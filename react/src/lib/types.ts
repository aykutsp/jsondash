export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface SummaryItem {
  key: string;
  label: string;
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface ChartRow {
  [key: string]: string | number | boolean | null;
}

export interface DashboardChart {
  id: string;
  type: "line" | "bar";
  title: string;
  xKey: string;
  yKey: string;
  data: ChartRow[];
}

export interface DashboardAnalysis {
  datasetName: string;
  rowCount: number;
  keys: string[];
  numericKeys: string[];
  categoricalKeys: string[];
  dateKeys: string[];
  summary: SummaryItem[];
  charts: DashboardChart[];
  rows: JsonObject[];
}
