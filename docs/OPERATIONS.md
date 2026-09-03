# Production operations

## Service objectives

- Availability target: 99.5% monthly for public catalog and planner.
- API p95 target: catalog <800 ms warm and plan mutations <1,000 ms.
- Catalog freshness: warn after 30 minutes; stale after two hours.
- Alert email delivery: retry at most three times with deterministic idempotency keys.

## Monitoring and response

The `/status` and `/api/health` surfaces expose database latency, catalog freshness, source quality, refresh reliability, email configuration, and retained refresh history. API work emits structured JSON logs; product events contain only bounded aggregate properties and respect Do Not Track. Alert on repeated refresh failure, stale catalog, database outage, elevated 5xx rate, and email failures.

Incident sequence: confirm impact, stop harmful writes, preserve logs, communicate a truthful status, restore the last known-good release or database point, verify primary flows, and write a blameless review. Never paste Clerk, Neon, Resend, or refresh secrets into issues or logs.

## Recovery and security checklist

- Quarterly: restore a Neon branch from retained history and run integration tests against it.
- Monthly: dependency audit, secret review, access review, and unsubscribe test.
- Per release: unit/integration/build/browser/accessibility/performance checks and production health verification.
- Security headers deny framing, MIME sniffing, camera, microphone, and geolocation, with Content Security Policy running in report-only mode before enforcement. Authenticated APIs enforce Clerk identity and ownership. Analytics accepts only same-origin, allowlisted, size-bounded aggregate events and includes a best-effort per-instance abuse guard; hosting-edge global rate limiting remains an infrastructure control rather than an application claim.
