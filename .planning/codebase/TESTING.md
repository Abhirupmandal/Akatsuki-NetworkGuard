---
last_mapped_commit: none
---

# Testing

**Date:** 2026-07-03

## Testing Framework & Practices
Currently, the repository does not include automated unit testing or integration testing frameworks (like `pytest` or `unittest`). 

## Validation
- **Model Validation:** The `NetworkGuard_Pipeline.ipynb` calculates Precision, Recall, and F1 Score against the ground-truth labels in the CIC-IDS2017 dataset. These metrics are persisted to the `validation_metrics` BigQuery table and surfaced in the Streamlit app's "Model Validation" tab.

## Future Testing Needs
- Unit tests for the data loading and processing functions.
- Integration tests simulating the flow of data from GCS -> Colab -> BigQuery.
- Streamlit app UI testing (e.g., using `pytest-playwright` or Streamlit's AppTest framework).
