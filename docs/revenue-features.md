# GC2 revenue-feature mapping

| Feature | Brief category | Server enforcement | Persistence |
|---|---|---|---|
| Allocated-seat availability | Inventory counter / availability filtering | Lock session, validate requested quantity against confirmed seat total, refuse oversell | Slot allocation and confirmed booking quantities |
| Bring-a-friend pricing | Tiered pricing | Select stored provider-approved per-person rate for quantity>=2, calculate totals/fee on server, reject altered browser price | Session buddy rate and booking standard/buddy price snapshots |

The group rate is optional per session. Same session, single transaction, at least 2 seats. Normal rate for one seat or an opted-out session. A customer cannot combine separate bookings to retroactively earn it. No automatic time-based rate reduction or stacking is included.

Provider approval occurs when entering/editing the offer and buddy rate; the net payout is shown before saving. Existing receipts never change. Quantity affects pricing and capacity independently: a valid group rate does not permit more seats than remain.

Example, fictional session1:
- One seat: PHP 1,600; fee PHP 160; provider PHP 1,440.
- Two seats at buddyPHP 1,520: total PHP 3,040; fee PHP 304; provider PHP 2,736.
- Without the group rate, two offer-price seats would total PHP 3,200.
- Additional discountPHP 160 = PHP 16 commission reduction + PHP 144 provider-proceeds reduction.

This is the listed tiered-pricing option, replacing the earlier proposed custom manual-offer feature. It does not represent instructor approval or a guarantee of marks. Paid activity add-ons are deferred to the Final Project. No custom-feature clearance question remains for manual price entry as feature2.

Working MVP policies: model commission 10%; discovery strictly less than 72 hours away; provider-set cutoff per session, with an activity default and no universal minimum lead time. Full rationale and unvalidated assumptions are in docs/business.md. Rates are model amounts, not actual collected cash.
