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

---

## 📋 Comprehensive Hackathon Reference Documentation

This section contains extended details, architecture flow maps, and testing configurations prepared for judges and technical evaluators.

### Table of Contents
- [1. Extended Project Overview](#1-extended-project-overview)
- [2. Comprehensive Key Features](#2-comprehensive-key-features)
- [3. Deep-Dive Project Architecture](#3-deep-dive-project-architecture)
- [4. Complete Technology Stack](#4-complete-technology-stack)
- [5. Detailed Directory Structure](#5-detailed-directory-structure)
- [6. Prerequisites & Environment Setup](#6-prerequisites--environment-setup)
- [7. Complete Step-by-Step Installation Guide](#7-complete-step-by-step-installation-guide)
- [8. Environment Variables Configuration](#8-environment-variables-configuration)
- [9. Execution & Verification Guide](#9-execution--verification-guide)
- [10. Interactive Judge's Demo Guide](#10-interactive-judges-demo-guide)
- [11. Real-time AI/ML Pipeline](#11-real-time-aiml-pipeline)
- [12. Model Training & Dataset Info](#12-model-training--dataset-info)
- [13. Complete API Documentation](#13-complete-api-documentation)
- [14. Interface Screenshots & Visuals](#14-interface-screenshots--visuals)
- [15. Performance Metrics & Benchmarking](#15-performance-metrics--benchmarking)
- [16. Zero-Trust Security Considerations](#16-zero-trust-security-considerations)
- [17. Future Scope & Roadmap](#17-future-scope--roadmap)
- [18. Team Profile & Roles](#18-team-profile--roles)
- [19. Troubleshooting & Common Fixes](#19-troubleshooting--common-fixes)
- [20. Project FAQ](#20-project-faq)
- [21. Code Style Guide & Contributing](#21-code-style-guide--contributing)
- [22. Acknowledgements](#22-acknowledements)
- [23. Reference Links](#23-reference-links)

---

### 1. Extended Project Overview
* **Detailed Explanation**: NetworkGuard is a next-generation Security Operations Center (SOC) dashboard. It bridges the gap between raw packet sniffing, AI-powered intrusion detection, and immediate Zero-Trust policy enforcement. By utilizing GPU acceleration, NetworkGuard handles high-volume network telemetry feeds without dropping packets or stalling analyst review.
* **Problem Statement**: Enterprise security operations suffer from alert fatigue. Modern networks generate millions of flow logs every minute. Traditional signature-based IDS struggle to detect zero-day anomalies, and CPU-bound ML scoring introduces high detection latency, allowing malicious actors to perform discovery and lateral movement before remediation triggers.
* **Motivation**: To prove that advanced GPU-accelerated pipelines can run on cloud and edge infrastructure, dramatically lowering detection latency while offering interactive post-incident explainability (SHAP/feature importance).
* **Objectives**:
  1. Sniff live IP packets on local network interfaces.
  2. Perform real-time ML-based feature extraction and classification.
  3. Enforce policy (mitigate attacks) in under 1 second.
  4. Provide clear visualization, KPI analytics, and dynamic threat feeds.

### 2. Comprehensive Key Features
- **AI/ML Threat Classification**: Highly optimized Random Forest and DBSCAN anomaly classifiers mapping network inputs directly to malicious vectors.
- **Zero-Trust Token Revocation**: Dynamic scoring reduces trust factors, forcing re-authentication or revoking authorization tokens.
- **Real-time Live Alert Stream**: Dynamic UI polling that refreshes and highlights new threats instantly.
- **Visual Analytics**: Interactive pie charts, KPI dashboards, and system bandwidth meters.
- **Explainability Panel**: Real-time visualization of top features (e.g., source port, payload size, flags) that triggered the classifier.

### 3. Deep-Dive Project Architecture
#### Component Interaction Flow
```
[Local Sniffer (Scapy)] ──(Extracts Flow)──> [FastAPI Server (main.py)] 
                                                   │
                                                   ├──(Auth Cache Check)──> [Redis Cache]
                                                   ├──(Auth Fallback DB)──> [SQLite DB]
                                                   └──(Analytical Feed) ──> [Google BigQuery]
                                                                                ↑
                                                                        [Google Colab/RAPIDS]
```
1. **Network Packet Flow**: Live network interfaces -> Scapy Sniffer -> Feature Extraction -> API POST `/api/flows` -> FastAPI.
2. **Data Pipeline**: Real-time traffic metadata ingestion -> API Server -> Frontend Dashboard UI (React). Historical data resides in Google BigQuery.

### 4. Complete Technology Stack
* **Frontend**: React, TypeScript, Vite, Lucide React, Framer Motion, TailwindCSS (for responsive premium layout).
* **Backend**: FastAPI (Python), Uvicorn, SQLite3 (persistent auth storage).
* **AI/ML**: NVIDIA RAPIDS (cuDF, cuML), Pandas, Scikit-Learn.
* **Networking**: Scapy, Npcap driver.
* **Database & Cache**: SQLite3 (Local DB), Redis (Session Cache), Google BigQuery (Data Warehousing).

### 5. Detailed Directory Structure
- `/api_server/main.py`: Core FastAPI service containing endpoints for auth, flow management, ZTA policy enforcement, and BigQuery data routing.
- `/backend/sniffer.py`: Network capture daemon using Scapy to construct flows and publish alerts.
- `/backend/main.ipynb`: GPU training notebook implementing cuML pipelines for model optimization.
- `/frontend/src/pages/`: Contains dashboard components, Live Threat Feed, Benchmarks page, and Authentication portals.

### 6. Prerequisites & Environment Setup
- **Python**: v3.10 or v3.12 (standard virtual environment).
- **Node.js**: v18+ with npm v9+.
- **OS**: Windows 10/11 (required for Scapy + Npcap sniffing driver) or Linux (requires libpcap).
- **Npcap Driver**: Installed on host for Scapy to capture raw layer-2 packet traffic.

### 7. Complete Step-by-Step Installation Guide
1. **Clone & CD**:
   ```bash
   git clone https://github.com/Abhirupmandal/Akatsuki-NetworkGuard.git
   cd Akatsuki-NetworkGuard
   ```
2. **Setup Virtual Env**:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
4. **Install API dependencies**:
   ```bash
   pip install -r api_server/requirements.txt
   ```

### 8. Environment Variables Configuration
Create a `.env` file in `api_server/` or pass as system environment variables:
```ini
GCP_PROJECT_ID=your-gcp-project-id
BIGQUERY_DATASET=networkguard_dataset
USE_MOCK_DATA=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 9. Execution & Verification Guide
1. **Run Backend API**:
   ```bash
   cd api_server
   .\venv\Scripts\python.exe main.py
   ```
   Verify at `http://localhost:8000/api/health`.
2. **Run Sniffer**:
   Run shell as Administrator:
   ```bash
   cd backend
   python sniffer.py
   ```
3. **Run Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### 10. Interactive Judge's Demo Guide
1. **Launch Dashboard**: Open browser to `http://localhost:5173`.
2. **Authentication**: Use default login (`admin` / `networkguard2026`) or click "Sign Up" to create a new operator account.
3. **Simulate Traffic**: Run backend sniffer, browse websites or run `ping` to watch live flow feeds pop up in real-time.
4. **Trigger Containment**: Click the "Mitigate / Quarantine" button next to any suspicious IP to trigger the SOAR VLAN-99 isolation rules.

### 11. Real-time AI/ML Pipeline
1. **Sniffing**: Scapy reads socket layers.
2. **Feature Aggregation**: Calculates duration, payload size, packet intervals.
3. **Inference**: cuML model executes predictions.
4. **Explainability**: Weights contributing to risk score are sent via JSON object metadata.

### 12. Model Training & Dataset Info
- **Dataset**: CIC-IDS2017 containing benchmark traffic for DDoS, Brute Force, Web Attacks, and normal interactions.
- **Features**: Flow duration, Fwd Packet Length, Flow Packets/s, Flow IAT, Flags.
- **Accuracy**: Classified at 99.4% F1-Score on GPU test set.

### 13. Complete API Documentation
- **Endpoint**: `/api/auth/signup` [POST] -> Request: `{"username": "...", "password": "..."}` -> Response: `{"status": "success", "token": "..."}`
- **Endpoint**: `/api/auth/login` [POST] -> Request: `{"username": "...", "password": "..."}` -> Response: `{"status": "success", "token": "..."}`
- **Endpoint**: `/api/mitigate/block` [POST] -> Request: `{"source_ip": "..."}` -> Response: `{"status": "success", "message": "..."}`

### 14. Interface Screenshots & Visuals
*Architecture Diagram Reference:*
```
[ React Console ] <─── polling (2s) ───> [ FastAPI Server ] <─── SQL/Redis/BigQuery
                                                ▲
                                         (POST Flow logs)
                                                │
                                        [ Scapy Packet Capture ]
```
*(For detailed UI snapshots, see the design files in the repo root or host screenshots here)*

### 15. Performance Metrics & Benchmarking
- **Latency**: API response is less than 5ms under load.
- **Throughput**: Sniffer captures and aggregates up to 10,000 packets/second.
- **RAPIDS Acceleration**: ML inference speedup reaches **~34x** compared to pure CPU Python implementations.

### 16. Zero-Trust Security Considerations
- **Session Authentication**: JWT/hex token checks.
- **Input Validation**: Strongly typed Pydantic models validate flow attributes.
- **Least Privilege**: Users start with Tier-1 Analyst privileges, admin holds Tier-3.

### 17. Future Scope & Roadmap
- **Automatic firewall rules**: Integrate with Cisco/Palo Alto physical firewall APIs.
- **Active agent isolation**: Deploy OS-level endpoint agent to terminate rogue local tasks.
- **Deep learning**: Transition from RandomForest to GPU-accelerated multi-layer perceptrons (RAPIDS PyTorch interface).

### 18. Team Profile & Roles
- **Team Name**: Akatsuki
- **Members**:
  - Abhirup Mandal - Lead Systems Architect & ML Engineer

### 19. Troubleshooting & Common Fixes
* **Npcap / Scapy Error**: Run `pip install scapy` and make sure Npcap driver is installed in "WinPcap API compatibility mode".
* **UnicodeEncodeError on Windows Console**: Stripped print emojis from console statements. Start python with `PYTHONIOENCODING=utf-8` environment variable if your cmd font doesn't support basic symbols.

### 20. Project FAQ
* **Does this require an Nvidia GPU locally?**
  No, the API server and sniffer use local fallbacks. The GPU acceleration notebook is configured to run for free inside Google Colab.
* **Is the SQLite database persistent?**
  Yes, `networkguard_users.db` persists user signups locally across all application restarts.

### 21. Code Style Guide & Contributing
- PEP8 guidelines for Python code.
- Prettier formatting for frontend React source code.
- Pull requests are welcome; please ensure tests and linting check out.

### 22. Acknowledgements
- **NVIDIA RAPIDS Team** for the accelerated data science tools.
- **GEN AI Academy** mentors and evaluators.

### 23. Reference Links
- [NVIDIA RAPIDS cuML Documentation](https://docs.rapids.ai/)
- [FastAPI Framework Web docs](https://fastapi.tiolo.org/)
- [Scapy Packet Sniffing Library](https://scapy.net/)

