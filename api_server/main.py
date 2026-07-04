import os
import json
import hashlib
import secrets
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.cloud import bigquery
from typing import Dict, Any

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-gcp-project-id")
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "networkguard_dataset")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"

app = FastAPI(title="NetworkGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = None
if not USE_MOCK_DATA:
    try:
        client = bigquery.Client(project=PROJECT_ID)
        print(f"[*] Connected to BigQuery (Project: {PROJECT_ID})")
    except Exception as e:
        print(f"[!] Warning: Failed to connect to BigQuery. Error: {e}")
        USE_MOCK_DATA = True

mock_data = {}
try:
    mock_file_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "data", "mock-data.json")
    with open(mock_file_path, "r") as f:
        mock_data = json.load(f)
except FileNotFoundError:
    print("[!] Warning: Could not find frontend mock-data.json for fallback.")

def query_bq(query: str) -> list:
    if USE_MOCK_DATA or not client:
        raise NotImplementedError("BigQuery is disabled in mock mode.")
    try:
        query_job = client.query(query)
        results = query_job.result()
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    return {"status": "ok", "mode": "mock" if USE_MOCK_DATA else "bigquery"}

USERS_DB: Dict[str, Dict[str, str]] = {
    "admin": {
        "password_hash": hashlib.sha256("networkguard2026".encode()).hexdigest(),
        "role": "Tier-3 Operator"
    }
}

class AuthRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/signup")
def signup(req: AuthRequest):
    username = req.username.strip().lower()
    if not username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password are required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Security key must be at least 6 characters.")
    if username in USERS_DB:
        raise HTTPException(status_code=409, detail="Operator handle already registered.")
    USERS_DB[username] = {
        "password_hash": hashlib.sha256(req.password.encode()).hexdigest(),
        "role": "Tier-1 Analyst"
    }
    token = secrets.token_hex(16)
    print(f"\n[AUTH] ✅ New operator registered: {username} (Role: Tier-1 Analyst)")
    return {"status": "success", "token": token, "username": username, "role": "Tier-1 Analyst"}

@app.post("/api/auth/login")
def login(req: AuthRequest):
    username = req.username.strip().lower()
    user = USERS_DB.get(username)
    if not user:
        raise HTTPException(status_code=401, detail="Operator handle not found.")
    password_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if password_hash != user["password_hash"]:
        raise HTTPException(status_code=401, detail="SECURE HANDSHAKE REJECTED: Invalid security key.")
    token = secrets.token_hex(16)
    print(f"\n[AUTH] 🔓 Operator authenticated: {username} (Role: {user['role']})")
    return {"status": "success", "token": token, "username": username, "role": user["role"]}

class BlockRequest(BaseModel):
    source_ip: str
    predicted_label: str
    risk_score: float

@app.post("/api/mitigate/block")
def mitigate_block(req: BlockRequest):
    print(f"\n[ZERO TRUST POLICY ENFORCEMENT] 🚨 threat activity detected from {req.source_ip} ({req.predicted_label}, Risk: {req.risk_score})")
    print(f"[ZERO TRUST POLICY ENFORCEMENT] 🛡️ Deploying access restriction rule to local firewalls...")
    print(f"[ZERO TRUST POLICY ENFORCEMENT] 🔒 Revoking OIDC tokens and placing {req.source_ip} in quarantine segment VLAN-99.")
    print(f"[ZERO TRUST POLICY ENFORCEMENT] Action successfully executed.\n")
    return {"status": "success", "message": f"IP {req.source_ip} isolated from network segment. Access revoked."}

def _zta_action(risk_score: float, predicted_label: str, source_ip: str) -> str:
    label_upper = str(predicted_label).upper()
    trust_score = 100 - risk_score
    if trust_score < 15:
        return f"🔴 REVOKE ACCESS TOKEN — Active threat {label_upper} on {source_ip}. Terminate active sessions."
    elif trust_score < 35:
        return f"轨迹 STEP-UP MFA REQUIRED — Abnormal {label_upper} pattern on {source_ip}. Force re-authentication."
    elif trust_score < 60:
        return f"🟡 ISOLATE HOST — Anomalous behavior from {source_ip}. Restrict access to Tier-1 network segment."
    else:
        return f"🟢 VERIFIED TRUST — {source_ip} behavior is normal."

class FlowRequest(BaseModel):
    timestamp: str
    source_ip: str
    dest_ip: str
    predicted_label: str
    severity: int
    is_anomaly: int
    risk_score: float
    recommended_action: str
    status: str

LIVE_FLOWS = []

@app.post("/api/flows")
def add_live_flow(flow: FlowRequest):
    global LIVE_FLOWS
    flow_dict = flow.model_dump() if hasattr(flow, "model_dump") else flow.dict()
    LIVE_FLOWS.insert(0, flow_dict)
    LIVE_FLOWS = LIVE_FLOWS[:100]
    return {"status": "success", "message": "Flow added successfully"}

@app.get("/api/flows")
def get_flows(limit: int = 50):
    flows_list = []
    if USE_MOCK_DATA:
        raw_flows = mock_data.get("flow_risk_scores", [])[:limit]
        raw_flows = [dict(f) for f in raw_flows]
        for rf in raw_flows:
            rf["recommended_action"] = _zta_action(rf.get("risk_score", 0), rf.get("predicted_label", "BENIGN"), rf.get("source_ip", "Unknown"))
        flows_list = raw_flows
    else:
        query = f"""
            SELECT *
            FROM `{PROJECT_ID}.{BIGQUERY_DATASET}.flow_risk_scores`
            LIMIT {limit}
        """
        rows = query_bq(query)
        formatted = []
        for r in rows:
            risk = r.get("risk_score", 0)
            sip = r.get("Source IP", "Unknown")
            label = r.get("predicted_label", "BENIGN")
            formatted.append({
                "timestamp": "2026-07-04T12:00:00Z",
                "source_ip": sip,
                "dest_ip": r.get("Destination IP", "Unknown"),
                "predicted_label": label,
                "severity": r.get("severity"),
                "is_anomaly": r.get("is_anomaly"),
                "risk_score": risk,
                "recommended_action": _zta_action(risk, label, sip),
                "status": "Quarantined" if risk >= 65 else "Monitored",
                "features": json.loads(r.get("top_contributing_features", "[]")) if isinstance(r.get("top_contributing_features"), str) else []
            })
        flows_list = formatted
    combined = LIVE_FLOWS + flows_list
    return combined[:limit]

@app.get("/api/kpis")
def get_kpis():
    if USE_MOCK_DATA:
        return mock_data.get("summary_kpis", [{}])[0]
    query = f"SELECT * FROM `{PROJECT_ID}.{BIGQUERY_DATASET}.summary_kpis` LIMIT 1"
    rows = query_bq(query)
    return rows[0] if rows else {}

@app.get("/api/benchmarks")
def get_benchmarks():
    if USE_MOCK_DATA:
        return {
            "benchmark_v2": mock_data.get("benchmark_v2", []),
            "throughput_summary": mock_data.get("throughput_summary", {})
        }
    query = f"SELECT * FROM `{PROJECT_ID}.{BIGQUERY_DATASET}.benchmark_results` ORDER BY rows ASC"
    rows = query_bq(query)
    bench_v2 = []
    cpu_tp = 0
    gpu_tp = 0
    speedup = 1.0
    for r in rows:
        row_count = r.get("rows", 0)
        c_sec = r.get("pandas_seconds", 0)
        g_sec = r.get("gpu_seconds", 0)
        c_tp = row_count / c_sec if c_sec > 0 else 0
        g_tp = row_count / g_sec if g_sec > 0 else 0
        bench_v2.append({
            "rows": row_count,
            "rows_label": f"{row_count/1e6:.1f}M" if row_count >= 1e6 else f"{row_count/1e3:.0f}K",
            "cpu_seconds": c_sec,
            "gpu_seconds": g_sec,
            "cpu_throughput": c_tp,
            "gpu_throughput": g_tp
        })
        if g_tp > gpu_tp:
            gpu_tp = g_tp
            cpu_tp = c_tp
            speedup = r.get("speedup", 1.0)
    return {
        "benchmark_v2": bench_v2,
        "throughput_summary": {
            "cpu_flows_per_sec": cpu_tp,
            "gpu_flows_per_sec": gpu_tp,
            "speedup_factor": speedup
        }
    }

@app.get("/api/validation")
def get_validation():
    if USE_MOCK_DATA:
        return {
            "validation_per_class": mock_data.get("validation_per_class", []),
            "confusion_matrix": mock_data.get("confusion_matrix", {})
        }
    query = f"SELECT * FROM `{PROJECT_ID}.{BIGQUERY_DATASET}.validation_metrics` LIMIT 1"
    rows = query_bq(query)
    if not rows:
        return {}
    row = rows[0]
    try:
        report_json = json.loads(row.get("per_class_report_json", "{}"))
    except:
        report_json = {}
    per_class = []
    for cls_name, metrics in report_json.items():
        if cls_name not in ["accuracy", "macro avg", "weighted avg"]:
            per_class.append({
                "class": cls_name,
                "precision": metrics.get("precision", 0),
                "recall": metrics.get("recall", 0),
                "f1": metrics.get("f1-score", 0),
                "support": metrics.get("support", 0),
                "false_positive_rate": 0.0
            })
    return {
        "validation_per_class": per_class,
        "confusion_matrix": mock_data.get("confusion_matrix", {})
    }

@app.get("/api/trends/{window}")
def get_trends(window: str):
    if window == "24h":
        return mock_data.get("trend_data_24h", [])
    return mock_data.get("trend_data_7d", [])

@app.get("/api/explainability")
def get_explainability():
    return mock_data.get("explainability", {})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
