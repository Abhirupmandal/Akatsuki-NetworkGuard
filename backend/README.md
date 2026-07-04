# NetworkGuard Backend Pipeline

This directory contains the data processing and machine learning backend for NetworkGuard.
It is designed to run on Google Cloud Platform, utilizing NVIDIA RAPIDS acceleration at two distinct scales.

## Architecture

1.  **Stage 1: Large-Scale ETL (Spark RAPIDS)**
    -   Reads raw CIC-IDS2017 CSVs from Google Cloud Storage.
    -   Cleans, normalizes, and engineers features.
    -   Runs benchmarks comparing CPU Spark vs. GPU Spark (RAPIDS Accelerator).
    -   Outputs processed data as Parquet to GCS.

2.  **Stage 2: Modeling (cuDF / cuML)**
    -   Loads the processed Parquet data.
    -   Runs a benchmark comparing standard pandas vs `cudf.pandas`.
    -   Trains a GPU-accelerated RandomForestClassifier (cuML) to classify attack types.
    -   Runs DBSCAN anomaly detection (cuML) for zero-day patterns.
    -   Calculates unified risk scores and explainability features.

3.  **Stage 3: Export**
    -   Exports all calculated metrics, benchmarks, and scored flows to BigQuery.

## How to Run

### Prerequisites

1.  A Google Cloud Project with Billing enabled.
2.  Google Cloud Storage bucket containing the raw CIC-IDS2017 CSVs.
3.  BigQuery dataset created.
4.  A GPU-enabled environment (e.g., Google Colab with T4 runtime, or a GCE VM with a GPU and RAPIDS installed).
5.  Service account credentials configured (e.g., via `gcloud auth application-default login`).

### Configuration

Open `config.py` and update the following variables:
-   `PROJECT_ID`
-   `BUCKET_NAME`
-   `BIGQUERY_DATASET`

### Execution Order

1.  **Run the Orchestrator**
    ```bash
    python main_orchestrator.py
    ```
    *Note: The orchestrator handles submitting the Spark job (Stage 1), waiting for it to finish, and then running the local cuDF pipeline (Stage 2) and BigQuery export (Stage 3).*

## Notes for Evaluators

-   **Two Scales of Acceleration:** We explicitly separate the big-data ETL benchmark (Spark RAPIDS) from the interactive modeling benchmark (cuDF/pandas) to demonstrate NVIDIA acceleration at different operational tiers.
-   **Zero Code Rewrite:** Stage 2 relies on `%load_ext cudf.pandas` to demonstrate that standard pandas code runs unmodified on the GPU.
-   **No Silent Failures:** The code defensively handles NaNs, infs, and schema inconsistencies present in the original academic dataset.
