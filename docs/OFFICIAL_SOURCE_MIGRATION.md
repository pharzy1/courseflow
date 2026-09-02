# Official-source migration decision

Date reviewed: 2026-09-02

## Evidence

- Berkeley identifies its public [Class Schedule](https://classes.berkeley.edu/) as the student-facing search surface and the [Student Information System](https://opa.berkeley.edu/campus-data/class-schedule-instructional-record-csir) as the system of record for class-schedule data.
- The Class Schedule publishes course, instructor, meeting, enrollment, capacity, waitlist, and reserved-seat information on anonymous section pages.
- Its current `robots.txt` disallows automated access to `/search/`. CourseFlow will therefore not crawl the search results or disguise automated traffic.
- Berkeley's [API Central](https://integration-services.berkeley.edu/node/336) provides documented APIs, access tokens, and a data-owner approval workflow. A CalNet identity may request access, but approval is not anonymous or automatic.
- Berkeley's official [undergraduate catalog](https://undergraduate.catalog.berkeley.edu/courses) exposes an “Export all results as CSV” control through its Coursedog catalog. This is suitable for a reviewed course-metadata import once Berkeley or Coursedog confirms a stable export contract; it does not replace live section/enrollment data.
- No official, anonymous grade-distribution API was identified. The existing grade adapter remains transitional and non-official.

## Recommended incremental strategy

1. Request read-only Class Schedule/course API access through API Central for CourseFlow's public student-planning use case.
2. In parallel, obtain written confirmation that the official Coursedog CSV export may be automated, then use it for course titles, descriptions, units, and requirements.
3. Keep the BerkeleyTime adapter as the section/enrollment fallback until the official candidate reaches at least 99% section coverage and 99% agreement on stable fields across a deterministic sample of at least 250 sections.
4. Require exact agreement for section identifiers, meeting times, and enrollment values before any official record replaces its fallback counterpart. Record disagreements rather than silently merging them.
5. Change in-app provenance per record only after that record is actually supplied by the official adapter.

## Decision required

Approval is required before CourseFlow automates either official-source path. The recommended choice is the **API Central + reviewed Coursedog export hybrid**, with BerkeleyTime retained as an explicit fallback during validation. A public Class Schedule HTML crawler is not recommended because its discovery path is disallowed by the current robots policy.
