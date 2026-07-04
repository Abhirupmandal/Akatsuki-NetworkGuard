import pandas as pd
import json

def push_all_tables(dataframes_dict, project_id, dataset_id):
    print(f"[*] Starting BigQuery Export to {project_id}.{dataset_id}...")
    
    expected_tables = [
        "flow_risk_scores",
        "benchmark_results",
        "summary_kpis",
        "validation_metrics"
    ]
    
    for table_name in expected_tables:
        if table_name not in dataframes_dict:
            print(f"[!] Warning: Table '{table_name}' missing from export dictionary. Skipping.")
            continue
            
        df = dataframes_dict[table_name]
        
        if hasattr(df, 'to_pandas'):
            df = df.to_pandas()
            
        for col in df.columns:
            if df[col].apply(lambda x: isinstance(x, (dict, list))).any():
                df[col] = df[col].apply(lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x)
                
        table_path = f"{dataset_id}.{table_name}"
        print(f"[*] Exporting {len(df)} rows to {table_path}...")
        
        try:
            df.to_gbq(
                destination_table=table_path,
                project_id=project_id,
                if_exists="replace",
                progress_bar=False
            )
            print(f"[*] Successfully exported {table_name}.")
        except Exception as e:
            print(f"[!] Error exporting {table_name}: {e}")
            
    print("[*] BigQuery export complete.")
