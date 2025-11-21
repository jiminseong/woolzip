import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "초대 코드가 필요합니다" } },
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

    // 사용자가 이미 가족에 속해있는지 확인
    const { data: existingMember } = await (supabase.from("family_members") as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { ok: false, error: { code: "ALREADY_IN_FAMILY", message: "이미 가족에 속해있습니다" } },
        { status: 400 }
      );
    }

    // 초대 코드 확인
    const { data: invite, error: inviteError } = await (supabase.from("invites") as any)
      .select(
        `
        family_id,
        families:family_id (
          id,
          name
        )
      `
      )
      .eq("code", code.toUpperCase())
      .gt("expires_at", new Date().toISOString())
      .is("used_by", null)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_CODE", message: "유효하지 않거나 만료된 초대 코드입니다" },
        },
        { status: 400 }
      );
    }

    // 가족 구성원으로 추가
    const { error: memberError } = await (supabase.from("family_members") as any).insert({
      family_id: invite.family_id,
      user_id: user.id,
      role: "child", // 기본값으로 설정, 나중에 변경 가능
      is_active: true,
    });

    if (memberError) {
      console.error("Family member insertion error:", memberError);
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: "가족 합류에 실패했습니다" } },
        { status: 500 }
      );
    }

    // 초대 코드 사용 처리
    const { error: useError } = await (supabase.from("invites") as any)
      .update({ used_by: user.id })
      .eq("code", code.toUpperCase());

    if (useError) {
      console.warn("Invite code update error:", useError);
    }

    return NextResponse.json({
      ok: true,
      family_id: invite.family_id,
      family_name: invite.families?.name || "가족",
      message: "가족에 성공적으로 합류했습니다",
    });
  } catch (error) {
    console.error("Invite acceptance error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
