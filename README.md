# CourseFlow

[![CI](https://github.com/pharzy1/courseflow/actions/workflows/ci.yml/badge.svg)](https://github.com/pharzy1/courseflow/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-live-1768e5)](https://berkeley-courseflow.zesty-mole-4007.chatgpt.site)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)

CourseFlow is a unified Berkeley course-intelligence and schedule-planning prototype. It connects discovery, historical signals, prerequisites, course comparison, degree value, workload planning, and conflict-free schedule ranking in one explainable workflow.

Stage 1 of the real-data architecture is now feature-flagged: `/catalog` reads a versioned Fall 2026 snapshot through a typed repository/API boundary that can switch to Neon Postgres without changing the UI. Every imported record includes visible provenance.

> This repository intentionally demonstrates a production-minded frontend and deterministic scheduling engine. Course and enrollment values are illustrative; it does not claim live Berkeley data, cloud accounts, or a degree audit.

## Live product

**[Launch CourseFlow →](https://berkeley-courseflow.zesty-mole-4007.chatgpt.site)**

![CourseFlow social preview](public/og.png)

## Why this project is different

- **One canonical state:** selected courses drive units, blocks, conflicts, averages, scoring, roadmap totals, saving, and restoration.
- **Unified course intelligence:** illustrative grade, workload, enrollment-momentum, prerequisite, and requirement signals live beside scheduling decisions.
- **Decision Desk:** compare up to three courses without bouncing between catalog, grades, enrollment, and planning tools.
- **Explainable ranking:** the headline score and visible contribution breakdown come from the same `ScoreResult` object.
- **Preference-sensitive alternatives:** morning, lunch, and instructor priorities can rank Schedule A and B differently.
- **Demonstrable conflict handling:** INFO 159 intentionally overlaps STAT 134 in Schedule A; Schedule B resolves it.
- **Accessible interaction:** labeled calendar events, a semantic agenda, live announcements, keyboard focus, responsive navigation, and automated axe checks.
- **Regression evidence:** unit tests validate the engine; Playwright covers real user flows on desktop and mobile; GitHub Actions runs the complete suite.

## Architecture

```mermaid
flowchart LR
  U["User interactions"] --> UI["React planner UI"]
  UI --> S["Canonical schedule state"]
  S --> E["Pure TypeScript engine"]
  E --> B["Meeting-block generator"]
  E --> C["Conflict detector"]
  E --> R["Preference scorer + ranker"]
  B --> V["Calendar + agenda"]
  C --> V
  R --> V
  S <--> L["Device-local saved snapshot"]
  T["Node + Playwright + axe"] --> E
  T --> UI
```

The engine in [`lib/courseflow.ts`](lib/courseflow.ts) has no React or browser dependency, making its behavior deterministic and inexpensive to test. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for data flow, invariants, scoring, and extension boundaries.

## Test strategy

| Layer | What it proves | Command |
|---|---|---|
| Unit | Search, score reconciliation, feasibility, all course subsets, and course-intelligence calculations | `pnpm test:unit` |
| Integration | Snapshot ingestion contract, provenance, filters, and bounded pagination | `pnpm test:integration` |
| Build | TypeScript and production bundling | `pnpm build` |
| End-to-end | Search → select → rank → save → reload, plus conflict resolution | `pnpm test:e2e` |
| Accessibility | Automated WCAG A/AA checks with axe on desktop and mobile | `pnpm test:accessibility` |
| Complete CI | Unit + build + browser suite | `pnpm test:ci` |

## Run locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Open `http://localhost:3000`.

## Key scenarios to inspect

1. Search for `CS 61B`, `machine learning`, or a nonsense query.
2. Toggle instructor, lunch, and morning priorities; inspect the reconciled score breakdown.
3. Add **INFO 159** while **STAT 134** is selected to trigger the conflict fixture.
4. Rank A vs. B to see the engine choose the higher-scoring alternative.
5. Save, make unsaved changes, restore, and reload.
6. Open **Intelligence**, switch courses, inspect prerequisite paths, and compare up to three choices.
7. Navigate entirely by keyboard or open **All schedule meetings** for the semantic alternative.

## Technology

- React 19 + TypeScript
- vinext/Vite deployment build
- Node test runner + tsx
- Playwright + axe-core
- GitHub Actions
- Sites deployment

## Current scope and next boundary

CourseFlow currently persists an anonymous snapshot in `localStorage`. The clean next boundary is an authenticated API adapter that replaces local storage without changing the scheduling engine. Live course ingestion, cloud persistence, notifications, and degree-audit integration are deliberately outside this release.

The approved production direction is Neon Postgres plus optional Clerk accounts. Both remain disabled until deployment credentials are provisioned; anonymous browsing and the deterministic snapshot fallback continue to work. See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Résumé-ready summary

> Built a TypeScript course-intelligence and scheduling engine that unifies prerequisite graphs, workload and enrollment signals, multi-course comparison, explainable preference ranking, conflict-free timetable generation, and responsive WCAG-tested React workflows.

## License

MIT. CourseFlow is an independent student project and is not affiliated with UC Berkeley.
