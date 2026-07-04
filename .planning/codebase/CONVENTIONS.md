---
last_mapped_commit: none
---

# Conventions

**Date:** 2026-07-03

## Code Style
- **Python:** Standard PEP 8 conventions apply.
- **Streamlit (`app.py`):**
  - Logical separation of concerns using comments and dividers (e.g., `# === CONFIG ===`, `# === DATA LOADING ===`).
  - Heavy use of `@st.cache_data` for database query results to ensure performance on the frontend.
  - Interactive widgets filter pandas DataFrames in-memory rather than re-querying the database.

## Naming Patterns
- Variables use `snake_case` (e.g., `risk_df`, `anomaly_pct`).
- BigQuery tables and datasets use `snake_case`.
- Constants use `UPPER_SNAKE_CASE` (e.g., `PROJECT_ID`, `DATASET`).

## Error Handling
- The Streamlit app wraps data loading in a `try...except` block, displaying `st.error()` and `st.info()` fallbacks if BigQuery connection fails or tables are missing, gracefully preventing the rest of the app from crashing by calling `st.stop()`.
