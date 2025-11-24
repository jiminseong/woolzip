import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import InviteCodeManager from "@/components/InviteCodeManager";
import LargeFontToggle from "@/components/LargeFontToggle";
import PushPermissionToggle from "@/components/PushPermissionToggle";
import QuizScheduleForm from "@/components/QuizScheduleForm";
import SignOutButton from "@/components/SignOutButton";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: familyMember } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  const { data: quizSchedule } = familyMember
    ? await (supabase.from("question_schedule") as any)
        .select("time_of_day, timezone, enabled")
        .eq("family_id", familyMember.family_id)
        .eq("enabled", true)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-sm text-token-text-secondary">가족 초대, 알림, 퀴즈 시간을 관리하세요</p>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <InviteCodeManager />

        <QuizScheduleForm
          initialTime={quizSchedule?.time_of_day || null}
          initialTimezone={quizSchedule?.timezone || "Asia/Seoul"}
        />

        <div className="card">
          <div className="text-lg font-semibold mb-2">환경 설정</div>
          <div className="space-y-3 text-sm">
            <LargeFontToggle />
            <PushPermissionToggle />
          </div>
          <div className="pt-4">
            <SignOutButton />
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
