"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "profile" | "family" | "complete";

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프로필 정보
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"parent" | "child" | "sibling">("parent");

  // 가족 정보
  const [familyChoice, setFamilyChoice] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  async function handleProfileSubmit() {
    if (!displayName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("사용자 정보를 찾을 수 없습니다");

      // 사용자 프로필 업데이트
      const { error: updateError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        display_name: displayName.trim(),
        locale: "ko-KR",
      });

      if (updateError) throw updateError;

      // 사용자 설정 생성
      const { error: settingsError } = await supabase.from("settings").upsert({
        user_id: user.id,
        share_signals: true,
        share_meds: true,
        share_emotion: true,
        font_scale: "md",
        high_contrast: false,
        push_opt_in: false,
      });

      if (settingsError) throw settingsError;

      setStep("family");
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 저장 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleFamilySubmit() {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("사용자 정보를 찾을 수 없습니다");

      if (familyChoice === "create") {
        if (!familyName.trim()) {
          setError("가족 이름을 입력하세요");
          return;
        }

        // 새 가족 생성
        const { data: family, error: familyError } = await supabase
          .from("families")
          .insert({
            name: familyName.trim(),
            created_by: user.id,
          })
          .select()
          .single();

        if (familyError) throw familyError;

        // 가족 구성원으로 추가
        const { error: memberError } = await supabase.from("family_members").insert({
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
          return;
        }

        // 초대 코드 확인
        const { data: invite, error: inviteError } = await supabase
          .from("invites")
          .select("family_id")
          .eq("code", inviteCode.trim())
          .gt("expires_at", new Date().toISOString())
          .is("used_by", null)
          .single();

        if (inviteError || !invite) {
          setError("유효하지 않거나 만료된 초대 코드입니다");
          return;
        }

        // 가족 구성원으로 추가
        const { error: memberError } = await supabase.from("family_members").insert({
          family_id: invite.family_id,
          user_id: user.id,
          role: role,
          is_active: true,
        });

        if (memberError) throw memberError;

        // 초대 코드 사용 처리
        const { error: useError } = await supabase
          .from("invites")
          .update({ used_by: user.id })
          .eq("code", inviteCode.trim());

        if (useError) console.warn("초대 코드 업데이트 실패:", useError);
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
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
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
                        ? "border-token-signal-green bg-green-50 text-token-signal-green"
                        : "border-neutral-200 bg-white hover:border-token-signal-green"
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
              className="btn btn-green w-full disabled:opacity-50"
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
          <h1 className="text-2xl font-bold">가족 설정 👨‍👩‍👧‍👦</h1>
          <p className="text-token-text-secondary">새로운 가족을 만들거나 기존 가족에 합류하세요</p>
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
                      ? "border-token-signal-green bg-green-50 text-token-signal-green"
                      : "border-neutral-200 bg-white hover:border-token-signal-green"
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
                      ? "border-token-signal-green bg-green-50 text-token-signal-green"
                      : "border-neutral-200 bg-white hover:border-token-signal-green"
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
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
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
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green font-mono"
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
              className="btn btn-green w-full disabled:opacity-50"
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
              <div className="text-xl font-bold text-token-signal-green mb-2">환영합니다!</div>
              <p className="text-token-text-secondary">
                이제 가족과 함께 안심 신호를 주고받을 수 있어요.
              </p>
            </div>

            <div className="space-y-2 text-sm text-token-text-secondary">
              <p>✅ 프로필 설정 완료</p>
              <p>✅ 가족 그룹 {familyChoice === "create" ? "생성" : "합류"} 완료</p>
              <p>🚀 이제 가족 안부를 공유해보세요!</p>
            </div>

            <button onClick={handleComplete} className="btn btn-green w-full">
              울집으로 들어가기 🏠
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
