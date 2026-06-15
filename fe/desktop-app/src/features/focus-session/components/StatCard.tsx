import "../pages/ActiveView.css";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value" style={{ color: accent }}>
        {value}
      </span>
      {sub && <span className="stat-card-sub">{sub}</span>}
    </div>
  );
}
