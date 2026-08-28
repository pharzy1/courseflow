# CourseFlow data sources

CourseFlow separates source adapters from the UI and database. Every record carries a source URL, retrieval timestamp, official/non-official flag, and license field.

## Approved Stage 1 sources

- **UC Berkeley SPoCC** (`spocc.berkeley.edu`) is Berkeley's official curriculum API. Its adapter is present but remains disabled until a stable endpoint contract and reuse terms are recorded.
- **BerkeleyTime public GraphQL catalog** (`berkeleytime.com/api/graphql`) is a public, unauthenticated read-only transitional source. Cached records are explicitly marked non-official and no authenticated Berkeley or CalCentral surface is accessed.
- **Versioned snapshot** (`data/catalog.snapshot.json`) keeps the feature-flagged real-data path deterministic when a live source or Neon is unavailable.

`COURSEFLOW_DATA_MODE=snapshot` is the safe default. `COURSEFLOW_DATA_MODE=neon` requires `DATABASE_URL` and switches the same typed repository interface to Postgres.

The snapshot generator intentionally fetches one bounded page by default. Production refresh jobs should ingest all pages into Neon only after source reuse terms and rate limits are confirmed.
