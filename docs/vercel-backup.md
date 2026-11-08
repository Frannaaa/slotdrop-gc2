# Vercel backup deployment

Render (`render.yaml`) is the submitted deployment. This branch adds a Vercel version of the same app as a backup, in case the free Render instance stops answering before grading.

## How it differs from Render

- `api/index.js` runs the Express app as one serverless function. Startup work from `server/index.js` (bootstrap, migrations, reference catalog) runs once per function instance, before its first request. It never reseeds or deletes data.
- `vercel.json` serves `public/` as static files and sends every `/api/...` request to that function.
- The function opens one database connection at a time, so use the database's **pooled** connection string (Neon: the host containing `-pooler`).
- The 429 limiter keeps its counts in memory. Vercel can run several instances, so the limit is per instance and less reliable than on Render.

## Set up (once)

1. Sign in at vercel.com with GitHub and import `Frannaaa/slotdrop-gc2`.
2. Framework preset: **Other**. Leave the build and output settings to `vercel.json`.
3. Environment variables: `DATABASE_URL` = the pooled connection string, and `NODE_ENV` = `production`. Enter the value only in Vercel.
4. Deploy. Under Settings → Git, set the production branch to `g1/m1-vercel-backup` until this branch is merged, or use the branch's preview URL.
5. Check `/api/health` (200), `/api/slots`, then run the Challenge 1 collection with `baseUrl` set to the Vercel URL.

Both deployments can share one database: a booking made on either site appears on both.
