using System;
using System.IO;
using System.Text.Json;
using JsonDash.Wpf.Models;

namespace JsonDash.Wpf.Services;

public static class ApexGalleryHtmlBuilder
{
    public static string Build(DashboardAnalysis analysis)
    {
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        var helperScriptPath = Path.Combine(repoRoot, "flask", "static", "apex-gallery.js");
        var helperScript = File.Exists(helperScriptPath)
            ? File.ReadAllText(helperScriptPath)
            : "window.renderApexGallery = function () {};";

        var payload = JsonSerializer.Serialize(
            analysis,
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

        return $$"""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        color: #eef5fb;
        background:
          radial-gradient(circle at top left, rgba(239, 187, 73, 0.16), transparent 28%),
          linear-gradient(180deg, #0f1722, #101827);
        font-family: "Segoe UI Variable", "Bahnschrift", sans-serif;
      }
      .frame {
        padding: 18px;
      }
      .header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }
      .eyebrow {
        display: inline-flex;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #d5a749;
      }
      h2 {
        margin: 8px 0 0;
        font-size: 28px;
      }
      p {
        margin: 6px 0 0;
        color: rgba(220, 232, 242, 0.76);
        line-height: 1.6;
      }
      .meta-chip,
      .mini-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(220, 232, 242, 0.82);
        font-size: 12px;
        white-space: nowrap;
      }
      .apex-gallery-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .gallery-card {
        display: grid;
        gap: 12px;
        padding: 20px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        color: #eef5fb;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }
      .gallery-card .eyebrow,
      .gallery-card .mini-chip,
      .gallery-card .gallery-subtitle {
        color: rgba(220, 232, 242, 0.74);
      }
      .gallery-card h4 {
        margin: 8px 0 0;
        font-size: 18px;
      }
      .gallery-header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 12px;
      }
      .gallery-subtitle {
        margin: 0;
        line-height: 1.65;
      }
      .gallery-shell {
        padding: 8px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .gallery-host {
        min-height: 280px;
      }
      .gallery-card.atlas {
        background:
          radial-gradient(circle at top left, rgba(79, 124, 255, 0.22), transparent 38%),
          linear-gradient(180deg, rgba(10, 20, 36, 0.98), rgba(11, 19, 31, 0.96));
      }
      .gallery-card.ember {
        background:
          radial-gradient(circle at top left, rgba(239, 187, 73, 0.18), transparent 38%),
          linear-gradient(180deg, rgba(38, 29, 21, 0.98), rgba(25, 19, 15, 0.96));
      }
      .gallery-card.lagoon {
        background:
          radial-gradient(circle at top left, rgba(45, 212, 191, 0.2), transparent 38%),
          linear-gradient(180deg, rgba(8, 31, 36, 0.98), rgba(8, 24, 28, 0.96));
      }
      .gallery-card.plum {
        background:
          radial-gradient(circle at top left, rgba(179, 146, 240, 0.22), transparent 38%),
          linear-gradient(180deg, rgba(25, 20, 38, 0.98), rgba(18, 14, 29, 0.96));
      }
      .apexcharts-text { fill: #d7e2ee; }
    </style>
  </head>
  <body>
    <div class="frame">
      <div class="header">
        <div>
          <span class="eyebrow">Apex gallery</span>
          <h2>All major Apex chart families in one live demo</h2>
          <p>Same dataset, sixteen visual languages. This embedded surface gives the WPF app full chart-family parity.</p>
        </div>
        <span class="meta-chip" id="apexGalleryCount">16 chart types</span>
      </div>
      <div class="apex-gallery-grid" id="apexGallery"></div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <script>{{helperScript}}</script>
    <script>
      window.renderApexGallery(document.getElementById("apexGallery"), {{payload}});
    </script>
  </body>
</html>
""";
    }
}
