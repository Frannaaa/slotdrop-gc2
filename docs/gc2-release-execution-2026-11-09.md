# SlotDrop GC2 — release execution plan and evidence matrix

**Owner:** Fran (captain) · **Updated:** November 9, 2026, ~10:55 PM PHT · **Official repo:** [Frannaaa/slotdrop-gc2](https://github.com/Frannaaa/slotdrop-gc2) · **Master board:** [#46](https://github.com/Frannaaa/slotdrop-gc2/issues/46).

## Deadline discrepancy — resolve, do not assume

The current Canvas assignment header displays **Due Monday November 16, 2026, 11:59 PM PHT**, while the assignment's own milestone table says **Final Nov 9, 11:59 PM** with main tagged `gc2-v1.0` and submitted online. It mistakenly labels November 9, 2026 as Wednesday (actually Monday). Treat **Nov 9** as the conservative Git release cutoff; ask the instructor *whether the Canvas Nov 16 due date also extends final submission, evidence, recording and individual gate*. Keep the written discrepancy in the submission notes if not clarified. Do not misstate one as confirmed.

## One-thing-first principle

For the rubric, a real outside-group user must finish **Home → Browse → Detail → Selection → Checkout → Confirmation (saved by ID)** on a public host, then the same booking appears on **Owner**. This transaction (20 pts), data/API (20), usability (10) and business alignment (20) are more consequential than optional +5 stretch. The current **official Render Node/Neon URL** is a viable fallback if Vercel is not ready. **Do not make Vercel a dependency of shipping** when reviewed production Render already exists.

## Workstreams: execute in parallel, with explicit integration gates

| Lane | Owner(s) and current PR | Done only when | First action |
| --- | --- | --- | --- |
| A. Customer Browse | Kirsten #62 + shared CSS #60; Kaitlyn/Chonel review | Human tested approval, green CI, merges, API-backed results, filters, all required loading/empty/error and 320–390 px | Kaitlyn independently review/APPROVE or request specific changes on #60/#62; Kirsten addresses feedback |
| B. Checkout/Confirmation | Kaitlyn #43; Kat reviewer; Janelle secondary | Kat's **CHANGES_REQUESTED resolved** on NEW head 3c857e3; green CI; successful 201 never re-enables submit; uncertain retry same requestId; receipt GET by ID after refresh | Kat independently check updated code and submit new valid approval if fixed; captain merges |
| C. Home entry | Chonel #68 after Browse #62 | All Home Browse links go to a *merged* /browse.html; copy updated from “Browse being prepared”; phone tested | Chonel fix stale CTA text, request review; wait until Browse merged |
| D. Booking/inventory | Janelle #59, Owner + existing API | 8 researched offers in persistent DB, at least one **future** bookable open session; server recomputes money, overselling rejected; receipt and Owner persist | Resolve #59's dirty old-base diff with main, get review; if blocked, Fran can create future **fictional** open offers using Owner, never reseed existing DB |
| E. Deployment | Fran #67 Vercel **optional**, existing official Render fallback | Actual public URL serves all seven screens and API, production DB, real receipt/Owner; deployed **SHA recorded** | Janelle/Kat review/approve #67 if Vercel needed; otherwise redeploy reviewed `main` on Render and smoke-test |
| F. Submission docs/evidence | Fran #47, reviewed #37 already merged | 11 items linked; diagrams, routes, schema, PDF, Postman, business/challenges/baseline consistent with final deployed SHA | Approve #47 after genuine review, merge only after correct source updates; don't present CI as phone/Postman evidence |
| G. Independent individual gates | All six authors personally | Each has **3 merged code PRs, 2 substantive reviews, merges in two historical windows** where possible, and independently recorded Challenge 5 video | Each person reports direct GitHub evidence + independent video; missing historical windows require timely instructor notice, not retroactive fabrication |

**Protected main rule:** one real teammate reviewer of record, at least one substantive review comment and approval, current-head green CI, no direct pushes/force/auto bypass. Author identity must match real work; no filler PRs to alter individual credit. Reviews requested ≠ reviews submitted. GitHub auto-merge is currently disabled.

## Captain sequence — tonight / first release window

1. **0–15 min: unblock reviewers.** Kat reviews corrected #43 (new head currently CI 105/105), Kaitlyn reviews #60/#62, Janelle/Kat review #67. Triage feedback in the PR, not separate chat-only claims. Chonel corrects #68 Home CTA. Collect links to the six independent video recordings (no model writing predictions).
2. **15–30 min: reviewed merges.** Merge #60 and #62 in order compatible with each other's current heads; integrate #43 when Kat has resolved her changes-requested state; merge #68 **only after #62**. For each merge record actual SHA, check the new merge commit's GitHub CI, and verify that prior screens remain accessible. Handle AI-USAGE.md collisions preserving all disclosures.
3. **30–45 min: deployment.** Prefer existing Render official Group 1 web service if Vercel PR or account setup is still blocked. Render auto-deploys `main`; identify deployed commit in its dashboard. If #67 is approved and merged, import Express to Vercel Hobby with secret **pooled Neon** DATABASE_URL and NODE_ENV production, root ./. Keep Render available until Vercel's public flow is proven. Never publish database credentials; rotate any previously exposed password and update both hosts.
4. **45–60 min: transaction acceptance.** Run `npm run check:gc2 -- https://ACTUAL-HOST` (read-only) and use the browser for a new **fictional** 201 booking; record booking ID, request payload/status, exact GET receipt, Owner row, metrics, and seats after save. Confirm 320–390 px, no Console errors, no dead buttons, bad-input/error and loading/empty states. Refresh receipt; verify the same ID survives redeploy/server restart. Use only actual observations, not plausible narratives.
5. **After public flow: collect required evidence.** Complete Challenges 1–4, baseline Lighthouse/Network, independent outside-group phone test and system hand drawing; reconcile PDF and README; get all Challenge 5 links. Freeze/tag final **tested** `main` `gc2-v1.0`; submit through the actual announced Canvas channel or documented instructor path. If the end-to-end build fails, submit honestly with the working API, concrete blockers and available source/evidence rather than pretending the six-screen journey succeeds.

The time bands are relative priorities, **not** guarantees; don't merge broken or unreviewed work because of the clock.

## Rubric-to-evidence matrix: 100 + up to 5

| Criterion | Pts | Required evidence | Owner / current truth |
| --- | ---: | --- | --- |
| Transaction flow | 20 | Public Home→Browse→Detail→Selection→Checkout→Confirmation save and Owner saved ID; outside-group user walkthrough | All; **blocked** until #62/#43 merge |
| Data and API | 20 | PostgreSQL ≥3 tables, ≥8 seeded realistic offers, own JSON API 200/201/400/404/409, server-validated money and stock, POST and GET same receipt, survives restart | Fran/Janelle; API+Neon live, deployed Challenge 1 16/16, **new browser transaction pending** |
| Business alignment | 20 | `business.md`, <=2-page PDF, GC1 traceability, funnel element→endpoint→metric reasons, five plain owner rules, 2 persisted server features (availability and buddy pricing), numerical examples ending in business conclusion, five Owner metric decisions | Fran + group; #37 merged, group checks final |
| Usability | 10 | Loading/empty/error per fetched page, phone width, no dead links or Console errors, design choices justified | Kirsten/Chonel/Kat/Kaitlyn; **browser QA pending** |
| Structure and documentation | 10 | Separate UI/routes/services/repos, money in one setting, secrets in host settings, README stack versions/reasons, route/schema, diagram, baseline, Changes since GC1 | Fran #47 (not yet merged) + team |
| Challenges 1–4 | 10 | (1) 6 deployed Postman request+expected+actual status+response screenshots, (2) live browser Network POST and file/function chain + hand-drawn diagram, (3) 3 *genuine* AI/design corrections with originals/tests/own reasoning, (4) trace one owner rule to exact files/lines **without changing it**, refactor to one place if needed with PR | Fran coordination; C1 deployed Newman evidence exists, rest incomplete |
| Git process | 10 | CP0 and CP1 real timestamps, issues, branches, 1 qualifying human approval, protected main, 3 merged authored CODE PRs + 2 substantive reviews + 2 distinct windows per person; AI-USAGE | Everyone; historic W1/W2 gaps cannot be manufactured; instructor clarification needed |
| Bonus 1 — double click | +1 | Two clicks / final seats, one safe booking; browser demonstration + backend lock/idempotency | Kaitlyn + Janelle; core safety code tested, browser evidence pending |
| Bonus 2 — pagination | +1 | API `page`/`limit` **and actual Browse consumption** + screenshot | Fran #49 / Kirsten #63; defer until core |
| Bonus 3 — 429 | +1 | Booking rate limit returns HTTP 429; frontend waits and safely retries same request ID | Fran #56 merged; Kaitlyn client integration/evidence pending |
| Bonus 4 — join compute | +1 | One screen makes two independent API requests and displays a derived value | Fran #51 or team; implementation/evidence pending |
| Bonus 5 — parallel | +1 | Same screen two independent calls, sequential vs parallel measured on real deployed URL with actual times | Fran #53 or team; code/test exists on PR, deployed evidence pending |

**No bonus can substitute for a broken checkout or a missing member recording.**

## Every member's own one-take Challenge 5

The author's **own** function: say its purpose; **before executing** predict results for three different inputs; run them and show actual output; explain mismatches; change one input or one line and show/explain the difference. **Unedited, voiced, maximum 3 minutes, no AI assistance for prediction/recording.** Store each video in a shared accessible folder or the announced Canvas method, with real filename/owner and working permission, and link from the captain's submission. An AI-generated script or synthetic evidence does not satisfy the individual gate.

## Eleven final submission items — captain signoff

- [ ] 1. Public `Frannaaa/slotdrop-gc2`, actually reviewed `main`, release tag **gc2-v1.0** pointing at **tested commit**
- [ ] 2. Actual public deployed URL **with whole customer + Owner flow working**, exact SHA/date noted
- [ ] 3. **PDF ≤2 pages**: what was built, business alignment, two revenue features and worked economics
- [ ] 4. **System diagram + short data flow** of browser→Express→database→receipt
- [ ] 5. **Routes and schema** consistent with last deployed code
- [ ] 6. Exported **Postman collection** in `docs/`, six actual deployed tests and screenshots
- [ ] 7. `docs/business.md`, `docs/challenges.md`, `docs/baseline.md` finalized with genuine observations
- [ ] 8. README **versions of each tool plus why** it was chosen
- [ ] 9. Root `AI-USAGE.md` accurate and complete across all members
- [ ] 10. README run steps, roster/ownership, env **variable names only**, and **Changes since GC1**
- [ ] 11. **One independent unedited voice recording per each of six members** and working access links

**Extra required signoffs:** one outside-group tester independently uses the actual public site on a **phone**, and the baseline records Mobile Lighthouse Performance/Accessibility/Best Practices, first-load request count, transfer bytes, Browse API time and **three actual weaknesses in the team's words**. No minimum Lighthouse score is required.

**Submission channel:** the body says *to be announced*; use only the currently announced method. The Canvas header has a later due date than the instructions; save the instructor's clarification.
