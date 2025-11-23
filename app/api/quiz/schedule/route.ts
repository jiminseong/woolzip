import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

export async function GET() {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data: member } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!member) return NextResponse.json({ ok: false, error: { code: "no_family" } }, { status: 400 });

  const { data: schedule } = await (supabase.from("question_schedule") as any)
    .select("time_of_day, timezone, enabled, created_at")
    .eq("family_id", member.family_id)
    .eq("enabled", true)
    .order("created_at", { ascending: false })
    .maybeSingle();

  // UI에는 한국 시간 기준으로만 노출
  const result = schedule
    ? {
        time_of_day: schedule.time_of_day,
        timezone: "Asia/Seoul",
        enabled: schedule.enabled,
        created_at: schedule.created_at,
      }
    : null;

  return NextResponse.json({ ok: true, data: result });
}

export async function POST(req: NextRequest) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });

  let body: { time_of_day?: string; timezone?: string; enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "bad_request" } }, { status: 400 });
  }

  const time_of_day = body.time_of_day;
  if (!time_of_day) {
    return NextResponse.json({ ok: false, error: { code: "bad_request", message: "시간이 필요합니다" } }, { status: 400 });
  }
  // 한국 서비스 기준으로 저장은 Asia/Seoul로 고정
  const timezone = "Asia/Seoul";
  const enabled = body.enabled ?? true;

  const supabase = await createSupabaseServerClient();
  const { data: member } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!member) return NextResponse.json({ ok: false, error: { code: "no_family" } }, { status: 400 });

  // Upsert schedule (one per family)
  const { data: existing } = await (supabase.from("question_schedule") as any)
    .select("id")
    .eq("family_id", member.family_id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await (supabase.from("question_schedule") as any)
      .update({ time_of_day, timezone, enabled })
      .eq("id", existing.id);
    if (updateError) {
      return NextResponse.json({ ok: false, error: { code: "db_error" } }, { status: 500 });
    }
  } else {
    const { error: insertError } = await (supabase.from("question_schedule") as any).insert({
      family_id: member.family_id,
      time_of_day,
      timezone,
      enabled,
    });
    if (insertError) {
      return NextResponse.json({ ok: false, error: { code: "db_error" } }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
