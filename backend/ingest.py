import pandas as pd

def load_dataset(gcs_path):
    print(f"[*] Ingesting raw data from {gcs_path}...")
    try:
        df = pd.read_csv(gcs_path)
    except Exception as e:
        print(f"[!] Failed to load data from {gcs_path}. Ensure it exists and is accessible. Error: {e}")
        raise
        
    print(f"[*] Loaded {len(df)} raw rows.")
    return df
