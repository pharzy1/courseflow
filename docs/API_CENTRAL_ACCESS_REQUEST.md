# Berkeley API Central access request draft

This draft is ready for the project owner to submit using a CalNet identity. Replace the bracketed contact field before submission.

## Application

**Application name:** CourseFlow  
**Public URL:** https://courseflowplanner.com  
**Source:** https://github.com/pharzy1/courseflow  
**Technical contact:** [YOUR BERKELEY EMAIL]

## Purpose

CourseFlow is a public, read-only course discovery, schedule planning, and enrollment-notification service for UC Berkeley students. We are requesting approved read-only access to current and future Class Schedule data so CourseFlow can reduce its dependency on a transitional third-party data provider and display Berkeley-sourced information with accurate provenance.

## Requested data

- Academic terms
- Course identifiers, subjects, numbers, titles, descriptions, and units
- Section and class numbers, components, instruction modes, and statuses
- Meeting days, start/end times, locations, and instructors
- Enrollment capacity/current enrollment
- Waitlist capacity/current waitlist
- Reserved-seat rules or aggregate availability when publishable

CourseFlow does **not** request student records, identities, enrollment actions, grades, CalCentral access, or any FERPA-protected information.

## Operational controls

- Server-side read-only access; credentials are never shipped to browsers
- Secrets stored in encrypted production/GitHub environments
- Refresh no more frequently than every 15 minutes for enrollment fields and daily for stable catalog metadata
- Exponential retry, request timeout, bounded pagination, and caching
- Immutable observation history for auditability
- Per-record source URL, retrieval timestamp, and official/non-official disclosure
- Existing third-party source retained only as an explicitly labeled fallback until coverage and accuracy validation passes

## Validation and retention

Before promotion, the official candidate must achieve at least 99% section coverage and 99% agreement on stable fields over a deterministic sample of at least 250 sections. CourseFlow retains aggregate public schedule observations for trend analysis and does not combine them with private student information.
