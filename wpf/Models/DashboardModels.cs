using System.Collections.Generic;

namespace JsonDash.Wpf.Models;

public sealed class DashboardAnalysis
{
    public string DatasetName { get; set; } = string.Empty;
    public int RowCount { get; set; }
    public List<string> Keys { get; set; } = [];
    public List<string> NumericKeys { get; set; } = [];
    public List<string> CategoricalKeys { get; set; } = [];
    public List<string> DateKeys { get; set; } = [];
    public List<SummaryItem> Summary { get; set; } = [];
    public List<DashboardChart> Charts { get; set; } = [];
    public List<Dictionary<string, object?>> Rows { get; set; } = [];
}

public sealed class SummaryItem
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public double Min { get; set; }
    public double Max { get; set; }
    public double Avg { get; set; }
    public int Count { get; set; }
}

public sealed class DashboardChart
{
    public string Id { get; set; } = string.Empty;
    public DashboardChartType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string XKey { get; set; } = string.Empty;
    public string YKey { get; set; } = string.Empty;
    public List<ChartPoint> Data { get; set; } = [];
}

public sealed class ChartPoint
{
    public string Label { get; set; } = string.Empty;
    public double Value { get; set; }
}

public enum DashboardChartType
{
    Line,
    Bar
}
