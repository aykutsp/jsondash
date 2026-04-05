using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using JsonDash.Wpf.Models;

namespace JsonDash.Wpf.Services;

public sealed class DashboardAnalyzer
{
    public DashboardAnalysis AnalyzeJson(string rawJson)
    {
        var root = JsonNode.Parse(rawJson);
        return AnalyzeNode(root);
    }

    private DashboardAnalysis AnalyzeNode(JsonNode? root)
    {
        var (datasetName, rows) = FindDataset(root);
        var keys = rows.SelectMany(row => row.Keys).Distinct().ToList();
        var numericKeys = new List<string>();
        var categoricalKeys = new List<string>();
        var dateKeys = new List<string>();

        foreach (var key in keys)
        {
            var values = rows
                .Where(row => row.ContainsKey(key) && row[key] is not null)
                .Select(row => row[key]!)
                .ToList();

            if (values.Count == 0)
            {
                continue;
            }

            var numericCount = values.Count(IsNumber);
            var dateCount = values.Count(LooksLikeDate);
            var stringCount = values.Count(value => value is string);
            var categoricalCount = values.Count(value => value is string or bool);

            if (numericCount == values.Count)
            {
                numericKeys.Add(key);
                continue;
            }

            if (dateCount >= Math.Ceiling(values.Count * 0.7))
            {
                dateKeys.Add(key);
                continue;
            }

            if (stringCount >= Math.Ceiling(values.Count * 0.7) || categoricalCount == values.Count)
            {
                categoricalKeys.Add(key);
            }
        }

        return new DashboardAnalysis
        {
            DatasetName = datasetName,
            RowCount = rows.Count,
            Keys = keys,
            NumericKeys = numericKeys,
            CategoricalKeys = categoricalKeys,
            DateKeys = dateKeys,
            Summary = BuildSummary(rows, numericKeys),
            Charts = BuildCharts(rows, numericKeys, categoricalKeys, dateKeys),
            Rows = rows
        };
    }

    private static (string Name, List<Dictionary<string, object?>> Rows) FindDataset(JsonNode? root)
    {
        if (root is JsonArray array && IsArrayOfObjects(array))
        {
            return ("root", array.Select(ConvertObjectNode).ToList());
        }

        if (root is JsonObject jsonObject)
        {
            foreach (var entry in jsonObject)
            {
                if (entry.Value is JsonArray nestedArray && IsArrayOfObjects(nestedArray))
                {
                    return (entry.Key, nestedArray.Select(ConvertObjectNode).ToList());
                }
            }

            return ("root-object", [ConvertObjectNode(jsonObject)]);
        }

        return ("value", [new Dictionary<string, object?> { ["value"] = ExtractValue(root) }]);
    }

    private static bool IsArrayOfObjects(JsonArray array)
    {
        return array.Count > 0 && array.All(node => node is JsonObject);
    }

    private static Dictionary<string, object?> ConvertObjectNode(JsonNode? node)
    {
        if (node is not JsonObject jsonObject)
        {
            return new Dictionary<string, object?>();
        }

        return jsonObject.ToDictionary(entry => entry.Key, entry => ExtractValue(entry.Value));
    }

    private static object? ExtractValue(JsonNode? node)
    {
        if (node is null)
        {
            return null;
        }

        if (node is JsonValue jsonValue)
        {
            if (jsonValue.TryGetValue<bool>(out var booleanValue))
            {
                return booleanValue;
            }

            if (jsonValue.TryGetValue<long>(out var longValue))
            {
                return longValue;
            }

            if (jsonValue.TryGetValue<double>(out var doubleValue))
            {
                return doubleValue;
            }

            if (jsonValue.TryGetValue<string>(out var stringValue))
            {
                return stringValue;
            }
        }

        return node.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
    }

    private static bool LooksLikeDate(object value)
    {
        return value is string text &&
               DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _);
    }

    private static bool IsNumber(object value)
    {
        return value is byte or sbyte or short or ushort or int or uint or long or ulong or float or double or decimal;
    }

    private static double ToDouble(object value)
    {
        return Convert.ToDouble(value, CultureInfo.InvariantCulture);
    }

    private static List<SummaryItem> BuildSummary(List<Dictionary<string, object?>> rows, List<string> numericKeys)
    {
        var summary = new List<SummaryItem>();

        foreach (var key in numericKeys)
        {
            var values = rows
                .Where(row => row.TryGetValue(key, out var value) && value is not null && IsNumber(value))
                .Select(row => ToDouble(row[key]!))
                .ToList();

            summary.Add(new SummaryItem
            {
                Key = key,
                Label = ToTitleCase(key),
                Min = values.Min(),
                Max = values.Max(),
                Avg = Math.Round(values.Average(), 2),
                Count = values.Count
            });
        }

        return summary;
    }

    private static List<DashboardChart> BuildCharts(
        List<Dictionary<string, object?>> rows,
        List<string> numericKeys,
        List<string> categoricalKeys,
        List<string> dateKeys)
    {
        var charts = new List<DashboardChart>();
        var primaryDateKey = dateKeys.FirstOrDefault();
        var primaryCategoryKey = categoricalKeys.FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(primaryDateKey))
        {
            foreach (var numericKey in numericKeys.Take(2))
            {
                charts.Add(new DashboardChart
                {
                    Id = $"line-{primaryDateKey}-{numericKey}",
                    Type = DashboardChartType.Line,
                    Title = $"{ToTitleCase(numericKey)} over {ToTitleCase(primaryDateKey)}",
                    XKey = primaryDateKey,
                    YKey = numericKey,
                    Data = rows
                        .Where(row => row.ContainsKey(primaryDateKey) && row.ContainsKey(numericKey) && row[numericKey] is not null && IsNumber(row[numericKey]!))
                        .Select(row => new ChartPoint
                        {
                            Label = Convert.ToString(row[primaryDateKey], CultureInfo.InvariantCulture) ?? string.Empty,
                            Value = ToDouble(row[numericKey]!)
                        })
                        .ToList()
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(primaryCategoryKey))
        {
            var counts = new Dictionary<string, int>();

            foreach (var row in rows)
            {
                var label = row.TryGetValue(primaryCategoryKey, out var value) && value is not null
                    ? Convert.ToString(value, CultureInfo.InvariantCulture) ?? "Unknown"
                    : "Unknown";

                counts[label] = counts.TryGetValue(label, out var currentCount) ? currentCount + 1 : 1;
            }

            charts.Add(new DashboardChart
            {
                Id = $"bar-count-{primaryCategoryKey}",
                Type = DashboardChartType.Bar,
                Title = $"Rows by {ToTitleCase(primaryCategoryKey)}",
                XKey = primaryCategoryKey,
                YKey = "count",
                Data = counts.Select(entry => new ChartPoint
                {
                    Label = entry.Key,
                    Value = entry.Value
                }).ToList()
            });

            var firstNumeric = numericKeys.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(firstNumeric))
            {
                var grouped = new Dictionary<string, List<double>>();

                foreach (var row in rows)
                {
                    if (!row.TryGetValue(firstNumeric, out var rawValue) || rawValue is null || !IsNumber(rawValue))
                    {
                        continue;
                    }

                    var label = row.TryGetValue(primaryCategoryKey, out var categoryValue) && categoryValue is not null
                        ? Convert.ToString(categoryValue, CultureInfo.InvariantCulture) ?? "Unknown"
                        : "Unknown";

                    if (!grouped.TryGetValue(label, out var values))
                    {
                        values = [];
                        grouped[label] = values;
                    }

                    values.Add(ToDouble(rawValue));
                }

                charts.Add(new DashboardChart
                {
                    Id = $"bar-avg-{primaryCategoryKey}-{firstNumeric}",
                    Type = DashboardChartType.Bar,
                    Title = $"Average {ToTitleCase(firstNumeric)} by {ToTitleCase(primaryCategoryKey)}",
                    XKey = primaryCategoryKey,
                    YKey = firstNumeric,
                    Data = grouped.Select(entry => new ChartPoint
                    {
                        Label = entry.Key,
                        Value = Math.Round(entry.Value.Average(), 2)
                    }).ToList()
                });
            }
        }

        return charts;
    }

    private static string ToTitleCase(string value)
    {
        var cleaned = value.Replace("_", " ").Replace("-", " ");
        return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(cleaned);
    }
}
