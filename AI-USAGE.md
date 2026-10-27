# AI assistance log

## October 27, 2026: Fran's CP0 preparation

Tool: ChatGPT/Codex. AI assisted with the starter, schema and seed, API contracts, documentation, task specifications and GitHub preparation described in PR22. Fran asked it to review the chat/repository, propose business decisions and fix the remaining preparation issues.

The current revision adds structured API errors, automated HTTP checks, a disposable SQL scenario checker, tighter money/cutoff constraints, business decision reasons and setup/review updates. Business APIs, a hosted database, teammate review, partner interviews and real payments are not completed by these changes.

## Business reasoning

AI performed the linked public-source desk research in docs/research.md and proposed the segment, geography, 72-hour horizon, per-session cutoff, 10% commission and supporting rationale at Fran's request. They are working MVP choices; they are not independent group research or proof that customers/providers accept them.

The brief, as recorded in the planning chat, reserves business reasoning for the group and allows AI wording help. This draft goes beyond wording assistance. Fran and the team must independently review, decide and explain the reasons, then record their actual reasoning and any revisions before claiming compliance with that rule. Do not describe an AI-written rationale as independent student reasoning.

## Checks performed by the assistant

See docs/preparation-checks.md for commands, actual results and limits. Automated checks do not constitute Fran's own run or Janelle's review.

## Fran's verification record

Pending Fran's own verification. Record the date, commands actually run, results, business choices personally reviewed, and any changes made. Do not fill this with assistant results.

## Janelle's review

Pending an actual review on PR22. Janelle records her own checks and findings. Neither invitation acceptance nor approval is inferred from this log.

## Next-phase database and discovery implementation
Codex implemented Fran's PostgreSQL adapter, persistent local demo, initialization tooling and session read routes at Fran's request. The assistant ran syntax, discovery/HTTP and SQL checks. Fran's own verification and teammate review remain pending; no hosted PostgreSQL run is claimed.

## Next-phase offer implementation
Codex implemented Fran's create/edit offer service and corresponding HTTP tests. Business inputs remain demo data. Student verification and teammate approval are pending.

## Next-phase owner workspace
Codex implemented Fran's dashboard, owner catalog, metrics and saved-booking list; added regression tests; and checked the local UI on desktop and phone widths. Database scenarios used PGlite; no hosted deployment, real customer flow, independent student contribution or teammate approval is claimed.
