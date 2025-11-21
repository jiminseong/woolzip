"use client";
import { useState } from "react";

type SignalType = "green" | "yellow" | "red";
type Tag = "meal" | "home" | "leave" | "sleep" | "wake" | "sos";

export default function SignalButton({
  type,
  tag,
  label,
  onPosted,
}: {
  type: SignalType;
  tag?: Tag;
  label: string;
  onPosted?: (payload: { type: SignalType; tag?: Tag; id?: string; undo_until?: string }) => void;
}) {
  const [posting, setPosting] = useState(false);
  const color = type === "green" ? "btn-green" : type === "yellow" ? "btn-amber" : "btn-red";

  async function handleClick() {
    setPosting(true);
    try {
      const response = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tag }),
      });

      const result = await response.json();

      if (result.ok) {
        onPosted?.({ type, tag, id: result.id, undo_until: result.undo_until });
      } else {
        console.error("Signal posting failed:", result.error);
        alert(result.error?.message || "신호 전송에 실패했습니다");
      }
    } catch (error) {
      console.error("Signal posting error:", error);
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setPosting(false);
    }
  }

  return (
    <button disabled={posting} onClick={handleClick} className={`btn ${color} w-full`}>
      {label}
    </button>
  );
}
