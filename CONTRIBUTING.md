# Contributing

Use this workflow: Issue → branch → commits → PR → teammate review → captain merges.

## Before coding

Start from the latest main. Use a branch named `g1/m<member>-<feature>` and a PR title starting with `[G1-M<member>]`. Member numbers and ownership are in README.

Give each screen, route and revenue feature an assigned Issue. Change an agreed route or schema through a separate Issue titled `Contract change: …`.

## Before review

- Bring in the latest main with `git pull --no-edit origin main`.
- Run the checks that cover your change and record the results in the PR.
- Check the affected loading, empty and error states, plus the phone layout.
- Make sure .env, credentials, node_modules and local demo data are not staged.
- Be ready to explain the code you submit.
- Fill in the PR assistance field and add one AI-USAGE.md row per meaningful use, or state None when no assistance was used.

The reviewer runs the branch, leaves a specific comment and approves after any issues are resolved. Janelle reviews Fran's CP0 work. Authors do not approve their own PRs. The captain merges after approval.

## Required contribution record

Each member needs three merged code PRs, two teammate reviews with specific comments, and work merged in two of these windows: October 14–28, October 29–November 4, November 5–9. Documentation-only PRs do not count as code PRs.

Keep main protected: PR required, one approval and no force pushes. Tag the reviewed final build `gc2-v1.0`.
