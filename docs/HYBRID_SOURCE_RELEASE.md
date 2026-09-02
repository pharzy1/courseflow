# Hybrid source production release evidence

Date: 2026-09-02

## Release result

- Full live validation: 5,961 sections and 2,688 distinct section-feed courses across 61 bounded pages.
- Official catalog export: 27,029 unique course keys.
- Deterministic quality sample: 250/250 official metadata matches (100% coverage; required threshold 99%).
- Official fields promoted: course title, description, and cross-listings.
- Protected fallback fields: section identity, component, meetings, instructor, term-specific units, enrollment, capacity, and waitlist.

## Automated evidence

- Unit suite: 28 passed.
- Integration suite: 5 passed; 2 credential-dependent identity tests skipped without local secrets.
- Browser suite: 30 passed across desktop, tablet, and mobile; 3 authenticated Clerk tests skipped without test identities.
- Production build and lint: passed.
- Runtime health, refresh history, quality coverage, and source roles are published on `/status`.

## Failure controls

- Missing required Coursedog columns fail parsing immediately.
- Official coverage below 99% fails before database mutation.
- The scheduled workflow independently asserts the source name, sample size, and coverage returned by the refresh worker.
- The existing fallback remains available and visibly disclosed while API Central access is pending.
