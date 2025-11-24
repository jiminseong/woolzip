import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type InsertEmotionArgs = Database["public"]["Functions"]["insert_emotion"]["Args"];

export async function POST(request: NextRequest) {
  try {
    const { emoji, text } = await request.json();

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

    const { data, error } = await ((supabase as any).rpc("insert_emotion", {
      p_emoji: emoji,
      p_text: text || null,
    } as InsertEmotionArgs));

    if (error) {
      const message = error.message || "";
      if (message.includes("NO_FAMILY")) {
        return NextResponse.json(
          { ok: false, error: { code: "NO_FAMILY", message: "가족 그룹이 없습니다" } },
          { status: 400 }
        );
      }
      if (message.includes("ALREADY_SHARED")) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "ALREADY_SHARED", message: "오늘은 이미 감정을 공유했습니다" },
          },
          { status: 400 }
        );
      }
      if (message.toLowerCase().includes("jwt") || error.code === "PGRST301") {
        return NextResponse.json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
          { status: 401 }
        );
      }
      console.error("Emotion insertion error:", error);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "감정 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    const emotion = data?.[0];

    if (!emotion) {
      console.error("Emotion insertion error: empty response");
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
