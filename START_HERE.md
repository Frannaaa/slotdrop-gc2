# Fran: finish October28 CP0

Group 1. Active PR: https://github.com/Frannaaa/slotdrop-gc2/pull/22
Branch: g1/m1-cp0-contract
This PR contains the author-side CP0 materials, not a complete booking app.

## 1. Review the agreed direction
Read docs/business.md: young professionals primary, students secondary; recurring leisure sessions with real spare seats; provider-set offer prices. Scope assumptions for review:72 hours window, draft 10% fee, multi-seat allocations and owner offer controls. No partner demand/availability is asserted.

## 2. Run and understand the starter

    git clone https://github.com/Frannaaa/slotdrop-gc2.git
    cd slotdrop-gc2
    git fetch origin
    git switch g1/m1-cp0-contract
    npm ci
    Copy-Item .env.example .env
    npm run check
    npm start

Open http://localhost:3000 and http://localhost:3000/api/health.
Expected JSON: {"status":"ok","app":"SlotDrop"}.
Stop Ctrl+C. No database URL needed yet.
If already cloned, fetch/switch in that existing folder after checking git status; do not overwrite local edits.

## 3. Close external handoffs
All five teammates and knee-rel were invited. They must accept the new repo invitation; old-repo access does not carry over. Finish actual Issue sidebar assignments to the intended owners after acceptance. Ask Janelle through the agreed group coordination channel to accept and review; no message was sent by this package.

The two revenue features now use the brief’s listed availability and tiered-pricing categories. Review docs/revenue-features.md; the earlier custom manual-offer clearance question has been replaced.

## 4. Human review and merge
Janelle follows docs/human-review.md: inspect, run, leave a substantive comment, approve after resolution. Fran must understand every line and supply the team's own business reasoning. After required approval, Fran resolves comments and merges PR22 without bypassing protections.

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
- [ ] Share repo via the announced checkpoint channel; no separate CP0 upload destination was specified in the brief.

No finished booking API, deployed site, final PDF or recordings are required for October28.

## Next phase
Oct 30 shared visual reference; Nov 1 first working code PR each; Nov 4 deployed database-backed Browse; Nov 7 integrated flow; Nov 9 final. Three substantive merged code PRs, two genuine reviews and code merged across two grading windows per person.
