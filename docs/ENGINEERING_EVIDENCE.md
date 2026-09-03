# Engineering evidence

CourseFlow uses a typed repository boundary to serve a versioned fallback snapshot or Neon-backed catalog without changing the UI contract. Clerk identity is verified server-side before account-scoped plan, roadmap, and watchlist access. Plans store bounded identifiers and rehydrate current catalog records rather than persisting stale section objects.

The optimizer separates hard constraints from preferences. It enumerates bounded section combinations, rejects overlaps and constraint violations, calculates one immutable contribution ledger, and derives the displayed score from that same ledger. Shared links preserve section identifiers and optimizer settings; calendar export uses recurring iCalendar events.

Evidence commands are documented in the README and enforced in GitHub Actions. Unit tests target pure algorithms and trust boundaries; integration tests cover repository behavior and anonymous protection; Playwright runs primary flows at desktop, tablet, and mobile sizes with axe checks. `/api/health` exposes live operational evidence instead of marketing counters.

The ordinary pull-request workflow proves database ownership rules without third-party credentials. The full Clerk lifecycle is an explicit pre-release boundary: maintainers run the `Authenticated release verification` workflow against the candidate public URL. That workflow fails closed when `CLERK_SECRET_KEY` or `CLERK_PUBLISHABLE_KEY` is missing, creates disposable identities, verifies save/restore and cross-account isolation through the public HTTP API, and deletes those identities afterward. It is intentionally not reported as covered by ordinary CI when credentials are unavailable.
