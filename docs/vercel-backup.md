# SlotDrop Group 1 — Vercel deployment runbook

**Status:** deployment-ready source in [PR #67](https://github.com/Frannaaa/slotdrop-gc2/pull/67), **not a verified live Vercel site**. Do not list a `.vercel.app` URL as final until it responds and the whole customer journey is tested. Vercel is the requested hosting option; keep the existing Render service as a fallback until Vercel passes.

## Architecture

- **GitHub source:** `Frannaaa/slotdrop-gc2`, reviewed and merged `main` for final submission.
- **Frontend:** existing `public/` HTML, CSS, JavaScript and fonts served by Vercel's CDN. No React migration is required for *GC2*.
- **Backend:** native Express Function detected from root `index.js`, reusing `server/app.js` and the existing booking, pricing, Owner, session and receipt routes. Do not use `npm start` as a Vercel build command.
- **Database:** the **same existing Neon PostgreSQL** database as the official Render Group 1 app. This is how both URLs see the same booking receipts. Do not create or reset a separate database for grading.
- **First API request per warm instance:** `server/vercel-handler.js` checks the schema, safely initializes *only a totally fresh empty database*, then applies additive migrations and ensures the reference catalog. Subsequent requests reuse the initialized handler. Existing bookings are never reseeded or erased. Startup failure returns 503 and can be retried.
- **Database connections:** `pg` pool is limited to one connection **per Vercel Function instance**. Prefer Neon's pooled connection URL (host with `-pooler`) and TLS.
- **Region:** Vercel `sin1` (Singapore), near the Neon Singapore database, in `vercel.json`. This avoids Vercel's default US region.
- **Rate limiting:** booking limiter state is per Function instance on Vercel. Do not claim that the optional 429 stretch criterion is globally enforced across a scale-out deployment.

Vercel's current official Express implementation detects `index.js` and serves `public/` from the CDN, **without custom API rewrites**. This preserves paths such as `/api/health`, `/api/slots`, `/api/bookings/:id`, while static pages such as `/browse.html` are handled by the CDN when those pages have been merged. [Vercel Express docs](https://vercel.com/docs/frameworks/backend/express).

## One-time setup in Vercel (requires owner's account)

1. Obtain a *valid* reviewed merge of PR #67 into `main` before importing the production project. Do not bypass protected-branch teammate approvals. If not yet merged, test the branch using a Vercel **Preview** deployment and do not present it as the release.
2. Open [Vercel New Project](https://vercel.com/new) while signed into the account you want to own the course project. Choose **Import Git Repository** and select `Frannaaa/slotdrop-gc2`. Approve the GitHub integration if prompted.
3. Project name: `slotdrop-gc2-group` (or a free available project slug). **Root Directory:** `./` (repository root). **Framework Preset:** **Express** (detected from root `index.js`); do not choose React, Next.js, Vite, or a static-only export. Do not override the build command or output directory. Vercel will read `vercel.json`.
4. Under **Environment Variables**, set `DATABASE_URL` to your **Neon pooled connection string** for the *same database that Render already uses*. Use Vercel's secret input, never a PR, README, screenshot, AI chat, or GitHub Actions output. Set `NODE_ENV=production`. Configure **Production**, and **Preview** too only if intentionally testing a preview against the live demo database. Note that preview writes will affect the same database.
5. Confirm **Production Branch = `main`** under **Settings → Git**, and deploy the reviewed commit. Future merges into `main` trigger further production deployments. If you add or change environment variables *after* a deployment, trigger a redeployment for the changes to take effect.
6. Copy the actual public `https://...vercel.app` URL from Vercel's deployment page. If access shows `401`/login protection for graders, check **Settings → Deployment Protection** and ensure the *production* URL is publicly accessible (without sharing any secrets).
7. Verify the direct links below **on the Vercel URL**. Do not assume green build status proves API/database/browser success.

### Public smoke test (using the real Vercel host)

Replace `https://YOUR-VERCEL-URL` with the actual assigned URL. Expected behavior:

| Route | Expected |
| --- | --- |
| `GET /` | 200 and the SlotDrop Home HTML |
| `GET /api/health` | 200 JSON `{"status":"ok","app":"SlotDrop"}` only when the database schema is reachable |
| `GET /api/slots` | 200 JSON array; ensure **bookable future** sessions are present |
| `GET /api/metrics` | 200 JSON Owner metrics |
| `GET /api/bookings` | 200 JSON booking list |
| `GET /detail.html?slotId=1` | 200 if the Detail page is merged |
| `GET /browse.html` | 200 only **after** Kirsten's reviewed Browse PR is merged |
| `GET /checkout.html?slotId=1&quantity=1` | 200 only **after** Kaitlyn's reviewed Checkout PR is merged |
| `GET /confirmation.html?id=<real-receipt-id>` | 200 and persisted receipt only after a successful booking |

Run `npm run check:gc2 -- https://YOUR-VERCEL-URL` after the full frontend merges. This is a **read-only** preflight, not a substitute for real browser interaction. Next, use the prepared six-case Postman collection from PR #37 with the *actual Vercel baseUrl*, active slot ID and server quote to capture deployed screenshots. Take one separate successful browser booking through Home → Browse → Detail → Selection → Checkout → Confirmation, then verify Owner counts, seats and receipt GET. Refresh the page and verify the saved receipt remains. After a redeployment, verify the same booking ID still exists (no database reset). Use fictional guest details only.

## Diagnosing failures

- **404 on `/browse.html` or `/checkout.html`:** these teammate pages are not yet in the deployed commit; merge and redeploy the approved UI PRs. It is *not* a Neon connection problem.
- **404 on `/api/slots`:** check that `index.js` and `vercel.json` are in the *deployed* Git commit, Framework Preset = Express, Root Directory = repo root, and that no custom rewrite is overwriting the original API path.
- **503 on `/api/health`:** inspect Vercel Function logs, ensure `DATABASE_URL` is configured for the right environment with the correct Neon DB/pooler host, and check Neon connectivity/schema. Do **not** reset a populated database. Vercel startup errors intentionally hide credentials.
- **500 / `FUNCTION_INVOCATION_FAILED`:** inspect Functions logs for missing SQL/JSON bundle files, Node runtime errors, or startup timeouts. The function bundle includes `db/**` and `public/data/**` in `vercel.json`.
- **Missing seeded sessions:** `/api/slots` lists only sessions inside the discovery window and before cutoff. Use Owner to add fresh fictional future open sessions. A seeded catalog is not proof of bookable future inventory at grading time.
- **Static images/CSS missing:** use root-relative `/css/...` and `/js/...` links, check asset URLs, and confirm `public/` was served by the CDN.
- **Slow pages:** distinguish static-page CDN load from `/api/slots`/Neon response time in DevTools Network. Vercel avoids Render Free's 15-minute idle sleep, but it does not guarantee zero latency or zero cold starts.
- **Vercel asks for payment:** choose Hobby for this non-commercial classroom demonstration; do not accept a paid upgrade without explicit permission.

## Security and grading safeguards

Never publish the Neon connection string, passwords or actual customer identities; use a fictional test guest. Rotate any database password previously shared in chats or screenshots. Keep both Render and Vercel pointed at **one** database while testing, but do not run destructive reset, `db:init` or `db/seed.sql` on existing production data. Keep protected `main`, teammate approvals and the final `gc2-v1.0` release tag. Submit the **actual working URL and commit**, not an assumed Vercel URL.

**Relevant Vercel docs:** [Express](https://vercel.com/docs/frameworks/backend/express), [Git import](https://vercel.com/docs/git), [environment variables](https://vercel.com/docs/environment-variables), [project settings](https://vercel.com/docs/project-configuration/project-settings).
