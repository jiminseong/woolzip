"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RealtimeProvider({
  familyId,
  children,
}: {
  familyId: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!familyId) return;

    const supabase = getSupabaseBrowserClient();

    // 가족별 실시간 채널 구독
    const channel = supabase
      .channel(`family:${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signals",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log("New signal:", payload);
          // 홈 화면 새로고침
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "med_logs",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log("New med log:", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emotions",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log("New emotion:", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_events",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log("SOS event:", payload);
          // SOS는 즉시 알림
          alert("🚨 가족 중 누군가가 SOS 신호를 보냈습니다!");
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "signals",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log("Signal deleted (undo):", payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, router]);

  return <>{children}</>;
}
