import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { session } = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });
  }

  let body: { questionInstanceId?: string; answer_text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "bad_request" } }, { status: 400 });
  }

  const { questionInstanceId, answer_text } = body;
  if (!questionInstanceId || typeof questionInstanceId !== "string") {
    return NextResponse.json({ ok: false, error: { code: "bad_request" } }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: instance, error: instanceError } = await (supabase.from("question_instances") as any)
    .select(
      `
      id,
      family_id,
      status
    `
    )
    .eq("id", questionInstanceId)
    .single();

  if (instanceError || !instance) {
    return NextResponse.json({ ok: false, error: { code: "not_found" } }, { status: 404 });
  }

  if (instance.status === "closed") {
    return NextResponse.json(
      { ok: false, error: { code: "closed", message: "이미 마감된 질문입니다" } },
      { status: 400 }
    );
  }

  const { data: existing } = await (supabase.from("question_responses") as any)
    .select("id")
    .eq("question_instance_id", questionInstanceId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { ok: false, error: { code: "already_answered", message: "이미 답변했습니다" } },
      { status: 400 }
    );
  }

  const { error: insertError } = await (supabase.from("question_responses") as any).insert({
    question_instance_id: questionInstanceId,
    user_id: session.user.id,
    answer_text: answer_text ?? "",
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: { code: "db_error" } }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
