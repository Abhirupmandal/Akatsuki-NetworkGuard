# 🛡️ NetworkGuard — Zero-Trust AI Security Operations Console

> **GPU-Accelerated Network Intrusion Detection & SOAR Platform**  
> Built on NVIDIA RAPIDS · Google Cloud · FastAPI · React

---

## 📖 Overview

**NetworkGuard** is a full-stack, production-grade cybersecurity dashboard designed for Security Operations Center (SOC) analysts. It detects network attacks in real-time, classifies them using a GPU-accelerated machine learning model, and provides automated Zero-Trust policy enforcement (SOAR), all through a premium dark-mode React console.

The project was built for the **GEN AI Academy Hackathon** and demonstrates a complete AI + GPU acceleration pipeline running on free-tier cloud infrastructure.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NetworkGuard Stack                        │
├─────────────────┬───────────────────┬───────────────────────┤
│  Live Sniffer   │   FastAPI Server  │   React Dashboard     │
│  (backend/)     │   (api_server/)   │   (frontend/)         │
│                 │                   │                        │
│  Scapy captures │  Routes + Auth    │  Real-time UI polls   │
│  local packets  │  POST /api/flows  │  GET /api/flows       │
│  → POST flows   │  GET  /api/flows  │  every 2 seconds      │
└─────────────────┴───────────────────┴───────────────────────┘
          ↑                   ↑
  Google Colab T4 GPU    BigQuery Sandbox
  cuDF + cuML pipeline   (Scores stored)
  (backend/main.ipynb)
```

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔴 **Real-Time Packet Sniffer** | Captures live network flows using Scapy + Npcap |
| 🤖 **GPU-Accelerated ML** | cuDF + cuML RandomForest + DBSCAN on NVIDIA T4 |
| 🎯 **MITRE ATT&CK Mapping** | Labels threats with standard technique codes (T1046, T1498, etc.) |
| 🔐 **Zero-Trust Architecture** | Dynamic trust scoring with automated token revocation |
| ⚡ **SOAR Playbooks** | One-click host isolation and firewall quarantine (VLAN-99) |
| 🧠 **Model Explainability** | Per-alert SHAP-style feature weight explanations |
| 📊 **Live Attack Breakdown** | Real-time pie chart of traffic distribution |
| 🔑 **Authentication System** | Sign Up / Sign In with session management |
| 🌐 **BigQuery Integration** | Processed scores piped from GCP to the live dashboard |

---

## 📁 Project Structure

```
files/
├── requirements.txt          # Master Python requirements (install this first)
├── npcap-1.88.exe            # Npcap Windows installer (required for Scapy)
│
├── frontend/                 # React + TypeScript dashboard (Vite)
│   ├── src/
│   │   ├── pages/            # Live Feed, Alert Console, Explainability, etc.
│   │   ├── components/       # NavSidebar, ExplainabilityPanel, SeverityBadge
│   │   ├── hooks/            # useApi (polling hook)
│   │   └── data/             # mock-data.json (offline fallback)
│   ├── package.json
│   └── index.html
│
├── api_server/               # FastAPI backend server
│   ├── main.py               # All API endpoints (auth, flows, SOAR, BigQuery)
│   └── requirements.txt      # API server Python deps
│
└── backend/                  # GPU pipeline + sniffer
    ├── main.ipynb             # Google Colab GPU training notebook
    ├── sniffer.py             # Live Scapy packet sniffer
    ├── model.py               # cuML RandomForest training
    ├── clean.py               # cuDF data cleaning
    ├── scoring.py             # Zero-Trust risk scoring
    ├── bigquery_export.py     # Export results to GCP BigQuery
    └── requirements.txt       # Backend Python deps (GPU pipeline)
```

---

## ⚙️ Prerequisites

### Windows Requirements
1. **Python 3.10+** — [Download](https://www.python.org/downloads/)
2. **Node.js 18+** — [Download](https://nodejs.org/)
3. **Npcap** (for live packet sniffing) — Run the included `npcap-1.88.exe` installer in the project root

### Google Cloud (Optional — for BigQuery integration)
- A GCP project with BigQuery Sandbox enabled (free tier)
- A service account key JSON file configured as `GOOGLE_APPLICATION_CREDENTIALS`

---

## 🔧 Installation

### Step 1 — Clone the repository
```bash
git clone <your-repo-url>
cd "GEN AI ACADEMY COHORT 2.0/files"
```

### Step 2 — Install Python dependencies

**Create a virtual environment (recommended):**
```bash
python -m venv venv
venv\Scripts\activate      # Windows
```

**Install all Python packages:**
```bash
pip install -r requirements.txt
```

### Step 3 — Install frontend dependencies
```bash
cd frontend
npm install
```

---

## 🏃 Running the Project

Open **3 separate terminal windows**:

### Terminal 1 — React Frontend
```bash
cd frontend
npm run dev
```
→ Opens at `http://localhost:5173`

### Terminal 2 — FastAPI Server
```bash
cd api_server
python main.py
```
→ Runs at `http://localhost:8000`

### Terminal 3 — Live Packet Sniffer
```bash
cd backend
python sniffer.py
```
> **Note:** Run as Administrator on Windows for full packet capture access.

---

## 🔐 Authentication

| Credential | Value |
|---|---|
| Default Username | `admin` |
| Default Password | `networkguard2026` |

New operators can self-register via the **Sign Up** tab. Registered accounts receive **Tier-1 Analyst** clearance.

---

## 🧠 GPU Acceleration (NVIDIA RAPIDS)

The ML training pipeline in `backend/main.ipynb` is designed to run on **Google Colab with a T4 GPU**:

1. Open [Google Colab](https://colab.research.google.com/)
2. Upload `backend/main.ipynb`
3. Set Runtime → **T4 GPU**
4. Run all cells — the pipeline uses `cuDF` and `cuML` for **~34x speedup** vs standard pandas/scikit-learn

**GPU libraries used:**
- `cudf.pandas` — GPU-accelerated DataFrames
- `cuml.ensemble.RandomForestClassifier` — GPU-accelerated model training
- `cuml.cluster.DBSCAN` — GPU-accelerated anomaly detection

> If running on CPU only, the pipeline automatically falls back to standard `pandas` and `scikit-learn`.

---

## 🛡️ MITRE ATT&CK Mapping

| Attack Class | MITRE Technique |
|---|---|
| DDoS | T1498 — Network Denial of Service |
| PortScan | T1046 — Network Service Discovery |
| BruteForce | T1110 — Brute Force |
| Botnet | T1071.001 — Web Protocols |
| WebAttack | T1190 — Exploit Public-Facing Application |
| Infiltration | T1190 — Exploit Public-Facing Application |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/auth/signup` | Register new operator |
| `POST` | `/api/auth/login` | Authenticate operator |
| `GET` | `/api/flows` | Get live + historical threat flows |
| `POST` | `/api/flows` | Push new flow from sniffer |
| `POST` | `/api/mitigate/block` | SOAR: Isolate IP in VLAN-99 |
| `GET` | `/api/kpis` | Summary KPI statistics |
| `GET` | `/api/benchmarks` | GPU vs CPU benchmark results |
| `GET` | `/api/validation` | Model accuracy metrics |
| `GET` | `/api/trends/{window}` | Traffic trends (24h or 7d) |

---

## 🏆 Hackathon Pitch Summary

- **Problem:** SOC analysts face alert fatigue from millions of flows/hour; traditional tools miss novel attacks.
- **Solution:** GPU-accelerated AI pipeline (cuDF + cuML) that scores all flows in seconds, not minutes, and surfaces only what matters with automated containment.
- **Dataset:** CIC-IDS2017 (University of New Brunswick) — 2.8M real network flow records.
- **Results:** 99%+ classification accuracy across 7 attack classes. 34x speedup vs CPU baseline.
- **Stack:** NVIDIA T4 on GCP → BigQuery → FastAPI → React (all free tier).

---

## 📄 License

MIT License — Free to use for educational and hackathon purposes.
