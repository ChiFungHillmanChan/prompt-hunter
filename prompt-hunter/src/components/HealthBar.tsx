type Props = {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
};

export default function HealthBar({ label, value, max, colorClass = 'bg-green-600' }: Props) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="text-xs mb-1">{label}</div>
      <div className="h-4 bg-white/10 rounded">
        <div className={`h-4 rounded ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


