# Released-seat booking direction

The main promise is: Book nearby activities happening in the next 72 hours, with released seats and upfront prices. It traces to GC1's empty-slot problem. Creative workshops and movement classes are the initial assortment, not separate required steps.

## Product flow

Home → Explore dated sessions → Detail → Selection → Checkout → saved Confirmation. The same booking appears on Owner. The supporting studio directory links to public research only; it must not replace this journey with outbound booking links.

Explore shows results immediately. When, Area and People are the primary controls. Activity shortcuts are optional; More filters holds search, broad category, approved attributes and price sort. Only show shortcuts supported by current inventory. Research has no verified Pilates seat allocation, so Pilates is a research type, not a simulated bookable shortcut in the current seed.

Keep one stored primary activity_type per service, but allow the same session to be found through technique, inclusions or literal search. Ceramic painting remains pottery and can match a search for painting. These are multiple routes to one slot ID and one seat counter, not duplicate inventory. Broad category is creative or active. Inclusions, technique and skill are distinct fields, even if the UI offers a compact Attribute filter. Visitors cannot create public tags.

## Before booking

Cards show studio, area/city, start, duration, seats left, exact deadline, selected-party total, per-person tier, regular-price comparison and supported inclusions. Buddy price applies only to 2+ people in the same transaction when the provider enabled it. Show the single-seat price when one person is selected. Price sort uses the tier for that selected party. Detail explains preparation/collection and the demo's cancellation limits.

## Code handoff

Fran: public/js/customer-common.js (shared request, money/date/availability/card helpers), db/schema.sql, db/seed.sql, db/migrations/001_activity_attributes.sql, server/repositories/migrations.js, server/repositories/slots.js, server/services/discovery.js and server/index.js.
Cholo: public/index.html and public/js/home.js, leading to Explore and featured bookable sessions.
Kirsten: public/browse.html, public/js/browse.js, public/css/style.css; coordinate the shared card renderer in public/js/customer-common.js.
Kat: public/js/detail.js for the added stored attributes, then Selection using Janelle's quote.
Kaitlyn: Checkout → saved Confirmation using the server quote/receipt; research IDs and prices never become booking fields.
Janelle: stored price selection, atomic availability and receipts; do not derive prices from tags.

The private reference has the complete UI and tests. The official group branch for this contract adds Fran's backend/schema work and documentation; it does not credit other members with the reference implementation or replace their own reviewed code PRs.

## Research and economics to validate

The provider must confirm which sessions will run, the released allocation, preparation lead time, rates/commission, cancellation terms and how direct-channel sales are reconciled. A public weekly timetable does not establish spare seats or willingness to discount. No supplier agreement or demand study is claimed. Record responses in provider-readiness.md.

Using the existing fictional seed: two standard seats at PHP1,600 generate PHP2,880 provider proceeds after the model 10% fee. Two buddy seats at PHP1,520 generate PHP2,736, a PHP144 reduction. If both guests would already have booked, the discount reduces proceeds. If it brings a second attendee who would otherwise not book, compare the additional proceeds with that attendee's variable costs. The UI and API cannot establish demand or profitability by themselves.

## Competitor references

ClassPass separates available classes from full studio schedules and offers independent activity/place/skill filters: https://help.classpass.com/hc/en-us/articles/204312229-How-do-I-search-for-classes
ClassBento offers activity categories and overlapping occasion collections: https://classbento.com.au/ . Its public-class flow requires a dated class and ticket quantity: https://classbento.zendesk.com/hc/en-us/articles/4946337442196-How-do-I-book-into-a-public-class
Classpop documents host group limits and minimum attendance: https://www.classpop.com/faq
Klook's Wabi Sabi listing separates package/date/quantity and explains inclusions: https://www.klook.com/en-US/activity/116888-pottery-workshop-wabi-sabi/

These inform design choices. No unique-market, partner or conversion claim is inferred from them.
