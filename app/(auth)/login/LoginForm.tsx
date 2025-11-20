"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleKakaoLogin() {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-6">
      <div>
        <div className="text-lg font-semibold">울집에 오신 걸 환영해요</div>
        <p className="text-sm text-token-text-secondary mt-1">
          카카오 계정으로 간편하게 시작하세요
        </p>
      </div>

      {error && (
        <div className="text-sm text-token-signal-red bg-red-50 p-3 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full h-12 bg-[#FEE500] hover:bg-[#FFEB3B] text-[#000000] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          aria-label="카카오 계정으로 로그인"
        >
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none" className="flex-shrink-0">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 0C4.477 0 0 3.26 0 7.297c0 2.637 1.787 4.95 4.465 6.37-.186-.677-.344-1.72-.074-2.478.245-.688 1.586-6.739 1.586-6.739s-.404-.808-.404-2.002c0-1.875 1.087-3.274 2.44-3.274 1.15 0 1.706.863 1.706 1.899 0 1.156-.736 2.886-1.116 4.489-.317 1.342.673 2.436 1.998 2.436 2.397 0 4.008-3.081 4.008-6.747 0-2.785-1.878-4.869-5.289-4.869-3.847 0-6.235 2.834-6.235 5.993 0 1.094.323 1.872.823 2.463a.41.41 0 01.094.394c-.104.435-.335 1.369-.38 1.563-.058.25-.19.302-.439.182-1.686-.688-2.481-2.594-2.481-4.725 0-3.434 2.889-7.553 8.619-7.553 4.473 0 7.436 3.118 7.436 6.469 0 4.436-2.403 7.78-5.944 7.78-1.197 0-2.323-.646-2.708-1.467 0 0-.65 2.571-.782 3.071-.236.81-.694 1.456-1.153 2.045C7.63 17.76 8.784 18 10 18c5.523 0 10-3.26 10-7.297C20 3.26 15.523 0 10 0z"
              fill="currentColor"
            />
          </svg>
          {loading ? "로그인 중..." : "카카오로 시작하기"}
        </button>

        <div className="text-xs text-token-text-secondary text-center px-4">
          로그인하면 울집의{" "}
          <button className="underline hover:text-token-signal-green">서비스 약관</button>과{" "}
          <button className="underline hover:text-token-signal-green">개인정보 처리방침</button>에
          동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  );
}
