import pandas as pd
import numpy as np

SEVERITY_MAPPING = {
    "BENIGN": 1,
    "PortScan": 3,
    "BruteForce": 4,
    "WebAttack": 4,
    "DDoS": 5,
    "Botnet": 5,
    "Infiltration": 5
}

def _get_severity(label):
    for k, v in SEVERITY_MAPPING.items():
        if k.lower() in str(label).lower():
            return v
    return 3 if str(label).lower() != "benign" else 1

def compute_risk_score(df_scores):
    if hasattr(df_scores, 'to_pandas'):
        df_scores = df_scores.to_pandas()
        
    unique_labels = df_scores['predicted_label'].unique()
    severity_map = {lbl: _get_severity(lbl) for lbl in unique_labels}
    df_scores['severity'] = df_scores['predicted_label'].map(severity_map).fillna(1).astype(int)
    
    base_score = df_scores['severity'] * 10
    confidence_score = df_scores['confidence'] * 30
    anomaly_score = df_scores['is_anomaly'] * 20
    
    raw_score = base_score + confidence_score + anomaly_score
    df_scores['risk_score'] = raw_score.clip(lower=0, upper=100)
    
    benign_mask = df_scores['predicted_label'].str.lower() == 'benign'
    df_scores.loc[benign_mask, 'risk_score'] = df_scores.loc[benign_mask, 'risk_score'] * 0.3
    
    return df_scores

def recommend_action(risk_score, predicted_label, source_ip):
    label_upper = str(predicted_label).upper()
    trust_score = 100 - risk_score
    
    if trust_score < 15:
        return f"🔴 REVOKE ACCESS TOKEN — Active threat {label_upper} on {source_ip}. Terminate active sessions."
    elif trust_score < 35:
        return f"🟠 STEP-UP MFA REQUIRED — Abnormal {label_upper} pattern on {source_ip}. Force re-authentication."
    elif trust_score < 60:
        return f"🟡 ISOLATE HOST — Anomalous behavior from {source_ip}. Restrict access to Tier-1 network segment."
    else:
        return f"🟢 VERIFIED TRUST — {source_ip} behavior is normal."

def apply_recommendations(df):
    if hasattr(df, 'to_pandas'):
        df = df.to_pandas()
        
    df['recommended_action'] = df.apply(
        lambda row: recommend_action(row['risk_score'], row['predicted_label'], row.get('Source IP', 'Unknown')),
        axis=1
    )
    return df
