# NetworkGuard — Looker Studio Dashboard Build Guide

Connect Looker Studio → BigQuery → select your `networkguard` dataset, add all 4 tables
as data sources in one report.

## Page 1: Executive Overview (what judges see first)

| Widget | Type | Data source | Field(s) |
|---|---|---|---|
| GPU Speedup | Scorecard (huge font) | `benchmark_results` | `MAX(speedup)` |
| Flows/sec throughput | Scorecard | `summary_kpis` | `gpu_throughput_flows_per_sec` |
| Total attacks detected | Scorecard | `summary_kpis` | `total_attacks_detected` |
| Model accuracy (F1) | Scorecard | `validation_metrics` | `f1_score` (format as %) |
| Speedup vs Data Scale | Line/bar combo chart | `benchmark_results` | X: `rows`, Y1: `pandas_seconds`, Y2: `gpu_seconds` |

## Page 2: Live Threat Dashboard (the "app" feel)

| Widget | Type | Data source | Field(s) |
|---|---|---|---|
| Risk Leaderboard | Table, sorted desc | `flow_risk_scores` | `predicted_label`, `risk_score`, `recommended_action` — sort by `risk_score` |
| Attack Type Breakdown | Pie or donut chart | `flow_risk_scores` | Dimension: `predicted_label`, Metric: `COUNT` (filter out BENIGN) |
| Severity Distribution | Bar chart | `flow_risk_scores` | Bucket `risk_score` into Critical/High/Medium/Low ranges |
| Anomaly Ratio | Scorecard + gauge | `flow_risk_scores` | `SUM(is_anomaly) / COUNT(*)` |

## Page 3: Validation & Trust

| Widget | Type | Data source | Field(s) |
|---|---|---|---|
| Precision / Recall / F1 | 3 scorecards side by side | `validation_metrics` | one field each |
| Confusion Matrix screenshot | Image (static) | — | export from notebook Cell 8 output, embed as image |

## Filters to add (top of report)
- Filter control on `predicted_label` — lets you demo "show me only DDoS" live
- Filter control on `risk_score` range slider

## Color scheme (matches severity tiers used in the notebook)
- Critical (85-100): red `#D93025`
- High (60-84): orange `#F29900`
- Medium (30-59): yellow `#F9AB00`
- Low (0-29): green `#1E8E3E`

## Demo tip
Open Page 1 first (the speedup story), then flip to Page 2 live and apply the
`predicted_label` filter to "DDoS" in front of judges — this makes the dashboard feel
interactive and real, not a static screenshot.
