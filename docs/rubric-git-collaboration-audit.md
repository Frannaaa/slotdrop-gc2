# GC2 rubric audit — Git collaboration and process (10 points)

**Audit date:** November 8, 2026 (Philippine time). Based on currently visible GitHub PR authors, submitted reviews, `main` history and repository files. Distinguish **verified** from **not yet established**. Do not fabricate earlier timestamps, teammates' code or human approvals.

## Checkpoints

| Gate | What GitHub verifies | Conclusion |
| --- | --- | --- |
| **CP0 Oct 28** | [PR #22](https://github.com/Frannaaa/slotdrop-gc2/pull/22) merged on **October 28, 2026, 09:47 PHT** (2026-10-28 01:47 UTC), with Janelle's substantive tested approval and route/schema/database skeleton | GitHub evidence supports **on-time CP0** (if instructor's date did not specify an earlier hour). Submission on Canvas must be checked separately |
| **CP1 Nov 4** | Official `main` has never contained `public/browse.html` as of this audit; no verified public Group 1 deployed API-backed Browse was identified. The `slotdrop-gc2-complete.onrender.com` service explicitly points to a **separate private reference-only repo**, not this group repo | **Cannot claim CP1 achieved by Nov 4**. Instructor's actual checkpoint record, if any, is needed to confirm penalty. Do not backdate |
| **Final Nov 9 11:59 PM PHT** | `gc2-v1.0` tag not yet created and reviewed customer pages/production evidence pending | Keep release gate open |

## No direct main commits after skeleton — Git-history evidence

An **earlier November 8 first-parent audit** identified 13 two-parent PR merges (#22, #30, #27, #28, #36, #40, #29, #34, #42, #32, #39, #35, #41) following the initial commit, with no one-parent commits on that audited chain. Later **reviewed** merges (#45, #56, #57, #37) have since been recorded; recalculate the final release's full history and counts before tagging. This is positive evidence against direct main pushes in this visible history; it does **not** by itself prove branch protection was enabled continuously on every earlier date.

A recent attempted protected merge of #45 was refused because the prior approver used a read-only account. That confirms branch protection now requires a qualifying write-access approval; **do not** weaken protection to rush submission. New approvals must be genuinely authored by a reviewer, on the current head, with specific observations.

## Individual minimums — evidence visible in the merged PRs

| Member | Merged code PRs visible | Substantive submitted reviews visibly attributable | Historical merge windows supported |
| --- | --- | --- | --- |
| Fran / `Frannaaa` | 3+ (including #22, #27, #28, #29, #34, #36, #39, #45, #56, #57) | 2+ (#40, #42) | **3**: W1 Oct 14–28; W2 Oct 29–Nov 4; W3 Nov 5–9 |
| Janelle / `janellereonal` | **2** (#40, #42) | 2+ (specific testing reviews on #22/#27/#28/#29 and others) | **1**: Oct 29–Nov 4 |
| Chonel / Home (`chukwunyeluukgabrielokolo-cmyk`) | **1** (#35); open authored #68 and #69 | **2** substantive submitted comments on #60 and #62 (Nov 8; subject to instructor's review-quality assessment) | **1**: W2 Oct 29–Nov 4; W3 pending new code merges |
| Kat / `kattgrass` | **1** (#41) | #37 current-head **APPROVED** with substantive review; #43 current-head **CHANGES_REQUESTED** with independent code/test findings (two distinct PR reviews, pending rubric acceptance) | **1**: W3 Nov 5–9; no historical W1/W2 merge visible |
| Kaitlyn / `sonatiina` | **0** (#43 remains open) | **1** substantive submitted approval (#41); newly requested to review #60 and #62 | **0** |
| Kirsten / `13kilograms` | **0** (#60 CSS, #62 Browse, #64 mobile are open; #63 stacked bonus is also open) | **0** confirmed substantive (the sole #35 approval, `yay i likey!`, is not adequate evidence); requested to review #43 and #68 | **0** |

These are **minimum verified counts**, not assertions that all discussion threads, unlinked GitHub work or historical records have been exhaustively retrieved. A code PR is counted only when actually merged and authored by its corresponding account; documentation-only PRs such as #30 are excluded. Github writes and course submissions must preserve all six people's true authorship. **Past windows cannot be recreated retroactively.** A member with qualifying circumstances should contact the instructor **before November 9** and include actual links and dates, not ask the captain to fabricate an earlier merge.

## Reviews and AI assistance

- Most early Fran API PRs have substantive Janelle approvals, with specific tested commands and requested fixes.
- **#35**'s approval is only `yay i likey! good stuff :)`; this is weak review substance even if GitHub accepted it. Encourage a current review/comment with concrete accessibility, API and navigation findings where needed; never alter its historic content or invent a past review.
- **#43** had an earlier mistaken Kat approval that was dismissed, **but Kat subsequently submitted a substantive current review requesting changes**. That review is evidence of review participation, **not approval for merging**. The PR also has merge conflicts and a post-success double-submit issue. The author must fix and receive a new valid approval. Fran's source bug comment is not an approval.
- **#45** originally received an approval from `janelledelavegareonal` with insufficient repo permissions. Janelle later tested the current head and approved through the write-access `janellereonal` account; #45 was subsequently merged on November 8. Preserve the history of the incorrect approval without treating it as a current blocker.
- **#37** was merged into main on November 8 with Kat's current-head approval and deployed Challenge 1 evidence. **#47** documentation was reconciled with that main merge on Nov 8 and still awaits current-head CI/approval. Other optional Fran PRs #49/#51/#53 require individual value, review, and integration; CI alone is not a human review. **#67** Vercel, **#62/#60** Browse/CSS, **#43** Checkout and **#59** future inventory are the current functional release gates.
- Root `AI-USAGE.md` exists on main with source-specific records, but newer assistance rows are staged on multiple open PRs. **Merge while preserving every genuine dated row**, align each with PR disclosures, and have teammates add their own records. Do not pass off model-generated challenge explanations as student reasoning.

## Audited hygiene

Fran's CI [run 42397908940](https://github.com/Frannaaa/slotdrop-gc2/actions/runs/42397908940) checked 190 reachable historical Git paths and 748 historical text blobs: no common committed `.env`, `node_modules`, key filenames or high-confidence token signatures. This **is not a complete guarantee** against secrets concealed in other text formats.

## Outstanding process gate

- [ ] Recover actual Canvas CP0/CP1 submission receipts for grading (GitHub alone does not prove Canvas submission).
- [ ] Teammates resolve review and authorship gaps without bypassing protected main.
- [ ] Reconcile overlapping AI-USAGE rows on all selected PR merges; rerun final CI after merges.
- [ ] Merge approved Group 1 work, verify the actual public flow, tag only the final tested `main` as `gc2-v1.0`.
- [ ] Captain submits only real, verified evidence; instructor decides late/exception cases.

**Provisional process assessment:** CP0 is supported; CP1 cannot be claimed; review quality and participation uneven. A perfect 10/10 cannot be confirmed from current evidence, even though protected-main merge history is strong.

## November 8 late release audit — supplemental note

- PR #37 was merged after a valid tested approval. GitHub review submissions on #60 and #62 now contain substantive Chonel comments, Kat has a tested #37 approval plus #43 change request, Janelle's separate code-review history is substantial. Kirsten's historical #35 approval is too thin to count confidently.
- Review **requests** issued to Kirsten (#43, #68), Kaitlyn (#60, #62) and Janelle (#43) are assignments, not completed reviews. Requested reviewer statuses must be checked before declaring credit.
- Janelle #59 and Kaitlyn #43 report merge conflicts; their authors need to update from latest main. Vercel #67 needs genuine Janelle/Kat review before merging. Browse #62 and CSS #60 are CI-green but pending approval and browser integration.
- A member missing W1 or W2 cannot make up that historical merge window with November 8–9 commits. The instructor must decide exceptional cases. No score or grade is guaranteed by this audit.
