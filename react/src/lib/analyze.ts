import type { DashboardAnalysis, DashboardChart, JsonObject, JsonValue, SummaryItem } from "./types";

function isPlainObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isArrayOfObjects(value: unknown): value is JsonObject[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => isPlainObject(item));
}

function looksLikeDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function findDataset(root: JsonValue) {
  if (isArrayOfObjects(root)) {
    return { name: "root", rows: root };
  }

  if (isPlainObject(root)) {
    for (const [key, value] of Object.entries(root)) {
      if (isArrayOfObjects(value)) {
        return { name: key, rows: value };
      }
    }

    return { name: "root-object", rows: [root] };
  }

  return {
    name: "value",
    rows: [{ value: root }]
  };
}

function buildSummary(rows: JsonObject[], numericKeys: string[]): SummaryItem[] {
  return numericKeys.map((key) => {
    const values = rows
      .map((row) => row[key])
      .filter((value): value is number => typeof value === "number");

    return {
      key,
      label: toTitleCase(key),
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Number(average(values).toFixed(2)),
      count: values.length
    };
  });
}

function buildCharts(
  rows: JsonObject[],
  numericKeys: string[],
  categoricalKeys: string[],
  dateKeys: string[]
): DashboardChart[] {
  const charts: DashboardChart[] = [];
  const primaryDateKey = dateKeys[0];
  const primaryCategoryKey = categoricalKeys[0];

  if (primaryDateKey) {
    for (const numericKey of numericKeys.slice(0, 2)) {
      charts.push({
        id: `line-${primaryDateKey}-${numericKey}`,
        type: "line",
        title: `${toTitleCase(numericKey)} over ${toTitleCase(primaryDateKey)}`,
        xKey: primaryDateKey,
        yKey: numericKey,
        data: rows
          .filter((row) => row[primaryDateKey] !== undefined && typeof row[numericKey] === "number")
          .map((row) => ({
            [primaryDateKey]: String(row[primaryDateKey]),
            [numericKey]: Number(row[numericKey])
          }))
      });
    }
  }

  if (primaryCategoryKey) {
    const counts = new Map<string, number>();

    for (const row of rows) {
      const category = row[primaryCategoryKey];
      const label = category === undefined || category === null ? "Unknown" : String(category);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    charts.push({
      id: `bar-count-${primaryCategoryKey}`,
      type: "bar",
      title: `Rows by ${toTitleCase(primaryCategoryKey)}`,
      xKey: primaryCategoryKey,
      yKey: "count",
      data: Array.from(counts.entries()).map(([label, count]) => ({
        [primaryCategoryKey]: label,
        count
      }))
    });

    const firstNumeric = numericKeys[0];

    if (firstNumeric) {
      const grouped = new Map<string, number[]>();

      for (const row of rows) {
        const category = row[primaryCategoryKey];
        const value = row[firstNumeric];

        if (typeof value !== "number") {
          continue;
        }

        const label = category === undefined || category === null ? "Unknown" : String(category);

        if (!grouped.has(label)) {
          grouped.set(label, []);
        }

        grouped.get(label)?.push(value);
      }

      charts.push({
        id: `bar-avg-${primaryCategoryKey}-${firstNumeric}`,
        type: "bar",
        title: `Average ${toTitleCase(firstNumeric)} by ${toTitleCase(primaryCategoryKey)}`,
        xKey: primaryCategoryKey,
        yKey: firstNumeric,
        data: Array.from(grouped.entries()).map(([label, values]) => ({
          [primaryCategoryKey]: label,
          [firstNumeric]: Number(average(values).toFixed(2))
        }))
      });
    }
  }

  return charts;
}

export function analyzeJson(root: JsonValue): DashboardAnalysis {
  const dataset = findDataset(root);
  const rows = dataset.rows;
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const numericKeys: string[] = [];
  const categoricalKeys: string[] = [];
  const dateKeys: string[] = [];

  for (const key of keys) {
    const values = rows
      .map((row) => row[key])
      .filter((value): value is Exclude<JsonValue, undefined> => value !== undefined && value !== null);

    if (!values.length) {
      continue;
    }

    const numericCount = values.filter((value) => typeof value === "number").length;
    const dateCount = values.filter((value) => looksLikeDate(value)).length;
    const stringCount = values.filter((value) => typeof value === "string").length;
    const categoricalCount = values.filter(
      (value) => typeof value === "string" || typeof value === "boolean"
    ).length;

    if (numericCount === values.length) {
      numericKeys.push(key);
      continue;
    }

    if (dateCount >= Math.ceil(values.length * 0.7)) {
      dateKeys.push(key);
      continue;
    }

    if (stringCount >= Math.ceil(values.length * 0.7) || categoricalCount === values.length) {
      categoricalKeys.push(key);
    }
  }

  return {
    datasetName: dataset.name,
    rowCount: rows.length,
    keys,
    numericKeys,
    categoricalKeys,
    dateKeys,
    summary: buildSummary(rows, numericKeys),
    charts: buildCharts(rows, numericKeys, categoricalKeys, dateKeys),
    rows
  };
}
