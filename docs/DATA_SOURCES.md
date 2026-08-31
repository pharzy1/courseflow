# CourseFlow data sources

CourseFlow separates source adapters from the UI and database. Every record carries a source URL, retrieval timestamp, official/non-official flag, and license field.

## Approved Stage 1 sources

- **UC Berkeley SPoCC** (`spocc.berkeley.edu`) is Berkeley's official curriculum API. Its adapter is present but remains disabled until a stable endpoint contract and reuse terms are recorded.
- **BerkeleyTime public GraphQL catalog** (`berkeleytime.com/api/graphql`) is a public, unauthenticated read-only transitional source. Cached records are explicitly marked non-official and no authenticated Berkeley or CalCentral surface is accessed.
- **Versioned snapshot** (`data/catalog.snapshot.json`) keeps the feature-flagged real-data path deterministic when a live source or Neon is unavailable.

`COURSEFLOW_DATA_MODE=snapshot` is the safe default. `COURSEFLOW_DATA_MODE=neon` requires `DATABASE_URL` and switches the same typed repository interface to Postgres.

The production importer paginates the public GraphQL catalog in bounded 500-row requests, retries transient failures three times with request timeouts, upserts normalized courses and sections, and records an immutable enrollment observation for every section. GitHub Actions runs the job every 15 minutes with concurrency protection; the catalog UI derives `live`, `aging`, or `stale` directly from the last successful source timestamp.

CourseFlow does not describe these enrollment values as official or instantaneous. Berkeley's official Registrar directs students to the Class Schedule, but no approved public enrollment API contract has been identified. BerkeleyTime remains a transparent transitional source until one is documented and approved.
