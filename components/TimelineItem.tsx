type Kind = "signal" | "med" | "emotion" | "join";

const kindLabel: Record<Kind, string> = {
  signal: "신호",
  med: "복용",
  emotion: "감정",
  join: "참여",
};

export default function TimelineItem({
  kind,
  title,
  time,
  color,
}: {
  kind: Kind;
  title: string;
  time: string;
  color?: "green" | "yellow" | "red";
}) {
  const dot =
    color === "green"
      ? "bg-token-signal-green"
      : color === "yellow"
        ? "bg-token-signal-yellow"
        : color === "red"
          ? "bg-token-signal-red"
          : "bg-neutral-300";
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-3 h-3 rounded-full ${dot}`} />
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-token-text-secondary">{time}</div>
      </div>
      <div className="text-xs text-token-text-secondary">{kindLabel[kind]}</div>
    </div>
  );
}
