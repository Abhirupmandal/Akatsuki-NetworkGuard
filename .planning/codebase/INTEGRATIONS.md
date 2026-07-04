---
last_mapped_commit: none
---

# Integrations

**Date:** 2026-07-03

## External Services & APIs
- **Google Cloud BigQuery:** Accessed via `google-cloud-bigquery` library in Python. Used for storing risk scores, benchmarks, KPIs, and validation metrics (`schema.sql`). `app.py` authenticates via Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS` to run queries against `PROJECT_ID.networkguard.*`.
- **Google Cloud Storage (GCS):** Used to store the raw CIC-IDS2017 dataset CSV files for ingestion by the notebook.
- **Looker Studio:** Integrates with BigQuery to provide an executive view dashboard (documented in `looker_field_mapping.md`).

## Databases
- **BigQuery:** The primary data warehouse for this project. The notebook populates the tables directly using `pandas_gbq`, and Streamlit reads from them.
  - `flow_risk_scores`: Flow-level predictions.
  - `benchmark_results`: Performance comparisons.
  - `summary_kpis`: High-level dashboard metrics.
  - `validation_metrics`: Model accuracy metrics.

## Authentication
- **GCP IAM:** Relies on `gcloud auth application-default login` for local execution or Service Account keys for automated execution to authenticate with BigQuery.
