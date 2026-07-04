# NetworkGuard SOC Console

A modern, high-density, mission-control frontend for the NetworkGuard GPU-accelerated cyberattack detection pipeline.

## Core Value
To provide SOC analysts with a live, risk-ranked action list that cuts through alert fatigue, allowing them to instantly know what to investigate and block first, presented in a performant and professional interface.

## Context
The backend ML pipeline already ingests network flow records, detects novel attacks using GPU-accelerated cuML, and pushes scored results to BigQuery. The existing UI was a basic Streamlit app (`app.py`). To elevate the user experience, we are replacing it with a "proper end-to-end frontend" modeled after professional enterprise security tools (like CrowdStrike or Datadog).

## What This Is
- A dark-themed, high-density dashboard built with React + Vite (TypeScript/Tailwind).
- A reusable component library tailored for security data visualization.
- A decoupled frontend that initially uses mock data but is structured to seamlessly swap to live BigQuery API responses.

## What This Is NOT
- A generic admin template.
- A monolithic application with hardcoded data scattered throughout components.
- A Python/Streamlit application.

## Requirements

### Validated
- ✓ Ingest CIC-IDS2017 dataset via Colab GPU Notebook — existing
- ✓ GPU-accelerated ETL & Feature Engineering (cudf.pandas) — existing
- ✓ Attack Classification (cuML Random Forest) & Anomaly Detection (cuML DBSCAN) — existing
- ✓ Store scored results and metrics in BigQuery (`schema.sql`) — existing

### Active
- [ ] Initialize a React + Vite (TypeScript/Tailwind) frontend project.
- [ ] Implement the core design system: Dark theme (#0B0E14 background), Severity color mapping (Critical: #EF4444, High: #F97316, Medium: #EAB308, Low: #3B82F6, Benign: #22C55E), Inter (labels/headers), JetBrains Mono (data/metrics).
- [ ] Build reusable component library: SeverityBadge, RiskScoreBar, StatCard, DataTable (sticky headers, sortable), NavSidebar.
- [ ] Create a central `mock-data.json` that mimics the BigQuery schemas exactly, decoupling UI from the API.
- [ ] Set up the navigation shell with 7 empty routes: Live Feed, Attack Breakdown, Alert Console, Explainability, Trends, Acceleration Proof, Validation.

### Out of Scope
- Backend API development (in this immediate phase, we are focusing purely on the decoupled frontend and component library).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **React + Vite (TypeScript/Tailwind)** | Best ecosystem for highly customizable, high-density component libraries and routing compared to Streamlit. | — Pending |
| **Central `mock-data.json`** | Ensures all placeholder data lives in one place with the exact schema shape, making the future API integration a zero-component-change swap. | — Pending |
| **Bespoke Design System** | A generic template won't convey the "mission-control" feel required for SOC tools. Custom CSS/Tailwind with specific typography (Inter/JetBrains Mono) is required. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-03 after initialization*
