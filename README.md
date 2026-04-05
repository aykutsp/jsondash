# jsondash

`jsondash` turns raw JSON into a polished dashboard with four separate implementations:

- React
- Angular
- Flask
- WPF

Each stack can load a local JSON file, restore the shared sample dataset, infer schema automatically, surface KPI cards, summarize numeric metrics, render quick comparison charts, show a full ApexCharts gallery, and keep the source rows searchable in one screen.

## Preview

![Angular Apex gallery preview](docs/assets/angular-apex-gallery.png)

## What You Get

- One product idea implemented in four different stacks
- A single launcher script for quick local switching
- Shared sample data used by every implementation
- Full chart-family coverage through the Apex gallery
- A clean starting point for internal analytics tools, client demos, and dashboard prototypes

## Stacks

### React

- Built with React + Vite
- Uses `react-apexcharts` for the full gallery
- Keeps the original lightweight dashboard flow alongside the larger chart showcase

### Angular

- Built with Angular standalone components
- Uses `ng-apexcharts` + `apexcharts`
- Includes the most complete visual demo and the live-demo script

### Flask

- Server-rendered Flask app
- Uses Chart.js for the fast summary panels
- Uses ApexCharts in the browser for the full gallery section

### WPF

- Native Windows desktop app built with WPF
- Keeps native KPI, summary, and table views
- Embeds a live Apex gallery surface inside the desktop window for full chart-family parity

## Features

- Load local JSON files directly from the UI
- Restore the shared `sales.json` sample in one click
- Detect numeric, categorical, and date fields automatically
- Show KPI cards for dataset shape
- Generate fast summary blocks for numeric columns
- Render trend and breakdown panels from inferred fields
- Render a complete Apex gallery:
  - Line
  - Area
  - Bar
  - Pie
  - Donut
  - Radial Bar
  - Scatter
  - Bubble
  - Heatmap
  - Candlestick
  - Box Plot
  - Radar
  - Polar Area
  - Range Bar
  - Range Area
  - Treemap
- Search and inspect raw rows without leaving the page or window

## Requirements

### Common

- Windows PowerShell
- Access to the project folder

### React and Angular

- Node.js 20+ recommended
- npm

### Flask

- Python 3.11+ recommended
- `python` available on PATH

### WPF

- .NET SDK with Windows desktop support
- Windows environment
- WebView2 runtime available on the machine for the embedded Apex gallery

## Quick Start

Use the launcher to pick a stack interactively:

```powershell
.\launch.ps1
```

Or start a specific stack directly:

```powershell
.\launch.ps1 -Stack React
.\launch.ps1 -Stack Angular
.\launch.ps1 -Stack Flask
.\launch.ps1 -Stack WPF
```

## Run Each Stack Manually

### React

```powershell
cd .\react
npm install
npm run dev -- --host 0.0.0.0
```

Default local URL:

```text
http://localhost:5173
```

### Angular

```powershell
cd .\angular
npm install
npm run live-demo
```

Default local URL:

```text
http://localhost:4200
```

### Flask

```powershell
cd .\flask
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Default local URL:

```text
http://127.0.0.1:5000
```

### WPF

```powershell
cd .\wpf
dotnet build
dotnet run
```

## How To Use The App

1. Launch the stack you want to explore.
2. Click `Load sample` to open the shared sales dataset instantly.
3. Click `Load JSON file` or `Open JSON file` to load your own file.
4. Review the KPI cards to confirm row and field counts.
5. Check the detected field tags to see how the parser classified your data.
6. Read the numeric summary to understand averages, mins, and maxes.
7. Use the quick charts for a fast first pass.
8. Scroll to the Apex gallery to explore the same data through multiple chart families.
9. Use the search box in the data explorer to inspect matching rows.

## JSON Shape Expectations

The parser is flexible, but the smoothest path is:

- A top-level array of objects
- Or a top-level object containing one array of objects

Examples that work well:

```json
[
  { "date": "2025-01-01", "region": "EU", "revenue": 1200, "orders": 24 },
  { "date": "2025-01-02", "region": "US", "revenue": 1800, "orders": 31 }
]
```

```json
{
  "sales": [
    { "date": "2025-01-01", "region": "EU", "revenue": 1200, "orders": 24 },
    { "date": "2025-01-02", "region": "US", "revenue": 1800, "orders": 31 }
  ]
}
```

## Shared Data

The repo includes a shared sample dataset used by every implementation:

```text
shared/sample-data/sales.json
```

## Project Structure

```text
jsondash/
├── angular/
│   ├── src/
│   └── angular.json
├── docs/
│   └── assets/
├── flask/
│   ├── static/
│   ├── templates/
│   └── app.py
├── react/
│   ├── src/
│   └── package.json
├── shared/
│   └── sample-data/
├── wpf/
│   ├── Models/
│   ├── Services/
│   ├── ViewModels/
│   └── MainWindow.xaml
├── .gitignore
├── launch.ps1
└── README.md
```

## Architecture Notes

### Shared analysis idea

Every stack follows the same product logic:

- find the active dataset
- inspect the keys
- infer which keys are numeric, categorical, and date-like
- build summary metrics
- create lightweight trend/breakdown charts
- feed a larger chart gallery from the inferred structure

### UI shape

Every implementation is organized around the same flow:

- hero and source selection
- KPI row
- field scan and numeric summary
- quick charts
- full Apex gallery
- searchable row explorer

### Why four stacks

This repo is useful when you need to:

- compare frontend and desktop delivery approaches
- demo the same product in different environments
- benchmark how fast a concept can move across frameworks
- choose the implementation style that best fits a team or deployment target

## Verification

Verified locally during setup:

- Angular: `npm run build`
- React: `npm run build`
- Flask: test client request returns `200`
- WPF: `dotnet build`

## Publishing Notes

- `node_modules`, virtual environments, build output, logs, and editor-only folders are excluded through `.gitignore`
- The repo is intended to publish only source, shared data, launcher scripts, assets, and public documentation

## License

License
MIT. See LICENSE.

Feel free to use this project however you like - fork it, ship it, tear it apart, build something bigger on top of it. If you end up using it in something public, a small credit or a link back would make my day, but it's not a requirement. Thanks for taking a look.
