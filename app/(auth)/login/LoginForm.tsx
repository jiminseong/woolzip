"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("ID와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      if (isSignUp) {
        // 1. username 중복 체크
        const { data: existingUsers } = await supabase
          .from("users")
          .select("username")
          .eq("username", username);

        if (existingUsers && existingUsers.length > 0) {
          setError("이미 사용 중인 ID입니다.");
          return;
        }

        // 2. 임시 이메일로 Supabase Auth 가입 (자동 로그인 실패 시 재로그인 시도)
        const tempEmail = `${username}@woolzip.temp`;
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password,
        });

        if (signUpError) {
          const signUpCode = (signUpError as { code?: string }).code;
          const isDuplicateEmail =
            signUpCode === "user_already_exists" ||
            signUpError.message.toLowerCase().includes("user already registered");

          if (isDuplicateEmail) {
            setError("이미 등록된 계정이에요. 로그인으로 이동해주세요.");
            return;
          }

          setError(signUpError.message);
          return;
        }

        // 세션이 없으면 자동 로그인 시도 (이메일 미인증 설정일 때 방어)
        const session =
          authData.session ??
          (await supabase.auth.signInWithPassword({ email: tempEmail, password })).data.session ??
          null;

        if (authData.user || session?.user) {
          const userId = authData.user?.id ?? session?.user.id;
          const email = authData.user?.email ?? session?.user.email ?? tempEmail;
          // 3. users 테이블에 프로필 생성/업서트
          const { error: profileError } = await (supabase.from("users") as any).upsert({
            id: userId,
            username,
            email,
          });

          if (profileError) {
            setError("프로필 생성에 실패했습니다.");
            return;
          }

          // 온보딩으로 이동
          router.push("/onboarding");
        }
      } else {
        // 로그인: username으로 email 찾기
        const { data: userData } = (await supabase
          .from("users")
          .select("email")
          .eq("username", username)
          .single()) as { data: { email: string } | null; error: any };

        const fallbackEmail = `${username}@woolzip.temp`;
        const emailToUse = userData?.email ?? fallbackEmail;

        // Supabase Auth로 로그인
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (signInError) {
          setError("ID 또는 비밀번호가 틀렸습니다.");
          return;
        }

        // 로그인 후 프로필이 없었다면 보강
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await (supabase.from("users") as any).upsert({
            id: user.id,
            username,
            email: user.email ?? emailToUse,
          });
        }

        // 메인 화면으로 이동
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card w-full space-y-6">
      <div>
        <div className="text-lg font-semibold">
          {isSignUp ? "울집에 오신 걸 환영해요" : "다시 만나서 반가워요"}
        </div>
        <p className="text-sm text-token-text-secondary mt-1">
          {isSignUp ? "간단한 정보로 가족과 연결해보세요" : "가족들이 기다리고 있어요"}
        </p>
      </div>

      {error && (
        <div className="text-sm text-token-signal-red bg-red-50 p-3 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            ID
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="영문, 숫자로 입력해주세요"
            className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-token-accent/50 focus:border-transparent"
            autoComplete={isSignUp ? "username" : "username"}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? "6자 이상 입력해주세요" : "비밀번호를 입력해주세요"}
            className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-token-accent/50 focus:border-transparent"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 6 : undefined}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-token-accent hover:bg-blue-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "처리 중..." : isSignUp ? "🎉 계정 만들기" : "로그인하기"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-token-text-secondary hover:text-token-accent underline"
          >
            {isSignUp ? "이미 계정이 있으신가요? 로그인하기" : "처음 오셨나요? 계정 만들기"}
          </button>
        </div>
      </form>

      {isSignUp && (
        <div className="text-xs text-token-text-secondary text-center px-4">
          가입하면 울집의{" "}
          <button className="underline hover:text-token-accent">서비스 약관</button>과{" "}
          <button className="underline hover:text-token-accent">개인정보 처리방침</button>에
          동의하는 것으로 간주됩니다.
        </div>
      )}
    </div>
  );
}
