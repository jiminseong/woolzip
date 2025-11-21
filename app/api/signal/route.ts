import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { type, tag, note } = await request.json();

    // 입력 검증
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

    // 사용자의 가족 정보 조회
    const { data: familyMember, error: memberError } = await (
      supabase.from("family_members") as any
    )
      .select("family_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (memberError || !familyMember) {
      return NextResponse.json(
        { ok: false, error: { code: "NO_FAMILY", message: "가족 그룹이 없습니다" } },
        { status: 400 }
      );
    }

    // Undo 윈도우 설정 (5분)
    const undoUntil = new Date();
    undoUntil.setMinutes(undoUntil.getMinutes() + 5);

    // 신호 기록
    const { data: signal, error: insertError } = await (supabase.from("signals") as any)
      .insert({
        family_id: familyMember.family_id,
        user_id: user.id,
        type,
        tag: tag || null,
        note: note || null,
        undo_until: undoUntil.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Signal insertion error:", insertError);
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
