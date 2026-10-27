# Fran GC2 technical verification

## PostgreSQL CI

[Verified GitHub Actions run](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/40525224871) for commit 2702750b146ed4e03e443bc9effb93afd325e71c passed on Node 22 with a PostgreSQL 16 service container:

- Syntax check passed.
- Eight disposable SQL scenario groups passed.
- All 11 HTTP, policy and PostgreSQL tests passed; zero failed or skipped.
- The competing-connection test held a session row lock during a booking insert. A capacity edit waited, then returned 409 after seeing the committed seats.

The test creates isolated schemas and removes only its generated schemas afterward. It does not access a hosted production database or prove the team's customer booking handler is complete.

## Postman-compatible collection

Newman 6.2.1 executed docs/SlotDrop-Fran.postman_collection.json on a fresh local fictional database: 21 requests, 26 assertions, zero request or assertion failures. Saved receipt data was inserted by the fixture to check owner metrics; it was not created through a customer booking page.

The compact actual run record is docs/evidence/fran-api-local.json. Set baseUrl to the public origin and rerun after deployment; this local record is not the required deployed challenge evidence.

## Owner UI

Desktop and phone checks covered form creation, edit mode, pause, loading/empty/error handling and horizontal page overflow. Regression checks cover a manual cutoff followed by an activity change, and paused sessions whose deadlines or capacity prevent resumption.

## Release limits

Hosted deployment, the integrated six-screen customer flow, deployed challenge screenshots, the List baseline, genuine teammate reviews, merged contributions across grading windows and Fran's own recording remain separate release requirements. No results are invented for them.
