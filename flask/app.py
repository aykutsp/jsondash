from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Any

from flask import Flask, jsonify, render_template, request


BASE_DIR = Path(__file__).resolve().parent
SAMPLE_PATH = BASE_DIR.parent / "shared" / "sample-data" / "sales.json"

app = Flask(__name__)


def is_plain_object(value: Any) -> bool:
    return isinstance(value, dict)


def is_array_of_objects(value: Any) -> bool:
    return isinstance(value, list) and bool(value) and all(is_plain_object(item) for item in value)


def looks_like_date(value: Any) -> bool:
    if not isinstance(value, str):
        return False

    try:
        from datetime import datetime

        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def to_title_case(value: str) -> str:
    return value.replace("_", " ").replace("-", " ").title()


def find_dataset(root: Any) -> tuple[str, list[dict[str, Any]]]:
    if is_array_of_objects(root):
        return "root", root

    if is_plain_object(root):
        for key, value in root.items():
            if is_array_of_objects(value):
                return key, value

        return "root-object", [root]

    return "value", [{"value": root}]


def analyze_json(root: Any) -> dict[str, Any]:
    dataset_name, rows = find_dataset(root)
    keys = list(dict.fromkeys(key for row in rows for key in row.keys()))
    numeric_keys: list[str] = []
    categorical_keys: list[str] = []
    date_keys: list[str] = []

    for key in keys:
        values = [row.get(key) for row in rows if row.get(key) is not None]

        if not values:
            continue

        numeric_count = sum(isinstance(value, (int, float)) and not isinstance(value, bool) for value in values)
        date_count = sum(looks_like_date(value) for value in values)
        string_count = sum(isinstance(value, str) for value in values)
        categorical_count = sum(isinstance(value, (str, bool)) for value in values)

        if numeric_count == len(values):
            numeric_keys.append(key)
            continue

        if date_count >= (len(values) * 0.7):
            date_keys.append(key)
            continue

        if string_count >= (len(values) * 0.7) or categorical_count == len(values):
            categorical_keys.append(key)

    summary = []
    for key in numeric_keys:
        values = [float(row[key]) for row in rows if isinstance(row.get(key), (int, float))]
        summary.append(
            {
                "key": key,
                "label": to_title_case(key),
                "min": min(values),
                "max": max(values),
                "avg": round(mean(values), 2),
                "count": len(values),
            }
        )

    charts: list[dict[str, Any]] = []
    primary_date_key = date_keys[0] if date_keys else None
    primary_category_key = categorical_keys[0] if categorical_keys else None

    if primary_date_key:
        for numeric_key in numeric_keys[:2]:
            charts.append(
                {
                    "id": f"line-{primary_date_key}-{numeric_key}",
                    "type": "line",
                    "title": f"{to_title_case(numeric_key)} over {to_title_case(primary_date_key)}",
                    "xKey": primary_date_key,
                    "yKey": numeric_key,
                    "data": [
                        {
                            primary_date_key: str(row.get(primary_date_key)),
                            numeric_key: row.get(numeric_key),
                        }
                        for row in rows
                        if row.get(primary_date_key) is not None and isinstance(row.get(numeric_key), (int, float))
                    ],
                }
            )

    if primary_category_key:
        counts: dict[str, int] = {}

        for row in rows:
            raw_value = row.get(primary_category_key)
            label = "Unknown" if raw_value is None else str(raw_value)
            counts[label] = counts.get(label, 0) + 1

        charts.append(
            {
                "id": f"bar-count-{primary_category_key}",
                "type": "bar",
                "title": f"Rows by {to_title_case(primary_category_key)}",
                "xKey": primary_category_key,
                "yKey": "count",
                "data": [{primary_category_key: label, "count": count} for label, count in counts.items()],
            }
        )

        first_numeric = numeric_keys[0] if numeric_keys else None
        if first_numeric:
            grouped: dict[str, list[float]] = {}

            for row in rows:
                raw_value = row.get(primary_category_key)
                numeric_value = row.get(first_numeric)

                if not isinstance(numeric_value, (int, float)):
                    continue

                label = "Unknown" if raw_value is None else str(raw_value)
                grouped.setdefault(label, []).append(float(numeric_value))

            charts.append(
                {
                    "id": f"bar-avg-{primary_category_key}-{first_numeric}",
                    "type": "bar",
                    "title": f"Average {to_title_case(first_numeric)} by {to_title_case(primary_category_key)}",
                    "xKey": primary_category_key,
                    "yKey": first_numeric,
                    "data": [
                        {primary_category_key: label, first_numeric: round(mean(values), 2)}
                        for label, values in grouped.items()
                    ],
                }
            )

    return {
        "datasetName": dataset_name,
        "rowCount": len(rows),
        "keys": keys,
        "numericKeys": numeric_keys,
        "categoricalKeys": categorical_keys,
        "dateKeys": date_keys,
        "summary": summary,
        "charts": charts,
        "rows": rows,
    }


def load_sample() -> Any:
    return json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))


def dashboard_context(source_data: Any, source_label: str, message: str, error: str = "") -> dict[str, Any]:
    return {
        "dashboard": analyze_json(source_data),
        "source_label": source_label,
        "message": message,
        "error": error,
    }


@app.get("/api/dashboard")
def dashboard_api():
    return jsonify(dashboard_context(load_sample(), "Shared sample dataset", "API preview")["dashboard"])


@app.route("/", methods=["GET", "POST"])
def index():
    source_data = load_sample()
    source_label = "Shared sample dataset"
    message = "Flask dashboard is ready."
    error = ""

    if request.method == "POST":
        action = request.form.get("action", "")

        if action == "sample":
            message = "Sample data restored."
        else:
            uploaded = request.files.get("json_file")

            if uploaded and uploaded.filename:
                try:
                    source_data = json.loads(uploaded.read().decode("utf-8"))
                    source_label = uploaded.filename
                    message = "Custom JSON loaded successfully."
                except (UnicodeDecodeError, json.JSONDecodeError):
                    error = "The selected file could not be parsed as valid JSON."

    context = dashboard_context(source_data, source_label, message, error)
    return render_template("index.html", **context)


if __name__ == "__main__":
    app.run(debug=False, port=5000)
