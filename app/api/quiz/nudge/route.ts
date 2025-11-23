import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

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

  // Insert nudge; actual push delivery to be handled via worker/Edge Function.
  const { error: insertError } = await (supabase.from("question_nudges") as any).insert({
    question_instance_id: questionInstanceId,
    from_user_id: session.user.id,
    to_user_id,
  });

  if (insertError) {
    return NextResponse.json({ ok: false, error: { code: "db_error" } }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
