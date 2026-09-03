# Changelog

## v39 — 2026-09-03

- Replaced the catalog-first landing experience with a focused student orientation hub.
- Added consistent task-based navigation across Home, Find Courses, Degree Plan, Guided Demo, and System Status.
- Added active-page states and an accessible responsive menu for tablet and mobile.
- Clarified the three-step student journey: search, build, and plan.
- Updated shareable schedule links to open the canonical catalog workspace.
- Added cross-page and cross-viewport navigation regression coverage.

## v38 — 2026-09-03

- Made Neon-backed account-isolation tests mandatory in CI with an ephemeral PostgreSQL service and self-contained fixtures.
- Removed the unused header-trusting legacy authentication module; Clerk remains the sole account identity boundary.
- Added a report-only Content Security Policy for production rollout measurement.
- Replaced alphabetic catalog validation with deterministic department-stratified sampling.
- Added a complete `VTIMEZONE` definition to calendar exports for Pacific daylight-saving transitions.
- Required a dedicated production unsubscribe-signing secret.
- Added release/tag evidence to the public health API and engineering status page.
- Added linting, a true 1440×900 browser viewport, total JavaScript transfer budgets, and stronger analytics input controls.

## v37 — 2026-09-02

- Completed the production-readiness foundation: real catalog planning, cloud plans, sharing, calendar export, operational telemetry, analytics, alert delivery, and security evidence.
