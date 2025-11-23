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
      <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <div className="flex-1">
        <div className="font-medium leading-tight">{title}</div>
        <div className="text-sm text-token-text-secondary leading-tight mt-1">{time}</div>
      </div>
      <div className="text-[11px] text-token-text-secondary bg-neutral-100 rounded-full px-2 py-1">
        {kindLabel[kind]}
      </div>
    </div>
  );
}
