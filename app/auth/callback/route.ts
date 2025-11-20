import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();

    // OAuth 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return redirect("/login?error=auth_failed");
    }

    if (data.user) {
      // 카카오 사용자 정보 확인
      const kakaoId = data.user.user_metadata?.provider_id;
      const kakaoNickname = data.user.user_metadata?.full_name || data.user.user_metadata?.name;
      const kakaoProfileImage = data.user.user_metadata?.avatar_url;

      // users 테이블에서 기존 사용자 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        // 신규 사용자: users 테이블에 레코드 생성
        const { error: insertError } = await (supabase.from("users") as any).insert({
          id: data.user.id,
          username: kakaoId || `kakao_${data.user.id.slice(0, 8)}`,
          email: null, // 비즈니스 등록 없이는 이메일 제공 안됨
          display_name: kakaoNickname || "카카오 사용자",
          avatar_url: kakaoProfileImage,
          kakao_id: kakaoId,
        });

        if (insertError) {
          console.error("User creation error:", insertError);
        }

        // 신규 사용자는 온보딩으로
        return redirect("/onboarding");
      } else {
        // 기존 사용자는 홈으로
        return redirect("/");
      }
    }
  }

  // 에러 발생 시 로그인 페이지로
  return redirect("/login?error=auth_failed");
}
