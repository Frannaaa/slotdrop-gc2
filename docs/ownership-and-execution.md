# Who owns what and how to hand it over

Updated 3 November 2026. This is the shared group repository. The private reference is a guide; it does not replace anyone's implementation, testing or review.

| Member | Code and issues | Handoff |
|---|---|---|
| Fran / M1 / Frannaaa | Database, session/offer APIs, shared customer helpers, owner dashboard and metrics, integration/deployment; #11–13, #17–18, #23–26, #31, #33 | Merge approved work, provide API setup and field names, check the connected flow and deployment. |
| Chonel (Cholo) / M2 / chukwunyeluukgabrielokolo-cmyk | public/index.html, public/js/home.js; #3 | Load featured sessions from GET /api/slots with request(), card() and notice(). Ask Kirsten to review the working branch. |
| Janelle / M3 / janellereonal | Quote, transactional booking and receipt services/routes; #14–16, #20–21 | Quote #40 and booking/receipt #42 are reviewed and merged. Maintain shared pricing and private retry matching; help Kat and Kaitlyn with integration. Ask Fran to review follow-up API changes. |
| Kaitlyn / M4 / sonatiina | public/checkout.html, public/confirmation.html and their JS; #7–8 | Accept slotId/quantity, fetch the server quote, save with a stable retry key, fetch the receipt by returned ID. Ask Kat to review. |
| Kat (Kaithlyn) / M5 / kattgrass | public/detail.html, public/selection.html and their JS; #5–6; studio verification with Fran | Preserve slotId/quantity, handle unavailable sessions and stale/failed quotes, hand selection to Kaitlyn. Ask Kaitlyn to review. |
| Kirsten / M6 / 13kilograms | public/css/style.css, public/browse.html, public/js/browse.js; #10 and #4 | Share CSS classes first; connect validated filters to GET /api/slots. Ask Chonel to review. |

## Start and test

1. Pull the latest main and run npm ci. Create a branch named g1/m<number>-<feature>.
2. For a separate local demo database, run npm run demo. The session API is already on main. For PostgreSQL, follow README environment/setup instructions. Never reseed a populated shared or deployed database.
3. Frontend owners can build layouts while waiting for APIs. Use the agreed routes and the shared helpers rather than copying pricing logic. Shared helper, quote and booking/receipt APIs are merged. The refreshed #35/#41/#43 branches include them; pull your own branch before testing.
4. Use pageParameters() for booking-page URL fields; positive(value) validates a session ID, while positive(value, 100) validates party size. Cards show previews. Only the server chooses and stores the final pricing tier.
5. Test loading, empty, failure/retry, valid and invalid input, phone layout and the links to the next page. Report missing page/style/API dependencies rather than calling the entire flow complete.
6. Push and open a PR linked to the assigned issue. State what changed, what you actually tested and what remains unfinished. Keep the required assistance record in its existing Markdown table.
7. The assigned reviewer runs the branch and leaves specific results. Fran merges only after the required approval and passing checks. After a fix, the reviewer checks the new commit before approval.

## Work order and dates

Session/offer/helper/quote/Owner/discovery/booking/receipt APIs are merged through #27/#28/#36/#40/#29/#34/#42. The student-page branches include current main. No separate API test branch is needed for #43; pull g1/m4-checkout-confirmation and run npm ci, then npm run demo.

Assigned reviews: Kirsten reviews Home #35; Kaitlyn reviews Detail/Selection #41; Kat reviews Checkout/Confirmation #43. Authors still complete their own actual test notes and assistance-record link. No CSS/Browse PR is visible yet; Kirsten should publish it so Chonel can review and Fran can complete the Nov 4 deployment. The class list is reported at the bottom of her CSS.

Supporting #32/#39 and business #37 still need separate reviews. Do not treat the private reference as the official deployed group build.

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

GC2 requires no owner login. Main returns non-contact owner summaries and public booking receipts: no customer name/email or requestId. Janelle's #42 implements receipt readback by UUID and preserves private fields internally for retries. Use fictional customer details for tests. The 72-hour discovery rule lives in public/js/business-config.js; server/config/business.js re-exports it in the discovery upgrade. The browser preview cannot reserve seats or overrule server checks.

Current main uses the legacy fixture catalog. #39 proposes real business identities and published activity facts, with explicitly simulated session dates, seats, deadlines, offers, payments and bookings. Do not hardcode the proposed catalog into customer screens or describe it as already merged. Public research does not establish a studio partnership or actual reservation.
