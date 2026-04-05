import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStates,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent
} from 'ng-apexcharts';
import { DashboardAnalysis, DashboardChart, JsonValue, SummaryItem } from './models/dashboard';
import { buildApexShowcase } from './utils/apex-showcase';
import { sampleData } from './utils/sample-data';
import { analyzeJson } from './utils/analyze';

interface GaugeChartConfig {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  states: ApexStates;
}

interface GaugeCard {
  id: string;
  label: string;
  note: string;
  chart: GaugeChartConfig;
}

interface AxisChartConfig {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  markers: ApexMarkers;
  legend: ApexLegend;
  states: ApexStates;
}

interface StatChip {
  label: string;
  value: string;
}

interface AxisChartCard {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  stats: StatChip[];
  accentClass: string;
  chart: AxisChartConfig;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ChartComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly dashboard = signal<DashboardAnalysis>(analyzeJson(sampleData));
  protected readonly sourceLabel = signal('Shared sample dataset');
  protected readonly message = signal('Angular live demo is ready with all major Apex chart families.');
  protected readonly error = signal('');
  protected readonly searchQuery = signal('');

  protected readonly visibleRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const current = this.dashboard();

    if (!query) {
      return current.rows;
    }

    return current.rows.filter((row) =>
      current.keys.some((key) => String(row[key] ?? '').toLowerCase().includes(query))
    );
  });

  protected readonly gaugeCards = computed(() => {
    const summary = this.dashboard().summary;

    if (!summary.length) {
      return [
        this.createFallbackGauge(
          'row-volume',
          'Row volume',
          this.dashboard().rowCount,
          this.dashboard().rowCount * 8,
          `${this.dashboard().keys.length} detected fields`,
          ['#efbb49', '#d88c1b']
        ),
        this.createFallbackGauge(
          'field-balance',
          'Field balance',
          this.dashboard().numericKeys.length + this.dashboard().categoricalKeys.length,
          ((this.dashboard().numericKeys.length + this.dashboard().categoricalKeys.length) /
            Math.max(this.dashboard().keys.length, 1)) *
            100,
          `${this.dashboard().dateKeys.length} date fields`,
          ['#2a9d8f', '#1f6b75']
        )
      ];
    }

    return summary.slice(0, 2).map((item, index) =>
      this.createGauge(item, index === 0 ? ['#efbb49', '#d88c1b'] : ['#2a9d8f', '#1f6b75'])
    );
  });

  protected readonly spotlightTrend = computed(() => {
    const chart = this.dashboard().charts.find((item) => item.type === 'line');
    return chart ? this.createAreaChartCard(chart, true) : null;
  });

  protected readonly prismBreakdown = computed(() => {
    const chart = this.dashboard().charts.find((item) => item.type === 'bar');
    return chart ? this.createBarChartCard(chart, true) : null;
  });

  protected readonly secondaryCharts = computed(() => {
    let seenLine = false;
    let seenBar = false;

    return this.dashboard().charts
      .filter((chart) => {
        if (chart.type === 'line' && !seenLine) {
          seenLine = true;
          return false;
        }

        if (chart.type === 'bar' && !seenBar) {
          seenBar = true;
          return false;
        }

        return true;
      })
      .map((chart) => (chart.type === 'line' ? this.createAreaChartCard(chart, false) : this.createBarChartCard(chart, false)));
  });

  protected readonly apexGallery = computed(() => buildApexShowcase(this.dashboard()));

  protected loadSample(): void {
    this.updateDashboard(sampleData, 'Shared sample dataset', 'Sample data restored across the full Apex chart gallery.');
  }

  protected async handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as JsonValue;
      this.updateDashboard(parsed, file.name, 'Custom JSON loaded across the full Apex chart gallery.');
    } catch {
      this.error.set('The selected file could not be parsed as valid JSON.');
    }
  }

  private createGauge(item: SummaryItem, colors: string[]): GaugeCard {
    const percent = this.normalizePercent((item.avg / Math.max(item.max, 1)) * 100);

    return {
      id: item.key,
      label: item.label,
      note: `Range ${this.formatValue(item.min)} to ${this.formatValue(item.max)}`,
      chart: this.buildGaugeConfig(item.label, percent, this.formatValue(item.avg), colors)
    };
  }

  private createFallbackGauge(
    id: string,
    label: string,
    rawValue: number,
    percentValue: number,
    note: string,
    colors: string[]
  ): GaugeCard {
    const percent = this.normalizePercent(percentValue);

    return {
      id,
      label,
      note,
      chart: this.buildGaugeConfig(label, percent, this.formatValue(rawValue), colors)
    };
  }

  private buildGaugeConfig(
    label: string,
    percent: number,
    totalValue: string,
    colors: string[]
  ): GaugeChartConfig {
    return {
      series: [percent],
      chart: {
        type: 'radialBar',
        height: 240,
        sparkline: {
          enabled: true
        }
      },
      labels: [label],
      plotOptions: {
        radialBar: {
          startAngle: -125,
          endAngle: 125,
          hollow: {
            size: '68%',
            background: 'rgba(255,255,255,0.84)',
            dropShadow: {
              enabled: true,
              blur: 18,
              opacity: 0.14
            }
          },
          track: {
            background: 'rgba(18, 36, 51, 0.08)',
            strokeWidth: '100%',
            margin: 0
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              offsetY: -4,
              fontSize: '30px',
              fontWeight: '700',
              color: '#122433',
              formatter: (value: number) => `${Math.round(value)}%`
            },
            total: {
              show: true,
              label: totalValue,
              color: '#5f6e82',
              fontSize: '13px',
              fontWeight: '500',
              formatter: () => label
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'horizontal',
          gradientToColors: [colors[1]],
          stops: [0, 100]
        }
      },
      stroke: {
        lineCap: 'round'
      },
      dataLabels: {
        enabled: false
      },
      states: {
        hover: {
          filter: {
            type: 'lighten'
          }
        }
      }
    };
  }

  private createAreaChartCard(chart: DashboardChart, primary: boolean): AxisChartCard {
    const values = chart.data.map((item) => Number(item[chart.yKey] ?? 0));
    const labels = chart.data.map((item) => String(item[chart.xKey] ?? ''));
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const maxIndex = values.indexOf(maxValue);
    const colors = primary ? ['#efbb49'] : ['#2a9d8f'];

    return {
      id: chart.id,
      badge: primary ? 'Signal line' : 'Trend layer',
      title: chart.title,
      subtitle: primary ? 'Smoothed area trend with highlight markers' : 'Secondary trend detail',
      stats: [
        { label: 'Peak', value: this.formatValue(maxValue) },
        { label: 'Low', value: this.formatValue(minValue) },
        { label: 'Last', value: this.formatValue(values.at(-1) ?? 0) }
      ],
      accentClass: primary ? 'amber' : 'teal',
      chart: {
        series: [
          {
            name: chart.yKey,
            data: values
          }
        ],
        chart: {
          type: 'area',
          height: primary ? 340 : 260,
          fontFamily: 'Segoe UI Variable, Aptos, sans-serif',
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          },
          background: 'transparent',
          foreColor: '#738297',
          dropShadow: {
            enabled: true,
            top: 14,
            left: 0,
            blur: 22,
            color: colors[0],
            opacity: 0.18
          },
          animations: {
            enabled: true,
            speed: 720
          }
        },
        colors,
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: primary ? 4 : 3.5
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 0.4,
            opacityFrom: primary ? 0.42 : 0.28,
            opacityTo: 0.04,
            stops: [0, 100]
          }
        },
        tooltip: {
          theme: 'dark'
        },
        plotOptions: {},
        xaxis: {
          categories: labels,
          labels: {
            rotate: 0,
            style: {
              colors: '#8b96a8',
              fontSize: '11px'
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            formatter: (value: number) => this.formatValue(value),
            style: {
              colors: '#8b96a8',
              fontSize: '11px'
            }
          }
        },
        grid: {
          borderColor: 'rgba(255,255,255,0.08)',
          strokeDashArray: 6,
          padding: {
            left: 12,
            right: 10
          }
        },
        markers: {
          size: 0,
          hover: {
            size: 7
          },
          discrete: maxIndex >= 0
            ? [
                {
                  seriesIndex: 0,
                  dataPointIndex: maxIndex,
                  fillColor: primary ? '#2a9d8f' : '#efbb49',
                  strokeColor: '#ffffff',
                  size: 7
                }
              ]
            : []
        },
        legend: {
          show: false
        },
        states: {
          hover: {
            filter: {
              type: 'lighten'
            }
          }
        }
      }
    };
  }

  private createBarChartCard(chart: DashboardChart, primary: boolean): AxisChartCard {
    const values = chart.data.map((item) => Number(item[chart.yKey] ?? 0));
    const labels = chart.data.map((item) => String(item[chart.xKey] ?? ''));

    return {
      id: chart.id,
      badge: primary ? 'Prism chart' : 'Visual breakdown',
      title: chart.title,
      subtitle: primary ? 'Column depth, gradients, and shadows' : 'Category distribution detail',
      stats: labels.map((label, index) => ({
        label,
        value: this.formatValue(values[index] ?? 0)
      })),
      accentClass: primary ? 'teal' : 'coral',
      chart: {
        series: [
          {
            name: chart.yKey,
            data: values
          }
        ],
        chart: {
          type: 'bar',
          height: primary ? 340 : 260,
          fontFamily: 'Segoe UI Variable, Aptos, sans-serif',
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          },
          background: 'transparent',
          foreColor: '#738297',
          dropShadow: {
            enabled: true,
            top: 12,
            left: 0,
            blur: 16,
            color: primary ? '#2a9d8f' : '#e76f51',
            opacity: 0.16
          },
          animations: {
            enabled: true,
            speed: 680
          }
        },
        colors: primary
          ? ['#2a9d8f', '#efbb49', '#e76f51', '#4f7cff', '#8247ff']
          : ['#e76f51', '#efbb49', '#2a9d8f', '#4f7cff', '#8247ff'],
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: false
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.38,
            opacityFrom: 0.98,
            opacityTo: 0.76,
            stops: [0, 100]
          }
        },
        tooltip: {
          theme: 'dark'
        },
        plotOptions: {
          bar: {
            distributed: true,
            borderRadius: 18,
            columnWidth: primary ? '52%' : '46%',
            colors: {
              backgroundBarColors: ['rgba(18, 36, 51, 0.08)'],
              backgroundBarOpacity: 1,
              backgroundBarRadius: 18
            }
          }
        },
        xaxis: {
          categories: labels,
          labels: {
            style: {
              colors: '#8b96a8',
              fontSize: '11px'
            }
          },
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          }
        },
        yaxis: {
          labels: {
            formatter: (value: number) => this.formatValue(value),
            style: {
              colors: '#8b96a8',
              fontSize: '11px'
            }
          }
        },
        grid: {
          borderColor: 'rgba(18, 36, 51, 0.08)',
          strokeDashArray: 5
        },
        markers: {
          size: 0
        },
        legend: {
          show: false
        },
        states: {
          hover: {
            filter: {
              type: 'darken'
            }
          }
        }
      }
    };
  }

  private normalizePercent(value: number): number {
    return Math.max(8, Math.min(100, Number(value.toFixed(0))));
  }

  private formatValue(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }

  private updateDashboard(nextSource: JsonValue, label: string, note: string): void {
    this.dashboard.set(analyzeJson(nextSource));
    this.sourceLabel.set(label);
    this.message.set(note);
    this.error.set('');
  }
}
