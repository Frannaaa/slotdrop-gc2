# Who owns what and how to hand it over

Updated 31 October 2026. This is the shared group repository. The private reference is a guide; it does not replace anyone's implementation, testing or review.

| Member | Code and issues | Handoff |
|---|---|---|
| Fran / M1 / Frannaaa | Database, session/offer APIs, shared customer helpers, owner dashboard and metrics, integration/deployment; #11–13, #17–18, #23–26, #31, #33 | Merge approved work, provide API setup and field names, check the connected flow and deployment. |
| Chonel (Cholo) / M2 / chukwunyeluukgabrielokolo-cmyk | public/index.html, public/js/home.js; #3 | Load featured sessions from GET /api/slots with request(), card() and notice(). Ask Kirsten to review the working branch. |
| Janelle / M3 / janellereonal | Quote, transactional booking and receipt services/routes; #14–16, #20–21 | Quote #40 is merged. Next save (#15), then readback (#16). Reuse server/services/pricing.js after the slot lock and fresh availability read. Share response fields with Kat and Kaitlyn. Ask Fran to review. |
| Kaitlyn / M4 / sonatiina | public/checkout.html, public/confirmation.html and their JS; #7–8 | Accept slotId/quantity, fetch the server quote, save with a stable retry key, fetch the receipt by returned ID. Ask Kat to review. |
| Kat (Kaithlyn) / M5 / kattgrass | public/detail.html, public/selection.html and their JS; #5–6; studio verification with Fran | Preserve slotId/quantity, handle unavailable sessions and stale/failed quotes, hand selection to Kaitlyn. Ask Kaitlyn to review. |
| Kirsten / M6 / 13kilograms | public/css/style.css, public/browse.html, public/js/browse.js; #10 and #4 | Share CSS classes first; connect validated filters to GET /api/slots. Ask Chonel to review. |

## Start and test

1. Pull the latest main and run npm ci. Create a branch named g1/m<number>-<feature>.
2. For a separate local demo database, run npm run demo. The session API is already on main. For PostgreSQL, follow README environment/setup instructions. Never reseed a populated shared or deployed database.
3. Frontend owners can build layouts while waiting for APIs. Use the agreed routes and the shared helpers rather than copying pricing logic. Shared helper #36 and quote #40 are merged; fetch and merge current main before importing them.
4. Use pageParameters() for booking-page URL fields; positive(value) validates a session ID, while positive(value, 100) validates party size. Cards show previews. Only the server chooses and stores the final pricing tier.
5. Test loading, empty, failure/retry, valid and invalid input, phone layout and the links to the next page. Report missing page/style/API dependencies rather than calling the entire flow complete.
6. Push and open a PR linked to the assigned issue. State what changed, what you actually tested and what remains unfinished. Keep the required assistance record in its existing Markdown table.
7. The assigned reviewer runs the branch and leaves specific results. Fran merges only after the required approval and passing checks. After a fix, the reviewer checks the new commit before approval.

## Work order and dates

Session #27, offers #28, shared helper #36 and quote #40 are on main. Kat can connect Selection to GET /api/pricing/quote?slotId=ID&quantity=N now. Janelle continues POST /api/bookings (#15), then receipt readback (#16).

Home #35 needs Chonel's existing branch updated from main, its description filled with Issue #3 and actual tests, then Kirsten's review. No CSS PR is visible yet; Kirsten should publish it with the shared class list for Chonel to review.

Owner #29 (02d61d1) and discovery #34 (1ec3504) preserve the reviewed fixes, now integrate #36/#40 and have passing CI. Janelle must recheck these current integration commits; Fran then merges #29 before #34. Supporting #32, business #37 and real-studio catalog/applications #39 remain separate unmerged reviews.

| Date | Deliverable |
|---|---|
| Oct 30, internal target | Shared CSS/classes and initial page layouts; Fran and Kat review the business draft. |
| Oct 31, agreed adjustment | Kaitlyn hands over Checkout/Confirmation layouts and validation; API save/readback wiring follows Janelle's #15/#16. |
| Nov 1, internal target | Everyone has a first working code PR submitted. |
| Nov 4, course checkpoint | Deployed Browse loads database sessions through the group's own API. |
| Nov 7, internal target | Connected Home → Browse → Detail → Selection → Checkout → Confirmation, with the saved booking visible in Owner. |
| Nov 9, 11:59 PM Philippine time | Final submission, reviewed main tag, two-page business PDF, diagrams/routes/schema, Postman, challenges/baseline and individual recordings. |

The three-PR/two-review individual gate and grading windows still apply. Do not count this reference or another member's code as your contribution.

## Public demo data

GC2 requires no owner login. Proposed owner #29 returns a non-contact GET /api/bookings summary: no customer name/email or requestId. This route is not on main yet. The receipt readback contract is separate and owned by Janelle. Use fictional customer details for tests. The 72-hour discovery rule lives in public/js/business-config.js; server/config/business.js re-exports it in the discovery upgrade. The browser preview cannot reserve seats or overrule server checks.

Current main uses the legacy fixture catalog. #39 proposes real business identities and published activity facts, with explicitly simulated session dates, seats, deadlines, offers, payments and bookings. Do not hardcode the proposed catalog into customer screens or describe it as already merged. Public research does not establish a studio partnership or actual reservation.
