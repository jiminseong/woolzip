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
      .select(
        `
        family_id,
        families:family_id (
          id,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (memberError || !familyMember) {
      return NextResponse.json(
        { ok: false, error: { code: "NO_FAMILY", message: "가족 그룹이 없습니다" } },
        { status: 400 }
      );
    }

    // 초대 코드 생성 (6자리 랜덤)
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let inviteCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    // 중복되지 않는 코드 생성
    do {
      inviteCode = generateCode();
      const { data: existing } = await (supabase.from("invites") as any)
        .select("code")
        .eq("code", inviteCode)
        .single();

      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CODE_GENERATION_FAILED", message: "초대 코드 생성에 실패했습니다" },
        },
        { status: 500 }
      );
    }

    // 기존 활성 초대 코드 비활성화
    await (supabase.from("invites") as any)
      .update({ expires_at: new Date().toISOString() })
      .eq("family_id", familyMember.family_id)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString());

    // 새 초대 코드 생성 (24시간 후 만료)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: insertError } = await (supabase.from("invites") as any).insert({
      code: inviteCode,
      family_id: familyMember.family_id,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Invite insertion error:", insertError);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "초대 코드 저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: inviteCode,
      family_name: familyMember.families?.name || "가족",
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Invite generation error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
