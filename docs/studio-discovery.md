# Real studios and activity discovery

Checked 30 October 2026. Studio names, advertised activity facts and source prices are public research, not negotiated SlotDrop rates. The private build now uses eight of these real activity references for explicitly simulated sessions. No listed business has confirmed a partnership, seat allocation, discount or SlotDrop deadline. Historical synthetic provider records and their receipts are preserved unchanged; they are retired from new customer discovery.

## Navigation and classification

For stored reference classification, use one primary activity type per offering: **Pottery, Painting or Pilates** for the current researched assortment. “All activities” removes the type filter. These stored types cover this researched assortment, not every future leisure activity. They do not require mutually exclusive search results or a mandatory top-level tab bar. Search can find secondary techniques and inclusions while preserving one offering ID. A class that makes and paints a ceramic mug stays Pottery, with Painting included as a tag. Ceramic painting is Pottery; canvas painting is Painting. Expand the controlled type list when a distinct activity is actually added.

Broad domains remain Creative and Movement (`creative` / `active` in the booking API). Do not make Workshop, Beginner, Date night or Weekend sibling activity types. Workshop is a format; beginner is a skill attribute; date night is an editorial use case; weekend is a date filter.

Tags may overlap. For GC2 the catalog editor maintains a small vocabulary (handbuilding, wheel-throwing, painting-included, group-class, beginner, painting); visitors filter existing tags, not create public tags. A later provider form can offer approved checkboxes after the source is checked. User reviews and user-created tags need identity, moderation and abuse controls and are outside this pass. Buddy price and remaining seats come from transaction data, never tags.

ClassPass separates business categories, activity/studio search and filters such as location, skill and amenities. It also distinguishes available class results from the studio’s schedule. SlotDrop uses that distinction with direct PHP prices rather than credits: **Real studios** for research with official-site links; **Demo activities** for the course’s own working booking flow. Source: https://help.classpass.com/hc/en-us/articles/204312229-How-do-I-search-for-classes

## Where it lives

- `public/data/studio-research.json`: eight sourced offerings from five real businesses; prices, schedule notes, primary type, controlled tags, checked date and official URLs.
- `server/routes/activities.js`: read-only `GET /api/activities`; validated q, type, area and tag filters; does not need or mutate the booking database.
- `public/studios.html`, `public/js/studios.js`, `public/css/studios.css`: responsive directory, accessible filter buttons, search, source details, loading/empty/error/retry states and URL restoration.
- `GET /api/slots`: existing bookable demo sessions with live database availability; its independent category, when, area and people filters are unchanged.

## Real business research

| Studio and branch | Offering | Published PHP/person | Published schedule evidence |
|---|---|---:|---|
| Laro Ceramics, Katipunan QC | Mug-making + painting | 3,000 | 3 hours; date/time selector, no fixed weekly schedule verified |
| Laro Ceramics, Katipunan QC | Beginner wheel-throwing | 3,200 | 3 hours; date/time selector, no fixed weekly schedule verified |
| Bumi & Ashe, Cubao Expo QC | Mug-making | 2,650 | 2 hours; FAQ says weekly slot releases, exact class times unverified; published sale price |
| Bumi & Ashe, Cubao Expo QC | Free Form Pottery + Paint | 3,200 | 3 hours; choose date or request one; no fixed timetable verified |
| AMT Ceramics, Tandang Sora QC | Hand-Building single session | 2,900 | 3 hours; FAQ lists Fri/Sat/Sun 10 AM–1 PM; reconfirm chosen date |
| AMT Ceramics, Tandang Sora QC | Wheel-Throwing Exploratory single session | 2,900 | Same FAQ timetable; reconfirm availability |
| Sip & Gogh, Century Mall Makati | Open Session painting | 1,400 | Published example: 6 November 2026, 6–9 PM; outside the current 72-hour booking window |
| Tahanan Pottery, Scout Tobias QC | Exploratory wheel | 2,500 | 3 hours; published Saturdays 2–5 PM; no dated allocation verified |
| Core Pilates Studio, South Triangle QC | Group Class single-session credit | 1,150 | Credit valid 60 days; exact class time and duration unverified |

Official price and schedule URLs are stored per offering in the JSON and shown on every card. Unknown schedule values stay unknown. Opening hours are not class times. A studio’s own sale price is not a SlotDrop discount. A single-session credit is not a reserved session.

## Commercial recommendation to validate

Start provider outreach with recurring pottery calendars (AMT’s published weekly pattern and Bumi’s weekly releases), plus repeatable movement sessions if timetable, provider allocation and cutoffs are confirmed. Painting adds a lower published price point, but one dated session is not evidence of weekly supply. Workshops may be occasional purchases; measure repeat booking across different activities rather than assuming the same customer buys pottery every week. These are planning recommendations, not validated demand or partner commitments.

Before a real offering can accept an actual reservation, confirm the branch, dated start/end, released seats, final per-person price, cutoff, cancellation terms and settlement arrangement with that provider. Store the source and approval date. Until then, official-site links are the route for actual studio dates. The separate course booking flow is labelled as a simulation; its saved record does not reserve a studio place.

## Verification for this pass

Private build: 33 API/unit tests passed locally, with one PostgreSQL-only lock test reserved for CI; eight SQL scenario groups passed. The complete customer booking/receipt/owner flow passed with no page or console errors, plus 18 customer recovery/state scenarios. Four discovery/reset browser scenarios passed, including empty/error/retry, shared URLs, browser Back, disjoint primary types, official source links and layouts at 320, 390, 768 and 1280px. Fixed the stale reset request in Browse and the researched directory. Prototype classification also no longer includes ceramic painting under Painting. Local automated evidence uses disposable data and is not proof of a production transaction or real studio allocation.

## Current priority

Home and the main navigation lead to bookable released sessions in /browse.html. This directory supports the concept and is linked in the footer. Its official-site links are not the graded transaction funnel. See released-seat-discovery.md for the current product and UI contract.

## Studio pages and applications

Real reference profiles link from session cards. They are marked independent and unclaimed. `/provider-apply.html` collects a sample application with controlled activity choices, authorization attestation and a course notice. The API saves it pending and returns a status link; it does not verify the applicant or publish a page. See `provider-onboarding.md` for states, sources and tests.
