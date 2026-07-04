---
last_mapped_commit: none
---

# Structure

**Date:** 2026-07-03

## Directory Layout

The codebase is organized by functional component:

- `e:/GEN AI ACADEMY COHORT 2.0/files/`
  - `README.md` - Overall project documentation and architecture overview.
  - `requirements.txt` - Python dependencies for the Streamlit application.
  - `app.py` - The Streamlit application entry point.
  - `schema.sql` - BigQuery table schemas for storing pipeline results.
  - `looker_field_mapping.md` - Documentation for connecting Looker Studio to BigQuery.
  - `NetworkGuard_Pipeline.ipynb` - The primary data processing and ML pipeline notebook.

*(Note: Based on the actual directory listing, all files are currently in the root directory. However, the README suggests an intended structure of `notebooks/`, `sql/`, and `dashboard/` which appears flattened in the current workspace.)*

## Key Locations
- **Pipeline:** `NetworkGuard_Pipeline.ipynb` contains the entirety of the RAPIDS/cuML data processing logic.
- **Dashboard:** `app.py` contains the entirety of the UI layer for the SOC analyst dashboard.
- **Database:** `schema.sql` contains the DDL for BigQuery tables.
