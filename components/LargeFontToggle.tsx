"use client";

import { useEffect, useState } from "react";

type FontScale = "md" | "lg" | "xl";

const STORAGE_KEY = "woolzip-font-scale";

export default function LargeFontToggle() {
  const [scale, setScale] = useState<FontScale>("md");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const saved = (localStorage.getItem(STORAGE_KEY) as FontScale | null) ?? "md";
    applyScale(saved);
    setScale(saved);
  }, []);

  const applyScale = (value: FontScale) => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.font = value;
    localStorage.setItem(STORAGE_KEY, value);
  };

  const handleToggle = () => {
    const next = scale === "md" ? "lg" : scale === "lg" ? "xl" : "md";
    applyScale(next);
    setScale(next);
  };

  const label =
    scale === "md"
      ? "기본"
      : scale === "lg"
        ? "큰 글자"
        : "아주 큰 글자";

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium">글자 크기</div>
        <div className="text-xs text-token-text-secondary">
          부모님이 읽기 편하도록 크게 설정하세요
        </div>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white hover:border-token-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-accent/50"
      >
        {label}
      </button>
    </div>
  );
}
