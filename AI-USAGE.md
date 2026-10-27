# Assistance log

| Date | Member | Tool | Request | Kept or changed | Verification |
|---|---|---|---|---|---|
| October 27, 2026 | Fran | ChatGPT/Codex | Technical planning and checkpoint preparation | Stack and route/schema planning, starter code and documentation support | Automated results are recorded in docs/challenges.md |
| October 27, 2026 | Fran | ChatGPT/Codex | Code support and debugging | Session/offer APIs, owner workspace and tests | PostgreSQL CI, restart check and Postman run; see docs/challenges.md |
| October 27, 2026 | Fran | ChatGPT/Codex | Desk research and business recommendations | Source notes and proposed rules/rationale | Sources are in docs/business.md; team confirmation is not recorded |
| October 28, 2026 | Fran | ChatGPT/Codex | Review Fran's checkpoint and final work; find and fix bugs | Reopening/time checks, owner form request guards, future-offer labels and an outstanding-work checklist | Regression tests, syntax/SQL checks, dependency audit and disposable browser checks; see docs/challenges.md |
| October 28, 2026 | Fran | ChatGPT/Codex | Second review of API validation and database failures | Correct malformed-path, unsupported-encoding and unavailable-database responses; add regression tests | Three new tests failed before correction; the local owner suite then passed 17 tests, with one PostgreSQL-only test skipped |
| October 28, 2026 | Fran | ChatGPT/Codex | Check owner-edit consistency and metric edge cases | Submit only edited offer fields so stale forms do not undo later pauses or inventory changes | Reproduced the unintended overwrite; added HTTP and multi-booking metric checks; 19 local tests passed, with one PostgreSQL-only test skipped |
| October 28, 2026 | Fran | ChatGPT/Codex | Align the owner workspace with the supplied brand book and prototype | Brand colors, original logo proportions, local font files, responsive styling, clearer allocation/pricing labels and keyboard table scrolling | Desktop/phone browser review, font and button-size checks, successful edit with unchanged receipt metrics; syntax and local tests passed |

The completed verification above is automated. No personal recording or teammate approval is recorded here. Members should add their own checks and changes when completed.
