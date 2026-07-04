# NetworkGuard — Backend Build Prompt (for AI coding agent / Antigravity)

Paste everything below into your coding agent as one instruction block.

---

## PROJECT CONTEXT

I am building "NetworkGuard" — a GPU-accelerated network intrusion and cyberattack
detection system. This is a flagship hackathon project for a Google Cloud + NVIDIA
acceleration hackathon. I need a production-quality backend pipeline, not a toy
script. Build it to survive technical questioning from judges: correct handling of
edge cases, real validation metrics, clean modular code, and clear logging at every
stage so failures are debuggable, not silent.

This project must explicitly demonstrate a **data intelligence tool a real user
would actually use**, and must show, with hard evidence, **how acceleration lets
that user make a faster or better decision** — not acceleration as decoration, but
acceleration as the thing that makes the tool operationally usable at all.

## HARD CONSTRAINT — READ THIS FIRST

**This project must run entirely on free tiers that require NO billing account and
NO credit card.** Do not use Google Cloud's Managed Service for Apache Spark, GPU-
enabled Dataproc, or any GCP product that requires linking a card, even under free
trial credit. Everything must work using:
- Google Colab's free GPU runtime (T4) — no card required
- BigQuery sandbox mode — no card required, works with just a Google account
- Cloud Storage free tier (5GB) — no card required
- Looker Studio — completely free, no card required
- Open-source RAPIDS libraries (cuDF, cuML) — free, pre-installable on Colab

If you are ever about to suggest a step that requires billing account setup, stop
and use a free-tier-compatible alternative instead — do not silently assume the
user has or wants to add a card.

## GOAL

Build a complete backend pipeline that:

1. Ingests the CIC-IDS2017 network intrusion dataset from Google Cloud Storage
   (free tier bucket)
2. Cleans and engineers features from raw network flow records using pandas/cuDF
3. Benchmarks identical pipeline logic on CPU (pandas) vs GPU (cudf.pandas /
   RAPIDS) at multiple data scales — this is the core acceleration proof, run
   entirely inside a free Colab GPU runtime
4. Trains a GPU-accelerated multiclass classifier (cuML RandomForestClassifier) to
   detect attack type per flow (BENIGN, DDoS, PortScan, Bot, Infiltration,
   Web Attack, FTP-Patator, SSH-Patator, etc — read actual labels from
   `df['Label'].unique()` at runtime rather than hardcoding, since exact label
   strings vary slightly across CIC-IDS2017 file releases)
5. Runs unsupervised anomaly detection (cuML DBSCAN) on behavioral features to
   catch novel/zero-day patterns that don't match any known attack signature
6. Computes per-flow explainability — which features drove each classification,
   using the trained model's `feature_importances_` mapped back to human-readable
   feature names
7. Computes a unified 0-100 risk score per flow combining classifier confidence +
   attack severity weighting + anomaly flag
8. Generates a human-readable recommended action string per flow based on risk
   tier (Critical/High/Medium/Low)
9. Validates model quality against CIC-IDS2017's real ground-truth labels:
   precision, recall, F1 per class, plus a confusion matrix (save as both CSV
   and PNG image)
10. Measures inference throughput (flows/second scored on GPU vs CPU) — this is
    the "operational responsiveness" evidence
11. Pushes all results into BigQuery (sandbox, free) across exactly these 4 tables:
    - `flow_risk_scores` (predicted_label, severity, is_anomaly, risk_score,
      recommended_action, top_contributing_features)
    - `benchmark_results` (rows, pandas_seconds, gpu_seconds, speedup)
    - `summary_kpis` (total_flows, total_attacks_detected, total_anomalies,
      gpu_throughput_flows_per_sec, best_speedup, model_train_time_sec)
    - `validation_metrics` (precision, recall, f1_score, per_class_report_json)

## WHY THIS STILL COVERS ALL REQUIRED NVIDIA/GCP COMPONENTS

Even without Spark, this legitimately covers:
- **NVIDIA RAPIDS** — the umbrella framework used throughout
- **cuDF / cudf.pandas** — the core CPU-vs-GPU benchmark demo
- **NVIDIA GPUs on Google Cloud** — Colab's T4 GPU runtime IS an NVIDIA GPU
  provisioned by Google Cloud infrastructure; explicitly log/print GPU details
  (via `!nvidia-smi`) at the start of the notebook so this claim is visibly proven,
  not just assumed
- **Google Cloud data layer**: Cloud Storage + BigQuery (2 GCP components, both
  free-tier, no card)
- **Looker** (optional 3rd GCP component) for the executive dashboard

This is 3 NVIDIA-relevant proof points and 2-3 GCP components — comfortably above
the "2 or more from each layer" requirement, entirely on free tiers.

## TECH STACK (mandatory)

- Python 3.10+, designed to run on **Google Colab's free GPU runtime**
- `cudf.pandas` (RAPIDS) for GPU-accelerated dataframe operations via
  `%load_ext cudf.pandas` — must be a drop-in accelerator: the SAME function
  should run correctly under both plain pandas and cudf.pandas without any code
  changes
- `cuml` for RandomForestClassifier, DBSCAN, StandardScaler, LabelEncoder,
  train_test_split — all GPU-backed
- `scikit-learn` ONLY for final metrics reporting (classification_report,
  confusion_matrix, precision_score, recall_score, f1_score) since cuML outputs
  need host-side conversion for these anyway
- `matplotlib`/`seaborn` for the confusion matrix PNG export
- `google-cloud-bigquery` + `pandas-gbq` for BigQuery writes (sandbox mode)
- `google-cloud-storage` (or pandas `gs://` path support) for reading the dataset

## OTHER HARD CONSTRAINTS — DO NOT VIOLATE THESE

- No paid APIs, no paid datasets, no billing account setup anywhere in the
  pipeline. CIC-IDS2017 is free academic data.
- Do not use deprecated cuML/cuDF APIs — check current stable RAPIDS API surface
  for whichever version Colab currently ships.
- Do not silently swallow exceptions. Every pipeline stage logs row counts in/out,
  timing, and any dropped/invalid rows with a reason.
- CIC-IDS2017 column headers have inconsistent leading/trailing whitespace and
  occasional casing differences across releases — normalize defensively
  (`.str.strip()`, case-insensitive matching for key columns like "Label").
- The dataset contains `inf`, `-inf`, and `NaN` in ratio-based features (a known,
  documented property of CIC-IDS2017) — handle explicitly, log how many rows were
  affected, don't silently dropna without reporting the count.
- Class imbalance is severe (BENIGN dominates) — use `class_weight='balanced'` or
  equivalent, and report per-class metrics, not just aggregate accuracy, since
  aggregate accuracy is misleading on imbalanced data.
- All BigQuery pushes use `if_exists="replace"` for idempotent re-runs.
- Every function has a docstring stating its purpose, inputs, and outputs.
- BigQuery sandbox mode has some limitations (e.g. no scheduled queries, 60-day
  table expiry by default) — if any required feature needs a paid BigQuery tier,
  tell me explicitly rather than silently working around it in a way that adds
  cost.

## STRUCTURE REQUIRED

Organize as importable functions, not just top-to-bottom script cells, so each
stage can be re-run independently while debugging:

```
config.py          - all constants (PROJECT_ID, BUCKET_NAME, paths, thresholds)
ingest.py           - load_dataset(gcs_path) -> DataFrame
clean.py            - clean_and_engineer(df) -> DataFrame  [must work under both
                       plain pandas AND cudf.pandas without modification]
benchmark.py         - run_scale_benchmark(df, row_counts) -> DataFrame of timings
model.py             - train_classifier(X, y) -> model, metrics
                        run_anomaly_detection(df, features) -> df with anomaly_cluster
                        get_feature_importances(model, feature_names) -> ranked list
scoring.py           - compute_risk_score(row) -> float
                        recommend_action(risk_score, predicted_label) -> str
validate.py          - compute_validation_metrics(y_true, y_pred) -> dict
                        save_confusion_matrix(y_true, y_pred, path)
bigquery_export.py   - push_all_tables(dataframes_dict, project_id, dataset_id)
main.py / notebook   - orchestrates all of the above in order, with clear
                       progress logging between stages, and prints GPU info via
                       `!nvidia-smi` at the start
```

## VALIDATION I WILL CHECK MYSELF

1. The `clean_and_engineer` function produces IDENTICAL output columns whether run
   under plain pandas or under `%load_ext cudf.pandas` — test both paths.
2. `!nvidia-smi` output is captured/logged early in the notebook, visibly proving
   NVIDIA GPU usage on Google Cloud infrastructure (Colab).
3. The classifier reports per-class precision/recall, not just overall accuracy.
4. The risk score is bounded 0-100 for every row (no negative or >100 values).
5. Every BigQuery table matches the exact schema listed above — column names and
   types checked before pushing.
6. The scale benchmark shows speedup increasing (or at least not decreasing) as
   row count grows — if GPU is slower at small scale (normal, due to kernel
   launch overhead) that's fine and expected, but flag it in the output rather
   than hiding it.
7. Confusion matrix PNG is actually saved and readable, not a blank/broken image.
8. No step in the pipeline requires a Google Cloud billing account or credit card
   at any point.

## OUTPUT FORMAT

Give me the code as a set of clearly labeled files (per the structure above), each
complete and runnable, followed by a short "how to run" section listing the exact
order to execute them and what config values I need to fill in myself (project ID,
bucket name, dataset name — all free-tier, no billing account needed).

If any part of the CIC-IDS2017 schema is ambiguous (e.g. exact label string
spelling for a given attack type), write defensive code that inspects
`df['Label'].unique()` at runtime and adapts the severity-weight mapping
dynamically, rather than hardcoding assumptions that might not match my exact file.
