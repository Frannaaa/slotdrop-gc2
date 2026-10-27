# October 28 CP0: exact remaining steps for Fran

Repository: https://github.com/Frannaaa/slotdrop-gc2

The CP0 package contains the route table, five-entity schema, first-draft business tables, modular runnable starter, environment example, contribution rules, PR template and task inventory. The server only implements health and static files. Feature code comes later.

## 1. Use Group 1
Fran confirmed Group 1 on October 27, 2026. Use g1 branch prefixes and G1 PR titles. Member numbers: Fran 1, Cholo 2, Janelle 3, Kaitlyn 4, Kaithlyn 5, Kirsten 6.

## 2. Review the PR yourself before Janelle approves
Open README.md, docs/architecture.md, docs/routes.md, docs/schema.md and db/schema.sql. Be able to explain: the browser calls your API; the API calls shared business functions; repositories query PostgreSQL; booking and availability update atomically. The database has not been deployed at CP0.

## 3. Decide the business proposals with Janelle
Open docs/business.md. Discuss the 12% provider-paid commission, proposed 48-hour window, 30/20/10% tiers and QC/Katipunan segment. These were not fixed by GC1. Record actual decisions and your own reasons in the human decision section before approval.

The minimum-price field currently means minimum CUSTOMER price. At PHP750 and 12% commission, the provider receives PHP660 before costs. If the intended minimum is provider NET proceeds, revise the contract first.

## 4. Run the PR branch on your PC
Install Git and Node.js 22+ if needed. In VS Code Terminal (PowerShell), use:

    git clone https://github.com/Frannaaa/slotdrop-gc2.git
    cd slotdrop-gc2
    git fetch origin
    git switch g1/m1-cp0-contract
    npm ci
    Copy-Item .env.example .env
    npm run check
    npm start

Open http://localhost:3000 and http://localhost:3000/api/health.
Expected health JSON: {"status":"ok","app":"SlotDrop"}.
Stop with Ctrl+C. Empty PORT uses 3000. No database URL is needed for CP0.

If you already cloned, do not clone into it again. Open the existing folder, run git status, then git fetch origin and switch to the PR branch. Preserve any local changes.

## 5. Accept invites and finish task assignments
All five teammates need to accept the invitation to THIS new repo; old-repo access does not carry over. The owner names in Issues describe who should do the work. GitHub assignees may remain pending until each person accepts; verify the sidebar rather than assuming a name in the text is an assignment.

Instructor knee-rel was invited on October 27, 2026 after Fran authorized it. All six invitations were pending acceptance when checked.

## 6. Janelle reviews
Janelle uses janellereonal, accepts the invite, opens the CP0 PR and follows docs/human-review.md. She checks changed files, runs the branch, leaves an actual specific comment, and uses Review changes > Approve after any fixes. Do not copy a prewritten review.

## 7. Fran merges
Once the required human approval is present, resolve all comments, then Merge pull request > Confirm merge. Do not bypass the protection or approve your own PR. Verify docs/routes.md, docs/schema.md and docs/business.md are on main.

On your PC:
    git switch main
    git pull origin main

## 8. CP0 completion checklist
- [ ] Repo exists and all five teammates plus knee-rel are collaborators/invited as required; teammates can clone.
- [ ] main requires a PR and one approval, including admins; force pushes blocked.
- [ ] CONTRIBUTING.md and .github/pull_request_template.md present.
- [ ] .gitignore excludes .env/node_modules; .env.example has names only.
- [ ] README declares app, roster, ownership and stack reasons.
- [ ] Route table and schema MERGED to main.
- [ ] One Issue per screen, route and revenue feature, each actually assigned.
- [ ] docs/business.md traceability and rules MERGED.
- [ ] Share repo link through the instructor's announced checkpoint channel. Brief does not identify a separate CP0 upload destination; do not assume a final-submission upload is needed now.

No finished booking backend, deployed app or final PDF is required for October 28.

## Next phase
Oct30 shared UI reference; Nov1 first code PR each; Nov4 deployed database-backed Browse; Nov7 integrated booking flow; Nov9 final. Each person needs 3 genuine merged code PRs, 2 substantive reviews, work merged across 2 grading windows. Plan work in Oct29-Nov4 and Nov5-Nov9 even if CP0 gets reviewed now.
