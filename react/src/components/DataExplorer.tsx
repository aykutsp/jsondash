import { useDeferredValue, useState } from "react";
import type { DashboardAnalysis } from "../lib/types";

interface DataExplorerProps {
  dashboard: DashboardAnalysis;
}

export function DataExplorer({ dashboard }: DataExplorerProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const visibleRows = dashboard.rows.filter((row) => {
    if (!deferredQuery.trim()) {
      return true;
    }

    const search = deferredQuery.toLowerCase();
    return dashboard.keys.some((key) => String(row[key] ?? "").toLowerCase().includes(search));
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Data explorer</span>
          <h3>Search and inspect the source rows</h3>
        </div>
        <span className="meta-chip">{visibleRows.length} visible rows</span>
      </div>

      <div className="table-toolbar">
        <input
          className="search-input"
          placeholder="Search by any column value"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              {dashboard.keys.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.slice(0, 300).map((row, index) => (
              <tr key={`${row[dashboard.keys[0] ?? "row"]}-${index}`}>
                {dashboard.keys.map((key) => (
                  <td key={key}>{String(row[key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
