# GC1 feedback response in the CP0 draft

The uploaded proposal/feedback retain their original Group3 filenames. Current GC2 team is Group 1 as Fran confirmed.

| Feedback | Current CP0 response | Status/limit |
|---|---|---|
| Target too broad | Young professionals primary,students secondary; initial nearby recurring leisure;22-35 planning age hypothesis | Income and demand still need validation |
| Missing monetization/features/stack | Model 10% commission; availability plus provider-approved buddy tier; declared Node/Express/PostgreSQL/plain JS | 10% is the selected model rate with reasons in business.md; seed prices and provider economics remain unvalidated; implementation later |
| No competitors/differentiation | FunNow,ClassPass,Eatigo,Bookme references and provisional positioning | Differentiation still needs validation |
| Role-duplicated stores | Four entities:providers,services,sessions,bookings | SQL executed in temporary PostgreSQL,hosted connection later |
| Missing end-to-end flow | docs/architecture.md describes UI->API->services->SQL->receipt | Production API flow not yet implemented |
| Popular-provider contradiction | Promise usable near-term released seats,not access to sold-out providers | Actual spare inventory must be established |
| Ghost slots | Explicit allocated seats,cutoffs,pause,transaction locks and retry keys | Internal integrity does not verify external calendars |
| Provider price resistance | Provider-set standard and optional buddy prices,net preview | Actual partner willingness/costs unvalidated |
| Missing detail/admin views | Six customer screens including Detail;owner dashboard/manager seventh screen | Wireframes/real UI owned by next-phase frontend members |
| Reopen cancellations | Provider-owned release/offer controls retained;customer refund workflow deferred | Do not reopen a prepaid booking automatically or infer resale rights |
| Phone/deployment | Acceptance criteria per owner;CP1 deployed database-backed Browse | Not a CP0 implementation requirement |

Business APIs are planned for the next phase. Provider interviews and Janelle's review are still pending. Paid activity add-ons are reserved for the Final Project.
