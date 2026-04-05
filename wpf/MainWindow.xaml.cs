using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Win32;
using JsonDash.Wpf.Models;
using JsonDash.Wpf.Services;
using JsonDash.Wpf.ViewModels;

namespace JsonDash.Wpf;

public partial class MainWindow : Window
{
    private readonly DashboardAnalyzer _analyzer = new();
    private readonly MainViewModel _viewModel = new();
    private readonly string _samplePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "shared", "sample-data", "sales.json"));

    private DashboardAnalysis _currentAnalysis = new();
    private string? _pendingGalleryHtml;

    public MainWindow()
    {
        InitializeComponent();
        DataContext = _viewModel;
        Loaded += MainWindow_Loaded;
        LoadFromPath(_samplePath, "Shared sample dataset", "Desktop dashboard is ready.");
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await EnsureGalleryReadyAsync();
    }

    private void OpenFileButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFileDialog
        {
            Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*",
            Title = "Select a JSON file"
        };

        if (dialog.ShowDialog(this) == true)
        {
            LoadFromPath(dialog.FileName, Path.GetFileName(dialog.FileName), "Custom JSON loaded successfully.");
        }
    }

    private void LoadSampleButton_Click(object sender, RoutedEventArgs e)
    {
        LoadFromPath(_samplePath, "Shared sample dataset", "Sample data restored.");
    }

    private void SearchTextBox_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
    {
        RefreshTable(SearchTextBox.Text);
    }

    private void LoadFromPath(string filePath, string sourceLabel, string statusMessage)
    {
        try
        {
            var rawJson = File.ReadAllText(filePath, Encoding.UTF8);
            _currentAnalysis = _analyzer.AnalyzeJson(rawJson);

            DatasetNameText.Text = _currentAnalysis.DatasetName;
            _viewModel.ApplyAnalysis(_currentAnalysis, sourceLabel, statusMessage);
            UpdateApexGallery();
            RefreshTable(SearchTextBox.Text);
        }
        catch (Exception exception)
        {
            MessageBox.Show(
                this,
                $"The selected file could not be loaded.\n\n{exception.Message}",
                "jsondash",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }

    private void RefreshTable(string query)
    {
        var filteredRows = FilterRows(query);
        var table = new DataTable();

        foreach (var key in _currentAnalysis.Keys)
        {
            table.Columns.Add(key, typeof(string));
        }

        foreach (var row in filteredRows)
        {
            var tableRow = table.NewRow();

            foreach (var key in _currentAnalysis.Keys)
            {
                tableRow[key] = row.TryGetValue(key, out var value) && value is not null
                    ? Convert.ToString(value) ?? string.Empty
                    : string.Empty;
            }

            table.Rows.Add(tableRow);
        }

        RowsGrid.ItemsSource = table.DefaultView;
        VisibleRowsText.Text = $"{filteredRows.Count} visible rows";
    }

    private List<Dictionary<string, object?>> FilterRows(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return _currentAnalysis.Rows.ToList();
        }

        var normalized = query.Trim().ToLowerInvariant();

        return _currentAnalysis.Rows
            .Where(row => _currentAnalysis.Keys.Any(key =>
            {
                if (!row.TryGetValue(key, out var value) || value is null)
                {
                    return false;
                }

                return Convert.ToString(value)?.ToLowerInvariant().Contains(normalized) == true;
            }))
            .ToList();
    }

    private void UpdateApexGallery()
    {
        _pendingGalleryHtml = ApexGalleryHtmlBuilder.Build(_currentAnalysis);

        if (ApexGalleryView.CoreWebView2 is not null)
        {
            ApexGalleryView.NavigateToString(_pendingGalleryHtml);
        }
    }

    private async Task EnsureGalleryReadyAsync()
    {
        await ApexGalleryView.EnsureCoreWebView2Async();

        if (!string.IsNullOrWhiteSpace(_pendingGalleryHtml))
        {
            ApexGalleryView.NavigateToString(_pendingGalleryHtml);
        }
    }
}
