# Who owns what and how to hand it over

Updated 30 October 2026. This is the shared group repository. The private reference is a guide; it does not replace anyone's implementation, testing or review.

| Member | Code and issues | Handoff |
|---|---|---|
| Fran / M1 / Frannaaa | Database, session/offer APIs, shared customer helpers, owner dashboard and metrics, integration/deployment; #11–13, #17–18, #23–26, #31, #33 | Merge approved work, provide API setup and field names, check the connected flow and deployment. |
| Chonel (Cholo) / M2 / chukwunyeluukgabrielokolo-cmyk | public/index.html, public/js/home.js; #3 | Load featured sessions from GET /api/slots with request(), card() and notice(). Ask Kirsten to review the working branch. |
| Janelle / M3 / janellereonal | Quote, transactional booking and receipt services/routes; #14–16, #20–21 | Quote first, then save and readback. Share response fields with Kat and Kaitlyn. Ask Fran to review. |
| Kaitlyn / M4 / sonatiina | public/checkout.html, public/confirmation.html and their JS; #7–8 | Accept slotId/quantity, fetch the server quote, save with a stable retry key, fetch the receipt by returned ID. Ask Kat to review. |
| Kat (Kaithlyn) / M5 / kattgrass | public/detail.html, public/selection.html and their JS; #5–6; studio verification with Fran | Preserve slotId/quantity, handle unavailable sessions and stale/failed quotes, hand selection to Kaitlyn. Ask Kaitlyn to review. |
| Kirsten / M6 / 13kilograms | public/css/style.css, public/browse.html, public/js/browse.js; #10 and #4 | Share CSS classes first; connect validated filters to GET /api/slots. Ask Chonel to review. |

## Start and test

1. Pull the latest main and run npm ci. Create a branch named g1/m<number>-<feature>.
2. For an isolated fictional local database, run npm run demo once the session API is merged. For PostgreSQL, follow README environment/setup instructions. Never reseed a populated shared or deployed database.
3. Frontend owners can build layouts while waiting for APIs. Use the agreed routes and the shared helpers rather than copying pricing logic. Helpers must be merged before dependent browser imports work.
4. Use pageParameters() for booking-page URL fields; positive(value) validates a session ID, while positive(value, 100) validates party size. Cards show previews. Only the server chooses and stores the final pricing tier.
5. Test loading, empty, failure/retry, valid and invalid input, phone layout and the links to the next page. Report missing page/style/API dependencies rather than calling the entire flow complete.
6. Push and open a PR linked to the assigned issue. State what changed, what you actually tested and what remains unfinished. Keep the required assistance record in its existing Markdown table.
7. The assigned reviewer runs the branch and leaves specific results. Fran merges only after the required approval and passing checks. After a fix, the reviewer checks the new commit before approval.

## Work order and dates

Session API #27 is available on main. Shared helper #36 needs Janelle's approval after fixes; Home #35 then needs an updated branch and Kirsten's review. Offer controls #28 are merged. Owner #29 has a privacy fix to recheck; #34 adds discovery metadata/filters. Supporting research #32 and business draft #37 have separate reviews.

| Date | Deliverable |
|---|---|
| Oct 30, internal target | Shared CSS/classes and initial page layouts; Fran and Kat review the business draft. |
| Nov 1, internal target | Everyone has a first working code PR submitted. |
| Nov 4, course checkpoint | Deployed Browse loads database sessions through the group's own API. |
| Nov 7, internal target | Connected Home → Browse → Detail → Selection → Checkout → Confirmation, with the saved booking visible in Owner. |
| Nov 9, 11:59 PM Philippine time | Final submission, reviewed main tag, two-page business PDF, diagrams/routes/schema, Postman, challenges/baseline and individual recordings. |

The three-PR/two-review individual gate and grading windows still apply. Do not count this reference or another member's code as your contribution.

## Public demo data

GC2 requires no owner login. GET /api/bookings is a non-contact owner summary: no customer name/email or requestId. The receipt readback contract is separate and owned by Janelle. Use fictional customer details for tests. The 72-hour discovery rule lives in public/js/business-config.js; server/config/business.js re-exports it in the discovery upgrade. The browser preview cannot reserve seats or overrule server checks.

## Studio application extension (Fran)

Fran owns reference-catalog.js, providers.js, migrations 002–003, real-studio-demo.json and the studio/application/status pages and matching JS/CSS. They add a pending demo application without publishing, verifying representation or changing a provider. Real business facts are sourced; dates, seats, cutoffs, discounts, payments and bookings are simulated. Cholo still owns Home, Kirsten shared CSS/Browse, Kat Detail/Selection, Janelle quote/save/receipt, Kaitlyn Checkout/Confirmation. This extension follows #32 and does not block core helper/pricing work. See provider-onboarding.md.

## October 30: real-studio reference integration handoff

This is a **catalog change, not a claim of new partners**. The existing fictional test-fixture records and any saved receipts remain unchanged. The new sample discovery inventory references real researched businesses and published workshop information, but SlotDrop dates, seat counts, cutoffs, discounts, payments and bookings are simulated. No studio has granted inventory, approved a discount or verified representation. Never say a simulated receipt reserves a real studio seat.

- **Chonel — Home (#35):** replace the old "all providers fictional" copy after the catalog PR is integrated. Use GET /api/slots and the shared card helper to show the real referenced studio names and sample-session warning; do not hardcode names or clone the research JSON. Keep customer links carrying the existing slotId, and confirm styling after Kirsten's CSS arrives. Preserve his own PR and review.
- **Kirsten — CSS/Browse (#10/#4):** share the already-finished CSS PR and class names, then verify Home/Browse consistency. Browse continues to query /api/slots for live *demo database* seats and prices; /api/activities is only supporting published-facts research. Preserve filtering, empty/error/retry states and narrow-width layouts. A studio research page is not a substitute for the transactional Browse screen.
- **Kat — Detail/Selection (#5/#6):** source the booking slot and quantity from the server and validated URL, display a clear "real business reference / simulated availability" distinction, and use server quotes for confirmed prices. Do not interpret published reference prices as approved SlotDrop offers.
- **Kaitlyn — Checkout/Confirmation (#7/#8):** label booking and payment as course simulations. A confirmation proves a saved demo receipt, not a real studio reservation. Preserve requestId across uncertain retry and show immutable server receipt amounts.
- **Janelle — quote/booking/receipt (#14–16/#20–21):** the quote and booked seats come from the same slot record under lock, not from /api/activities or published website prices. Return consistent expected-total conflicts and stable-key retries. Public Owner booking lists must omit customer contact data.
- **Fran — integration (#29/#34/#32/#39):** own reference data, provider-application safety, migrations, integration checks and deployment. The studio application remains pending; its authorization checkbox is not proof of ownership and it never publishes a business page. Review approvals and the latest CI before merging dependent PRs.

Dependency order: #36 shared helper → Chonel rebases #35 and Kirsten reviews; #29 Owner review/merge → #34 discovery → #32 research → #39 reference catalog/applications. Business #37 can be reviewed separately. These are integration dependencies, not a request for teammates to redo completed work. Internal targets: October 30 styling/layouts; November 1 first code PRs; November 4 deployed API-backed Browse; November 7 complete connected flow; November 9, 11:59 PM PHT final submission.
