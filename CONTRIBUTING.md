# Workflow

Issue -> branch -> meaningful commits -> PR -> human comment and approval -> Fran merges.

GC2 is Group 1, confirmed by Fran. Preserve member numbers from README. Fran uses g1/m1-cp0-contract and title [G1-M1] Add CP0 contracts and modular starter.

Start from current main: git switch main, git pull, then feature branch. Before review: git pull --no-edit origin main. No direct main pushes after initial skeleton, no force pushes to main.

Reviewer checks changed files, runs relevant behavior, leaves a specific actual finding/comment, then approves after concerns are resolved. Janelle (janellereonal) reviews Fran's CP0. Fran cannot approve her own PR.

Every member needs 3 merged substantive code PRs, 2 reviews each with a real comment, and work merged in 2 of the windows Oct14-28, Oct29-Nov4, Nov5-9. Documentation-only PRs do not count toward three code PRs. No one authors another member's work.

Contract edits need a Contract change: Issue. Separate UI/routes/services/repositories. Calculate money once on the server. Never commit secrets or node_modules. Understand all merged lines.
