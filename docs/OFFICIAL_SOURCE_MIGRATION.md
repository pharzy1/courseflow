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

The **API Central + reviewed Coursedog export hybrid** was approved on 2026-09-02, with BerkeleyTime retained as an explicit fallback during validation. A public Class Schedule HTML crawler remains excluded because its discovery path is disallowed by the current robots policy.

## Initial official-export validation

The public Coursedog export returned 27,029 unique course keys. Against a deterministic 250-course sample from CourseFlow's production snapshot, course-key coverage and normalized title agreement were both 100%. Unit-range agreement was 92.8%; inspection showed that the official catalog describes allowable course ranges (for example, 1–4 units) while the term section carries the selected value (for example, 4 units). CourseFlow therefore promotes official titles and descriptions only. Section units remain sourced from the term-specific section feed until the approved Class Schedule API is available.

The hybrid adapter was enabled in production on 2026-09-02 behind `COURSEFLOW_CATALOG_SOURCE=hybrid`. Every refresh now fails closed if a deterministic 250-course sample falls below 99% official-metadata coverage or if required Coursedog export columns disappear. The prepared [API Central request](./API_CENTRAL_ACCESS_REQUEST.md) remains the path to replace the section/enrollment fallback after campus approval.
