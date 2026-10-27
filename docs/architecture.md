# Group 1 modular architecture

Browser page JavaScript fetches JSON from Express routes. Routes validate HTTP inputs and call services. Services own booking, offer and money rules. Repositories own parameterized SQL and PostgreSQL transactions. Each module has one responsibility.

CP0 implemented modules: server/index.js entrypoint, server/app.js app wiring and server/routes/health.js. Business service/repository modules remain assigned feature work; directory README files describe their ownership.

## Planned booking flow

Select session and seat quantity -> fetch quote -> explicitly confirm amount -> POST booking with stable retry key -> validate -> acquire one SQL client -> BEGIN -> lock session -> check current allocation minus confirmed seat quantities -> select the stored standard/buddy quantity tier -> calculate server total -> check customer acknowledgement -> insert price/time snapshot -> COMMIT -> return booking ID -> fetch confirmation from database -> render saved receipt.

Capacity safety comes from serializing booking/edit operations on the same slot row and checking booked quantities under that lock. Multiple customers can book the same session. request_id uniqueness handles repeated submissions, not overall capacity. Rollback/release on errors. A changed amount returns 409 and requires reconfirmation before writes.

## Provider flow

Demo owner selects seeded activity -> enters dated session, original price, offer price, released seat quantity and cutoff -> server validates and saves -> Browse shows it only within 72 hours and before cutoff -> booking consumes allocated seats -> owner sees updated receipts and metrics. Pause blocks new bookings while preserving receipts.

Provider-set normal offers and optional bring-a-friend rates replace automatic time-based discount tiers. Recurrence notes explain the type of activity; every dated session is a separate inventory record. No recurring-calendar engine is needed for GC2. Provider offer controls share the seventh owner screen rather than adding another page.

## Honest scope

All data is fictional. No real inventory/calendar synchronization, authenticated provider roles, real payment, customer refund workflow or five-minute hold is claimed. Existing regular-price sales are not assumed to be incremental. Real supply cadence and demand still require interviews.

Group quantity affects both inventory and pricing: quantity 1 uses the normal offer; quantity>=2 uses the opted-in stored buddy rate. Pricing lives in one future shared service owned by Janelle; CP0 does not pre-author her feature implementation. Paid activity add-ons are deferred to the Final Project.
