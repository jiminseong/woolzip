import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import EmotionComposer from "@/components/EmotionComposer";
import TakePillButton from "@/components/TakePillButton";
import SignOutButton from "@/components/SignOutButton";
import InviteCodeManager from "@/components/InviteCodeManager";
import PushPermissionToggle from "@/components/PushPermissionToggle";
import MedicationManager from "@/components/MedicationManager";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MePage() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  // 사용자 약 정보 조회
  const supabase = await createSupabaseServerClient();
  const { data: medications } = await (supabase.from("medications") as any)
    .select("*")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .order("name");

  // 오늘 복용 기록 조회
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayLogs } = await (supabase.from("med_logs") as any)
    .select("medication_id, time_slot")
    .eq("user_id", session.user.id)
    .gte("taken_at", today.toISOString());

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">내 정보</h1>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <InviteCodeManager />

        <div className="card">
          <div className="text-lg font-semibold mb-2">설정</div>
          <div className="space-y-3 text-sm">
            <PushPermissionToggle />
          </div>
          <div className="pt-4">
            <SignOutButton />
          </div>
        </div>

        <div className="card">
          <div className="text-lg font-semibold mb-2">약 관리</div>
          <MedicationManager initial={medications || []} />
          {medications && medications.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="text-sm font-medium">오늘 복용 체크</div>
              {medications.map((med: any) => (
                <div key={med.id} className="space-y-2">
                  <div className="font-medium">{med.name}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {med.times?.includes("morning") && (
                      <TakePillButton
                        medicationId={med.id}
                        time_slot="morning"
                        initialTaken={todayLogs?.some(
                          (log: any) => log.medication_id === med.id && log.time_slot === "morning"
                        )}
                      />
                    )}
                    {med.times?.includes("noon") && (
                      <TakePillButton
                        medicationId={med.id}
                        time_slot="noon"
                        initialTaken={todayLogs?.some(
                          (log: any) => log.medication_id === med.id && log.time_slot === "noon"
                        )}
                      />
                    )}
                    {med.times?.includes("evening") && (
                      <TakePillButton
                        medicationId={med.id}
                        time_slot="evening"
                        initialTaken={todayLogs?.some(
                          (log: any) => log.medication_id === med.id && log.time_slot === "evening"
                        )}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <EmotionComposer />
      </main>
      <BottomNav />
    </div>
  );
}
