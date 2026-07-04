# REQUIREMENTS

## Phase 1: Frontend Shell & Component Library

### User Stories
- As a developer, I need a modern React + Vite project initialized so that I have a robust framework for building the UI.
- As a SOC analyst, I need a high-density, mission-control dark theme so that the dashboard reduces eye strain and looks professional.
- As a developer, I need a central `mock-data.json` file structured exactly like the BigQuery schema so that I can decouple UI development from API readiness.

### Acceptance Criteria
- [ ] Project initialized with Vite, React, TypeScript, and Tailwind CSS.
- [ ] Tailwind configured with background color `#0B0E14`, Inter font for sans-serif, and JetBrains Mono for monospace.
- [ ] Severity colors configured in Tailwind: Critical (`#EF4444`), High (`#F97316`), Medium (`#EAB308`), Low (`#3B82F6`), Benign (`#22C55E`).
- [ ] Reusable components built: `SeverityBadge`, `RiskScoreBar`, `StatCard`, `DataTable` (with sticky headers and sorting), and `NavSidebar`.
- [ ] `mock-data.json` created in the codebase with a TODO comment referencing `schema.sql` and containing sample data for the 4 BigQuery tables.
- [ ] React Router set up with 7 empty routes: Live Feed, Attack Breakdown, Alert Console, Explainability, Trends, Acceleration Proof, Validation.

## Definition of Done
- All code is committed and the React app builds successfully.
- The 7 navigation routes are accessible via the `NavSidebar`.
- `mock-data.json` is properly structured and placed in the project.
