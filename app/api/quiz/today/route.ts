import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

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

  const today = new Date().toISOString().split("T")[0];

  const { data: instance } = await (supabase.from("question_instances") as any)
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
    .eq("for_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!instance) {
    return NextResponse.json({ ok: true, data: null });
  }

  const { data: responses } = await (supabase.from("question_responses") as any)
    .select("user_id")
    .eq("question_instance_id", instance.id);

  return NextResponse.json({
    ok: true,
    data: {
      instance_id: instance.id,
      prompt: instance.questions?.prompt,
      status: instance.status,
      expires_at: instance.expires_at,
      my_answered: responses?.some((r: any) => r.user_id === session.user.id) ?? false,
      answered_count: responses?.length ?? 0,
    },
  });
}
