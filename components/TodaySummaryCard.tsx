type Member = {
  id: string;
  name: string;
  last: string;
  gyrc: { g: number; y: number; r: number };
  med: boolean;
};

export default function TodaySummaryCard({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {members.map((m) => (
        <div key={m.id} className="card flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{m.name}</div>
            <div className="text-sm text-token-text-secondary">마지막: {m.last}</div>
          </div>
          <div className="text-right">
            <div className="text-sm">초록/노랑/빨강: {m.gyrc.g}/{m.gyrc.y}/{m.gyrc.r}</div>
            <div
              className={`text-sm ${
                m.med ? "text-token-accent" : "text-token-text-secondary"
              }`}
            >
              약: {m.med ? "○" : "—"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
