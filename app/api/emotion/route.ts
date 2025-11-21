import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { emoji, text } = await request.json();

    // 입력 검증
    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_EMOJI", message: "이모지가 필요합니다" } },
        { status: 400 }
      );
    }

    if (text && text.length > 60) {
      return NextResponse.json(
        { ok: false, error: { code: "TEXT_TOO_LONG", message: "텍스트는 60자 이내로 입력하세요" } },
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

    // 오늘 이미 감정을 공유했는지 확인 (하루 1회 제한)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingEmotion } = await (supabase.from("emotions") as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", familyMember.family_id)
      .gte("created_at", today.toISOString())
      .single();

    if (existingEmotion) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "ALREADY_SHARED", message: "오늘은 이미 감정을 공유했습니다" },
        },
        { status: 400 }
      );
    }

    // 감정 기록 저장
    const { data: emotion, error: insertError } = await (supabase.from("emotions") as any)
      .insert({
        family_id: familyMember.family_id,
        user_id: user.id,
        emoji,
        text: text || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Emotion insertion error:", insertError);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "감정 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: emotion.id,
      created_at: emotion.created_at,
    });
  } catch (error) {
    console.error("Emotion sharing error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
