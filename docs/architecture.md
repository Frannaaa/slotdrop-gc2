# Modular architecture and planned data flow

Browser HTML/CSS/page JavaScript calls Express HTTP routes. Routes validate requests and call services. Services own pricing and booking rules; repositories own parameterized SQL. PostgreSQL stores entities and constraints. The browser never queries PostgreSQL directly.

CP0 implements only the static page and health route. The service/repository directories explain ownership for later PRs.

## Planned booking transaction

Checkout handler -> POST /api/bookings -> field validation -> booking service -> one checked-out database client -> BEGIN -> lock slot -> check time/status/confirmed booking -> shared price calculation -> insert booking snapshot -> mark slot booked -> COMMIT -> 201 with booking id -> confirmation fetch by id -> render database record.

On failure: ROLLBACK and release the client. A conflicting booking returns 409. A partial unique index also prevents two confirmed bookings for one slot.

No five-minute hold is implemented or promised. Provider cancellation/reopening is deferred; adding it needs a contract change and coherent booking history. Owner data is demo-only because login is outside this phase.
