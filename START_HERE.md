# Fran: finish October28 CP0

Group 1. Active PR: https://github.com/Frannaaa/slotdrop-gc2/pull/22
Branch: g1/m1-cp0-contract
This PR contains the CP0 contracts, business draft and starter app. Booking APIs are scheduled for the next phase.

## 1. Review the agreed direction
Start with docs/research.md for current public-source evidence and its limits.
Read docs/business.md: young professionals primary, students secondary; recurring leisure sessions with real spare seats; provider-set offer prices. Scope assumptions for review:72 hours window, model 10% fee, multi-seat allocations and owner offer controls. Provider availability and customer demand still need research.

## 2. Run and understand the starter

    git clone https://github.com/Frannaaa/slotdrop-gc2.git
    cd slotdrop-gc2
    git fetch origin
    git switch g1/m1-cp0-contract
    npm ci
    Copy-Item .env.example .env
    npm run check
    npm test
    npm run check:sql
    npm start

Open http://localhost:3000 and http://localhost:3000/api/health.
Expected JSON: {"status":"ok","app":"SlotDrop"}.
Stop Ctrl+C. No database URL needed yet.
If already cloned, fetch/switch in that existing folder after checking git status; do not overwrite local edits.

## 3. Close external handoffs
All five teammates and knee-rel were invited. They must accept the new repo invitation; old-repo access does not carry over. Finish actual Issue sidebar assignments to the intended owners after acceptance. Ask Janelle through the agreed group coordination channel to accept and review.

The two revenue features now use the brief’s listed availability and tiered-pricing categories. Review docs/revenue-features.md; the earlier custom manual-offer clearance question has been replaced.

## 4. Review and merge
Janelle follows docs/review-checklist.md: inspect, run, leave a substantive comment, approve after resolution. Fran reviews the business assumptions with the team and resolves feedback. After required approval, Fran resolves comments and merges PR22 without bypassing protections.

    git switch main
    git pull origin main

Verify docs/routes.md, docs/schema.md, docs/business.md and root workflow files appear on main. Until then the contract is not merged.

## 5. CP0 checklist
- [ ] All members plus knee-rel have access; invitations accepted as needed.
- [ ] main protected: PR, one approval, force pushes blocked.
- [ ] CONTRIBUTING.md and .github/pull_request_template.md visible.
- [ ] .gitignore excludes .env/node_modules; env example contains names only.
- [ ] README declares app, roster, ownership and stack.
- [ ] Routes and schema merged.
- [ ] One assigned Issue per screen, route and revenue feature.
- [ ] First business traceability/rules draft merged.
- [ ] Confirm feature mapping in docs/revenue-features.md: availability plus bring-a-friend tiered pricing.
- [ ] Complete AI-USAGE.md with Fran's actual verification and independently reviewed business reasoning; disclose assistance in PR22.
- [ ] Share repo via the announced checkpoint channel; no separate CP0 upload destination was specified in the brief.

No finished booking API, deployed site, final PDF or recordings are required for October28.

## Next phase
Oct 30 shared visual reference; Nov 1 first working code PR each; Nov 4 deployed database-backed Browse; Nov 7 integrated flow; Nov 9 final. Three substantive merged code PRs, two genuine reviews and code merged across two grading windows per person.

## Keeping the demo usable later
Seed data expires: the earliest booking cutoff is two hours after seeding, and the last is 69.5 hours after seeding. Use a fresh disposable database for each fresh-seed demonstration. Existing-data seed refusal protects saved bookings; do not delete or reset a shared database. Later offer-management routes can add future dated sessions. See docs/database-checks.md.
