"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "profile" | "family" | "complete";

type OnboardingProps = {
  initialDisplayName?: string;
  initialRole?: "parent" | "child" | "sibling";
  hasProfile: boolean;
  hasSettings: boolean;
};

export default function OnboardingClient({
  initialDisplayName = "",
  initialRole = "parent",
  hasProfile,
  hasSettings,
}: OnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(hasProfile ? "family" : "profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프로필 정보
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [role, setRole] = useState<"parent" | "child" | "sibling">(initialRole);
  const [profileCompleted, setProfileCompleted] = useState(hasProfile && hasSettings);

  // 가족 정보
  const [familyChoice, setFamilyChoice] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  async function persistProfile({ withLoading }: { withLoading?: boolean } = {}) {
    if (withLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("사용자 정보를 찾을 수 없습니다");

      if (!displayName.trim()) throw new Error("이름을 입력하세요");

      // 사용자 프로필 업데이트 (username은 이미 생성됨)
      const { error: updateError } = await (supabase.from("users") as any)
        .update({
          display_name: displayName.trim(),
          locale: "ko-KR",
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // 사용자 설정 생성
      const { error: settingsError } = await (supabase.from("settings") as any).upsert({
        user_id: user.id,
        share_signals: true,
        share_meds: true,
        share_emotion: true,
        font_scale: "md",
        high_contrast: false,
        push_opt_in: false,
      });

      if (settingsError) throw settingsError;

      setProfileCompleted(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 저장 중 오류가 발생했습니다");
      return false;
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  }

  async function handleProfileSubmit() {
    const saved = await persistProfile({ withLoading: true });
    if (saved) {
      setStep("family");
    }
  }

  async function handleFamilySubmit() {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!profileCompleted) {
        const saved = await persistProfile();
        if (!saved) {
          setLoading(false);
          return;
        }
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("사용자 정보를 찾을 수 없습니다");

      if (familyChoice === "create") {
        if (!familyName.trim()) {
          setError("가족 이름을 입력하세요");
          setLoading(false);
          return;
        }

        // 새 가족 생성
        const { data: family, error: familyError } = await (supabase.from("families") as any)
          .insert({
            name: familyName.trim(),
            created_by: user.id,
          })
          .select()
          .single();

        if (familyError) throw familyError;

        // 가족 구성원으로 추가
        const { error: memberError } = await (supabase.from("family_members") as any).insert({
          family_id: family.id,
          user_id: user.id,
          role: role,
          is_active: true,
        });

        if (memberError) throw memberError;
      } else {
        // 초대 코드로 가족 합류
        if (!inviteCode.trim()) {
          setError("초대 코드를 입력하세요");
          setLoading(false);
          return;
        }

        // API를 통한 초대 코드 처리
        const response = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode.trim() }),
        });

        const result = await response.json();

        if (!result.ok) {
          setError(result.error?.message || "초대 코드 처리에 실패했습니다");
          return;
        }

        // 역할 업데이트 (API에서는 기본값 'child'로 설정됨)
        if (role !== "child") {
          const { error: roleError } = await (supabase.from("family_members") as any)
            .update({ role: role })
            .eq("family_id", result.family_id)
            .eq("user_id", user.id);

          if (roleError) {
            console.warn("역할 업데이트 실패:", roleError);
          }
        }
      }

      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "가족 설정 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function handleComplete() {
    router.replace("/");
    router.refresh();
  }

  if (step === "profile") {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="section">
          <h1 className="text-2xl font-bold">안녕하세요! 👋</h1>
          <p className="text-token-text-secondary">가족과 함께 사용할 프로필을 만들어보세요</p>
        </header>

        <main className="flex-1 px-4 pb-16 space-y-6">
          <div className="card space-y-4">
            <div>
              <label className="block space-y-1">
                <span className="text-sm font-medium">이름</span>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-accent/50"
                  placeholder="예: 엄마, 아빠, 큰아들"
                  maxLength={20}
                />
              </label>
              <div className="text-xs text-token-text-secondary mt-1">
                가족들이 볼 수 있는 이름입니다 (최대 20자)
              </div>
            </div>

            <div>
              <span className="text-sm font-medium block mb-2">가족 내 역할</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "parent", label: "👨‍👩‍👧‍👦 부모", desc: "50-60대" },
                  { value: "child", label: "🧑‍🎓 자녀", desc: "20-30대" },
                  { value: "sibling", label: "👫 형제자매", desc: "동년배" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value as typeof role)}
                    className={`p-3 rounded-xl border text-center transition-colors ${
                      role === option.value
                        ? "border-token-accent bg-token-accent/10 text-token-accent"
                        : "border-neutral-200 bg-white hover:border-token-accent"
                    }`}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-token-text-secondary">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-token-signal-red bg-red-50 p-3 rounded-xl" role="alert">
                {error}
              </div>
            )}

            <button
              onClick={handleProfileSubmit}
              disabled={loading || !displayName.trim()}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? "저장 중..." : "다음 단계 →"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === "family") {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="section">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">가족 설정 👨‍👩‍👧‍👦</h1>
              <p className="text-token-text-secondary">새로운 가족을 만들거나 기존 가족에 합류하세요</p>
            </div>
            {hasProfile && (
              <button
                type="button"
                onClick={() => setStep("profile")}
                className="text-sm text-token-accent underline"
              >
                이름/역할 수정
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pb-16 space-y-6">
          <div className="card space-y-4">
            <div>
              <span className="text-sm font-medium block mb-2">어떻게 시작하시겠어요?</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFamilyChoice("create")}
                  className={`p-4 rounded-xl border text-center transition-colors ${
                    familyChoice === "create"
                      ? "border-token-accent bg-token-accent/10 text-token-accent"
                      : "border-neutral-200 bg-white hover:border-token-accent"
                  }`}
                >
                  <div className="text-2xl mb-1">🆕</div>
                  <div className="text-sm font-medium">새 가족 만들기</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFamilyChoice("join")}
                  className={`p-4 rounded-xl border text-center transition-colors ${
                    familyChoice === "join"
                      ? "border-token-accent bg-token-accent/10 text-token-accent"
                      : "border-neutral-200 bg-white hover:border-token-accent"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
                  <div className="text-sm font-medium">기존 가족 합류</div>
                </button>
              </div>
            </div>

            {familyChoice === "create" && (
              <div>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">가족 이름</span>
                  <input
                    type="text"
                    required
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-accent/50"
                    placeholder="예: 김씨 가족, 우리 가족"
                    maxLength={30}
                  />
                </label>
              </div>
            )}

            {familyChoice === "join" && (
              <div>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">초대 코드</span>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-accent/50 font-mono"
                    placeholder="예: FAMILY123"
                    maxLength={10}
                  />
                </label>
                <div className="text-xs text-token-text-secondary mt-1">
                  가족 구성원에게 받은 초대 코드를 입력하세요
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-token-signal-red bg-red-50 p-3 rounded-xl" role="alert">
                {error}
              </div>
            )}

            <button
              onClick={handleFamilySubmit}
              disabled={
                loading ||
                (familyChoice === "create" && !familyName.trim()) ||
                (familyChoice === "join" && !inviteCode.trim())
              }
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? "설정 중..." : "가족 설정 완료 🎉"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-dvh flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="card text-center space-y-6 max-w-md mx-auto">
            <div className="text-6xl">🎉</div>
            <div>
              <div className="text-xl font-bold text-token-accent mb-2">환영합니다!</div>
              <p className="text-token-text-secondary">
                이제 가족과 함께 안심 신호를 주고받을 수 있어요.
              </p>
            </div>

            <div className="space-y-2 text-sm text-token-text-secondary">
              <p>✅ 프로필 설정 완료</p>
              <p>✅ 가족 그룹 {familyChoice === "create" ? "생성" : "합류"} 완료</p>
              <p>🚀 이제 가족 안부를 공유해보세요!</p>
            </div>

            <button onClick={handleComplete} className="btn btn-primary w-full">
              울집으로 들어가기 🏠
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
