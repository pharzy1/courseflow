# CourseFlow architecture

## Design goals

1. Keep product claims observable and testable.
2. Derive every schedule metric from one selected-course state.
3. Keep scheduling logic independent of rendering and storage.
4. Make score explanations structurally incapable of drifting from headline scores.
5. Preserve an upgrade path from local persistence to an API-backed account model.

## Runtime topology

```mermaid
flowchart TD
  P["app/page.tsx\ninteraction + rendering"]
  E["lib/courseflow.ts\npure domain engine"]
  D["Illustrative course + section data"]
  LS["localStorage\nSavedSchedule snapshot"]
  P -->|"selected IDs, variant, priorities"| E
  D --> E
  E -->|"blocks, conflicts, ScoreResult, ranking"| P
  P <-->|"explicit save / restore + load"| LS
```

## Domain model

- `Course` describes catalog metadata and the stable course identifier.
- `Block` is one meeting on one weekday with a normalized start and duration.
- `Priority` is a closed union: `morning | lunch | rating`.
- `Variant` is currently `0 | 1`, representing two deterministic section combinations.
- `ScoreResult` contains the headline score and every contribution used to produce it.
- `SavedSchedule` is a versionable browser snapshot of selected IDs, priorities, variant, and timestamp.

## Engine pipeline

```mermaid
sequenceDiagram
  participant UI as React UI
  participant Engine as Scheduler engine
  UI->>Engine: selected IDs + active priorities
  Engine->>Engine: build blocks for A and B
  Engine->>Engine: detect pairwise overlaps
  Engine->>Engine: calculate contribution objects
  Engine->>Engine: rank by total score, then variant ID
  Engine-->>UI: winning variant + reconciled ScoreResult
  UI->>UI: render calendar, alert, score, and explanation
```

## Scoring contract

The unbounded score is the exact sum of:

```text
base feasibility
+ instructor contribution, only when rating is active
+ free-morning contribution, only when morning is active
+ protected-lunch contribution, only when lunch is active
- 15 points per detected overlap
```

The result is clamped to 0–100. The UI renders values directly from `ScoreResult.contributions`; it does not recompute presentation-only numbers.

## Conflict fixture

INFO 159 and STAT 134 meet Tuesday/Thursday at 9:30–11:00 in Schedule A. Selecting both produces two conflict pairs and a 30-point penalty. Schedule B moves INFO 159 to 3:00–4:30 PM, after DATA C100, so the normal five-course path resolves every overlap. Ranking treats feasibility as a gate: only a zero-conflict candidate can be announced as the winner.

## State invariants

- `selected` stores IDs only; course objects are derived from the catalog.
- Units are the sum of currently selected course units.
- Calendar blocks are generated from the same selected IDs and active variant.
- Conflict count is derived from displayed blocks.
- Score and explanation share one engine result.
- The roadmap current term reads the same count and unit values.
- Save and restore serialize the same state required to reproduce the schedule.

## Test boundaries

- `tests/unit/courseflow.test.ts` verifies domain invariants without a browser.
- `tests/e2e/courseflow.spec.ts` verifies the user-observable workflow and WCAG rules.
- `.github/workflows/ci.yml` makes both suites a repeatable merge/push check.

## Evolution path

The UI should depend on a future `ScheduleRepository` interface rather than calling `localStorage` directly. A backend implementation can provide authentication and PostgreSQL persistence while leaving `lib/courseflow.ts` unchanged. A data-ingestion adapter can replace the illustrative constants after licensing, provenance, freshness, and failure states are defined.
