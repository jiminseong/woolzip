import { redirect } from "next/navigation";
import QuizClient from "@/components/QuizClient";
import BottomNav from "@/components/BottomNav";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function QuizPage() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: member } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!member) {
    redirect("/onboarding");
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: instance } = await (supabase.from("question_instances") as any)
    .select(
      `
      id,
      status,
      for_date,
      expires_at,
      questions:question_id (prompt),
      question_responses (
        user_id,
        answer_text,
        users:user_id (display_name)
      )
    `
    )
    .eq("family_id", member.family_id)
    .eq("for_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: members } = await (supabase.from("family_members") as any)
    .select(
      `
      user_id,
      users:user_id (display_name)
    `
    )
    .eq("family_id", member.family_id)
    .eq("is_active", true);

  const responses = instance?.question_responses || [];
  const memberList =
    members?.map((m: any) => ({
      user_id: m.user_id,
      display_name: m.users?.display_name || "가족",
      answered: responses.some((r: any) => r.user_id === m.user_id),
    })) || [];

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 px-4 pb-24 space-y-4">
        <h1 className="text-2xl font-bold py-4">오늘의 질문</h1>
        <QuizClient
          instanceId={instance?.id ?? null}
          prompt={instance?.questions?.prompt ?? null}
          status={instance?.status ?? null}
          expires_at={instance?.expires_at ?? null}
          members={memberList}
          answers={
            instance?.status === "closed"
              ? responses.map((r: any) => ({
                  user_id: r.user_id,
                  display_name: r.users?.display_name || "가족",
                  answer_text: r.answer_text,
                }))
              : []
          }
          myAnswered={responses.some((r: any) => r.user_id === session.user.id)}
          currentUserId={session.user.id}
        />
      </main>
      <BottomNav />
    </div>
  );
}
