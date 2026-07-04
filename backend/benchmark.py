import time
import pandas as pd

def _run_interactive_workload(df):
    temp = df.copy()
    
    if 'Flow Duration' in temp.columns:
        temp['Duration_s'] = temp['Flow Duration'] / 1e6
        
    if 'Destination Port' in temp.columns:
        _ = temp.groupby('Destination Port').agg({
            'Flow Duration': 'mean',
            'Total Fwd Packets': 'sum',
            'Total Backward Packets': 'sum'
        }).reset_index()
    
    if 'Flow Duration' in temp.columns:
        temp = temp.sort_values(by='Flow Duration', ascending=False)
        
    _ = len(temp)
    return temp

def run_scale_benchmark(df, row_counts=[100_000, 1_000_000, 2_800_000]):
    print("[*] Starting scale benchmark...")
    
    results = []
    max_rows = len(df)
    
    for count in row_counts:
        if count > max_rows:
            print(f"[*] Skipping benchmark for {count} rows (only {max_rows} available).")
            continue
            
        sample_df = df.head(count)
        _run_interactive_workload(sample_df.head(1000))
        
        start_time = time.time()
        _run_interactive_workload(sample_df)
        end_time = time.time()
        
        duration = end_time - start_time
        throughput = count / duration if duration > 0 else 0
        
        print(f"[*] Processed {count:,} rows in {duration:.4f} seconds ({throughput:,.2f} rows/s)")
        
        results.append({
            "rows": count,
            "seconds": duration,
            "throughput": throughput
        })
        
    return pd.DataFrame(results)
