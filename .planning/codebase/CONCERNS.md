---
last_mapped_commit: none
---

# Concerns

**Date:** 2026-07-03

## Technical Debt
- Project structure is flat; `app.py`, `requirements.txt`, and `schema.sql` are in the root directory instead of the documented `dashboard/` and `sql/` directories as detailed in the README.

## Known Issues
- Currently, the dashboard lacks automated tests, which means that any breaking changes to the BigQuery schema or the Streamlit app logic will only be discovered at runtime.

## Fragile Areas
- `app.py` directly references the hardcoded `PROJECT_ID = "your-gcp-project-id"`. This requires users to manually modify the code before they can deploy it, and could easily cause exceptions if the user forgets to update this constant.
- BigQuery table creation relies on `pandas_gbq` in the notebook, which implies schema inference. Using the explicit `schema.sql` is optional, which could lead to type mismatches if `pandas_gbq` infers an unexpected type during ingestion.

## Security
- No explicit authentication layer within the Streamlit app; it relies entirely on the host environment's Identity-Aware Proxy (IAP) or network security to restrict access to the live SOC dashboard.
