# Assistance log

| Date | Member | Tool | What we asked for | What we kept or changed | How we checked it |
|---|---|---|---|---|---|
| October 27, 2026 | Fran | ChatGPT/Codex | Technical consultation and checkpoint preparation | Stack, route/schema planning, starter code and documentation support | Automated checks recorded in the repo; Fran's own verification pending |
| October 27, 2026 | Fran | ChatGPT/Codex | Code assistance, debugging and technical review | Session/offer APIs, owner workspace and tests | PostgreSQL CI, restart checks and Postman run recorded in docs/final-verification.md; Fran's own verification pending |
| October 27, 2026 | Fran | ChatGPT/Codex | Desk research and recommendations for the business draft | Source notes and proposed business rules/rationale | Sources linked in docs/research.md; team review pending |

## Fran's verification

**Date:** October 27, 2026. Fran's personal review date has not been recorded.

**Checks personally performed:** Fran's personal checks have not been recorded. Completed automated verification includes 12 passing PostgreSQL tests, eight SQL scenario groups, 21 Postman requests with 26 passing assertions, and a production-container restart check confirming that saved data and owner metrics persisted. The actual evidence is linked in docs/final-verification.md.

**What was kept or changed after review:** Booking cutoffs remain separate from the 72-hour discovery window so each provider can account for preparation time. The cutoff guidance was corrected to follow the selected activity while preserving a session override. Sales resumption now rejects unavailable sessions, unchanged deadlines retain their full precision, and the owner display distinguishes platform commission, booking value and provider proceeds.

## Team business review

**Decisions and reasoning confirmed or revised by the team:** Team confirmation has not been recorded.

The current GC2 build uses a focused catalog of nearby recurring leisure activities, a 72-hour discovery window, provider-controlled session deadlines, a 10% model commission and optional buddy pricing for two or more seats in one booking. These choices keep the MVP focused and let providers control participation and preparation requirements. The commission is a model assumption; provider costs and willingness to participate still require validation. Filling an additional seat is distinguished from discounting customers who would already have booked.
