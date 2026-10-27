# Assistance log

| Date | Member | Tool | What we asked for | What we kept or changed | How we checked it |
|---|---|---|---|---|---|
| October 27, 2026 | Fran | ChatGPT/Codex | Technical consultation and checkpoint preparation | Stack, route/schema planning, starter code and documentation support | Automated checks recorded in the repo; Fran's own verification pending |
| October 27, 2026 | Fran | ChatGPT/Codex | Code assistance, debugging and technical review | Session/offer APIs, owner workspace and tests | PostgreSQL CI, restart checks and Postman run recorded in docs/final-verification.md; Fran's own verification pending |
| October 27, 2026 | Fran | ChatGPT/Codex | Desk research and recommendations for the business draft | Source notes and proposed business rules/rationale | Sources linked in docs/research.md; team review pending |

## Fran's verification

**Status: Suggested response for Fran to confirm. This is not yet a completed verification record.**

**Date:** [Enter the date you actually review and test the work.]

**Checks personally performed:** Pending. After completing the checks, adapt this suggested wording to your actual results:

> I ran `npm run check`, `npm test` and `npm run check:sql` and reviewed the results. I opened the owner dashboard at desktop and phone widths, checked the activity-default cutoff and a manual session override, and tried creating, editing and pausing a fictional session. I checked that an unavailable session could not be resumed without correcting its deadline or capacity. My actual results were: [record what happened, including any failure or skipped check].

**What I kept or changed after review — suggested wording:**

> I kept booking cutoffs separate from the 72-hour discovery window because different activities need different preparation times. I requested corrections so the cutoff guidance follows the selected activity and the owner is not told sales have resumed when the session is still unavailable. I also kept the distinction between platform commission, total booking value and provider proceeds. Any further changes I personally made: [enter changes, or say none].

## Team business review

**Status: Pending team discussion. The following is a proposed response, not a claim that the group has agreed.**

**Decisions and reasoning confirmed or revised by the team — proposed wording:**

> We propose a focused catalog of nearby recurring leisure activities so the MVP has a clear use case and manageable supply. The 72-hour window supports near-term planning, while providers control the deadline for each session according to preparation needs. We propose a 10% provider-paid commission as a simple model rate, subject to checking provider costs and willingness to participate. Buddy pricing stays optional for bookings of two or more seats in the same session, so providers can decide whether the lower rate is worthwhile. We will distinguish filling an additional seat from discounting people who would already have booked.

**After discussion:** Record the date, who participated, which choices were accepted or revised, and the team's own reasons.
