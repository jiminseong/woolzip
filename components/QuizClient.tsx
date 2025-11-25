"use client";

import { useEffect, useMemo, useState } from "react";

type Member = { user_id: string; display_name: string; answered: boolean };
type Answer = { user_id: string; display_name: string; answer_text: string };

export default function QuizClient({
  instanceId,
  prompt,
  status,
  expires_at,
  members,
  answers,
  myAnswered,
  currentUserId,
}: {
  instanceId: string | null;
  prompt: string | null;
  status: "open" | "closed" | null;
  expires_at: string | null;
  members: Member[];
  answers: Answer[];
  myAnswered: boolean;
  currentUserId: string;
}) {
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberState, setMemberState] = useState(members);
  const [answeredState, setAnsweredState] = useState(myAnswered);
  const [answerList, setAnswerList] = useState(answers);
  const [statusState, setStatusState] = useState(status);
  const [expiresAt, setExpiresAt] = useState(expires_at);

  useEffect(() => {
    setMemberState(members);
    setAnsweredState(myAnswered);
    setAnswerList(answers);
    setStatusState(status);
    setExpiresAt(expires_at);
  }, [members, myAnswered, answers, status, expires_at, instanceId]);

  useEffect(() => {
    if (!instanceId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/quiz/today");
        const data = await res.json();
        if (!res.ok || !data?.ok || !data.data || cancelled) return;
        const incoming = data.data;
        // Only apply if same instance/day
        if (incoming.instance_id !== instanceId) return;
        setStatusState(incoming.status);
        setExpiresAt(incoming.expires_at);
        setAnsweredState(incoming.my_answered);
        setMemberState(incoming.members || []);
        if (incoming.status === "closed") {
          setAnswerList(incoming.answers || []);
        }
      } catch (e) {
        // ignore polling errors
      }
    };

    tick();
    const id = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [instanceId]);

  const remaining = useMemo(
    () => memberState.filter((m) => !m.answered && m.user_id !== null),
    [memberState]
  );

  const handleSubmit = async () => {
    if (!instanceId || !prompt) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/quiz/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionInstanceId: instanceId, answer_text: answerText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || "제출에 실패했습니다");
        return;
      }
      setAnsweredState(true);
      setMessage("답변이 저장되었어요. 가족이 모두 답변하면 공개됩니다.");
      setMemberState((prev) =>
        prev.map((m) => (m.user_id === currentUserId ? { ...m, answered: true } : m))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const sendNudge = async (toUserId: string) => {
    if (!instanceId) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/quiz/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionInstanceId: instanceId, to_user_id: toUserId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || "요청을 보낼 수 없습니다");
        return;
      }
      setMessage("답변 요청을 보냈어요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 중 오류가 발생했습니다");
    }
  };

  if (!instanceId || !prompt) {
    return (
      <div className="card">
        <div className="font-medium">오늘의 질문</div>
        <p className="text-sm text-token-text-secondary mt-1">아직 오늘의 질문이 도착하지 않았어요.</p>
      </div>
    );
  }

  const pendingList = memberState.filter((m) => !m.answered);

  return (
    <div className="card space-y-4">
      <div>
        <div className="text-xs text-token-text-secondary">오늘의 질문</div>
        <div className="text-lg font-semibold mt-1 leading-snug">{prompt}</div>
        {expiresAt && (
          <div className="text-xs text-token-text-secondary mt-1">
            마감: {new Date(expiresAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {statusState === "open" && !answeredState && (
        <div className="space-y-2">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="짧게 남겨주세요"
            className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-accent/50"
            rows={3}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "제출 중..." : "답변 제출"}
          </button>
        </div>
      )}

      {statusState === "open" && answeredState && (
        <div className="text-sm text-token-text-secondary">답변을 저장했어요. 가족 응답을 기다리는 중입니다.</div>
      )}

      {statusState === "open" && pendingList.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">아직 대기 중인 가족</div>
          <div className="flex flex-wrap gap-2">
            {pendingList.map((m) => (
              <button
                key={m.user_id}
                type="button"
                onClick={() => sendNudge(m.user_id)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs bg-white hover:border-token-accent"
              >
                {m.display_name}에게 요청
              </button>
            ))}
          </div>
        </div>
      )}

      {statusState === "closed" && (
        <div className="space-y-2">
          <div className="text-sm font-medium">가족 답변</div>
          {answerList.length === 0 ? (
            <div className="text-sm text-token-text-secondary">답변이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {answerList.map((a) => (
                <div key={a.user_id} className="rounded-lg bg-neutral-50 px-3 py-2">
                  <div className="text-sm font-medium">{a.display_name}</div>
                  <div className="text-sm text-token-text-secondary whitespace-pre-line">{a.answer_text || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {message && <div className="text-sm text-token-text-secondary">{message}</div>}
      {error && <div className="text-sm text-token-signal-red">{error}</div>}
    </div>
  );
}
