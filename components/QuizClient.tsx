"use client";

import { useMemo, useState } from "react";

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
  const [pending, setPending] = useState(members);
  const [answeredState, setAnsweredState] = useState(myAnswered);
  const [answerList, setAnswerList] = useState(answers);

  const remaining = useMemo(
    () => pending.filter((m) => !m.answered && m.user_id !== null),
    [pending]
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
      setPending((prev) =>
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

  const pendingList = pending.filter((m) => !m.answered);

  return (
    <div className="card space-y-4">
      <div>
        <div className="text-xs text-token-text-secondary">오늘의 질문</div>
        <div className="text-lg font-semibold mt-1 leading-snug">{prompt}</div>
        {expires_at && (
          <div className="text-xs text-token-text-secondary mt-1">
            마감: {new Date(expires_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {status === "open" && !answeredState && (
        <div className="space-y-2">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="짧게 남겨주세요"
            className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
            rows={3}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-green w-full disabled:opacity-60"
          >
            {submitting ? "제출 중..." : "답변 제출"}
          </button>
        </div>
      )}

      {status === "open" && answeredState && (
        <div className="text-sm text-token-text-secondary">답변을 저장했어요. 가족 응답을 기다리는 중입니다.</div>
      )}

      {status === "open" && pendingList.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">아직 대기 중인 가족</div>
          <div className="flex flex-wrap gap-2">
            {pendingList.map((m) => (
              <button
                key={m.user_id}
                type="button"
                onClick={() => sendNudge(m.user_id)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs bg-white hover:border-token-signal-green"
              >
                {m.display_name}에게 요청
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "closed" && (
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
