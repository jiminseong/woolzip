import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWebPush } from "@/lib/push";
import type { Database } from "@/lib/database.types";

type InsertSignalArgs = Database["public"]["Functions"]["insert_signal"]["Args"];

export async function POST(request: NextRequest) {
  try {
    const { type, tag, note } = await request.json();

    if (!type || !["green", "yellow", "red"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TYPE", message: "유효하지 않은 신호 타입입니다" } },
        { status: 400 }
      );
    }

    if (tag && !["meal", "home", "leave", "sleep", "wake", "sos"].includes(tag)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TAG", message: "유효하지 않은 태그입니다" } },
        { status: 400 }
      );
    }

    if (note && note.length > 60) {
      return NextResponse.json(
        { ok: false, error: { code: "NOTE_TOO_LONG", message: "메모는 60자 이내로 입력하세요" } },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await ((supabase as any).rpc("insert_signal", {
      p_type: type,
      p_tag: tag || null,
      p_note: note || null,
    } as InsertSignalArgs));

    if (error) {
      const message = error.message || "";
      if (message.includes("NO_FAMILY")) {
        return NextResponse.json(
          { ok: false, error: { code: "NO_FAMILY", message: "가족 그룹이 없습니다" } },
          { status: 400 }
        );
      }
      if (message.toLowerCase().includes("jwt") || error.code === "PGRST301") {
        return NextResponse.json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
          { status: 401 }
        );
      }
      console.error("Signal insertion error:", error);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "신호 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    const signal = data?.[0];

    if (!signal) {
      console.error("Signal insertion error: empty response");
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "신호 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    // Push 알림 발송 (동일 가족, push_opt_in=true, 디바이스 등록 대상)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const admin = createSupabaseAdminClient();
      // 신호 상세 조회 (family_id, user_id, note, tag, type)
      const { data: signalRow } = await (admin.from("signals") as any)
        .select("id, family_id, user_id, type, tag, note")
        .eq("id", signal.id)
        .maybeSingle();

      if (signalRow?.family_id) {
        const { data: members } = await (admin.from("family_members") as any)
          .select(
            `
            user_id,
            users:user_id (display_name),
            settings:user_id (push_opt_in)
          `
          )
          .eq("family_id", signalRow.family_id)
          .eq("is_active", true);

        const senderId = user?.id;
        const senderName = members?.find((m: any) => m.user_id === senderId)?.users?.display_name || "가족";
        const targets =
          members
            ?.filter((m: any) => m.settings?.push_opt_in && m.user_id !== senderId)
            .map((m: any) => m.user_id) || [];

        if (targets.length > 0) {
          const { data: devices } = await (admin.from("devices") as any)
            .select("push_token, user_id")
            .in("user_id", targets);

          const seen = new Set<string>();
          for (const dev of devices || []) {
            const token = dev?.push_token as string | null;
            if (!token || seen.has(token)) continue;
            seen.add(token);
            const body = buildSignalBody(senderName, signalRow.type, signalRow.tag, signalRow.note);
            try {
              await sendWebPush(token, {
                title: "가족 신호",
                body,
                url: "/",
                icon: "/icons/icon-192.png",
              });
            } catch (pushErr) {
              console.error("signal push error", pushErr);
            }
          }
        }
      }
    } catch (pushWrapError) {
      console.error("signal push wrap error", pushWrapError);
    }

    return NextResponse.json({
      ok: true,
      id: signal.id,
      created_at: signal.created_at,
      undo_until: signal.undo_until,
    });
  } catch (error) {
    console.error("Signal posting error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}

function buildSignalBody(
  sender: string,
  type: string,
  tag?: string | null,
  note?: string | null
) {
  if (note?.trim()) return `${sender}: ${note.trim()}`;
  const tagTexts: Record<string, string> = {
    meal: "식사 완료",
    home: "귀가 완료",
    leave: "출발",
    sleep: "취침",
    wake: "기상",
    sos: "SOS",
  };
  if (tag && tagTexts[tag]) return `${sender}: ${tagTexts[tag]}`;
  const typeText = type === "green" ? "안심" : type === "yellow" ? "주의" : "위험";
  return `${sender}: ${typeText}`;
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const signalId = url.searchParams.get("id");

    if (!signalId) {
      return NextResponse.json(
        { ok: false, error: { code: "MISSING_ID", message: "신호 ID가 필요합니다" } },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    // 신호 삭제 (Undo) - RLS 정책에 의해 본인 신호만 삭제 가능
    const { error: deleteError } = await (supabase.from("signals") as any)
      .delete()
      .eq("id", signalId)
      .eq("user_id", user.id)
      .gt("undo_until", new Date().toISOString());

    if (deleteError) {
      console.error("Signal deletion error:", deleteError);
      return NextResponse.json(
        { ok: false, error: { code: "DELETE_FAILED", message: "신호 삭제에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "신호가 취소되었습니다",
    });
  } catch (error) {
    console.error("Signal deletion error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
