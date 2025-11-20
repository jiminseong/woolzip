"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (isSignUp) {
        // 회원가입: username 중복 체크 후 진행
        const { data: existingUsers } = (await supabase
          .from("users")
          .select("username")
          .eq("username", username)) as {
          data: { username: string }[] | null;
          error: any;
        };

        if (existingUsers && existingUsers.length > 0) {
          setError("이미 사용중인 ID입니다");
          return;
        }

        // Supabase Auth에 임시 이메일로 가입 (내부용)
        const tempEmail = `${username}@example.com`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password,
          options: {
            emailRedirectTo: undefined, // 이메일 인증 비활성화
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.user) {
          // Create user profile with username
          const { error: profileError } = await (supabase.from("users") as any).insert([
            {
              id: data.user.id,
              username,
              email: data.user.email,
            },
          ]);

          if (profileError) {
            setError("사용자 프로필 생성에 실패했습니다");
            return;
          }
        }

        // 회원가입 성공 시 자동으로 로그인 상태가 됩니다
        router.replace("/onboarding");
      } else {
        // 로그인: username으로 사용자 조회 후 email로 Supabase 인증
        const { data: userList, error: userError } = (await supabase
          .from("users")
          .select("email")
          .eq("username", username)) as {
          data: { email: string }[] | null;
          error: any;
        };

        if (userError || !userList || userList.length === 0 || !userList[0].email) {
          setError("사용자를 찾을 수 없습니다");
          return;
        }

        const userData = userList[0];
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password,
        });

        if (signInError) {
          setError("ID 또는 비밀번호가 올바르지 않습니다");
          return;
        }

        router.replace("/");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full space-y-4">
      <div>
        <div className="text-lg font-semibold">
          {isSignUp ? "가족과 함께 시작하기" : "울집에 돌아오신 걸 환영해요"}
        </div>
        <p className="text-sm text-token-text-secondary mt-1">
          {isSignUp ? "가족 안부를 공유할 계정을 만들어보세요" : "ID와 비밀번호로 로그인하세요"}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">ID</span>
          <input
            name="id"
            type="text"
            required
            autoComplete={isSignUp ? "email" : "username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
            placeholder="myid123"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
            placeholder="••••••••"
            minLength={6}
          />
          {isSignUp && (
            <div className="text-xs text-token-text-secondary">최소 6자 이상 입력하세요</div>
          )}
        </label>
      </div>

      {error && (
        <div className="text-sm text-token-signal-red bg-red-50 p-3 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-green w-full disabled:opacity-50"
        >
          {loading
            ? isSignUp
              ? "계정 생성 중..."
              : "로그인 중..."
            : isSignUp
            ? "🎉 계정 만들기"
            : "🏠 로그인"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-token-text-secondary hover:text-token-signal-green transition-colors"
          >
            {isSignUp ? "이미 계정이 있으신가요? 로그인하기" : "처음 오셨나요? 계정 만들기"}
          </button>
        </div>
      </div>
    </form>
  );
}
