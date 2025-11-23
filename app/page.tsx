import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TodaySummaryCard from "@/components/TodaySummaryCard";
import TimelineItem from "@/components/TimelineItem";
import RealtimeProvider from "@/components/RealtimeProvider";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

async function getFamilyData(userId: string) {
  const supabase = await createSupabaseServerClient();

  // 사용자의 가족 정보 조회
  const { data: familyMember } = await (supabase.from("family_members") as any)
    .select(
      `
      family_id,
      families:family_id (
        id,
        name
      )
    `
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!familyMember) {
    return { members: [], timeline: [], familyName: null, familyId: null };
  }

  const familyId = familyMember.family_id;

  // 가족 구성원 목록
  const { data: members } = await (supabase.from("family_members") as any)
    .select(
      `
      user_id,
      role,
      joined_at,
      users:user_id (
        display_name
      )
    `
    )
    .eq("family_id", familyId)
    .eq("is_active", true);

  // 오늘 신호 데이터
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: signals } = await (supabase.from("signals") as any)
    .select(
      `
      id,
      type,
      tag,
      note,
      created_at,
      users:user_id (
        display_name
      )
    `
    )
    .eq("family_id", familyId)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  // 오늘 약 복용 데이터
  const { data: medLogs } = await (supabase.from("med_logs") as any)
    .select(
      `
      id,
      time_slot,
      taken_at,
      users:user_id (
        display_name
      ),
      medications:medication_id (
        name
      )
    `
    )
    .eq("family_id", familyId)
    .gte("taken_at", todayStart.toISOString())
    .order("taken_at", { ascending: false })
    .limit(10);

  // 오늘 감정 데이터
  const { data: emotions } = await (supabase.from("emotions") as any)
    .select(
      `
      id,
      emoji,
      text,
      created_at,
      users:user_id (
        display_name
      )
    `
    )
    .eq("family_id", familyId)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  // 타임라인 통합
  const timeline = [
    ...(signals || []).map((s: any) => ({
      id: s.id,
      kind: "signal" as const,
      title: `${s.users?.display_name || "누군가"} · ${getSignalText(s.type, s.tag)}`,
      time: new Date(s.created_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      color: s.type as "green" | "yellow" | "red",
      timestamp: new Date(s.created_at),
    })),
    ...(medLogs || []).map((m: any) => ({
      id: m.id,
      kind: "med" as const,
      title: `${m.users?.display_name || "누군가"} · ${
        m.medications?.name || "약"
      } 복용 (${getTimeSlotText(m.time_slot)})`,
      time: new Date(m.taken_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(m.taken_at),
    })),
    ...(emotions || []).map((e: any) => ({
      id: e.id,
      kind: "emotion" as const,
      title: `${e.users?.display_name || "누군가"} · ${e.emoji}${e.text ? ` ${e.text}` : ""}`,
      time: new Date(e.created_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(e.created_at),
    })),
    ...(members || [])
      .filter((m: any) => m.joined_at && new Date(m.joined_at) >= todayStart)
      .map((m: any) => ({
        id: `join-${m.user_id}`,
        kind: "join" as const,
        title: `${m.users?.display_name || "새 가족"} · 가족에 참여했어요`,
        time: new Date(m.joined_at).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: new Date(m.joined_at),
      })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 구성원별 오늘 요약 생성
  const memberSummaries = (members || []).map((member: any) => {
    const memberSignals = (signals || []).filter(
      (s: any) => s.users?.display_name === member.users?.display_name
    );
    const gyrc = {
      g: memberSignals.filter((s: any) => s.type === "green").length,
      y: memberSignals.filter((s: any) => s.type === "yellow").length,
      r: memberSignals.filter((s: any) => s.type === "red").length,
    };

    const lastSignal = memberSignals[0];
    const lastActivity = lastSignal
      ? `${getSignalText(lastSignal.type, lastSignal.tag)} ${new Date(
          lastSignal.created_at
        ).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
      : "아직 없음";

    const hasMedToday = (medLogs || []).some(
      (m: any) => m.users?.display_name === member.users?.display_name
    );

    const joinedAt = member.joined_at
      ? new Date(member.joined_at).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return {
      id: member.user_id,
      name: member.users?.display_name || "알 수 없음",
      last: lastActivity,
      gyrc,
      med: hasMedToday,
      joinedAt,
    };
  });

  return {
    members: memberSummaries,
    timeline,
    familyName: familyMember.families?.name || "가족",
    familyId: familyId,
  };
}

function getSignalText(type: string, tag?: string) {
  const tagTexts: Record<string, string> = {
    meal: "식사",
    home: "귀가",
    leave: "출발",
    sleep: "취침",
    wake: "기상",
    sos: "SOS",
  };

  if (tag && tagTexts[tag]) {
    return tagTexts[tag];
  }

  return type === "green" ? "안심" : type === "yellow" ? "주의" : "위험";
}

function getTimeSlotText(slot: string) {
  const slotTexts: Record<string, string> = {
    morning: "아침",
    noon: "점심",
    evening: "저녁",
  };
  return slotTexts[slot] || slot;
}

export default async function Page() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  // 온보딩 체크 - 사용자가 가족에 속해있는지 확인
  const supabase = await createSupabaseServerClient();
  const { data: familyMember } = await (supabase.from("family_members") as any)
    .select("id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!familyMember) {
    redirect("/onboarding");
  }

  const { members, timeline, familyName, familyId } = await getFamilyData(session.user.id);
  return (
    <RealtimeProvider familyId={familyId}>
      <div className="flex flex-col min-h-dvh">
        <header className="section">
          <h1 className="text-2xl font-bold">오늘 요약</h1>
          <p className="text-sm text-token-text-secondary">{familyName}</p>
        </header>
        <main className="flex-1 px-4 pb-24 space-y-4">
          <TodaySummaryCard members={members} />
          <div className="card">
            <div className="text-lg font-semibold mb-2">타임라인</div>
            {timeline.length > 0 ? (
              timeline.map((item) => (
                <TimelineItem
                  key={item.id}
                  kind={item.kind}
                  title={item.title}
                  time={item.time}
                  color={"color" in item ? item.color : undefined}
                />
              ))
            ) : (
              <div className="text-center py-8 text-token-text-secondary">
                <p>아직 오늘의 활동이 없습니다</p>
                <p className="text-sm">+ 버튼을 눌러 첫 신호를 보내보세요!</p>
              </div>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    </RealtimeProvider>
  );
}
