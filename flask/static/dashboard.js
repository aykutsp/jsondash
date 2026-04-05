const payloadElement = document.getElementById("dashboard-json");

if (payloadElement) {
  const dashboard = JSON.parse(payloadElement.textContent || "{}");
  const tableBody = document.getElementById("tableBody");
  const rowCount = document.getElementById("rowCount");
  const searchInput = document.getElementById("tableSearch");

  const renderTable = (rows) => {
    if (!tableBody || !rowCount) {
      return;
    }

    tableBody.innerHTML = rows
      .slice(0, 300)
      .map(
        (row) =>
          `<tr>${dashboard.keys
            .map((key) => `<td>${String(row[key] ?? "")}</td>`)
            .join("")}</tr>`
      )
      .join("");

    rowCount.textContent = String(rows.length);
  };

  renderTable(dashboard.rows || []);

  if (window.renderApexGallery) {
    window.renderApexGallery(document.getElementById("apexGallery"), dashboard);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const query = String(event.target.value || "").trim().toLowerCase();

      if (!query) {
        renderTable(dashboard.rows || []);
        return;
      }

      const rows = (dashboard.rows || []).filter((row) =>
        dashboard.keys.some((key) => String(row[key] ?? "").toLowerCase().includes(query))
      );

      renderTable(rows);
    });
  }

  (dashboard.charts || []).forEach((chart, index) => {
    const element = document.getElementById(`chart-${index}`);

    if (!element) {
      return;
    }

    const labels = chart.data.map((item) => String(item[chart.xKey] ?? ""));
    const values = chart.data.map((item) => Number(item[chart.yKey] ?? 0));

    new Chart(element, {
      type: chart.type,
      data: {
        labels,
        datasets: [
          {
            label: chart.title,
            data: values,
            borderColor: "#21455c",
            backgroundColor:
              chart.type === "line" ? "rgba(244, 194, 83, 0.24)" : "rgba(33, 69, 92, 0.86)",
            fill: chart.type === "line",
            borderWidth: chart.type === "line" ? 2.4 : 1.4,
            tension: 0.35,
            pointRadius: chart.type === "line" ? 2 : 0,
            borderRadius: chart.type === "bar" ? 12 : 0
          }
        ]
      },
      options: {
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
              color: "#5f6e82"
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#5f6e82"
            },
            grid: {
              color: "rgba(95, 110, 130, 0.12)"
            }
          }
        }
      }
    });
  });
}
