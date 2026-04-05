import { ApexAxisChartSeries, ApexNonAxisChartSeries, ApexOptions, ChartType } from 'ng-apexcharts';
import { DashboardAnalysis, JsonValue } from '../models/dashboard';

type MetricMode = 'count' | 'sum' | 'avg';

interface LabeledValue {
  label: string;
  value: number;
}

interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  group: string;
}

interface BoxPlotValue {
  x: string;
  y: [number, number, number, number, number];
}

export interface ShowcaseChartCard {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  note: string;
  skin: string;
  chart: ApexOptions;
}

export function buildApexShowcase(current: DashboardAnalysis): ShowcaseChartCard[] {
  return new ShowcaseFactory(current).build();
}

class ShowcaseFactory {
  private readonly skins = ['atlas', 'ember', 'lagoon', 'plum'];

  constructor(private readonly current: DashboardAnalysis) {}

  build(): ShowcaseChartCard[] {
    const lineSeries = this.getSequentialSeries(0);
    const areaSeries = this.getAreaSeries();
    const categoryCounts = this.getCategoryBreakdown(undefined, 'count');
    const categoryTotals = this.getCategoryBreakdown(this.current.numericKeys[0], 'sum');
    const categoryAverages = this.getCategoryBreakdown(this.current.numericKeys[0], 'avg');
    const scatterPoints = this.getScatterPoints();
    const radar = this.getRadarSeries();
    const heatmap = this.getHeatmapSeries();
    const rangeArea = this.getRangeAreaSeries(lineSeries);
    const candles = this.getCandlestickSeries(lineSeries);
    const boxPlot = this.getBoxPlotSeries();
    const radialMetrics = this.getRadialMetrics();
    const rangeBars = this.getSummaryRangeBars();
    const scatterGroups = Array.from(
      scatterPoints.reduce((map, point) => {
        if (!map.has(point.group)) {
          map.set(point.group, []);
        }

        map.get(point.group)?.push({ x: point.x, y: point.y });
        return map;
      }, new Map<string, { x: number; y: number }[]>())
    )
      .slice(0, 4)
      .map(([group, data]) => ({ name: group, data })) as ApexAxisChartSeries;
    const bubbleSeries = [
      {
        name: 'Dataset intensity',
        data: scatterPoints.map((point) => ({ x: point.x, y: point.y, z: point.z }))
      }
    ] as ApexAxisChartSeries;

    return [
      {
        id: 'showcase-line',
        badge: 'Line',
        title: `${this.getMetricLabel(0)} trajectory`,
        subtitle: 'The cleanest read on sequence, trend, and turning points.',
        note: 'Sequential signal',
        skin: this.skins[0],
        chart: {
          series: [{ name: this.getMetricLabel(0), data: lineSeries.map((item) => item.value) }] as ApexAxisChartSeries,
          chart: this.buildChart('line'),
          colors: ['#efbb49'],
          stroke: { curve: 'smooth', width: 4 },
          dataLabels: { enabled: false },
          markers: { size: 4, strokeWidth: 0, hover: { size: 7 } },
          xaxis: this.buildXAxis(lineSeries.map((item) => item.label)),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-area',
        badge: 'Area',
        title: `${this.getMetricLabel(1)} flow`,
        subtitle: 'Adds volume and atmosphere to the same sequential story.',
        note: 'Filled progression',
        skin: this.skins[1],
        chart: {
          series: [{ name: this.getMetricLabel(1), data: areaSeries.map((item) => item.value) }] as ApexAxisChartSeries,
          chart: this.buildChart('area'),
          colors: ['#4fd1c5'],
          stroke: { curve: 'smooth', width: 3.5 },
          fill: { type: 'gradient', gradient: { shadeIntensity: 0.2, opacityFrom: 0.48, opacityTo: 0.04, stops: [0, 100] } },
          dataLabels: { enabled: false },
          xaxis: this.buildXAxis(areaSeries.map((item) => item.label)),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-bar',
        badge: 'Bar',
        title: 'Category volume',
        subtitle: 'Fast visual ranking for counts, totals, or grouped performance.',
        note: 'Discrete comparison',
        skin: this.skins[2],
        chart: {
          series: [{ name: 'Rows', data: categoryCounts.map((item) => item.value) }] as ApexAxisChartSeries,
          chart: this.buildChart('bar'),
          colors: ['#4f7cff', '#efbb49', '#2dd4bf', '#ff8a5b', '#b392f0', '#7dd3fc'],
          plotOptions: { bar: { distributed: true, borderRadius: 14, columnWidth: '48%' } },
          dataLabels: { enabled: false },
          xaxis: this.buildXAxis(categoryCounts.map((item) => item.label)),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-pie',
        badge: 'Pie',
        title: 'Share of rows',
        subtitle: 'A quick part-to-whole read for category counts.',
        note: 'Composition view',
        skin: this.skins[3],
        chart: {
          series: categoryCounts.map((item) => item.value) as ApexNonAxisChartSeries,
          chart: this.buildChart('pie', 290),
          labels: categoryCounts.map((item) => item.label),
          colors: ['#efbb49', '#2dd4bf', '#4f7cff', '#ff8a5b', '#b392f0', '#7dd3fc'],
          legend: this.buildLegend('bottom'),
          dataLabels: { enabled: false },
          tooltip: this.buildTooltip(),
          stroke: { colors: ['rgba(14, 19, 29, 0.4)'] }
        }
      },
      {
        id: 'showcase-donut',
        badge: 'Donut',
        title: `Average ${this.getMetricLabel(0)} by segment`,
        subtitle: 'Same composition story with a stronger center-weighted layout.',
        note: 'Center-weighted split',
        skin: this.skins[0],
        chart: {
          series: categoryAverages.map((item) => item.value) as ApexNonAxisChartSeries,
          chart: this.buildChart('donut', 290),
          labels: categoryAverages.map((item) => item.label),
          colors: ['#2dd4bf', '#efbb49', '#ff8a5b', '#4f7cff', '#b392f0', '#7dd3fc'],
          legend: this.buildLegend('bottom'),
          dataLabels: { enabled: false },
          plotOptions: { pie: { donut: { size: '62%' } } },
          tooltip: this.buildTooltip(),
          stroke: { colors: ['rgba(14, 19, 29, 0.4)'] }
        }
      },
      {
        id: 'showcase-radial-bar',
        badge: 'Radial Bar',
        title: 'Dataset health ring',
        subtitle: 'Progress-style metric readouts in a compact circular layout.',
        note: 'Multi-metric gauge',
        skin: this.skins[1],
        chart: {
          series: radialMetrics.map((item) => item.value) as ApexNonAxisChartSeries,
          chart: this.buildChart('radialBar', 290),
          labels: radialMetrics.map((item) => item.label),
          colors: ['#efbb49', '#4fd1c5', '#4f7cff'],
          plotOptions: {
            radialBar: {
              startAngle: -120,
              endAngle: 240,
              track: { background: 'rgba(255,255,255,0.1)', margin: 8 },
              hollow: { size: '24%' },
              dataLabels: {
                name: { fontSize: '12px', color: '#a8bdd1' },
                value: { fontSize: '21px', fontWeight: '700', color: '#f6fbff' }
              }
            }
          },
          stroke: { lineCap: 'round' }
        }
      },
      {
        id: 'showcase-scatter',
        badge: 'Scatter',
        title: 'Metric relationship',
        subtitle: 'Looks for clusters, outliers, and cross-metric spread.',
        note: 'Correlation scan',
        skin: this.skins[2],
        chart: {
          series: scatterGroups,
          chart: this.buildChart('scatter'),
          colors: ['#efbb49', '#4fd1c5', '#ff8a5b', '#7dd3fc'],
          markers: { size: 6, hover: { size: 8 } },
          xaxis: this.buildNumericXAxis(),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          legend: this.buildLegend('top'),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-bubble',
        badge: 'Bubble',
        title: 'Relationship plus intensity',
        subtitle: 'Adds a third variable through size so impact is instantly visible.',
        note: 'Three-dimensional read',
        skin: this.skins[3],
        chart: {
          series: bubbleSeries,
          chart: this.buildChart('bubble'),
          colors: ['#efbb49'],
          fill: { opacity: 0.72 },
          xaxis: this.buildNumericXAxis(),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-heatmap',
        badge: 'Heatmap',
        title: 'Metric heat grid',
        subtitle: 'Shows relative hot spots across categories and measures.',
        note: 'Intensity matrix',
        skin: this.skins[0],
        chart: {
          series: heatmap,
          chart: this.buildChart('heatmap'),
          colors: ['#4f7cff'],
          plotOptions: { heatmap: { radius: 8, shadeIntensity: 0.48 } },
          dataLabels: { enabled: false },
          xaxis: this.buildXAxis(categoryCounts.map((item) => item.label)),
          tooltip: this.buildTooltip(),
          legend: this.buildLegend('top')
        }
      },
      {
        id: 'showcase-candlestick',
        badge: 'Candlestick',
        title: 'Synthetic OHLC view',
        subtitle: 'Useful when a sequence needs open-high-low-close framing.',
        note: 'OHLC storytelling',
        skin: this.skins[1],
        chart: {
          series: [{ name: 'Session', data: candles }] as ApexAxisChartSeries,
          chart: this.buildChart('candlestick'),
          plotOptions: { candlestick: { colors: { upward: '#2dd4bf', downward: '#ff8a5b' } } },
          xaxis: this.buildCategoryAxis(),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-box-plot',
        badge: 'Box Plot',
        title: 'Distribution spread',
        subtitle: 'Ideal for medians, quartiles, and understanding variability.',
        note: 'Quartile summary',
        skin: this.skins[2],
        chart: {
          series: [{ name: this.getMetricLabel(0), data: boxPlot }] as ApexAxisChartSeries,
          chart: this.buildChart('boxPlot'),
          colors: ['#efbb49'],
          plotOptions: { boxPlot: { colors: { upper: '#4fd1c5', lower: '#4f7cff' } } },
          xaxis: this.buildXAxis(boxPlot.map((item) => item.x)),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-radar',
        badge: 'Radar',
        title: 'Multi-metric shape',
        subtitle: 'Compares several measures across the same set of categories.',
        note: 'Profile comparison',
        skin: this.skins[3],
        chart: {
          series: radar.series,
          chart: this.buildChart('radar'),
          colors: ['#efbb49', '#4fd1c5', '#7dd3fc'],
          stroke: { width: 2.8 },
          fill: { opacity: 0.18 },
          xaxis: {
            categories: radar.labels,
            labels: { style: { colors: radar.labels.map(() => '#d7e1ec'), fontSize: '12px' } }
          },
          legend: this.buildLegend('top'),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-polar-area',
        badge: 'Polar Area',
        title: 'Circular category emphasis',
        subtitle: 'Great when you want magnitude but keep a strong radial composition.',
        note: 'Radial composition',
        skin: this.skins[0],
        chart: {
          series: categoryTotals.map((item) => item.value) as ApexNonAxisChartSeries,
          chart: this.buildChart('polarArea', 290),
          labels: categoryTotals.map((item) => item.label),
          colors: ['#efbb49', '#4fd1c5', '#ff8a5b', '#4f7cff', '#b392f0', '#7dd3fc'],
          stroke: { colors: ['rgba(14, 19, 29, 0.35)'] },
          fill: { opacity: 0.9 },
          legend: this.buildLegend('bottom'),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-range-bar',
        badge: 'Range Bar',
        title: 'Min-max per metric',
        subtitle: 'Summarizes span and variance in a compact horizontal form.',
        note: 'Range summary',
        skin: this.skins[1],
        chart: {
          series: [{ name: 'Range', data: rangeBars }] as ApexAxisChartSeries,
          chart: this.buildChart('rangeBar'),
          colors: ['#4fd1c5'],
          plotOptions: { bar: { horizontal: true, borderRadius: 10, barHeight: '48%' } },
          xaxis: this.buildNumericXAxis(),
          yaxis: { labels: { style: { colors: ['#d7e1ec'], fontSize: '12px' } } },
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-range-area',
        badge: 'Range Area',
        title: 'Volatility band',
        subtitle: 'Frames the likely upper and lower corridor around a sequential metric.',
        note: 'Upper-lower corridor',
        skin: this.skins[2],
        chart: {
          series: [{ name: 'Operating band', data: rangeArea }] as ApexAxisChartSeries,
          chart: this.buildChart('rangeArea'),
          colors: ['#7dd3fc'],
          fill: { type: 'gradient', gradient: { opacityFrom: 0.38, opacityTo: 0.05, stops: [0, 100] } },
          stroke: { curve: 'smooth', width: 2.4 },
          dataLabels: { enabled: false },
          xaxis: this.buildXAxis(lineSeries.map((item) => item.label)),
          yaxis: this.buildYAxis(),
          grid: this.buildGrid(),
          tooltip: this.buildTooltip()
        }
      },
      {
        id: 'showcase-treemap',
        badge: 'Treemap',
        title: 'Contribution map',
        subtitle: 'Highlights which segments dominate the total contribution.',
        note: 'Nested composition',
        skin: this.skins[3],
        chart: {
          series: [{ data: categoryTotals.map((item) => ({ x: item.label, y: item.value })) }] as ApexAxisChartSeries,
          chart: this.buildChart('treemap'),
          colors: ['#4f7cff', '#efbb49', '#2dd4bf', '#ff8a5b', '#b392f0', '#7dd3fc'],
          legend: { show: false },
          dataLabels: { enabled: true, style: { fontSize: '12px' } },
          tooltip: this.buildTooltip()
        }
      },
    ];
  }

  private buildChart(type: ChartType, height = 280): NonNullable<ApexOptions['chart']> {
    return {
      type,
      height,
      fontFamily: 'Segoe UI Variable, Aptos, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      foreColor: '#c8d5e3',
      animations: { enabled: true, speed: 680 },
      dropShadow: { enabled: true, top: 12, left: 0, blur: 18, color: '#030712', opacity: 0.18 }
    };
  }

  private buildXAxis(categories: string[]): NonNullable<ApexOptions['xaxis']> {
    return {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, style: { colors: categories.map(() => '#9fb3c7'), fontSize: '11px' } }
    };
  }

  private buildYAxis(): NonNullable<ApexOptions['yaxis']> {
    return {
      labels: {
        formatter: (value: number) => this.formatValue(value),
        style: { colors: ['#9fb3c7'], fontSize: '11px' }
      }
    };
  }

  private buildNumericXAxis(): NonNullable<ApexOptions['xaxis']> {
    return {
      type: 'numeric',
      labels: { style: { colors: ['#9fb3c7'], fontSize: '11px' } }
    };
  }

  private buildCategoryAxis(): NonNullable<ApexOptions['xaxis']> {
    return {
      type: 'category',
      labels: { style: { colors: ['#9fb3c7'], fontSize: '11px' } }
    };
  }

  private buildGrid(): NonNullable<ApexOptions['grid']> {
    return {
      borderColor: 'rgba(255,255,255,0.08)',
      strokeDashArray: 5,
      padding: { left: 10, right: 10 }
    };
  }

  private buildLegend(position: 'top' | 'bottom' = 'bottom'): NonNullable<ApexOptions['legend']> {
    return {
      show: true,
      position,
      horizontalAlign: 'left',
      fontSize: '12px',
      labels: { colors: '#dce7f2' }
    };
  }

  private buildTooltip(): NonNullable<ApexOptions['tooltip']> {
    return { theme: 'dark' };
  }

  private getSequentialSeries(numericIndex: number): LabeledValue[] {
    const numericKey = this.current.numericKeys[numericIndex] ?? this.current.numericKeys[0];
    const labelKey = this.current.dateKeys[0] ?? this.current.categoricalKeys[0] ?? this.current.keys[0];
    const rows = this.takeTail(this.current.rows, 8);
    const points = rows
      .map((row, index) => {
        const value = numericKey && typeof row[numericKey] === 'number' ? row[numericKey] : index + 1;
        const label = labelKey
          ? this.toShortLabel(row[labelKey], `Row ${this.current.rowCount - rows.length + index + 1}`)
          : `Row ${this.current.rowCount - rows.length + index + 1}`;

        return { label, value: Number(value) };
      })
      .filter((item) => Number.isFinite(item.value));

    return points.length ? points : this.createFallbackSeries();
  }

  private getAreaSeries(): LabeledValue[] {
    if (this.current.numericKeys[1]) {
      return this.getSequentialSeries(1);
    }

    const baseSeries = this.getSequentialSeries(0);
    return baseSeries.map((item, index) => {
      const window = baseSeries.slice(Math.max(0, index - 1), Math.min(baseSeries.length, index + 2));
      return { label: item.label, value: Number(this.average(window.map((entry) => entry.value)).toFixed(2)) };
    });
  }

  private getCategoryBreakdown(numericKey: string | undefined, mode: MetricMode): LabeledValue[] {
    const categoryKey = this.current.categoricalKeys[0] ?? this.current.dateKeys[0];

    if (!categoryKey) {
      if (mode === 'count') {
        return this.current.summary.length
          ? this.current.summary.slice(0, 6).map((item) => ({ label: item.label, value: item.count }))
          : this.createFallbackSeries();
      }

      if (mode === 'avg') {
        return this.current.summary.length
          ? this.current.summary.slice(0, 6).map((item) => ({ label: item.label, value: item.avg }))
          : this.createFallbackSeries();
      }

      return this.current.summary.length
        ? this.current.summary.slice(0, 6).map((item) => ({ label: item.label, value: item.max }))
        : this.createFallbackSeries();
    }

    const grouped = new Map<string, number[]>();
    const counts = new Map<string, number>();

    for (const row of this.current.rows) {
      const label = this.toShortLabel(row[categoryKey], 'Unknown');
      counts.set(label, (counts.get(label) ?? 0) + 1);

      if (!numericKey) {
        continue;
      }

      const rawValue = row[numericKey];

      if (typeof rawValue !== 'number') {
        continue;
      }

      if (!grouped.has(label)) {
        grouped.set(label, []);
      }

      grouped.get(label)?.push(rawValue);
    }

    return Array.from(counts.entries())
      .map(([label, count]) => {
        if (mode === 'count' || !numericKey) {
          return { label, value: count };
        }

        const values = grouped.get(label) ?? [];
        if (!values.length) {
          return { label, value: count };
        }

        if (mode === 'avg') {
          return { label, value: Number(this.average(values).toFixed(2)) };
        }

        return { label, value: Number(values.reduce((sum, value) => sum + value, 0).toFixed(2)) };
      })
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }

  private getScatterPoints(): ScatterPoint[] {
    const xKey = this.current.numericKeys[0];
    const yKey = this.current.numericKeys[1] ?? this.current.numericKeys[0];
    const zKey = this.current.numericKeys[2];
    const groupKey = this.current.categoricalKeys[0] ?? this.current.dateKeys[0];

    if (!xKey && !yKey) {
      return this.takeTail(this.createFallbackSeries(), 8).map((item, index) => ({
        x: index + 1,
        y: item.value,
        z: (index + 2) * 6,
        group: 'Rows'
      }));
    }

    return this.takeTail(this.current.rows, 18)
      .map((row, index) => {
        const xValue = xKey && typeof row[xKey] === 'number' ? row[xKey] : index + 1;
        const yValue = yKey && typeof row[yKey] === 'number' ? row[yKey] : index + 2;
        const zValue = zKey && typeof row[zKey] === 'number' ? Math.max(6, Math.abs(Number(row[zKey]) / 8)) : (index % 5 + 1) * 7;

        return {
          x: Number(xValue),
          y: Number(yValue),
          z: Number(zValue.toFixed(2)),
          group: groupKey ? this.toShortLabel(row[groupKey], 'Rows') : 'Rows'
        };
      })
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  }

  private getRadarSeries(): { labels: string[]; series: ApexAxisChartSeries } {
    const labels = this.getCategoryBreakdown(undefined, 'count').map((item) => item.label);
    const metrics = this.current.numericKeys.length ? this.current.numericKeys.slice(0, 3) : ['rows'];
    const series = metrics.map((metric) => {
      if (metric === 'rows') {
        const countMap = new Map(this.getCategoryBreakdown(undefined, 'count').map((item) => [item.label, item.value]));
        return { name: 'Rows', data: labels.map((label) => countMap.get(label) ?? 0) };
      }

      const valueMap = new Map(this.getCategoryBreakdown(metric, 'avg').map((item) => [item.label, item.value]));
      return { name: this.toTitleCase(metric), data: labels.map((label) => valueMap.get(label) ?? 0) };
    }) as ApexAxisChartSeries;

    return { labels, series };
  }

  private getHeatmapSeries(): ApexAxisChartSeries {
    const labels = this.getCategoryBreakdown(undefined, 'count').map((item) => item.label);
    const metrics = this.current.numericKeys.length ? this.current.numericKeys.slice(0, 3) : ['rows'];

    return metrics.map((metric) => {
      if (metric === 'rows') {
        const countMap = new Map(this.getCategoryBreakdown(undefined, 'count').map((item) => [item.label, item.value]));
        return { name: 'Rows', data: labels.map((label) => ({ x: label, y: countMap.get(label) ?? 0 })) };
      }

      const averageMap = new Map(this.getCategoryBreakdown(metric, 'avg').map((item) => [item.label, item.value]));
      return { name: this.toTitleCase(metric), data: labels.map((label) => ({ x: label, y: averageMap.get(label) ?? 0 })) };
    }) as ApexAxisChartSeries;
  }

  private getSummaryRangeBars(): { x: string; y: [number, number] }[] {
    if (this.current.summary.length) {
      return this.current.summary.slice(0, 5).map((item) => {
        const start = item.min;
        const end = item.max === item.min ? item.max + 1 : item.max;
        return { x: item.label, y: [Number(start.toFixed(2)), Number(end.toFixed(2))] };
      });
    }

    return [
      { x: 'Rows', y: [0, Math.max(this.current.rowCount, 1)] },
      { x: 'Fields', y: [0, Math.max(this.current.keys.length, 1)] },
      { x: 'Numeric', y: [0, Math.max(this.current.numericKeys.length, 1)] }
    ];
  }

  private getRangeAreaSeries(series: LabeledValue[]): { x: string; y: [number, number] }[] {
    return series.map((item, index) => {
      const window = series.slice(Math.max(0, index - 1), Math.min(series.length, index + 2));
      const values = window.map((entry) => entry.value);
      return { x: item.label, y: [Math.min(...values), Math.max(...values)] };
    });
  }

  private getCandlestickSeries(series: LabeledValue[]): { x: string; y: [number, number, number, number] }[] {
    return series.map((item, index) => {
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

  private getBoxPlotSeries(): BoxPlotValue[] {
    const categoryKey = this.current.categoricalKeys[0] ?? this.current.dateKeys[0];
    const metricKey = this.current.numericKeys[0];

    if (categoryKey && metricKey) {
      const grouped = new Map<string, number[]>();
      for (const row of this.current.rows) {
        const label = this.toShortLabel(row[categoryKey], 'Unknown');
        const value = row[metricKey];
        if (typeof value !== 'number') {
          continue;
        }
        if (!grouped.has(label)) {
          grouped.set(label, []);
        }
        grouped.get(label)?.push(value);
      }

      const entries = Array.from(grouped.entries()).slice(0, 6).map(([label, values]) => ({ x: label, y: this.computeBoxPlot(values) }));
      if (entries.length) {
        return entries;
      }
    }

    const fallback = this.getSequentialSeries(0);
    const bucketCount = Math.min(4, Math.max(2, fallback.length));
    const chunks = Array.from({ length: bucketCount }, (_, index) => fallback.filter((_, pointIndex) => pointIndex % bucketCount === index)).filter((chunk) => chunk.length);
    return chunks.map((chunk, index) => ({ x: `Slice ${index + 1}`, y: this.computeBoxPlot(chunk.map((item) => item.value)) }));
  }

  private getRadialMetrics(): LabeledValue[] {
    const detectedKeys = this.current.numericKeys.length + this.current.categoricalKeys.length + this.current.dateKeys.length;
    return [
      { label: 'Schema fit', value: this.normalizePercent((detectedKeys / Math.max(this.current.keys.length, 1)) * 100) },
      { label: 'Metric depth', value: this.normalizePercent((this.current.summary.length / Math.max(this.current.keys.length, 1)) * 100 + 24) },
      { label: 'Row readiness', value: this.normalizePercent(this.current.rowCount * 12) }
    ];
  }

  private createFallbackSeries(): LabeledValue[] {
    const length = Math.max(Math.min(this.current.rowCount, 6), 4);
    return Array.from({ length }, (_, index) => ({ label: `Row ${index + 1}`, value: index + 1 }));
  }

  private computeBoxPlot(values: number[]): [number, number, number, number, number] {
    const sorted = [...values].sort((left, right) => left - right);
    if (!sorted.length) {
      return [0, 0, 0, 0, 0];
    }

    return [
      Number(sorted[0].toFixed(2)),
      this.quantile(sorted, 0.25),
      this.quantile(sorted, 0.5),
      this.quantile(sorted, 0.75),
      Number(sorted.at(-1)!.toFixed(2))
    ];
  }

  private quantile(values: number[], ratio: number): number {
    if (values.length === 1) {
      return Number(values[0].toFixed(2));
    }

    const position = (values.length - 1) * ratio;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) {
      return Number(values[lower].toFixed(2));
    }

    const blend = values[lower] + (values[upper] - values[lower]) * (position - lower);
    return Number(blend.toFixed(2));
  }

  private getMetricLabel(numericIndex: number): string {
    const metric = this.current.numericKeys[numericIndex] ?? this.current.numericKeys[0];
    return metric ? this.toTitleCase(metric) : 'Dataset metric';
  }

  private average(values: number[]): number {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  private takeTail<T>(items: T[], maxItems: number): T[] {
    return items.length > maxItems ? items.slice(items.length - maxItems) : items;
  }

  private toShortLabel(value: JsonValue | undefined, fallback: string): string {
    const label = value === undefined || value === null ? fallback : String(value);
    return label.length > 18 ? `${label.slice(0, 18)}...` : label;
  }

  private toTitleCase(value: string): string {
    return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private normalizePercent(value: number): number {
    return Math.max(8, Math.min(100, Number(value.toFixed(0))));
  }

  private formatValue(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }
}
