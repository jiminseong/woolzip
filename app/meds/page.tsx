import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MedicationManager from "@/components/MedicationManager";
import TakePillButton from "@/components/TakePillButton";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MedsPage() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: medications } = await (supabase.from("medications") as any)
    .select("*")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .order("name");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayLogs } = await (supabase.from("med_logs") as any)
    .select("medication_id, time_slot")
    .eq("user_id", session.user.id)
    .gte("taken_at", today.toISOString());

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">복용약</h1>
        <p className="text-sm text-token-text-secondary">약을 관리하고 오늘 복용을 체크하세요</p>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
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
      </main>
      <BottomNav />
    </div>
  );
}
