# Atelier North

A website for a fictional boutique architecture and interior design studio: public marketing site, enquiry pipeline and a staff admin console. MERN stack, TypeScript on both sides.

> **Demo content.** All studio names, people, projects, testimonials and journal articles are fictional. Photography is hotlinked from Pexels (see [docs/IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md)) and illustrates imaginary projects. Replace before launch.

## What is in the box

| Folder | Contents |
|---|---|
| `backend/` | Express 4 + Mongoose 8 API, seed script, 70 automated tests |
| `frontend/` | Vite + React 18 SPA (public site + `/admin` console), 12 automated tests |
| `e2e/` | Real-browser flow test, WCAG scan and screenshot capture (Puppeteer + Chrome) |
| `design/` | Design-system tokens, hi-fi desktop/mobile mockups (Home, Project detail, Enquiry) and generator script |
| `docs/` | Setup, API spec, deployment, design note, test evidence, walkthrough script, credits, screenshots |

## 60-second start

```bash
npm run install:all
cp backend/.env.example backend/.env       # set JWT_SECRET (see docs/SETUP.md)
cp frontend/.env.example frontend/.env
# MongoDB must be running (local, Docker: `docker compose up -d`, or an Atlas URI in backend/.env)
npm run seed
npm run dev:api      # terminal 1 -> http://localhost:5000
npm run dev:web      # terminal 2 -> http://localhost:5173
```

Admin console: <http://localhost:5173/admin> 

| Role | Email | Password |
|---|---|---|
| Admin | `admin@atelier-north.test` | `Atelier!Admin2026` |
| Editor | `editor@atelier-north.test` | `Atelier!Editor2026` |

Change both passwords before any public deployment (they are demo credentials).

Full instructions: **[docs/SETUP.md](docs/SETUP.md)**.

## Documentation

- [Setup guide (step by step)](docs/SETUP.md)
- [API specification](docs/API.md)
- [Deployment notes](docs/DEPLOYMENT.md)
- [Design note and design system](docs/DESIGN_NOTE.md)
- [Test evidence](docs/TEST_EVIDENCE.md)
- [5–8 minute walkthrough script](docs/WALKTHROUGH.md)
- [Image credits](docs/IMAGE_CREDITS.md)

## Feature summary

**Public:** home (editorial hero, positioning, selected projects, services, process, testimonial, consultation CTA), projects (category/location filters, search, sort, URL-driven pagination), project detail (gallery with accessible lightbox, scope, location, year, area, brief, approach, related projects), services (3 pages with deliverables, steps, FAQs, contextual CTA), about, journal (list, category filter, article, reading time, related), contact (validated enquiry form with optional attachment), custom 404, privacy notice, cookie/analytics choice, sitemap.xml, robots.txt, per-page title/description/Open Graph/canonical, JSON-LD.

**Staff:** login, role-based access (editor = content only; admin = users, settings, enquiries), CRUD with publish/unpublish for projects, services, articles, testimonials and team, featured-project ordering, media upload with alt text, enquiry inbox with search/status filters, assignment, internal notes, email status/retry, CSV export, users and site settings.

**Enquiry flow:** validated on client and server, saved first, reference ID shown (`AN-YYMMDD-XXXX`), staff emailed via Nodemailer. If email fails the enquiry is kept and the failure is stored with automatic exponential back-off retries plus a manual "Retry email" button. Spam control: honeypot, minimum-time trap, link limit, rate limit, duplicate protection.

**Security:** bcrypt password hashing, JWT in an httpOnly cookie, CSRF header guard, helmet, restricted CORS, rate limiting, HTML sanitising of rich text and plain text, magic-byte file-type checking, size limits, private enquiry attachments (admin only), request logging with request IDs, least-privilege roles, secrets from environment.

## Time estimate

Estimated effort for a developer building this scope from scratch: **~110–130 hours** (design system and mockups 14h, backend 30h, public frontend 36h, admin 26h, tests 12h, docs/deploy 8h).

## Known limitations (be aware)

- Per-page SEO tags are set client-side (single-page app). Google renders JS, but social-card scrapers often do not. See next steps in the design note (SSR/prerender).
- Hi-fi designs are generated SVG/PNG mockups, not a Figma file.
- Cloudinary storage and live SMTP were not exercised against real accounts in development (tests use a mock mail transport); setup is documented.
- Backend tests ran against FerretDB (Mongo-compatible) in the build sandbox. They are written for MongoDB and use `mongodb-memory-server` by default.
- No deployed demo link is included (deployment was not possible from the build environment). Deployment steps are in docs/DEPLOYMENT.md.
