using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using JsonDash.Wpf.Models;

namespace JsonDash.Wpf.ViewModels;

public sealed class MainViewModel : INotifyPropertyChanged
{
    private string _sourceLabel = "Shared sample dataset";
    private string _statusMessage = "Desktop dashboard is ready.";
    private int _rowCount;
    private int _numericFieldCount;
    private int _categoryFieldCount;

    public event PropertyChangedEventHandler? PropertyChanged;

    public string SourceLabel
    {
        get => _sourceLabel;
        set => SetField(ref _sourceLabel, value);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        set => SetField(ref _statusMessage, value);
    }

    public int RowCount
    {
        get => _rowCount;
        set => SetField(ref _rowCount, value);
    }

    public int NumericFieldCount
    {
        get => _numericFieldCount;
        set => SetField(ref _numericFieldCount, value);
    }

    public int CategoryFieldCount
    {
        get => _categoryFieldCount;
        set => SetField(ref _categoryFieldCount, value);
    }

    public ObservableCollection<string> FieldTags { get; } = [];

    public ObservableCollection<SummaryItem> SummaryItems { get; } = [];

    public ObservableCollection<ChartCardViewModel> ChartCards { get; } = [];

    public void ApplyAnalysis(DashboardAnalysis analysis, string sourceLabel, string statusMessage)
    {
        SourceLabel = sourceLabel;
        StatusMessage = statusMessage;
        RowCount = analysis.RowCount;
        NumericFieldCount = analysis.NumericKeys.Count;
        CategoryFieldCount = analysis.CategoricalKeys.Count;

        FieldTags.Clear();
        foreach (var key in analysis.NumericKeys)
        {
            FieldTags.Add($"Numeric: {key}");
        }

        foreach (var key in analysis.CategoricalKeys)
        {
            FieldTags.Add($"Category: {key}");
        }

        foreach (var key in analysis.DateKeys)
        {
            FieldTags.Add($"Date: {key}");
        }

        SummaryItems.Clear();
        foreach (var item in analysis.Summary)
        {
            SummaryItems.Add(item);
        }

        ChartCards.Clear();
        foreach (var chart in analysis.Charts)
        {
            ChartCards.Add(ChartCardViewModel.FromChart(chart));
        }
    }

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private void SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (Equals(field, value))
        {
            return;
        }

        field = value;
        OnPropertyChanged(propertyName);
    }
}

public sealed class ChartCardViewModel
{
    public string Title { get; init; } = string.Empty;
    public bool IsLineChart { get; init; }
    public bool IsBarChart => !IsLineChart;
    public string Points { get; init; } = string.Empty;
    public ObservableCollection<ChartDisplayItem> Items { get; init; } = [];

    public static ChartCardViewModel FromChart(DashboardChart chart)
    {
        var maxValue = chart.Data.Count == 0 ? 1 : chart.Data.Max(item => item.Value);
        var items = chart.Data
            .Select(item => new ChartDisplayItem
            {
                Label = item.Label,
                Value = item.Value,
                Percent = maxValue <= 0 ? 0 : (item.Value / maxValue) * 100
            })
            .ToList();

        return new ChartCardViewModel
        {
            Title = chart.Title,
            IsLineChart = chart.Type == DashboardChartType.Line,
            Points = chart.Type == DashboardChartType.Line ? BuildPolylinePoints(chart.Data, maxValue) : string.Empty,
            Items = new ObservableCollection<ChartDisplayItem>(items)
        };
    }

    private static string BuildPolylinePoints(List<ChartPoint> points, double maxValue)
    {
        if (points.Count == 0)
        {
            return string.Empty;
        }

        var width = 420d;
        var height = 170d;
        var step = points.Count == 1 ? 0 : width / (points.Count - 1);

        var segments = points.Select((point, index) =>
        {
            var x = index * step;
            var normalized = maxValue <= 0 ? 0 : point.Value / maxValue;
            var y = height - (normalized * height);
            return $"{x:0.##},{y:0.##}";
        });

        return string.Join(" ", segments);
    }
}

public sealed class ChartDisplayItem
{
    public string Label { get; init; } = string.Empty;
    public double Value { get; init; }
    public double Percent { get; init; }
}
