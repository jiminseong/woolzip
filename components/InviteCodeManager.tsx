"use client";

import { useState } from "react";

export default function InviteCodeManager() {
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  async function generateCode() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error?.message || "초대 코드 생성에 실패했습니다");
        return;
      }

      setInviteCode(data.code);
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">가족 초대하기</h3>
        <p className="text-sm text-token-text-secondary">
          가족 구성원에게 초대 코드를 공유하여 울집에 함께 참여하세요
        </p>
      </div>

      {error && (
        <div className="text-sm text-token-signal-red bg-red-50 p-3 rounded-xl" role="alert">
          {error}
        </div>
      )}

      {!inviteCode ? (
        <button
          onClick={generateCode}
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {loading ? "생성 중..." : "초대 코드 생성하기"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-token-bg-subtle p-4 rounded-xl">
            <div className="text-sm text-token-text-secondary mb-1">초대 코드</div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-2xl font-bold text-token-accent">
                {inviteCode}
              </div>
              <button
                onClick={copyCode}
                className="btn h-10 px-3 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              >
                {copySuccess ? "✓" : "복사"}
              </button>
            </div>
          </div>

          <div className="text-xs text-token-text-secondary space-y-1">
            <p>• 이 코드는 24시간 후에 만료됩니다</p>
            <p>• 가족 구성원에게 코드를 공유하여 초대하세요</p>
            <p>• 새 코드를 생성하면 이전 코드는 무효화됩니다</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generateCode}
              disabled={loading}
              className="btn flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            >
              새 코드 생성
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "울집 초대",
                    text: `울집 가족 그룹에 초대합니다!\n\n초대 코드: ${inviteCode}\n\n울집 앱을 다운로드하고 이 코드를 입력하세요.`,
                    url: window.location.origin,
                  });
                } else {
                  copyCode();
                }
              }}
              className="btn flex-1 bg-token-accent hover:bg-blue-600 text-white"
            >
              공유하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
