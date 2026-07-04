# ROADMAP

## Phase 1: Frontend Shell & Component Library
**Goal:** Initialize the React/Vite dashboard, set up the design system, build core reusable components, and establish the mock data architecture.

### Objectives
- Set up Vite + React + TypeScript + Tailwind CSS project
- Implement the `#0B0E14` dark theme and Inter/JetBrains Mono typography
- Create severity color mapping constants
- Build reusable UI components (SeverityBadge, RiskScoreBar, StatCard, DataTable, NavSidebar)
- Create `mock-data.json` replicating the BigQuery schemas
- Scaffold the 7 navigation routes

## Phase 2: Data Integration & View Implementation
**Goal:** Integrate the mock data into the views and build out the specific visualizations for each of the 7 routes.

### Objectives
- Build out Live Feed with Risk-Ranked Alert Leaderboard
- Build out Attack Breakdown pie charts and Anomaly Ratio progress bars
- Build out Acceleration Proof charts
- Implement Validation metrics display
- Prepare hooks/services for swapping to the real BigQuery API later
