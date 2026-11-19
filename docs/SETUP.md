# Setup guide

Follow these steps in order. Every command is run from the project root (`atelier-north/`) unless stated.

## 0. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20 or newer (22 tested) | `node -v` |
| npm | 10+ | `npm -v` |
| MongoDB | 6+ local **or** a free MongoDB Atlas cluster **or** Docker | see step 2 |
| Google Chrome | optional, only for `e2e/` | |

## 1. Install dependencies

```bash
npm run install:all
```

## 2. Get a MongoDB

Pick **one**:

**A. Docker (easiest).** `docker compose up -d` starts MongoDB on 27017 and MailHog (fake mail inbox) on 8025.

**B. Local install.** Install MongoDB Community, start it, keep the default `mongodb://127.0.0.1:27017`.

**C. MongoDB Atlas.** Create a free cluster, add a database user, allow your IP under *Network Access*, click *Connect > Drivers* and copy the connection string, for example `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/atelier_north`.

## 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at least:

| Variable | What to put |
|---|---|
| `MONGODB_URI` | Your connection string from step 2 |
| `JWT_SECRET` | A long random string. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_ORIGINS` | `http://localhost:5173` (comma-separate several) |
| `SITE_URL` | `http://localhost:5173` |

Everything else has a safe local default. Optional groups:

- **Email** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `MAIL_FROM`, `STAFF_NOTIFY_EMAIL`): see step 6. If `SMTP_HOST` is empty the site still works; enquiries are saved with email status **skipped**.
- **Storage** (`STORAGE_DRIVER=local` or `cloudinary`, `CLOUDINARY_URL`): see [DEPLOYMENT.md](DEPLOYMENT.md).
- **Limits** (`MAX_IMAGE_MB`, `MAX_ATTACHMENT_MB`, `ENQUIRY_RATE_LIMIT_*`, `LOGIN_RATE_LIMIT_MAX`).
- **Seed credentials** (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_EDITOR_*`).

## 4. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

For local development nothing needs changing: Vite proxies `/api`, `/uploads`, `/sitemap.xml` and `/robots.txt` to `http://localhost:5000`. Set `VITE_PLAUSIBLE_DOMAIN=` (empty) to disable analytics and the cookie banner entirely.

## 5. Seed the database

```bash
npm run seed            # idempotent: safe to re-run, updates by slug/email
npm --prefix backend run seed -- --reset   # wipes content collections first (not users)
```

Creates 8 projects, 3 services, 4 articles, 4 testimonials, 3 team profiles, site settings and the 2 demo users.

## 6. Start everything

```bash
npm run dev:api     # terminal 1 -> http://localhost:5000/api/health should say {"status":"ok"}
npm run dev:web     # terminal 2 -> http://localhost:5173
```

**Testing email locally:** with Docker running, set `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025`, restart the API, submit an enquiry, then open <http://localhost:8025>. For real email use your provider's SMTP details (Gmail needs an *App password*; SendGrid/Mailgun/Postmark give SMTP credentials). Set `STAFF_NOTIFY_EMAIL` (or the admin setting *Enquiry notification email*) to the staff inbox.

## 7. Try it

1. Open <http://localhost:5173>, browse projects, use filters and search, open a gallery (keyboard: arrows, Esc).
2. Go to **Contact**, submit the form. You receive a reference like `AN-261119-DUNS`.
3. Sign in at <http://localhost:5173/admin> as admin, open **Enquiries**, change status, add a note.
4. Sign in as editor: note that Enquiries, Users and Settings are not available.
5. Create a project, publish it, find it on the public Projects page.

## 8. Run the tests

```bash
npm run typecheck
npm --prefix frontend test                    # 12 tests, no database needed
npm --prefix backend test                     # 70 tests
```

Backend tests need MongoDB. By default they download an in-memory `mongodb-memory-server` binary. If that is blocked on your network, point at any running MongoDB (a throwaway database name is used and wiped):

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/atelier_test npm --prefix backend test
```

Real-browser tests (API + frontend must be running, database seeded):

```bash
cd e2e && npm install
npm run flow         # 30 end-to-end checks
npm run axe          # WCAG 2.0/2.1/2.2 A+AA scan of every public page
npm run screenshots  # writes ../docs/screenshots/*.png at 360/768/1024/1440
# Windows/macOS: set CHROME_PATH to your Chrome executable, e.g. CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## 9. Production build

```bash
npm run build           # backend -> backend/dist, frontend -> frontend/dist
npm --prefix backend run start
```
Deployment: [DEPLOYMENT.md](DEPLOYMENT.md).

## Troubleshooting

| Symptom | Fix |
|---|---|
| API exits: `Invalid environment` | Read the message; usually `JWT_SECRET` too short (min 32 chars) or `MONGODB_URI` missing |
| `/api/health` says `db: disconnected` | MongoDB not running or URI/credentials wrong; Atlas: allow your IP |
| Login works but you are signed out on refresh | Frontend and API on different sites: set `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, HTTPS on both |
| Browser shows CORS error | Add the exact frontend origin (no trailing slash) to `CLIENT_ORIGINS` |
| Images look like grey placeholders | The Pexels CDN is unreachable from your network. Check connection or upload your own images |
| Enquiry saved but email shows **failed** | Open the enquiry in admin: the last SMTP error is shown. Fix `SMTP_*`, then click *Retry email* |
| Uploads vanish after deploy | Host has an ephemeral disk: use `STORAGE_DRIVER=cloudinary` (enquiry attachments are stored in MongoDB so they survive) |
| `EADDRINUSE` | Change `PORT` in `backend/.env` and the proxy target `VITE_DEV_API` |
