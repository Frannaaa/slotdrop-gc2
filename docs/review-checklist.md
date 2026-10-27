# Janelle: CP0 review checklist

Accept the repository invitation as janellereonal, then open PR22 on g1/m1-cp0-contract.

1. Read the business proposal: recurring leisure sessions, provider-set offers and allocated seats. Demo providers and sessions are fictional.
2. Check the four entities and API contracts. Review capacity locking, retry keys and saved receipt prices.
3. Check the buddy example: two seats cost PHP 3,040, with a PHP 304 fee and PHP 2,736 provider proceeds at the model 10% commission. One seat costs PHP 1,600. A changed total must be confirmed before saving.
4. Run npm ci, npm run check and npm start. Open Home and /api/health. See preparation-checks.md for the temporary PostgreSQL checks. Hosted connectivity and business APIs are still pending.
5. Check .gitignore, the empty environment example, task ownership and Issue assignments.
6. Review the business assumptions and the two revenue features: availability and bring-a-friend tiered pricing. Paid add-ons are deferred.
7. Leave a specific review comment, request fixes where needed and approve after the concerns are resolved. Fran then merges.

Include the checks you ran in your review. Each member should also plan three substantive feature code PRs across Oct 29-Nov 4 and Nov 5-Nov 9; documentation-only PRs do not count toward that requirement.


Run npm test and npm run check:sql. Check structured error responses, activity defaults and session overrides, price bounds and fee rounding. Verify the demo inventory has not expired.
