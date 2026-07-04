PROJECT_ID = "your-gcp-project-id"
BUCKET_NAME = "your-networkguard-bucket"
BIGQUERY_DATASET = "networkguard_dataset"

RAW_DATA_PATH = f"gs://{BUCKET_NAME}/raw/CIC-IDS2017/*.csv"

CONFUSION_MATRIX_PNG_PATH = "confusion_matrix.png"

FEATURE_COLS = [
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Fwd IAT Mean",
    "Bwd IAT Mean",
    "Fwd Header Length",
    "Bwd Header Length",
    "Fwd Packets/s",
    "Bwd Packets/s",
    "Packet Length Std",
    "SYN Flag Count"
]

RISK_THRESHOLDS = {
    "Critical": 85,
    "High": 65,
    "Medium": 40,
    "Low": 0
}
