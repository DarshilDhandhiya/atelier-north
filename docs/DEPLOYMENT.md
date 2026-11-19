# Deployment notes

Frontend and backend deploy **separately**. Suggested free-tier stack: MongoDB Atlas (database) + Render/Railway/Fly (API) + Netlify/Vercel (frontend) + Cloudinary (images). Any equivalent works.

## 1. Database: MongoDB Atlas
1. Create a cluster and a database user. Network Access: allow your API host's outbound IPs (or `0.0.0.0/0` for a demo, with a strong password).
2. Copy the connection string, add the database name: `mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/atelier_north`.
3. Seed it once from your machine: set `MONGODB_URI` in `backend/.env`, then `npm run seed`. Afterwards **change the demo passwords** in Admin > Users (or set `SEED_*` variables to your own before seeding).

## 2. Backend (Render example)
- New *Web Service* from the repo, root directory `backend`.
- Build: `npm install && npm run build` Start: `npm run start` Health check path: `/api/health`.
- Environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas string |
| `JWT_SECRET` | 48+ random bytes (required, app refuses to start with the dev value) |
| `CLIENT_ORIGINS` | `https://your-site.netlify.app` (exact origin(s), comma-separated) |
| `SITE_URL` | same public frontend URL (used in sitemap and emails) |
| `PUBLIC_API_URL` | `https://your-api.onrender.com` (used to build absolute upload URLs) |
| `TRUST_PROXY` | `true` (so rate limiting sees real client IPs and HTTPS redirect works) |
| `FORCE_HTTPS` | `true` (redirects http to https; needs `TRUST_PROXY=true`) |
| `COOKIE_SAMESITE` | `none` when frontend and API are on different registrable domains; `lax` if they share a parent domain (e.g. `www.` and `api.`) |
| `COOKIE_SECURE` | `true` |
| `SMTP_*`, `MAIL_FROM`, `STAFF_NOTIFY_EMAIL` | your provider |
| `STORAGE_DRIVER` | `cloudinary` |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |

`backend/.env.example` is the authoritative list.

## 3. Frontend (Netlify or Vercel)
- Base directory `frontend`, build `npm run build`, publish `dist`.
- Environment: `VITE_API_URL=https://your-api.onrender.com`, `VITE_SITE_URL=https://your-site.netlify.app`, `VITE_PLAUSIBLE_DOMAIN=` (empty = no analytics) or your Plausible domain.
- **Replace `YOUR-API-HOST`** in `frontend/public/_redirects` (Netlify) or `frontend/vercel.json` (Vercel) with the API host. These rules proxy `/sitemap.xml` and `/robots.txt` to the API (so they reflect live content) and provide the single-page-app fallback so deep links like `/projects/ridge-glasshouse` work.
- The Vercel file also sets security headers and long-term caching of hashed assets. For Netlify add equivalent headers in `netlify.toml` if desired.

## 4. Cross-site cookies checklist
Sign-in uses a cookie set by the API. When the frontend and API are on different sites you need all of: HTTPS on both, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, `CLIENT_ORIGINS` containing the exact frontend origin, and `VITE_API_URL` set. Safari/Brave may still block third-party cookies: the most robust fix is serving the API under the same parent domain (`api.yourstudio.com` + `www.yourstudio.com`, `COOKIE_SAMESITE=lax`) or proxying `/api` through the frontend host.

## 5. Cloudinary (optional media storage)
Create a free Cloudinary account, copy the *API environment variable* (`cloudinary://...`) from the dashboard, set `STORAGE_DRIVER=cloudinary` and `CLOUDINARY_URL`. New admin uploads are then signed-uploaded to Cloudinary; the stored URL is saved in MongoDB with alt text and dimensions. Existing local uploads keep working. (Implemented with Cloudinary's signed REST API; verify with one upload on your account after switching.)

With `STORAGE_DRIVER=local`, files are written to `backend/uploads/` and served from `/uploads`. This works on a VPS with a persistent disk, but not on hosts with ephemeral filesystems.

## 6. After deploying
- `GET https://your-api/api/health` returns `{"status":"ok","db":"connected"}`.
- Submit a test enquiry; confirm the reference appears, the staff email arrives (or shows *failed* with a readable error in Admin > Enquiries).
- Open `https://your-site/sitemap.xml` and `/robots.txt`.
- Run the e2e checks against production: `BASE_URL=https://your-site npm --prefix e2e run axe`.
- Submit the sitemap in Google Search Console.

## Operational notes
- Logs: every request is logged with a request id (also returned in error bodies and the `X-Request-Id` header) to help trace a user report.
- Failed notification emails retry automatically with exponential back-off (up to `EMAIL_MAX_ATTEMPTS`); staff can also retry manually.
- Backups: enable Atlas backups. Enquiry attachments live in MongoDB, so they are included.
