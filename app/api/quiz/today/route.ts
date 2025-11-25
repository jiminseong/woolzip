import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

const DEFAULT_PROMPTS = [
  "오늘 가장 기분 좋았던 순간은?",
  "오늘 고마웠던 일 한 가지는?",
  "오늘 힘들었던 일 한 가지는?",
  "지금 듣고 싶은 말이 있나요?",
  "오늘 먹은 것 중에 가장 맛있었던 건?",
  "요즘 빠져 있는 노래/드라마/게임은?",
  "내일 가장 기대되는 일은?",
  "이번 주에 꼭 하고 싶은 일은?",
  "요즘 걱정되는 일이 있나요?",
  "오늘 웃었던 순간을 공유해줘요.",
  "오늘 배운 것 한 가지는?",
  "최근에 읽은/본 콘텐츠는?",
  "지금 가장 필요한 건 뭐예요?",
  "오늘 나에게 점수를 준다면 몇 점?",
  "최근에 감사한 사람은 누구인가요?",
  "잠들기 전에 생각나는 건?",
  "오늘 산책이나 움직임을 했나요?",
  "오늘 날씨를 한 단어로 표현해줘요.",
  "한 줄로 오늘을 적어본다면?",
  "이번 달 목표 중 진행 중인 건?",
];

function getNowKst() {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  return new Date(kstMs);
}

function getKstDateString(date: Date) {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isAfter8pmKst(date: Date) {
  return date.getUTCHours() >= 11; // 20:00 KST == 11:00 UTC
}

export async function GET() {
  const { session } = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: member } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!member) {
    return NextResponse.json({ ok: false, error: { code: "no_family" } }, { status: 400 });
  }

  const nowKst = getNowKst();
  const todayKst = getKstDateString(nowKst);

  // 이미 오늘 인스턴스가 있으면 바로 반환
  let { data: instance } = await (supabase.from("question_instances") as any)
    .select(
      `
      id,
      status,
      for_date,
      expires_at,
      questions:question_id (
        prompt
      )
    `
    )
    .eq("family_id", member.family_id)
    .eq("for_date", todayKst)
    .order("created_at", { ascending: false })
    .maybeSingle();

  // 오늘 것이 없으면 20시 이후에만 생성 시도
  if (!instance) {
    if (!isAfter8pmKst(nowKst)) {
      return NextResponse.json(
        { ok: false, error: { code: "before_time", message: "20시 이후에 이용할 수 있어요." } },
        { status: 400 }
      );
    }

    // 질문 풀 확보 (없으면 기본 20개 시드)
    const { data: questions } = await (supabase.from("questions") as any)
      .select("id, prompt")
      .eq("family_id", member.family_id);

    if (!questions || questions.length === 0) {
      const inserts = DEFAULT_PROMPTS.map((prompt) => ({
        family_id: member.family_id,
        prompt,
        created_by: session.user.id,
      }));
      const { error: seedError } = await (supabase.from("questions") as any).insert(inserts);
      if (seedError) {
        return NextResponse.json(
          { ok: false, error: { code: "seed_failed", message: "질문을 준비하지 못했어요." } },
          { status: 500 }
        );
      }
    }

    const { data: pool } = await (supabase.from("questions") as any)
      .select("id, prompt")
      .eq("family_id", member.family_id);

    const { data: usedRows } = await (supabase.from("question_instances") as any)
      .select("question_id")
      .eq("family_id", member.family_id);

    const usedIds = new Set((usedRows || []).map((r: any) => r.question_id));
    const available = (pool || []).filter((q: any) => !usedIds.has(q.id));

    if (!available || available.length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "depleted", message: "준비된 질문이 모두 소진되었습니다." } },
        { status: 410 }
      );
    }

    const picked = available[Math.floor(Math.random() * available.length)];

    const { data: created, error: createError } = await (supabase.from("question_instances") as any)
      .insert({
        family_id: member.family_id,
        question_id: picked.id,
        for_date: todayKst,
        status: "open",
      })
      .select(
        `
        id,
        status,
        for_date,
        expires_at,
        questions:question_id (prompt)
      `
      )
      .maybeSingle();

    if (createError && createError.code !== "23505") {
      return NextResponse.json(
        { ok: false, error: { code: "create_failed", message: "오늘의 질문을 준비하지 못했어요." } },
        { status: 500 }
      );
    }

    if (created) {
      instance = created;
    } else {
      // 경합으로 이미 생성된 경우 다시 조회
      const { data: existing } = await (supabase.from("question_instances") as any)
        .select(
          `
          id,
          status,
          for_date,
          expires_at,
          questions:question_id (prompt)
        `
        )
        .eq("family_id", member.family_id)
        .eq("for_date", todayKst)
        .order("created_at", { ascending: false })
        .maybeSingle();
      instance = existing || null;
    }
  }

  if (!instance) {
    return NextResponse.json({ ok: true, data: null });
  }

  const { data: members } = await (supabase.from("family_members") as any)
    .select(
      `
      user_id,
      users:user_id (display_name)
    `
    )
    .eq("family_id", member.family_id)
    .eq("is_active", true);

  const { data: responses } = await (supabase.from("question_responses") as any)
    .select(
      `
      user_id,
      answer_text,
      created_at,
      users:user_id (display_name)
    `
    )
    .eq("question_instance_id", instance.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ok: true,
    data: {
      instance_id: instance.id,
      prompt: instance.questions?.prompt,
      status: instance.status,
      expires_at: instance.expires_at,
      my_answered: (responses || []).some((r: any) => r.user_id === session.user.id),
      answered_count: (responses || []).length,
      members: (members || []).map((m: any) => ({
        user_id: m.user_id,
        display_name: m.users?.display_name || "가족",
        answered: (responses || []).some((r: any) => r.user_id === m.user_id),
      })),
      answers: (responses || []).map((r: any) => ({
        user_id: r.user_id,
        display_name: r.users?.display_name || "가족",
        answer_text: r.answer_text,
      })),
    },
  });
}
