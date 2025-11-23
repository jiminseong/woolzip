import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
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

  const limit = 20;
  const cursor = req.nextUrl.searchParams.get("cursor");

  const query = (supabase.from("question_instances") as any)
    .select(
      `
      id,
      for_date,
      status,
      questions:question_id(prompt),
      question_responses (
        user_id,
        answer_text,
        created_at
      )
    `
    )
    .eq("family_id", member.family_id)
    .eq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query.lt("created_at", cursor);
  }

  const { data: instances } = await query;

  return NextResponse.json({
    ok: true,
    data: instances || [],
    nextCursor: instances && instances.length === limit ? instances[instances.length - 1].created_at : null,
  });
}
