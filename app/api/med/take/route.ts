import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { medicationId, time_slot } = await request.json();

    // 입력 검증
    if (!medicationId || typeof medicationId !== "string") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_MEDICATION", message: "약 ID가 필요합니다" } },
        { status: 400 }
      );
    }

    if (!time_slot || !["morning", "noon", "evening"].includes(time_slot)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TIME_SLOT", message: "유효하지 않은 시간대입니다" } },
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

    // 약 정보 확인 (본인 소유 확인)
    const { data: medication, error: medError } = await (supabase.from("medications") as any)
      .select("id, name")
      .eq("id", medicationId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (medError || !medication) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "MEDICATION_NOT_FOUND", message: "약 정보를 찾을 수 없습니다" },
        },
        { status: 404 }
      );
    }

    // 오늘 이미 같은 시간대에 복용했는지 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingLog } = await (supabase.from("med_logs") as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("medication_id", medicationId)
      .eq("time_slot", time_slot)
      .gte("taken_at", today.toISOString())
      .single();

    if (existingLog) {
      return NextResponse.json(
        { ok: false, error: { code: "ALREADY_TAKEN", message: "이미 복용 기록이 있습니다" } },
        { status: 400 }
      );
    }

    // 복용 기록 저장
    const { data: medLog, error: insertError } = await (supabase.from("med_logs") as any)
      .insert({
        family_id: familyMember.family_id,
        user_id: user.id,
        medication_id: medicationId,
        time_slot,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Med log insertion error:", insertError);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "복용 기록 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: medLog.id,
      taken_at: medLog.taken_at,
      medication_name: medication.name,
    });
  } catch (error) {
    console.error("Medication logging error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
