export default function StatCard({ label, value, tone = "primary", suffix }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <span className="stat-eyebrow">{label}</span>
      <span className="stat-value">
        {value}
        {suffix ? <span className="stat-suffix">{suffix}</span> : null}
      </span>
    </div>
  );
}
