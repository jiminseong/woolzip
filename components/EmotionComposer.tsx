"use client";
import { useState } from "react";

export default function EmotionComposer() {
  const [emoji, setEmoji] = useState("😊");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [shared, setShared] = useState(false);

  const emojis = ["😊", "😌", "😴", "😂", "🥰", "😎", "🤔", "😔", "😤", "🥺"];

  async function handleShare() {
    if (!emoji.trim()) return;

    setPosting(true);
    try {
      const response = await fetch("/api/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, text: text.trim() || null }),
      });

      const result = await response.json();

      if (result.ok) {
        setShared(true);
        setText("");
      } else {
        alert(result.error?.message || "감정 공유에 실패했습니다");
      }
    } catch (error) {
      console.error("Emotion sharing error:", error);
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setPosting(false);
    }
  }

  if (shared) {
    return (
      <div className="card text-center space-y-3">
        <div className="  text-4xl">{emoji}</div>
        <div>
          <div className="font-medium text-token-signal-green">감정이 공유되었습니다!</div>
          <div className="text-sm text-token-text-secondary">오늘은 이미 감정을 공유했어요</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="text-sm font-medium">오늘 기분은 어떤가요?</div>
      <div className="flex items-center gap-2 flex-wrap">
        {emojis.map((e) => (
          <button
            key={e}
            className={`btn h-12 w-12 text-xl rounded-full flex justify-center items-center ${
              emoji === e ? "bg-token-signal-green text-white" : "bg-neutral-100"
            }`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
        <div className="bg-green-300 w-full px-4 gap-2 h-12 rounded-2xl flex justify-center items-center  text-3xl">
          <span className="text-lg">내 기분은 :</span> {emoji}
        </div>
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-signal-green"
        placeholder="한 줄로 오늘 기분 (선택사항)"
        maxLength={60}
      />
      <button
        className="btn btn-green disabled:opacity-50"
        onClick={handleShare}
        disabled={posting}
      >
        {posting ? "공유 중..." : "감정 공유하기"}
      </button>
    </div>
  );
}
