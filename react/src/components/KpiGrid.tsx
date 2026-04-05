import type { DashboardAnalysis } from "../lib/types";

interface KpiGridProps {
  dashboard: DashboardAnalysis;
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="kpi-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function KpiGrid({ dashboard }: KpiGridProps) {
  return (
    <section className="kpi-grid">
      <KpiCard label="Dataset" value={dashboard.datasetName} />
      <KpiCard label="Rows" value={dashboard.rowCount} />
      <KpiCard label="Numeric fields" value={dashboard.numericKeys.length} />
      <KpiCard label="Category fields" value={dashboard.categoricalKeys.length} />
    </section>
  );
}
