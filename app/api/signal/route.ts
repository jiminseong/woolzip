import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
