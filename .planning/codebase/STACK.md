---
last_mapped_commit: none
---

# Tech Stack

**Date:** 2026-07-03

## Overview
NetworkGuard is a GPU-accelerated intrusion and cyberattack detection pipeline using Python, RAPIDS (cuDF, cuML), BigQuery, and Streamlit. It uses a Jupyter Notebook for the data pipeline running on Google Colab (T4 GPU) and Streamlit for a live SOC dashboard.

## Languages & Runtimes
- **Python:** Primary language used for both the Colab pipeline and Streamlit dashboard.

## Frameworks & Libraries
- **Streamlit (`streamlit==1.38.0`):** Used for building the interactive SOC dashboard (`app.py`).
- **Pandas (`pandas==2.2.2`):** Used for CPU baseline data processing and reading BigQuery tables in the Streamlit app.
- **Plotly (`plotly==5.24.0`):** Used for data visualization in the Streamlit dashboard.
- **RAPIDS (`cuDF`, `cuML`):** Used in the `NetworkGuard_Pipeline.ipynb` for GPU-accelerated data processing (cudf.pandas), Random Forest classification (attack detection), and DBSCAN (anomaly detection).

## Data & Storage
- **Google Cloud BigQuery (`google-cloud-bigquery==3.25.0`, `db-dtypes==1.3.0`):** Stores risk scores, benchmark results, KPIs, and validation metrics (`schema.sql`).
- **Google Cloud Storage:** Used to store the raw CIC-IDS2017 dataset CSV files.

## Infrastructure
- **Google Colab (T4 GPU):** Environment used for executing the ML pipeline notebook.
- **Looker Studio:** Used for the executive view dashboards (via `looker_field_mapping.md`).
