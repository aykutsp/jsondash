import { startTransition, useState, type ChangeEvent } from "react";
import "./App.css";
import { ApexGallery } from "./components/ApexGallery";
import { ChartPanel } from "./components/ChartPanel";
import { DataExplorer } from "./components/DataExplorer";
import { KpiGrid } from "./components/KpiGrid";
import { analyzeJson } from "./lib/analyze";
import { sampleData } from "./lib/sample-data";
import type { DashboardAnalysis, JsonValue } from "./lib/types";

function createDashboard(source: JsonValue): DashboardAnalysis {
  return analyzeJson(source);
}

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardAnalysis>(() => createDashboard(sampleData));
  const [sourceLabel, setSourceLabel] = useState("Shared sample dataset");
  const [message, setMessage] = useState("Ready to inspect local JSON with the full Apex chart gallery.");
  const [error, setError] = useState("");

  function loadSource(nextSource: JsonValue, label: string, note: string) {
    startTransition(() => {
      setDashboard(createDashboard(nextSource));
      setSourceLabel(label);
      setMessage(note);
      setError("");
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as JsonValue;
      loadSource(parsed, file.name, "Custom JSON loaded across the full Apex chart gallery.");
    } catch {
      setError("The selected file could not be parsed as valid JSON.");
    }
  }

  return (
    <main className="app-shell">
      <section className="hero panel">
        <div className="hero-copy">
          <span className="eyebrow">React implementation</span>
          <h1>Turn raw JSON into a dashboard before the question goes stale.</h1>
          <p>
            Upload a file, inspect a shared sample, and let the interface infer trend lines,
            grouping charts, full Apex chart families, and tabular detail instantly.
          </p>
          <div className="framework-list">
            <span className="active-chip">React</span>
            <span>Angular</span>
            <span>Flask</span>
            <span>WPF</span>
          </div>
        </div>

        <aside className="source-card">
          <span className="eyebrow">Source</span>
          <strong>{sourceLabel}</strong>
          <p>{message}</p>
          <div className="actions">
            <label className="action-button accent">
              Load JSON file
              <input type="file" accept=".json,application/json" onChange={handleFileChange} hidden />
            </label>
            <button
              className="action-button subtle"
              type="button"
              onClick={() =>
                loadSource(
                  sampleData,
                  "Shared sample dataset",
                  "Sample data restored across the full Apex chart gallery."
                )
              }
            >
              Load sample
            </button>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </aside>
      </section>

      <KpiGrid dashboard={dashboard} />

      <section className="summary-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Field scan</span>
              <h3>Automatic structure detection</h3>
            </div>
          </div>
          <div className="tag-group">
            {dashboard.numericKeys.map((key) => (
              <span className="tag" key={key}>
                Numeric: {key}
              </span>
            ))}
            {dashboard.categoricalKeys.map((key) => (
              <span className="tag" key={key}>
                Category: {key}
              </span>
            ))}
            {dashboard.dateKeys.map((key) => (
              <span className="tag" key={key}>
                Date: {key}
              </span>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Numeric summary</span>
              <h3>Fast read on the metrics</h3>
            </div>
          </div>
          <div className="stats-list">
            {dashboard.summary.length ? (
              dashboard.summary.map((item) => (
                <div className="stat-row" key={item.key}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>Avg {item.avg}</span>
                  </div>
                  <div>
                    <span>Min {item.min}</span>
                    <span>Max {item.max}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-text">No numeric fields were detected in the current dataset.</p>
            )}
          </div>
        </article>
      </section>

      <section className="chart-grid">
        {dashboard.charts.length ? (
          dashboard.charts.map((chart) => <ChartPanel chart={chart} key={chart.id} />)
        ) : (
          <article className="panel">
            <span className="eyebrow">Charts</span>
            <h3>No chartable fields were detected.</h3>
          </article>
        )}
      </section>

      <ApexGallery dashboard={dashboard} />

      <DataExplorer dashboard={dashboard} />
    </main>
  );
}
