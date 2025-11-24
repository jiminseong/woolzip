import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ScheduleRow = {
  id: string;
  family_id: string;
  time_of_day: string;
  timezone: string | null;
  enabled: boolean | null;
};

const DEFAULT_PROMPTS = [
  "오늘 가장 기분 좋았던 순간은?",
  "오늘 고마웠던 일 한 가지는?",
  "내일 가장 기대되는 일이 뭐예요?",
  "이번 주에 꼭 하고 싶은 일은?",
  "요즘 빠져 있는 것/노래/음식은?",
  "힘들 때 나에게 힘이 되는 것은?",
  "오늘 웃었던 순간을 공유해주세요.",
];

const CRON_SECRET = process.env.QUIZ_CRON_SECRET || process.env.CRON_SECRET;

function unauthorized() {
  return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });
}

function parseMinutes(time: string) {
  const [h = "0", m = "0"] = time.split(":");
  const hours = Number.parseInt(h, 10);
  const minutes = Number.parseInt(m, 10);
  return hours * 60 + minutes;
}

function formatDateInTz(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTimeInTz(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function dayIndex(forDate: string) {
  const date = new Date(`${forDate}T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function buildExpiresAt(forDate: string, timezone: string) {
  if (timezone === "Asia/Seoul" || !timezone) return `${forDate}T23:59:00+09:00`;
  return `${forDate}T23:59:00Z`;
}

async function ensureQuestionForFamily(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  familyId: string,
  forDate: string
) {
  const { data: existing, error: existingError } = await (supabase.from("questions") as any)
    .select("id, prompt, created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (existingError) throw existingError;

  let questions = existing || [];
  if (questions.length === 0) {
    const inserts = DEFAULT_PROMPTS.map((prompt) => ({
      family_id: familyId,
      prompt,
      created_by: null,
    }));
    const { data: seeded, error: seedError } = await (supabase.from("questions") as any)
      .insert(inserts)
      .select("id, prompt, created_at")
      .order("created_at", { ascending: true });
    if (seedError) throw seedError;
    questions = seeded || [];
  }

  const idx = questions.length > 0 ? dayIndex(forDate) % questions.length : 0;
  const picked = questions[idx];
  return picked?.id as string;
}

async function createInstances(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const now = new Date();
  const { data: schedules, error } = await (supabase.from("question_schedule") as any)
    .select("id, family_id, time_of_day, timezone, enabled")
    .eq("enabled", true);

  if (error) throw error;

  const created: string[] = [];
  const skipped: string[] = [];

  for (const schedule of schedules as ScheduleRow[]) {
    const tz = schedule.timezone || "Asia/Seoul";
    const forDate = formatDateInTz(now, tz);
    const nowMinutes = parseMinutes(formatTimeInTz(now, tz));
    const scheduledMinutes = parseMinutes(schedule.time_of_day);
    if (scheduledMinutes > nowMinutes) {
      skipped.push(`${schedule.family_id}:before_time`);
      continue;
    }

    const { data: existing } = await (supabase.from("question_instances") as any)
      .select("id")
      .eq("family_id", schedule.family_id)
      .eq("for_date", forDate)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      skipped.push(`${schedule.family_id}:exists`);
      continue;
    }

    const questionId = await ensureQuestionForFamily(supabase, schedule.family_id, forDate);
    if (!questionId) {
      skipped.push(`${schedule.family_id}:no_question`);
      continue;
    }

    const expires_at = buildExpiresAt(forDate, tz);
    const { error: insertError } = await (supabase.from("question_instances") as any).insert({
      family_id: schedule.family_id,
      question_id: questionId,
      for_date: forDate,
      expires_at,
      status: "open",
    });

    if (insertError) {
      skipped.push(`${schedule.family_id}:error`);
      continue;
    }

    created.push(schedule.family_id);
  }

  return { created, skipped };
}

async function closeFinishedInstances(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const now = new Date();
  const { data: openInstances, error } = await (supabase.from("question_instances") as any)
    .select(
      `
      id,
      family_id,
      expires_at,
      question_responses (user_id),
      family_members:family_id (user_id, is_active)
    `
    )
    .eq("status", "open");

  if (error) throw error;

  const closed: string[] = [];

  for (const inst of openInstances || []) {
    const members = (inst.family_members || [])
      .filter((m: any) => m.is_active)
      .map((m: any) => m.user_id);
    const responders = new Set((inst.question_responses || []).map((r: any) => r.user_id));
    const allAnswered = members.length > 0 && members.every((id: string) => responders.has(id));
    const expired = inst.expires_at ? new Date(inst.expires_at) <= now : false;

    if (!allAnswered && !expired) continue;

    const { error: updateError } = await (supabase.from("question_instances") as any)
      .update({ status: "closed" })
      .eq("id", inst.id);

    if (!updateError) {
      closed.push(inst.id as string);
    }
  }

  return { closed };
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET)
    return NextResponse.json({ ok: false, error: { code: "misconfigured" } }, { status: 500 });
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) return unauthorized();

  const supabase = createSupabaseAdminClient();

  try {
    const [createResult, closeResult] = await Promise.all([
      createInstances(supabase),
      closeFinishedInstances(supabase),
    ]);
    return NextResponse.json({
      ok: true,
      created: createResult.created,
      skipped: createResult.skipped,
      closed: closeResult.closed,
    });
  } catch (e) {
    console.error("quiz cron error", e);
    return NextResponse.json({ ok: false, error: { code: "server_error" } }, { status: 500 });
  }
}
