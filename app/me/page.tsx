import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import EmotionComposer from "@/components/EmotionComposer";
import { getSession } from "@/lib/supabase/server";

export default async function MePage() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="section">
        <h1 className="text-2xl font-bold">내 상태</h1>
        <p className="text-sm text-token-text-secondary">감정을 공유하고 가족과 나눠요</p>
      </header>
      <main className="flex-1 px-4 pb-24 space-y-4">
        <EmotionComposer />
      </main>
      <BottomNav />
    </div>
  );
}
