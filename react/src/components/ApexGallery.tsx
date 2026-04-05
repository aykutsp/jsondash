import Chart from "react-apexcharts";
import type { DashboardAnalysis } from "../lib/types";
import { buildApexShowcase } from "../lib/apexShowcase";

type Props = {
  dashboard: DashboardAnalysis;
};

export function ApexGallery({ dashboard }: Props) {
  const gallery = buildApexShowcase(dashboard);

  return (
    <section className="panel apex-lab">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Apex gallery</span>
          <h3>All major Apex chart families in one live demo</h3>
        </div>
        <span className="meta-chip">{gallery.length} chart types</span>
      </div>

      <p className="gallery-copy">
        Same dataset, sixteen visual languages. Use this section as a live ApexCharts reference for
        composition, comparison, distribution, correlation, range, and hierarchy patterns.
      </p>

      <div className="apex-gallery-grid">
        {gallery.map((card) => {
          const chartType = card.chart.chart?.type ?? "line";
          const chartHeight = Number(card.chart.chart?.height ?? 280);
          const { series = [], ...options } = card.chart;

          return (
            <article className={`gallery-card ${card.skin}`} key={card.id}>
              <div className="gallery-header">
                <div>
                  <span className="eyebrow">{card.badge}</span>
                  <h4>{card.title}</h4>
                </div>
                <span className="mini-chip">{card.note}</span>
              </div>
              <p className="gallery-subtitle">{card.subtitle}</p>
              <div className="gallery-shell">
                <Chart
                  className="gallery-host"
                  options={options}
                  series={series as never[]}
                  type={chartType as never}
                  height={chartHeight}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
