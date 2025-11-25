import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWebPush } from "@/lib/push";

export async function POST(req: Request) {
  const { session } = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });
  }

  let body: { questionInstanceId?: string; to_user_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "bad_request" } }, { status: 400 });
  }

  const { questionInstanceId, to_user_id } = body;
  if (!questionInstanceId || !to_user_id) {
    return NextResponse.json({ ok: false, error: { code: "bad_request" } }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: instance, error: instanceError } = await (supabase.from("question_instances") as any)
    .select("id, family_id, status")
    .eq("id", questionInstanceId)
    .single();

  if (instanceError || !instance) {
    return NextResponse.json({ ok: false, error: { code: "not_found" } }, { status: 404 });
  }

  if (instance.status === "closed") {
    return NextResponse.json({ ok: false, error: { code: "closed" } }, { status: 400 });
  }

  // 대상 사용자가 같은 가족인지 확인 + 푸시 opt-in 여부 조회
  const { data: targetMember } = await (supabase.from("family_members") as any)
    .select(
      `
      user_id,
      users:user_id (display_name),
      settings:user_id (push_opt_in)
    `
    )
    .eq("family_id", instance.family_id)
    .eq("user_id", to_user_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ ok: false, error: { code: "not_found" } }, { status: 404 });
  }

  const pushOptIn = targetMember.settings?.push_opt_in;

  // Insert nudge 기록 (RLS 보호)
  const { error: insertError } = await (supabase.from("question_nudges") as any).insert({
    question_instance_id: questionInstanceId,
    from_user_id: session.user.id,
    to_user_id,
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: { code: "db_error" } }, { status: 500 });
  }

  // 푸시 전송 (service role로 대상 디바이스 조회)
  let sent = 0;
  if (pushOptIn) {
    const admin = createSupabaseAdminClient();
    const { data: devices } = await (admin.from("devices") as any)
      .select("push_token")
      .eq("user_id", to_user_id);

    const seen = new Set<string>();
    for (const dev of devices || []) {
      const token = dev?.push_token as string | null;
      if (!token || seen.has(token)) continue;
      seen.add(token);
      try {
        await sendWebPush(token, {
          title: targetMember.users?.display_name
            ? `${targetMember.users.display_name}님, 질문에 답해주세요`
            : "가족 퀴즈 알림",
          body: "가족이 답변을 기다리고 있어요.",
          url: "/quiz",
          icon: "/icons/icon-192.png",
        });
        sent += 1;
      } catch (err) {
        console.error("quiz nudge push error", err);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
