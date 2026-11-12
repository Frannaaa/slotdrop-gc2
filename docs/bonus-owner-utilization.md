# Optional bonus: Join and compute (+1) — Owner released-seat utilization

**Status:** implementation candidate on Fran-owned Owner branch; public evidence and peer approval **pending**.

## The two real JSON routes

1. `GET /api/owner/catalog` returns active services, released session capacity, booking cutoffs, start times, and status.
2. `GET /api/bookings` returns saved booking summaries with `slotId`, `quantity`, and `status`, omitting private customer contact fields.

`public/js/owner.js` already loads these independent routes (and `GET /api/metrics`) with `Promise.all`. The pure `openReleaseUtilization()` function in `public/js/owner-insights.js` joins confirmed booking summaries with eligible open-session IDs, sums booked quantities and released capacity, and computes:

```text
percent = round(100 * confirmedSeatsOnEligibleSlots / capacityOfEligibleSlots)
```

Eligibility checks active service, open/runs-as-scheduled session, future cutoff and start, and the server-provided discovery-hours window. Empty eligible inventory explicitly shows 'No eligible, open demo sessions' instead of a misleading 0% usage rate. Cancelled bookings, paused/inactive/expired and future-outside-window slots do not count.

This is the **course-demo released allocation** only, **not** total studio occupancy or validated demand. The five required server-provided Owner KPI cards are unchanged.

## Automated checks

`tests/owner-insights.test.js` exercises a 3/10-seat example, cancellation and exclusion rules, empty inventory, and bad booking quantities. Do **not** describe these synthetic unit-test values as a real deployed booking.

## Public evidence to collect (required to claim bonus)

- [ ] PR merged after real teammate review and checks.
- [ ] Record the actual deployed URL, commit and test time.
- [ ] Capture Owner Network entries for **both** `GET /api/owner/catalog` and `GET /api/bookings`; show the relevant input rows and visible computed utilization.
- [ ] Verify a freshly saved fictional booking changes the visible percentage after Refresh, and note actual before/after quantities. Do not fabricate measurements.
- [ ] Copy actual outcome and screenshot/evidence link into `docs/challenges.md` with group review before final tag.
