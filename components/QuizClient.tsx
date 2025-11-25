"use client";

import { useEffect, useState } from "react";

type Member = { user_id: string; display_name: string; answered: boolean };
type Answer = { user_id: string; display_name: string; answer_text: string };

type QuizData = {
  instance_id: string;
  prompt: string;
  status: "open" | "closed";
  expires_at: string | null;
  my_answered: boolean;
  answered_count: number;
  members: Member[];
  answers: Answer[];
};

export default function QuizClient({ currentUserId }: { currentUserId: string }) {
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null); // before_time, depleted 등

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/quiz/today");
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const code = data?.error?.code || "error";
        setBlocked(code);
        setQuizData(null);
        setError(
          data?.error?.message ||
            (code === "before_time"
              ? "20시 이후에 이용할 수 있어요."
              : code === "depleted"
              ? "준비된 질문이 모두 소진되었습니다."
              : "오늘의 질문을 불러오지 못했어요.")
        );
        return;
      }
      setBlocked(null);
      setQuizData(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오늘의 질문을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    const id = setInterval(fetchQuiz, 15000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async () => {
    if (!quizData?.instance_id) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/quiz/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionInstanceId: quizData.instance_id, answer_text: answerText }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error?.message || "제출에 실패했습니다");
        return;
      }
      setAnswerText("");
      setMessage("답변이 저장되었어요.");
      await fetchQuiz();
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !quizData && !blocked) {
    return <div className="card">로딩 중...</div>;
  }

  if (blocked && !quizData) {
    return (
      <div className="card space-y-2">
        <div className="font-medium">오늘의 질문</div>
        <p className="text-sm text-token-text-secondary">
          {error || "지금은 질문을 가져올 수 없습니다. 잠시 후 다시 시도해 주세요."}
        </p>
        <button onClick={fetchQuiz} className="btn w-full">
          다시 시도
        </button>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="card space-y-2">
        <div className="font-medium">오늘의 질문</div>
        <p className="text-sm text-token-text-secondary">아직 오늘의 질문이 없습니다.</p>
        <button onClick={fetchQuiz} className="btn w-full">
          새로고침
        </button>
      </div>
    );
  }

  const answeredState = quizData.my_answered;
  const memberState = quizData.members;
  const answerList = quizData.answers;

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-token-text-secondary">오늘의 질문</div>
          <div className="text-lg font-semibold mt-1 leading-snug">{quizData.prompt}</div>
        </div>
        <button onClick={fetchQuiz} className="text-xs text-token-text-secondary underline">
          새로고침
        </button>
      </div>

      {!answeredState && (
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
            disabled={submitting || answerText.trim().length === 0}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "제출 중..." : "답변 제출"}
          </button>
        </div>
      )}

      {answerList.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">가족 답변</div>
          <div className="space-y-2">
            {answerList.map((a) => (
              <div key={a.user_id} className="rounded-lg bg-neutral-50 px-3 py-2">
                <div className="text-sm font-medium">{a.display_name}</div>
                <div className="text-sm text-token-text-secondary whitespace-pre-line">
                  {a.answer_text || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {memberState.length > 0 && (
        <div className="text-xs text-token-text-secondary">
          응답: {memberState.filter((m) => m.answered).length}/{memberState.length}
        </div>
      )}

      {message && <div className="text-sm text-token-text-secondary">{message}</div>}
      {error && <div className="text-sm text-token-signal-red">{error}</div>}
    </div>
  );
}
