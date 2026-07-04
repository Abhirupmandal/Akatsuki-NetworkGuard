import pandas as pd
import numpy as np

def clean_and_engineer(df):
    print("[*] Starting data cleaning and feature engineering...")
    
    df.columns = df.columns.str.strip()
    
    label_col = next((c for c in df.columns if c.lower() == 'label'), None)
    if not label_col:
        raise ValueError("Could not find 'Label' column.")
    if label_col != 'Label':
        df = df.rename(columns={label_col: 'Label'})
        
    df['Label'] = df['Label'].astype(str).str.strip()
    
    initial_len = len(df)
    df = df.dropna(how='all')
    df = df.drop_duplicates()
    print(f"[*] Dropped {initial_len - len(df)} duplicate/empty rows.")
    
    ratio_cols = ["Flow Bytes/s", "Flow Packets/s"]
    for col in ratio_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].replace([np.inf, -np.inf], np.nan)
            
            invalid_count = df[col].isna().sum()
            if invalid_count > 0:
                print(f"[*] Found {invalid_count} NaN/inf values in '{col}'. Dropping affected rows.")
                df = df.dropna(subset=[col])
                
    if 'Total Length of Fwd Packets' in df.columns and 'Total Length of Bwd Packets' in df.columns:
        total_bytes = df['Total Length of Fwd Packets'] + df['Total Length of Bwd Packets']
        df['Fwd_Payload_Ratio'] = np.where(total_bytes > 0, 
                                           df['Total Length of Fwd Packets'] / total_bytes, 
                                           0)
        
    print(f"[*] Cleaning complete. Final usable rows: {len(df)}")
    return df
