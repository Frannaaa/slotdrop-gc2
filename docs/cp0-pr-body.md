Prepares Group 1 SlotDrop CP0 with a four-entity session/booking contract, fictional seed inventory, assigned task specifications and a modular Express starter.

Business direction: near-term local creative activities, provider-set offers, optional 2+ seat buddy pricing, a selected 10% model fee and a 72-hour discovery window. Each session has an independent provider-set booking cutoff initialized from an activity default. Published local-studio and competitor evidence, rationale and unresolved research limits are in docs/research.md and docs/business.md.

Fixes the starter's HTML/stack-trace error responses by returning structured JSON for invalid JSON, oversized requests, unimplemented APIs and unexpected failures. Adds repeatable HTTP and disposable PostgreSQL contract checks, price bounds and fee arithmetic constraints. Business APIs, hosted connectivity and deployment remain next-phase work.

Validation: npm ci; npm run check; npm test (3 passing); npm run check:sql (8 scenario groups passing). See docs/preparation-checks.md for environment and limits.

Janelle reviews; Fran resolves feedback and merges after approval. Invitation acceptance and remaining Issue assignments are tracked in #1.

Closes #1. Also closes #19 after approval/merge. References #25. Provider API implementation remains tracked in #23 and #24.
