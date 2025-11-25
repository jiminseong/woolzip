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

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 px-4 pb-24 space-y-4">
        <h1 className="text-2xl font-bold py-4">오늘의 질문</h1>
        <QuizClient currentUserId={session.user.id} />
      </main>
      <BottomNav />
    </div>
  );
}
