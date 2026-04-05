(function () {
  function average(values) {
    if (!values.length) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function normalizePercent(value) {
    return Math.max(8, Math.min(100, Math.round(value)));
  }

  function formatValue(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  function toTitleCase(value) {
    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function toShortLabel(value, fallback) {
    const label = value === undefined || value === null ? fallback : String(value);
    return label.length > 18 ? `${label.slice(0, 18)}...` : label;
  }

  function takeTail(items, maxItems) {
    return items.length > maxItems ? items.slice(items.length - maxItems) : items;
  }

  function buildChart(type, height) {
    return {
      type,
      height: height || 280,
      fontFamily: "Manrope, Segoe UI Variable, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
      foreColor: "#c8d5e3",
      animations: { enabled: true, speed: 680 },
      dropShadow: { enabled: true, top: 12, left: 0, blur: 18, color: "#030712", opacity: 0.18 }
    };
  }

  function buildXAxis(categories) {
    return {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, style: { colors: categories.map(() => "#9fb3c7"), fontSize: "11px" } }
    };
  }

  function buildYAxis() {
    return {
      labels: {
        formatter: function (value) {
          return formatValue(value);
        },
        style: { colors: ["#9fb3c7"], fontSize: "11px" }
      }
    };
  }

  function buildNumericXAxis() {
    return {
      type: "numeric",
      labels: { style: { colors: ["#9fb3c7"], fontSize: "11px" } }
    };
  }

  function buildCategoryAxis() {
    return {
      type: "category",
      labels: { style: { colors: ["#9fb3c7"], fontSize: "11px" } }
    };
  }

  function buildGrid() {
    return {
      borderColor: "rgba(255,255,255,0.08)",
      strokeDashArray: 5,
      padding: { left: 10, right: 10 }
    };
  }

  function buildLegend(position) {
    return {
      show: true,
      position: position || "bottom",
      horizontalAlign: "left",
      fontSize: "12px",
      labels: { colors: "#dce7f2" }
    };
  }

  function buildTooltip() {
    return { theme: "dark" };
  }

  function createFallbackSeries(dashboard) {
    const length = Math.max(Math.min(dashboard.rowCount, 6), 4);
    return Array.from({ length }, function (_, index) {
      return { label: `Row ${index + 1}`, value: index + 1 };
    });
  }

  function getSequentialSeries(dashboard, numericIndex) {
    const numericKey = dashboard.numericKeys[numericIndex] || dashboard.numericKeys[0];
    const labelKey = dashboard.dateKeys[0] || dashboard.categoricalKeys[0] || dashboard.keys[0];
    const rows = takeTail(dashboard.rows || [], 8);
    const points = rows
      .map(function (row, index) {
        const value = numericKey && typeof row[numericKey] === "number" ? row[numericKey] : index + 1;
        const label = labelKey
          ? toShortLabel(row[labelKey], `Row ${dashboard.rowCount - rows.length + index + 1}`)
          : `Row ${dashboard.rowCount - rows.length + index + 1}`;
        return { label, value: Number(value) };
      })
      .filter(function (item) {
        return Number.isFinite(item.value);
      });

    return points.length ? points : createFallbackSeries(dashboard);
  }

  function getAreaSeries(dashboard) {
    if (dashboard.numericKeys[1]) {
      return getSequentialSeries(dashboard, 1);
    }

    const baseSeries = getSequentialSeries(dashboard, 0);
    return baseSeries.map(function (item, index) {
      const window = baseSeries.slice(Math.max(0, index - 1), Math.min(baseSeries.length, index + 2));
      return { label: item.label, value: Number(average(window.map((entry) => entry.value)).toFixed(2)) };
    });
  }

  function getCategoryBreakdown(dashboard, numericKey, mode) {
    const categoryKey = dashboard.categoricalKeys[0] || dashboard.dateKeys[0];

    if (!categoryKey) {
      if (mode === "count") {
        return dashboard.summary.length
          ? dashboard.summary.slice(0, 6).map((item) => ({ label: item.label, value: item.count }))
          : createFallbackSeries(dashboard);
      }

      if (mode === "avg") {
        return dashboard.summary.length
          ? dashboard.summary.slice(0, 6).map((item) => ({ label: item.label, value: item.avg }))
          : createFallbackSeries(dashboard);
      }

      return dashboard.summary.length
        ? dashboard.summary.slice(0, 6).map((item) => ({ label: item.label, value: item.max }))
        : createFallbackSeries(dashboard);
    }

    const grouped = new Map();
    const counts = new Map();

    (dashboard.rows || []).forEach(function (row) {
      const label = toShortLabel(row[categoryKey], "Unknown");
      counts.set(label, (counts.get(label) || 0) + 1);

      if (!numericKey || typeof row[numericKey] !== "number") {
        return;
      }

      if (!grouped.has(label)) {
        grouped.set(label, []);
      }

      grouped.get(label).push(row[numericKey]);
    });

    return Array.from(counts.entries())
      .map(function ([label, count]) {
        if (mode === "count" || !numericKey) {
          return { label, value: count };
        }

        const values = grouped.get(label) || [];
        if (!values.length) {
          return { label, value: count };
        }

        if (mode === "avg") {
          return { label, value: Number(average(values).toFixed(2)) };
        }

        return {
          label,
          value: Number(values.reduce((sum, value) => sum + value, 0).toFixed(2))
        };
      })
      .sort(function (left, right) {
        return right.value - left.value;
      })
      .slice(0, 6);
  }

  function getScatterPoints(dashboard) {
    const xKey = dashboard.numericKeys[0];
    const yKey = dashboard.numericKeys[1] || dashboard.numericKeys[0];
    const zKey = dashboard.numericKeys[2];
    const groupKey = dashboard.categoricalKeys[0] || dashboard.dateKeys[0];

    if (!xKey && !yKey) {
      return takeTail(createFallbackSeries(dashboard), 8).map(function (item, index) {
        return { x: index + 1, y: item.value, z: (index + 2) * 6, group: "Rows" };
      });
    }

    return takeTail(dashboard.rows || [], 18)
      .map(function (row, index) {
        const xValue = xKey && typeof row[xKey] === "number" ? row[xKey] : index + 1;
        const yValue = yKey && typeof row[yKey] === "number" ? row[yKey] : index + 2;
        const zValue =
          zKey && typeof row[zKey] === "number"
            ? Math.max(6, Math.abs(Number(row[zKey]) / 8))
            : (index % 5 + 1) * 7;

        return {
          x: Number(xValue),
          y: Number(yValue),
          z: Number(zValue.toFixed(2)),
          group: groupKey ? toShortLabel(row[groupKey], "Rows") : "Rows"
        };
      })
      .filter(function (point) {
        return Number.isFinite(point.x) && Number.isFinite(point.y);
      });
  }

  function getRadarSeries(dashboard) {
    const labels = getCategoryBreakdown(dashboard, undefined, "count").map((item) => item.label);
    const metrics = dashboard.numericKeys.length ? dashboard.numericKeys.slice(0, 3) : ["rows"];
    const series = metrics.map(function (metric) {
      if (metric === "rows") {
        const countMap = new Map(getCategoryBreakdown(dashboard, undefined, "count").map((item) => [item.label, item.value]));
        return { name: "Rows", data: labels.map((label) => countMap.get(label) || 0) };
      }

      const valueMap = new Map(getCategoryBreakdown(dashboard, metric, "avg").map((item) => [item.label, item.value]));
      return { name: toTitleCase(metric), data: labels.map((label) => valueMap.get(label) || 0) };
    });

    return { labels, series };
  }

  function getHeatmapSeries(dashboard) {
    const labels = getCategoryBreakdown(dashboard, undefined, "count").map((item) => item.label);
    const metrics = dashboard.numericKeys.length ? dashboard.numericKeys.slice(0, 3) : ["rows"];

    return metrics.map(function (metric) {
      if (metric === "rows") {
        const countMap = new Map(getCategoryBreakdown(dashboard, undefined, "count").map((item) => [item.label, item.value]));
        return { name: "Rows", data: labels.map((label) => ({ x: label, y: countMap.get(label) || 0 })) };
      }

      const averageMap = new Map(getCategoryBreakdown(dashboard, metric, "avg").map((item) => [item.label, item.value]));
      return {
        name: toTitleCase(metric),
        data: labels.map((label) => ({ x: label, y: averageMap.get(label) || 0 }))
      };
    });
  }

  function getSummaryRangeBars(dashboard) {
    if (dashboard.summary.length) {
      return dashboard.summary.slice(0, 5).map(function (item) {
        const start = item.min;
        const end = item.max === item.min ? item.max + 1 : item.max;
        return { x: item.label, y: [Number(start.toFixed(2)), Number(end.toFixed(2))] };
      });
    }

    return [
      { x: "Rows", y: [0, Math.max(dashboard.rowCount, 1)] },
      { x: "Fields", y: [0, Math.max(dashboard.keys.length, 1)] },
      { x: "Numeric", y: [0, Math.max(dashboard.numericKeys.length, 1)] }
    ];
  }

  function getRangeAreaSeries(series) {
    return series.map(function (item, index) {
      const window = series.slice(Math.max(0, index - 1), Math.min(series.length, index + 2));
      const values = window.map((entry) => entry.value);
      return { x: item.label, y: [Math.min.apply(null, values), Math.max.apply(null, values)] };
    });
  }

  function getCandlestickSeries(series) {
    return series.map(function (item, index) {
      const previous = series[Math.max(index - 1, 0)]?.value ?? item.value;
      const next = series[Math.min(index + 1, series.length - 1)]?.value ?? item.value;
      const open = Number(previous.toFixed(2));
      const close = Number(item.value.toFixed(2));
      const drift = Math.max(Math.abs(next - previous) * 0.45, Math.max(item.value * 0.05, 1));
      const high = Number((Math.max(open, close) + drift).toFixed(2));
      const low = Number(Math.max(0, Math.min(open, close) - drift).toFixed(2));
      return { x: item.label, y: [open, high, low, close] };
    });
  }

  function quantile(values, ratio) {
    if (values.length === 1) {
      return Number(values[0].toFixed(2));
    }

    const position = (values.length - 1) * ratio;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) {
      return Number(values[lower].toFixed(2));
    }

    return Number((values[lower] + (values[upper] - values[lower]) * (position - lower)).toFixed(2));
  }

  function computeBoxPlot(values) {
    const sorted = values.slice().sort(function (left, right) {
      return left - right;
    });

    if (!sorted.length) {
      return [0, 0, 0, 0, 0];
    }

    return [
      Number(sorted[0].toFixed(2)),
      quantile(sorted, 0.25),
      quantile(sorted, 0.5),
      quantile(sorted, 0.75),
      Number(sorted.at(-1).toFixed(2))
    ];
  }

  function getBoxPlotSeries(dashboard) {
    const categoryKey = dashboard.categoricalKeys[0] || dashboard.dateKeys[0];
    const metricKey = dashboard.numericKeys[0];

    if (categoryKey && metricKey) {
      const grouped = new Map();
      (dashboard.rows || []).forEach(function (row) {
        const label = toShortLabel(row[categoryKey], "Unknown");
        const value = row[metricKey];

        if (typeof value !== "number") {
          return;
        }

        if (!grouped.has(label)) {
          grouped.set(label, []);
        }

        grouped.get(label).push(value);
      });

      const entries = Array.from(grouped.entries())
        .slice(0, 6)
        .map(function ([label, values]) {
          return { x: label, y: computeBoxPlot(values) };
        });

      if (entries.length) {
        return entries;
      }
    }

    const fallback = getSequentialSeries(dashboard, 0);
    const bucketCount = Math.min(4, Math.max(2, fallback.length));
    const chunks = Array.from({ length: bucketCount }, function (_, index) {
      return fallback.filter(function (_item, pointIndex) {
        return pointIndex % bucketCount === index;
      });
    }).filter(function (chunk) {
      return chunk.length;
    });

    return chunks.map(function (chunk, index) {
      return { x: `Slice ${index + 1}`, y: computeBoxPlot(chunk.map((item) => item.value)) };
    });
  }

  function getRadialMetrics(dashboard) {
    const detectedKeys =
      dashboard.numericKeys.length + dashboard.categoricalKeys.length + dashboard.dateKeys.length;

    return [
      { label: "Schema fit", value: normalizePercent((detectedKeys / Math.max(dashboard.keys.length, 1)) * 100) },
      { label: "Metric depth", value: normalizePercent((dashboard.summary.length / Math.max(dashboard.keys.length, 1)) * 100 + 24) },
      { label: "Row readiness", value: normalizePercent(dashboard.rowCount * 12) }
    ];
  }

  function getMetricLabel(dashboard, numericIndex) {
    const metric = dashboard.numericKeys[numericIndex] || dashboard.numericKeys[0];
    return metric ? toTitleCase(metric) : "Dataset metric";
  }

  function buildCards(dashboard) {
    const lineSeries = getSequentialSeries(dashboard, 0);
    const areaSeries = getAreaSeries(dashboard);
    const categoryCounts = getCategoryBreakdown(dashboard, undefined, "count");
    const categoryTotals = getCategoryBreakdown(dashboard, dashboard.numericKeys[0], "sum");
    const categoryAverages = getCategoryBreakdown(dashboard, dashboard.numericKeys[0], "avg");
    const scatterPoints = getScatterPoints(dashboard);
    const radar = getRadarSeries(dashboard);
    const heatmap = getHeatmapSeries(dashboard);
    const rangeArea = getRangeAreaSeries(lineSeries);
    const candles = getCandlestickSeries(lineSeries);
    const boxPlot = getBoxPlotSeries(dashboard);
    const radialMetrics = getRadialMetrics(dashboard);
    const rangeBars = getSummaryRangeBars(dashboard);
    const scatterGroups = Array.from(
      scatterPoints.reduce(function (map, point) {
        if (!map.has(point.group)) {
          map.set(point.group, []);
        }
        map.get(point.group).push({ x: point.x, y: point.y });
        return map;
      }, new Map())
    )
      .slice(0, 4)
      .map(function ([group, data]) {
        return { name: group, data };
      });
    const bubbleSeries = [{ name: "Dataset intensity", data: scatterPoints.map((point) => ({ x: point.x, y: point.y, z: point.z })) }];

    return [
      {
        id: "showcase-line",
        badge: "Line",
        title: `${getMetricLabel(dashboard, 0)} trajectory`,
        subtitle: "The cleanest read on sequence, trend, and turning points.",
        note: "Sequential signal",
        skin: "atlas",
        options: {
          series: [{ name: getMetricLabel(dashboard, 0), data: lineSeries.map((item) => item.value) }],
          chart: buildChart("line"),
          colors: ["#efbb49"],
          stroke: { curve: "smooth", width: 4 },
          dataLabels: { enabled: false },
          markers: { size: 4, strokeWidth: 0, hover: { size: 7 } },
          xaxis: buildXAxis(lineSeries.map((item) => item.label)),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-area",
        badge: "Area",
        title: `${getMetricLabel(dashboard, 1)} flow`,
        subtitle: "Adds volume and atmosphere to the same sequential story.",
        note: "Filled progression",
        skin: "ember",
        options: {
          series: [{ name: getMetricLabel(dashboard, 1), data: areaSeries.map((item) => item.value) }],
          chart: buildChart("area"),
          colors: ["#4fd1c5"],
          stroke: { curve: "smooth", width: 3.5 },
          fill: { type: "gradient", gradient: { shadeIntensity: 0.2, opacityFrom: 0.48, opacityTo: 0.04, stops: [0, 100] } },
          dataLabels: { enabled: false },
          xaxis: buildXAxis(areaSeries.map((item) => item.label)),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-bar",
        badge: "Bar",
        title: "Category volume",
        subtitle: "Fast visual ranking for counts, totals, or grouped performance.",
        note: "Discrete comparison",
        skin: "lagoon",
        options: {
          series: [{ name: "Rows", data: categoryCounts.map((item) => item.value) }],
          chart: buildChart("bar"),
          colors: ["#4f7cff", "#efbb49", "#2dd4bf", "#ff8a5b", "#b392f0", "#7dd3fc"],
          plotOptions: { bar: { distributed: true, borderRadius: 14, columnWidth: "48%" } },
          dataLabels: { enabled: false },
          xaxis: buildXAxis(categoryCounts.map((item) => item.label)),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-pie",
        badge: "Pie",
        title: "Share of rows",
        subtitle: "A quick part-to-whole read for category counts.",
        note: "Composition view",
        skin: "plum",
        options: {
          series: categoryCounts.map((item) => item.value),
          chart: buildChart("pie", 290),
          labels: categoryCounts.map((item) => item.label),
          colors: ["#efbb49", "#2dd4bf", "#4f7cff", "#ff8a5b", "#b392f0", "#7dd3fc"],
          legend: buildLegend("bottom"),
          dataLabels: { enabled: false },
          tooltip: buildTooltip(),
          stroke: { colors: ["rgba(14, 19, 29, 0.4)"] }
        }
      },
      {
        id: "showcase-donut",
        badge: "Donut",
        title: `Average ${getMetricLabel(dashboard, 0)} by segment`,
        subtitle: "Same composition story with a stronger center-weighted layout.",
        note: "Center-weighted split",
        skin: "atlas",
        options: {
          series: categoryAverages.map((item) => item.value),
          chart: buildChart("donut", 290),
          labels: categoryAverages.map((item) => item.label),
          colors: ["#2dd4bf", "#efbb49", "#ff8a5b", "#4f7cff", "#b392f0", "#7dd3fc"],
          legend: buildLegend("bottom"),
          dataLabels: { enabled: false },
          plotOptions: { pie: { donut: { size: "62%" } } },
          tooltip: buildTooltip(),
          stroke: { colors: ["rgba(14, 19, 29, 0.4)"] }
        }
      },
      {
        id: "showcase-radial-bar",
        badge: "Radial Bar",
        title: "Dataset health ring",
        subtitle: "Progress-style metric readouts in a compact circular layout.",
        note: "Multi-metric gauge",
        skin: "ember",
        options: {
          series: radialMetrics.map((item) => item.value),
          chart: buildChart("radialBar", 290),
          labels: radialMetrics.map((item) => item.label),
          colors: ["#efbb49", "#4fd1c5", "#4f7cff"],
          plotOptions: {
            radialBar: {
              startAngle: -120,
              endAngle: 240,
              track: { background: "rgba(255,255,255,0.1)", margin: 8 },
              hollow: { size: "24%" },
              dataLabels: {
                name: { fontSize: "12px", color: "#a8bdd1" },
                value: { fontSize: "21px", fontWeight: "700", color: "#f6fbff" }
              }
            }
          },
          stroke: { lineCap: "round" }
        }
      },
      {
        id: "showcase-scatter",
        badge: "Scatter",
        title: "Metric relationship",
        subtitle: "Looks for clusters, outliers, and cross-metric spread.",
        note: "Correlation scan",
        skin: "lagoon",
        options: {
          series: scatterGroups,
          chart: buildChart("scatter"),
          colors: ["#efbb49", "#4fd1c5", "#ff8a5b", "#7dd3fc"],
          markers: { size: 6, hover: { size: 8 } },
          xaxis: buildNumericXAxis(),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          legend: buildLegend("top"),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-bubble",
        badge: "Bubble",
        title: "Relationship plus intensity",
        subtitle: "Adds a third variable through size so impact is instantly visible.",
        note: "Three-dimensional read",
        skin: "plum",
        options: {
          series: bubbleSeries,
          chart: buildChart("bubble"),
          colors: ["#efbb49"],
          fill: { opacity: 0.72 },
          xaxis: buildNumericXAxis(),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-heatmap",
        badge: "Heatmap",
        title: "Metric heat grid",
        subtitle: "Shows relative hot spots across categories and measures.",
        note: "Intensity matrix",
        skin: "atlas",
        options: {
          series: heatmap,
          chart: buildChart("heatmap"),
          colors: ["#4f7cff"],
          plotOptions: { heatmap: { radius: 8, shadeIntensity: 0.48 } },
          dataLabels: { enabled: false },
          xaxis: buildXAxis(categoryCounts.map((item) => item.label)),
          tooltip: buildTooltip(),
          legend: buildLegend("top")
        }
      },
      {
        id: "showcase-candlestick",
        badge: "Candlestick",
        title: "Synthetic OHLC view",
        subtitle: "Useful when a sequence needs open-high-low-close framing.",
        note: "OHLC storytelling",
        skin: "ember",
        options: {
          series: [{ name: "Session", data: candles }],
          chart: buildChart("candlestick"),
          plotOptions: { candlestick: { colors: { upward: "#2dd4bf", downward: "#ff8a5b" } } },
          xaxis: buildCategoryAxis(),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-box-plot",
        badge: "Box Plot",
        title: "Distribution spread",
        subtitle: "Ideal for medians, quartiles, and understanding variability.",
        note: "Quartile summary",
        skin: "lagoon",
        options: {
          series: [{ name: getMetricLabel(dashboard, 0), data: boxPlot }],
          chart: buildChart("boxPlot"),
          colors: ["#efbb49"],
          plotOptions: { boxPlot: { colors: { upper: "#4fd1c5", lower: "#4f7cff" } } },
          xaxis: buildXAxis(boxPlot.map((item) => item.x)),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-radar",
        badge: "Radar",
        title: "Multi-metric shape",
        subtitle: "Compares several measures across the same set of categories.",
        note: "Profile comparison",
        skin: "plum",
        options: {
          series: radar.series,
          chart: buildChart("radar"),
          colors: ["#efbb49", "#4fd1c5", "#7dd3fc"],
          stroke: { width: 2.8 },
          fill: { opacity: 0.18 },
          xaxis: { categories: radar.labels, labels: { style: { colors: radar.labels.map(() => "#d7e1ec"), fontSize: "12px" } } },
          legend: buildLegend("top"),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-polar-area",
        badge: "Polar Area",
        title: "Circular category emphasis",
        subtitle: "Great when you want magnitude but keep a strong radial composition.",
        note: "Radial composition",
        skin: "atlas",
        options: {
          series: categoryTotals.map((item) => item.value),
          chart: buildChart("polarArea", 290),
          labels: categoryTotals.map((item) => item.label),
          colors: ["#efbb49", "#4fd1c5", "#ff8a5b", "#4f7cff", "#b392f0", "#7dd3fc"],
          stroke: { colors: ["rgba(14, 19, 29, 0.35)"] },
          fill: { opacity: 0.9 },
          legend: buildLegend("bottom"),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-range-bar",
        badge: "Range Bar",
        title: "Min-max per metric",
        subtitle: "Summarizes span and variance in a compact horizontal form.",
        note: "Range summary",
        skin: "ember",
        options: {
          series: [{ name: "Range", data: rangeBars }],
          chart: buildChart("rangeBar"),
          colors: ["#4fd1c5"],
          plotOptions: { bar: { horizontal: true, borderRadius: 10, barHeight: "48%" } },
          xaxis: buildNumericXAxis(),
          yaxis: { labels: { style: { colors: ["#d7e1ec"], fontSize: "12px" } } },
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-range-area",
        badge: "Range Area",
        title: "Volatility band",
        subtitle: "Frames the likely upper and lower corridor around a sequential metric.",
        note: "Upper-lower corridor",
        skin: "lagoon",
        options: {
          series: [{ name: "Operating band", data: rangeArea }],
          chart: buildChart("rangeArea"),
          colors: ["#7dd3fc"],
          fill: { type: "gradient", gradient: { opacityFrom: 0.38, opacityTo: 0.05, stops: [0, 100] } },
          stroke: { curve: "smooth", width: 2.4 },
          dataLabels: { enabled: false },
          xaxis: buildXAxis(lineSeries.map((item) => item.label)),
          yaxis: buildYAxis(),
          grid: buildGrid(),
          tooltip: buildTooltip()
        }
      },
      {
        id: "showcase-treemap",
        badge: "Treemap",
        title: "Contribution map",
        subtitle: "Highlights which segments dominate the total contribution.",
        note: "Nested composition",
        skin: "plum",
        options: {
          series: [{ data: categoryTotals.map((item) => ({ x: item.label, y: item.value })) }],
          chart: buildChart("treemap"),
          colors: ["#4f7cff", "#efbb49", "#2dd4bf", "#ff8a5b", "#b392f0", "#7dd3fc"],
          legend: { show: false },
          dataLabels: { enabled: true, style: { fontSize: "12px" } },
          tooltip: buildTooltip()
        }
      }
    ];
  }

  window.renderApexGallery = function renderApexGallery(container, dashboard) {
    if (!container || !window.ApexCharts) {
      return;
    }

    const cards = buildCards(dashboard);
    const countChip = document.getElementById("apexGalleryCount");

    if (countChip) {
      countChip.textContent = `${cards.length} chart types`;
    }

    container.innerHTML = cards
      .map(function (card) {
        return `
          <article class="gallery-card ${card.skin}">
            <div class="gallery-header">
              <div>
                <span class="eyebrow">${card.badge}</span>
                <h4>${card.title}</h4>
              </div>
              <span class="mini-chip">${card.note}</span>
            </div>
            <p class="gallery-subtitle">${card.subtitle}</p>
            <div class="gallery-shell">
              <div class="gallery-host" id="${card.id}"></div>
            </div>
          </article>
        `;
      })
      .join("");

    cards.forEach(function (card) {
      const host = document.getElementById(card.id);
      if (!host) {
        return;
      }

      const chart = new ApexCharts(host, card.options);
      chart.render();
    });
  };
})();
