# API specification

Base URL: `http://localhost:5000` (dev). JSON everywhere except uploads (`multipart/form-data`).

## Conventions

- Success: `{ "data": ..., "meta"?: { page, limit, total, totalPages } }`
- Errors (always this shape): `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "path": "email", "message": "..." }], "requestId": "..." } }`
- Codes: `VALIDATION_ERROR`/`BAD_REQUEST`/`BAD_ID`/`BAD_JSON` 400, `UNAUTHENTICATED`/`INVALID_CREDENTIALS` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT`/`DUPLICATE` 409, `FILE_TOO_LARGE`/`PAYLOAD_TOO_LARGE` 413, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500.
- Auth: httpOnly cookie `an_session` (JWT, 8 hours by default; `JWT_EXPIRES_HOURS`). State-changing requests (POST/PUT/PATCH/DELETE) to `/api/admin/*` and `/api/auth/*` must send the header `X-Requested-With: XMLHttpRequest` (CSRF guard) and come from an allowed origin.
- Public GETs send `Cache-Control: public, max-age=60, stale-while-revalidate=300`; admin responses are `no-store`.
- Only published content is ever returned by public routes (`publishedAt <= now`, or `published: true`).

## Public

| Method & path | Query / body | Notes |
|---|---|---|
| `GET /api/health` | | `{status, db, uptime}` |
| `GET /api/settings` | | Public site settings (no notification email) |
| `GET /api/meta/enquiry-options` | | Allowed project types, budget ranges, timelines |
| `GET /api/projects` | `category`, `location`, `q`, `sort` = `newest`\|`oldest`\|`largest`\|`smallest`\|`title`, `page`, `limit` (max 50, default 9), `featured=true` | Search matches title, summary, location, category, tags |
| `GET /api/projects/filters` | | `{categories[], locations[]}` |
| `GET /api/projects/:slug` | | Project + `related[]` (up to 3) |
| `GET /api/services` | | Ordered |
| `GET /api/services/:slug` | | |
| `GET /api/articles` | `category`, `q`, `page`, `limit` | Without body; includes `readingTime` |
| `GET /api/articles/categories` | | |
| `GET /api/articles/:slug` | | Article + `related[]` |
| `GET /api/testimonials` | | Approved only |
| `GET /api/team` | | Published only |
| `POST /api/enquiries` | multipart: `name`, `email`, `phone?`, `projectType`, `location`, `budgetRange`, `timeline`, `message` (20–4000), `consent=true`, `attachment?` (JPG/PNG/WebP/PDF ≤10 MB), `sourceProject?`, `sourceService?`, honeypot `website` (must be empty), `formStartedAt` (ms epoch) | `201 { data: { reference } }`. Saved before email is attempted. Rate limited (default 5/hour/IP). Duplicate within 10 minutes returns the original reference (idempotent). |
| `GET /sitemap.xml`, `GET /robots.txt` | | Generated from published content |

## Auth

| Method & path | Body | Result |
|---|---|---|
| `POST /api/auth/login` | `{email, password}` | `{data:{user}}` + cookie. 401 on bad credentials, 429 after `LOGIN_RATE_LIMIT_MAX` |
| `POST /api/auth/logout` | | Clears cookie |
| `GET /api/auth/me` | | Current user or 401 |

## Admin (`/api/admin`, requires sign-in)

Roles: **editor** = content + media; **admin** = everything, incl. enquiries, users, settings.

### Content resources
`projects`, `services`, `articles`, `testimonials`, `team` all support:

| Method & path | Notes |
|---|---|
| `GET /api/admin/<resource>` | `q`, `status=published\|draft`, `page`, `limit` |
| `GET /api/admin/<resource>/:id` | |
| `POST /api/admin/<resource>` | Slug generated (and made unique) from title when omitted or empty |
| `PUT/PATCH /api/admin/<resource>/:id` | Partial updates allowed |
| `DELETE /api/admin/<resource>/:id` | |
| `POST /api/admin/<resource>/:id/publish` and `/unpublish` | projects & articles (`publishedAt`), services & team (`published`) |
| `PUT /api/admin/<resource>/order` | `{ids:[...]}`; services, testimonials, team |
| `PUT /api/admin/projects/featured-order` | `{ids:[...]}` sets featured projects and their order |

Rules: images need a URL (https or `/uploads/...`) and alt text (≥3 chars); rich text (service description, article body) is sanitised to an allow-list of tags; plain-text fields have HTML stripped.

### Media
`GET /api/admin/media`, `POST /api/admin/media` (multipart `file`, optional `alt`; JPG/PNG/WebP ≤8 MB; verified by file signature), `PUT /api/admin/media/:id` (`{alt}`), `DELETE /api/admin/media/:id`. Dimensions are stored with each item.

### Enquiries (admin only)
| Method & path | Notes |
|---|---|
| `GET /api/admin/enquiries` | `q`, `status=new\|contacted\|qualified\|closed`, `emailStatus=sent\|failed\|pending\|skipped`, paging; response includes `counts` per status |
| `GET /api/admin/enquiries/export.csv` | Same filters |
| `GET /api/admin/enquiries/:id` | |
| `PATCH /api/admin/enquiries/:id` | `{status?, assignee?}` |
| `POST /api/admin/enquiries/:id/notes` | `{body}` internal note |
| `POST /api/admin/enquiries/:id/retry-email` | Re-sends the staff notification |
| `GET /api/admin/enquiries/:id/attachment` | Private download |
| `DELETE /api/admin/enquiries/:id` | Also deletes the attachment |

### Users, settings, stats (admin only, stats for any role)
`GET/POST /api/admin/users`, `PATCH/DELETE /api/admin/users/:id` (cannot demote/disable/delete yourself or the last active admin), `GET/PUT /api/admin/settings`, `GET /api/admin/stats`.

## Data model (MongoDB collections)

`users` (unique `email`, `role`, `status`, `passwordHash`), `projects` (unique `slug`; indexes on `publishedAt`, `category`, `featured`+`featuredOrder`), `services`, `articles` (unique `slug`; indexes `publishedAt`, `category`), `testimonials`, `teammembers`, `enquiries` (unique `reference`; `status` enum new/contacted/qualified/closed; email delivery fields `emailStatus`, `emailAttempts`, `emailError`, `emailNextRetryAt`), `attachments` (private binary), `media` (`url`, `alt`, `width`, `height`, `attribution`), `sitesettings` (singleton). Image sub-documents everywhere carry `url`, `alt`, `width`, `height`, `attribution{creator,source,sourceUrl,license}`.
