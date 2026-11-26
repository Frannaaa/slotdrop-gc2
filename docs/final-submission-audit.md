# SlotDrop Final Phase 2: requirements audit
Checked 26 November 2026 against the supplied instructor announcement, sections 1-13, and repository main `fdcdfb0dc37cae7e7cb997cf01ede5d043d3fb94`.

**Result:** the backend foundation is merged, deployed and healthy. The complete upgrade and submission package are not finished. A repeat outsider recruitment/recording is not specified.

## Source and limits
- The instructor announcement, titled **Final Project - Phase 2: Improve, demonstrate, defend**, is the source of requirements.
- The first five pages of `SlotDrop_Final_Project_Combined_Brief.pdf` and the shared execution guide are working team plans. They do not override the instructor announcement.
- This audit reads the supplied announcement and current connected evidence. It does not claim a fresh Canvas check. The referenced `final-demo-day-checklist.md` was not found in the available Library/Drive search; do not invent additional requirements from its title.
- The original dates table and presentation section contradict each other. Keep those questions open below.

## 1. Required software and demonstration

| Requirement | Current evidence / status | Next action and owner |
|---|---|---|
| Existing Home/Browse -> Detail -> Selection -> Checkout -> Confirmation flow still works | GC2 flow, stored receipt and Owner evidence exist; PR #92 preserves it. | Rehearse the **integrated** final flow, uninterrupted, after the client/conversion changes. Kat + Kaitlyn; Fran coordinates. |
| A saved booking is read from the database by its ID | Existing receipt route and Confirmation; persisted readback verified. | Show a new final-build receipt in a fresh tab or its matching Owner row. Kaitlyn + Janelle. |
| Server computes money; saving changes availability in the same operation | Existing server pricing, locked save and immutable receipt amounts; main CI passed. | Preserve these rules during conversion; count the customer's held seats once. Janelle. |
| Data survives restart | Main CI includes production-container restart persistence. | Recheck the reviewed integrated release and presentation laptop. Fran. |
| Invalid input is refused visibly, with no saved transaction | Actual refusal captures exist. | Recheck the final screen's message and one refusal during the live demo. Kat/Kaitlyn + Janelle. |
| Loading, empty and error states; phone width; usable controls; clean Console | GC2 evidence and Home/hold browser checks exist. | Regression-check the changed countdown/checkout screens. Each screen owner; Kirsten checks shared styling. |
| **One deliberate upgrade: server-enforced ten-minute hold with visible countdown and automatic expiry** | Create/read/release APIs, server expiry, shared availability and Owner guards are merged in #92. **Visible countdown and booking conversion are unfinished on main.** | Janelle: hold-aware quote and atomic save/conversion. Kat: create/reuse hold and hand it off. Kaitlyn: countdown, expiry, safe submission and saved receipt. |
| Upgrade counts in at least two of the five ways in section 3 | Declared target covers visible feedback, changed bookability, added server logic and a saved-booking relation. | Demonstrate the implemented effects; declaration alone is not proof. Fran + feature owners. |
| Numerical business decision | Report retains the 10% pilot hypothesis and roughly 27-seat modeled break-even, with costs and assumptions. | Say what the number changes about the business decision, not just the arithmetic. Fran + Janelle. |

The four live-demo proofs, in order, are:
1. One uninterrupted full booking flow.
2. Verifiable saved data: new receipt by ID or matching Owner row and changed availability.
3. Two different correct upgrade outcomes, such as successful conversion and expiry; show the feature acting and state the numerical decision. Prepare the expired case beforehand so the feature proof fits within a minute.
4. A refusal, its visible reason, and proof nothing was saved.

The presentation outline in section 8 shows the live-demo flow/save/refusal before the separate upgrade segment. Keep all four proofs; do not replace clicking with a narrated slide or recording.

## 2. Exactly what must be submitted (section 11)

| Submission item | Status on main / pending branch | Finish condition |
|---|---|---|
| Repository link, with reviewed main tagged **final-v1.0** | **Missing final tag.** Only `gc2-v1.0` exists at `905b4c7`. | Tag only the reviewed, tested and verified integrated main commit. Fran. Preserve the GC2 tag. |
| **One group PDF, 2-4 pages** | Three-page report exists. Corrected version is in #94. Its implementation status still identifies pending countdown/conversion. | Refresh the report against the actual final build and submit that PDF. Fran compiles. |
| Deployed link **or** real README run steps | Both exist; current main is live on Render. README uses `npm ci` and `npm run demo`. | Verify the final deployed build and the actual presentation-laptop fallback. Use the project's real commands, not the brief's generic `npm run seed`. Fran. |
| **docs/changes-since-gc2.md** | Exists, including the exact declaration. | Update the completed feature/files, name at least two qualifying effects, and keep the file within the **one-page maximum**. Fran + Janelle. |
| **docs/gc2-feedback-response.md** | **Missing from main and the open PRs checked.** | One row per actual comment: comment, response/decision, precise screen/file/section. Kirsten compiles; each owner supplies their response. |
| **docs/refusals.md** | Exists with actual requests, status codes and bodies. | Refresh captures on the integrated build; resolve/document the 201-versus-409 contract point below. Fran + Janelle. |
| **AI-USAGE.md** updated through submission | Entries exist through 26 November; #94 adds the testing correction. | Keep logging each subsequent contribution through December 1. Everyone must understand and explain their AI-assisted code. |
| System diagram with data-flow arrows and a versioned stack | Included on the report's last page. | Keep both aligned with the final system; no separate diagram upload is required if included in the PDF. Fran. |

### The PDF's six required sections, in order
1. **System overview:** five sentences explaining what, for whom and how.
2. **GC2 -> Final improvements:** declaration sentence, changed work and at least two qualifying ways.
3. **Feature explanation:** steps, named server rule/code location, and a decision with a number.
4. **Transaction flow:** one real save traced UI -> API -> server -> database -> response -> UI.
5. **Data handling:** named product/service, transaction and customer-bearing tables; when stored and how retrieved.
6. **Reflection:** what broke, what comes next and what the team learned.

On the last page: system diagram and stack versions. The current report supplies these sections; completing the software and refreshing its evidence are still necessary.

### All six refusal/total requests
| Request | Brief expects | Recorded implementation |
|---|---|---|
| Quantity 0 or -3 | 400, naming the field | 400 captured. |
| Missing required field | 400, naming the field | 400 captured. |
| More seats than available | 409 or documented refusal; nothing saved | 409 captured; no new booking. |
| Wrong browser total | **201 with server total** | **409 PRICE_CHANGED** for a mismatched accepted total, then 201 only after explicit fresh-quote acceptance. This difference is disclosed, not a claimed 201 pass. |
| Unknown product/session ID | 404 | 404 captured. |
| No matching search | 200 with empty list | 200 / empty list captured. |

## 3. Presentation and day-of readiness
- Cover business recap, system overview, live demo, upgrade, one-save system explanation, current improvements and future roadmap.
- **The brief says every member speaks and contributes meaningfully in Q&A.** The working plan gives Chonel no speaking slot. That plan needs an instructor-approved exception or a revised speaking allocation; this audit does not invent an exception or silently change Fran's plan.
- Every presenter should explain their own code and the whole transaction, including where the server decides expiry, price and availability. Run the prescribed 60-second AI-code sweep for drifting fields, browser-owned totals and service bypasses.
- Request the health route every ten minutes and open the site shortly before presenting. The GitHub pinger is on main, but **no scheduled execution appeared in the latest check**; PR/manual health checks are not proof of recurring execution.
- Prepare the actual presentation laptop, current code, usable demo inventory and local fallback. Open the running app and Owner/database view in that order.
- A backup recording is optional insurance, usable after a failed live attempt. It is not the primary demo and is not another outsider-test deliverable.

Core grading: **40% live demo, 20% business alignment, 20% system explanation, 20% Q&A**.

## 4. Chosen optional bonus
The group chose **Owner / analytics**. Claim it in writing and show all five server-computed figures: booking count, platform commission revenue, average booking value, top-selling activity and low stock/nearly full sessions.

Controlled evidence already verifies **2 bookings, PHP 783 commission, PHP 3,915 AOV, 3 seats sold, and 1 nearly-full session with 1 of 4 seats free**. Total booking value is PHP 7,830. Holds reduce availability but create no confirmed order or revenue. Refresh the demonstration on the integrated release.

A second automation bonus is not required. The brief describes both criterion-band lifts and +5, so exact bonus scoring is another wording ambiguity; it does not change the selected implementation.

## 5. Already completed or not newly required
- Retain the **16 November outside-group iPhone test**: the 65.5-second recording, Bumi & Ashe PHP 2,880 receipt and matching Owner verification are in `docs/challenges.md`. **No second outside-group participant or new recording is specified.** Recheck the updated flow internally and at phone width.
- No new round of individual GC2 Challenge 5 videos is listed for this group Final.
- No login/accounts, real payments, paid API, security layer, load testing, scalability work, React conversion or new database platform is required.
- Chonel's grouped Home improvement (#93) is ready for teammate review and has green CI. Three grouped featured cards are a team improvement, not a separate rubric requirement.
- Optional old Home CTA PR #90 and backup PRs #73/#74 do not all need merging for the Final.
- Janelle's non-blocking hold-rate-limit suggestion is a follow-up, not a new requirement from this brief.
- Fran's **individual storefront** assignment is separate. Its React/Supabase requirements and own-voice video must not be added to the group Final checklist.

## 6. Questions that need authoritative clarification
1. **Deadline:** the source says December 1, 2026, 11:59 PM, but calls it Monday. December 1, 2026 is **Tuesday**. Verify the final Canvas date/time; defense is listed for **Wednesday, December 2**.
2. **Duration:** section 1 says **10 minutes + 5 Q&A**; section 8 says **15 + 5**. Confirm the duration before timing the final script.
3. **Chonel's speaking exception:** the current five-presenter plan conflicts with the all-members rule unless the instructor approved an exception.
4. **Wrong-total response:** ask whether the documented stale-accepted-price 409 contract is accepted for this Final's generic 201 example. GC2 feedback praised that 409 behavior; do not silently remove it or claim it returned 201.
5. **Full GC2 feedback:** the supplied excerpt mentions two small Final items but contains only the cold-start action. Obtain any omitted comment rather than inventing it. The response file must cover every actual comment.
6. **Submission location:** the supplied brief says the channel will be announced. Confirm the actual Canvas/upload destination.

## 7. Immediate work by person
| Person | Next concrete work |
|---|---|
| Janelle | Hold-aware quote, validated atomic hold-to-booking conversion, identical-retry receipt, money/Owner consistency. |
| Kat | Create/reuse the matching hold from Detail/Selection; pass ID/expiry/quantity; usable refusal and refresh recovery. |
| Kaitlyn | Countdown, expiry lock/recovery, stable save/retry, Confirmation from saved ID; rehearse final flow. |
| Kirsten | Changed-screen phone-width/state/Console regression, feedback-response file, Owner labels; independent review of #93 if following the agreed review pair. No mandatory new outsider recruitment. |
| Chonel | Hand off/review Home #93 and supply presentation materials; confirm the speaking-plan exception with Fran. |
| Fran | Coordinate reviews/integration, confirm timing and speaking rule, verify recurring health checks/local backup, refresh final evidence/report, and tag/submit the tested final release. |

## Checked sources and evidence
- Supplied instructor announcement: `Pasted text(20261124-104231).txt`, sections 1-13.
- Combined working plan and the shared execution guide, including the supplied 105/100 feedback summary.
- [Current main](https://github.com/Frannaaa/slotdrop-gc2/tree/fdcdfb0dc37cae7e7cb997cf01ede5d043d3fb94), [merged #92](https://github.com/Frannaaa/slotdrop-gc2/pull/92), [Home #93](https://github.com/Frannaaa/slotdrop-gc2/pull/93), [correction/audit #94](https://github.com/Frannaaa/slotdrop-gc2/pull/94).
- `docs/changes-since-gc2.md`, `docs/refusals.md`, `docs/evidence/final-readiness.json`, `docs/challenges.md`, README, report template, main CI, tag list and Render deploy metadata.
- Current main is deployed as `fdcdfb0`. #93 and #94 remain unmerged and had no independent review at audit time. Their checked heads had passing CI.
