import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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

    // SOS 이벤트 기록
    const { data: sosEvent, error: insertError } = await (supabase.from("sos_events") as any)
      .insert({
        family_id: familyMember.family_id,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("SOS event insertion error:", insertError);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "SOS 이벤트 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    // SOS 신호도 함께 기록
    const { error: signalError } = await (supabase.from("signals") as any).insert({
      family_id: familyMember.family_id,
      user_id: user.id,
      type: "red",
      tag: "sos",
      note: "긴급 상황",
    });

    if (signalError) {
      console.warn("SOS signal insertion warning:", signalError);
    }

    return NextResponse.json({
      ok: true,
      id: sosEvent.id,
      created_at: sosEvent.created_at,
      message: "SOS 신호가 전송되었습니다",
    });
  } catch (error) {
    console.error("SOS event error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
