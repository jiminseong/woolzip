import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { medicationId, time_slot } = await request.json();

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

    const { data, error } = await (supabase.rpc("insert_med_log", {
      p_medication_id: medicationId,
      p_time_slot: time_slot,
    }) as any);

    if (error) {
      const message = error.message || "";
      if (message.includes("NO_FAMILY")) {
        return NextResponse.json(
          { ok: false, error: { code: "NO_FAMILY", message: "가족 그룹이 없습니다" } },
          { status: 400 }
        );
      }
      if (message.includes("MEDICATION_NOT_FOUND")) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "MEDICATION_NOT_FOUND", message: "약 정보를 찾을 수 없습니다" },
          },
          { status: 404 }
        );
      }
      if (message.includes("ALREADY_TAKEN")) {
        return NextResponse.json(
          { ok: false, error: { code: "ALREADY_TAKEN", message: "이미 복용 기록이 있습니다" } },
          { status: 400 }
        );
      }
      if (message.toLowerCase().includes("jwt") || error.code === "PGRST301") {
        return NextResponse.json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
          { status: 401 }
        );
      }
      console.error("Med log insertion error:", error);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "복용 기록 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    const medLog = data?.[0];

    if (!medLog) {
      console.error("Med log insertion error: empty response");
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "복용 기록 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: medLog.id,
      taken_at: medLog.taken_at,
      medication_name: medLog.medication_name,
    });
  } catch (error) {
    console.error("Medication logging error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
