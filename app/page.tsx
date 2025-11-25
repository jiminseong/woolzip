import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TodaySummaryCard from "@/components/TodaySummaryCard";
import TimelineItem from "@/components/TimelineItem";
import RealtimeProvider from "@/components/RealtimeProvider";
import { getSession, createSupabaseServerClient } from "@/lib/supabase/server";

const TIME_ZONE = "Asia/Seoul";
const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

function startOfTodayKst() {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000; // UTC -> KST
  const kst = new Date(kstMs);
  kst.setHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000); // back to UTC boundary
}

function startOfDayKst(offsetDays = 0) {
  const today = startOfTodayKst();
  return new Date(today.getTime() + offsetDays * 24 * 60 * 60 * 1000);
}

function formatKstTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return timeFormatter.format(date);
}

function formatDateLabel(date: Date, todayStart: Date, yesterdayStart: Date) {
  const time = date.getTime();
  if (time >= todayStart.getTime()) return "오늘";
  if (time >= yesterdayStart.getTime()) return "어제";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}

async function getFamilyData(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  familyId: string,
  familyName: string | null
) {
  const todayStart = startOfTodayKst();
  const yesterdayStart = startOfDayKst(-1);
  const rangeStart = yesterdayStart;

  const [membersResult, signalsResult, medLogsResult, emotionsResult] = await Promise.all([
    (supabase.from("family_members") as any)
      .select(
        `
        user_id,
        role,
        joined_at,
        users:user_id (
          display_name,
          username
        )
      `
      )
      .eq("family_id", familyId)
      .eq("is_active", true),
    (supabase.from("signals") as any)
      .select(
        `
        id,
        type,
        tag,
        note,
        created_at,
        users:user_id (
          display_name,
          username
        )
      `
      )
      .eq("family_id", familyId)
      .gte("created_at", rangeStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
    (supabase.from("med_logs") as any)
      .select(
        `
        id,
        time_slot,
        taken_at,
        users:user_id (
          display_name,
          username
        ),
        medications:medication_id (
          name
        )
      `
      )
      .eq("family_id", familyId)
      .gte("taken_at", rangeStart.toISOString())
      .order("taken_at", { ascending: false })
      .limit(10),
    (supabase.from("emotions") as any)
      .select(
        `
        id,
        emoji,
        text,
        created_at,
        users:user_id (
          display_name,
          username
        )
      `
      )
      .eq("family_id", familyId)
      .gte("created_at", rangeStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const members = membersResult?.data || [];
  const signals = signalsResult?.data || [];
  const medLogs = medLogsResult?.data || [];
  const emotions = emotionsResult?.data || [];

  const getDisplayName = (u?: { display_name?: string | null; username?: string | null }) =>
    u?.display_name || u?.username || "가족";

  // 타임라인 통합
  const timeline = [
    ...signals.map((s: any) => ({
      id: s.id,
      kind: "signal" as const,
      name: getDisplayName(s.users) || "누군가",
      body: buildSignalBody(s),
      time: formatKstTime(s.created_at),
      color: s.type as "green" | "yellow" | "red",
      timestamp: new Date(s.created_at),
    })),
    ...medLogs.map((m: any) => ({
      id: m.id,
      kind: "med" as const,
      name: getDisplayName(m.users) || "누군가",
      body: buildMedBody(m),
      time: formatKstTime(m.taken_at),
      color: "green" as const,
      timestamp: new Date(m.taken_at),
    })),
    ...emotions.map((e: any) => ({
      id: e.id,
      kind: "emotion" as const,
      name: getDisplayName(e.users) || "누군가",
      body: buildEmotionBody(e),
      time: formatKstTime(e.created_at),
      color: "yellow" as const,
      timestamp: new Date(e.created_at),
    })),
    ...members
      .filter((m: any) => m.joined_at && new Date(m.joined_at) >= rangeStart)
      .map((m: any) => ({
        id: `join-${m.user_id}`,
        kind: "join" as const,
        name: getDisplayName(m.users) || "새 가족",
        body: "가족에 참여했어요",
        time: formatKstTime(m.joined_at),
        color: "green" as const,
        timestamp: new Date(m.joined_at),
      })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .map((item) => {
      const dateKey = item.timestamp.toISOString().split("T")[0];
      const dateLabel = formatDateLabel(item.timestamp, todayStart, yesterdayStart);
      return { ...item, dateKey, dateLabel };
    });

  const groupedTimeline: {
    dateKey: string;
    dateLabel: string;
    items: (typeof timeline)[number][];
  }[] = [];

  for (const item of timeline) {
    const lastGroup = groupedTimeline[groupedTimeline.length - 1];
    if (lastGroup && lastGroup.dateKey === item.dateKey) {
      lastGroup.items.push(item);
    } else {
      groupedTimeline.push({
        dateKey: item.dateKey,
        dateLabel: item.dateLabel,
        items: [item],
      });
    }
  }

  // 구성원별 오늘 요약 생성
  const memberSummaries = members.map((member: any) => {
    const displayName = getDisplayName(member.users);
    const memberSignals = signals.filter((s: any) => getDisplayName(s.users) === displayName);
    const gyrc = {
      g: memberSignals.filter((s: any) => s.type === "green").length,
      y: memberSignals.filter((s: any) => s.type === "yellow").length,
      r: memberSignals.filter((s: any) => s.type === "red").length,
    };

    const lastSignal = memberSignals[0];
    const lastActivity = lastSignal
      ? `${getSignalText(lastSignal.type, lastSignal.tag)} ${formatKstTime(lastSignal.created_at)}`
      : "아직 없음";

    const hasMedToday = (medLogs || []).some((m: any) => getDisplayName(m.users) === displayName);

    const joinedAt = member.joined_at ? formatKstTime(member.joined_at) : null;

    return {
      id: member.user_id,
      name: displayName,
      last: lastActivity,
      gyrc,
      med: hasMedToday,
      joinedAt,
    };
  });

  return {
    members: memberSummaries,
    timelineGroups: groupedTimeline,
    familyName: familyName || "가족",
    familyId,
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

function buildSignalBody(signal: any) {
  const tagTexts: Record<string, string> = {
    meal: "🍚 식사 완료",
    home: "🏠 귀가 완료",
    leave: "🏃 출발",
    sleep: "😴 취침",
    wake: "🌞 기상",
    sos: "🚨 SOS",
  };
  if (signal.note?.trim()) return signal.note.trim();
  if (signal.tag && tagTexts[signal.tag]) return tagTexts[signal.tag];
  return getSignalText(signal.type, signal.tag);
}

function getTimeSlotText(slot: string) {
  const slotTexts: Record<string, string> = {
    morning: "아침",
    noon: "점심",
    evening: "저녁",
  };
  return slotTexts[slot] || slot;
}

function buildMedBody(medLog: any) {
  const medName = medLog.medications?.name || "약";
  const slotLabel = getTimeSlotText(medLog.time_slot);
  return `💊 ${slotLabel} ${medName} 복용 완료`;
}

function buildEmotionBody(emotion: any) {
  const text = emotion.text?.trim() || "";
  const emoji = emotion.emoji || "";
  const combined = `${emoji}${emoji && text ? " " : ""}${text}`;
  return combined || "기분을 공유했어요";
}

export default async function Page() {
  const { session } = await getSession();
  if (!session) redirect("/login");

  // 온보딩 체크 - 사용자가 가족에 속해있는지 확인
  const supabase = await createSupabaseServerClient();
  const { data: familyMember } = await (supabase.from("family_members") as any)
    .select(
      `
      id,
      family_id,
      families:family_id (
        id,
        name
      )
    `
    )
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!familyMember) {
    redirect("/onboarding");
  }

  const { members, timelineGroups, familyName, familyId } = await getFamilyData(
    supabase,
    familyMember.family_id,
    familyMember.families?.name || null
  );
  return (
    <RealtimeProvider familyId={familyId}>
      <div className="flex flex-col min-h-dvh">
        <header className="section">
          <h1 className="text-2xl font-bold">우리 가족 타임 라인</h1>
          <p className="text-sm text-token-text-secondary">{familyName}</p>
        </header>
        <main className="flex-1 px-4 pb-24 space-y-4">
          <TodaySummaryCard members={members} />
          <div className=" space-y-6">
            {timelineGroups.length > 0 ? (
              <div className="space-y-8">
                {timelineGroups.map((group) => (
                  <div key={group.dateKey} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-token-accent/20 bg-white text-token-accent shadow-sm">
                        🗓️
                      </div>
                      <div className="text-base font-semibold text-token-accent">
                        {group.dateLabel}
                      </div>
                    </div>
                    <div className="space-y-5">
                      {group.items.map((item, idx) => (
                        <TimelineItem
                          key={item.id}
                          time={item.time}
                          name={item.name}
                          body={item.body}
                          color={item.color}
                          isFirst={idx === 0}
                          isLast={idx === group.items.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-token-text-secondary">
                <p>아직 활동이 없습니다</p>
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
