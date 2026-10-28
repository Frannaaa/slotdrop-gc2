# October 28 checkpoint and Fran code audit

Checked against the full GC2 brief supplied October 28, 2026. This report concerns the shared repository; the private reference build has a separate release checklist.

## CP0

- Routes, four-table schema and first business draft were merged in #22 with Janelle's written approval.
- main is reported protected by GitHub. Exact admin settings could not be re-read: the connector lacks administration permission and GitHub requires fresh email verification in the browser. This report does not independently establish rejection of a direct push.
- All five teammates have write permission: chukwunyeluukgabrielokolo-cmyk, janellereonal, sonatiina, kattgrass and 13kilograms. The instructor's invitation remains to be verified in Settings; public read access is not evidence of an accepted collaborator invitation.
- Assigned Issues cover every screen, route and the two revenue features. Issue #1 tracks the remaining checkpoint steps.
- README declares roster, ownership and stack; CONTRIBUTING, route/schema/business documents and the environment template are present. No filled environment file or node_modules is tracked.
- This correction restores the assistance record and PR template field required by sections 5.1 and 6. It needs a teammate's review and merge before those files count as present on main.

## Fresh code checks

| Ref checked | Local HTTP/unit tests | SQL scenario groups | Result |
|---|---:|---:|---|
| main 0193e98 | 5 passed | 8 passed | Passed |
| #27 88bffaa | 11 passed | 8 passed | Passed |
| #28 c5c941f | 17 passed, 1 PostgreSQL-only skip | 8 passed | Passed |
| #29 99cc822 | 29 passed, 1 PostgreSQL-only skip | 8 passed | Passed |

Syntax checks passed on all four refs. The PostgreSQL-only skip is a local environment limitation; the feature PRs link their successful PostgreSQL CI runs. The audit covered input boundaries, status codes, unknown IDs, Manila dates, search wildcards/nulls, allocation math, concurrent offers, cutoffs after lock waits, resuming/cancelling, saved receipts, five metrics, stale edits and request timeouts. The browser then reproduced an additional owner input defect: a five-digit year threw Invalid time value and left the old automatic cutoff visible. The correction in #29 validates dates, clears stale automatic cutoffs, bounds the native inputs and recovers after a valid date is entered. The updated owner suite passes 30 local tests with one PostgreSQL-only skip. The private build includes the same fix and a browser regression.

## Fran's remaining work

PRs #27–#29 are draft and unmerged. Janelle must run and review them; merge data, then offers, then owner, retargeting each next PR to main. New changes require a fresh review of the changed code. The private implementation and automated review do not supply that approval.

Keep separate the later requirements: CP1 deployed DB-backed Browse by November 4, full reviewed release by November 9 at 11:59 PM Philippine time, three real code PR merges, two specific reviews and work merged in two grading windows. Group evidence and individual recordings are still required.
