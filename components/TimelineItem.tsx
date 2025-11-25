import type { CSSProperties } from "react";

export default function TimelineItem({
  time,
  name,
  body,
  color = "green",
  isFirst = false,
  isLast = false,
}: {
  time: string;
  name: string;
  body: string;
  color?: "green" | "yellow" | "red";
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const dot =
    color === "green"
      ? "bg-token-signal-green"
      : color === "yellow"
      ? "bg-token-signal-yellow"
      : color === "red"
      ? "bg-token-signal-red"
      : "bg-neutral-300";

  const lineStyle: CSSProperties = {
    top: isFirst ? "1.2rem" : "-1.25rem",
    bottom: isLast ? "1.2rem" : "-1.25rem",
  };

  return (
    <div className="grid grid-cols-[64px_1fr] gap-3">
      <div className="pt-2 text-sm text-token-text-secondary whitespace-nowrap">{time}</div>
      <div className="relative pl-6">
        <div
          className="absolute left-[9px] w-px bg-neutral-200"
          style={lineStyle}
          aria-hidden
        />
        <div className={`absolute left-0 top-3 h-3 w-3 rounded-full ${dot}`} aria-hidden />
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm px-4 py-3 space-y-1">
          <div className="font-semibold text-token-text-primary">{name}</div>
          <div className="text-base text-token-text-primary leading-snug">{body}</div>
        </div>
      </div>
    </div>
  );
}
