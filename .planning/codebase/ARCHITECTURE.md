---
last_mapped_commit: none
---

# Architecture

**Date:** 2026-07-03

## System Design
NetworkGuard follows a batch-processing, data-lakehouse architecture for ML inference, paired with a live-read dashboard layer.

## Data Flow
1. **Ingestion:** Raw CIC-IDS2017 flow data resides in Cloud Storage.
2. **Processing (Colab GPU):** The Jupyter notebook (`NetworkGuard_Pipeline.ipynb`) pulls data from GCS.
3. **ETL & Feature Engineering:** Data is loaded and processed using `cudf.pandas` for GPU acceleration, avoiding rewrite of CPU-pandas logic.
4. **Machine Learning:** 
   - `cuML` Random Forest classifies known attacks.
   - `cuML` DBSCAN flags behavioral anomalies.
5. **Storage:** The notebook scores the data and pushes results to BigQuery (`schema.sql`).
6. **Visualization:**
   - Streamlit (`app.py`) queries BigQuery to provide an interactive, live threat feed to SOC analysts.
   - Looker Studio connects to BigQuery for executive KPI reporting.

## Key Abstractions & Entry Points
- **ML Pipeline Entry Point:** `NetworkGuard_Pipeline.ipynb` (Colab Notebook)
- **Database Schema Definitions:** `schema.sql` (BigQuery SQL DDL)
- **SOC Dashboard Entry Point:** `app.py` (Streamlit App)
