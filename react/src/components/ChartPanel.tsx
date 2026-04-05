import {
  BarElement,
  CategoryScale,
  Chart as ChartJs,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { DashboardChart } from "../lib/types";

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Legend,
  Tooltip,
  Filler
);

interface ChartPanelProps {
  chart: DashboardChart;
}

const lineOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: "#5e6a80"
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#5e6a80"
      },
      grid: {
        color: "rgba(94, 106, 128, 0.12)"
      }
    }
  }
};

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: "#5e6a80"
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#5e6a80"
      },
      grid: {
        color: "rgba(94, 106, 128, 0.12)"
      }
    }
  }
};

export function ChartPanel({ chart }: ChartPanelProps) {
  const labels = chart.data.map((item) => String(item[chart.xKey] ?? ""));
  const values = chart.data.map((item) => Number(item[chart.yKey] ?? 0));

  const lineData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: chart.title,
        data: values,
        borderColor: "#264653",
        backgroundColor: "rgba(233, 196, 106, 0.18)",
        pointRadius: 2,
        fill: true,
        tension: 0.35,
        borderWidth: 2.5
      }
    ]
  };

  const barData: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: chart.title,
        data: values,
        borderColor: "#264653",
        backgroundColor: "rgba(38, 70, 83, 0.8)",
        borderWidth: 1.5,
        borderRadius: 12
      }
    ]
  };

  return (
    <article className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{chart.type === "line" ? "Trend" : "Breakdown"}</span>
          <h3>{chart.title}</h3>
        </div>
      </div>
      <div className="chart-wrap">
        {chart.type === "line" ? <Line options={lineOptions} data={lineData} /> : <Bar options={barOptions} data={barData} />}
      </div>
    </article>
  );
}
