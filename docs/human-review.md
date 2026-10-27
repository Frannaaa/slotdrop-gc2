# Janelle: independent CP0 review

Use janellereonal, accept invitation, open PR22. Review the latest Group 1 g1/m1-cp0-contract branch, not closed PR2.

1. Read the business update: recurring leisure, manual offers, multi-seat allocation; fictional supply only.
2. Check four entities and routes. Explain why one booking per slot is now wrong, how transaction locking protects capacity, how retry keys differ from capacity checks and how receipt snapshots remain stable.
3. Check the two-seat buddy example: PHP 3,040 total, PHP 304 fee, PHP 2,736 provider proceeds at draft 10%, versus one seat at PHP 1,600. Check reconfirmation before writing a changed-price booking.
4. Run npm ci, npm run check and npm start. Open Home and /api/health. Temporary PostgreSQL schema/seed checks are recorded in preparation-checks.md; hosted connectivity and business API execution are not claimed.
5. Check secrets ignore rules, empty env example, no node_modules, ownership and actual task sidebar assignments.
6. Fran/team supply their own business rationale. Check availability and bring-a-friend tiered pricing are distinct, enforced and saved; paid add-ons are deferred.
7. Leave at least one specific finding based on your actual review. Request changes where needed. Approve only after concerns are resolved. Fran then merges.

Base your review comment on checks you actually performed. Plan three genuine feature code PRs each across Oct 29-Nov 4 and Nov 5-Nov 9 regardless of whether this scaffold counts.
