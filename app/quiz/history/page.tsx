import { redirect } from "next/navigation";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function QuizHistoryPage() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: member } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!member) redirect("/onboarding");

  const { data: instances } = await (supabase.from("question_instances") as any)
    .select(
      `
      id,
      for_date,
      status,
      questions:question_id (prompt),
      question_responses (
        user_id,
        answer_text,
        users:user_id (display_name)
      )
    `
    )
    .eq("family_id", member.family_id)
    .eq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 px-4 pb-24 space-y-4">
        <h1 className="text-2xl font-bold py-4">지난 질문</h1>
        {(instances || []).length === 0 ? (
          <div className="card text-sm text-token-text-secondary">아직 공개된 질문이 없습니다.</div>
        ) : (
          (instances || []).map((inst: any) => (
            <div key={inst.id} className="card space-y-2">
              <div className="text-xs text-token-text-secondary">
                {inst.for_date} · {inst.questions?.prompt}
              </div>
              <div className="space-y-2">
                {(inst.question_responses || []).map((r: any) => (
                  <div key={r.user_id} className="rounded-lg bg-neutral-50 px-3 py-2">
                    <div className="text-sm font-medium">{r.users?.display_name || "가족"}</div>
                    <div className="text-sm text-token-text-secondary whitespace-pre-line">
                      {r.answer_text || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
