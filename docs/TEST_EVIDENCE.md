# Test evidence

Results from the final build (all passing). Re-run with the commands shown.

| Layer | Command | Result |
|---|---|---|
| Type-check (backend + frontend, strict) | `npm run typecheck` | 0 errors |
| API tests (supertest) | `npm --prefix backend test` | **70 / 70** |
| UI tests (Vitest + Testing Library + vitest-axe) | `npm --prefix frontend test` | **12 / 12** |
| Real-browser flow (Chrome) | `npm --prefix e2e run flow` | **30 / 30** |
| WCAG scan (axe-core, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) | `npm --prefix e2e run axe` | **0 violations** on 11 public routes |
| Production builds | `npm run build` | OK |

## What the tests cover (mapped to the brief)

- **Form validation:** `frontend/src/test/enquiryForm.test.ts` (required fields, email/phone, message length, attachment type/size), `components.test.tsx` (error summary, focus, `aria-invalid`, no API call while invalid, honeypot), `backend/tests/enquiry.test.ts` (server validation, honeypot, time trap, link limit, duplicates, attachment type spoofing and size, HTML escaped in staff email, CSV formula neutralising, email failure keeps enquiry and records a retryable error, retry succeeds, rate limiting).
- **API permissions:** `backend/tests/permissions.test.ts` (signed-out 401, editor 403 on enquiries/users/settings, admin allowed, CSRF header required, disabled accounts rejected, forged tokens rejected, no privilege escalation, admins cannot disable or delete themselves).
- **Project filters:** `backend/tests/public.test.ts` (category, location, search, sort, pagination, facets, unpublished projects return 404, related projects, sitemap lists published only).
- **Admin CRUD:** `backend/tests/admin.test.ts` (create with generated unique slug, blank slug, partial update, publish/unpublish, HTML stripping, alt required, featured reorder, delete, malformed ids).
- **Accessibility basics:** axe in unit tests (contact form, lightbox) and in real Chrome across all public pages; lightbox keyboard behaviour.
- **Mobile/desktop flows:** `e2e/flow.mjs` plus screenshots at 360, 768, 1024, 1440 px for seven pages in `docs/screenshots/` and a check for horizontal overflow (found and fixed a 360px overflow on the contact form during testing).

## Bugs found by testing and fixed during the build
1. Saving a new project with the slug left blank was rejected although the form says "leave blank to generate": fixed in the schema, regression test added.
2. Contact form overflowed horizontally at 360px (file input width): fixed in CSS.

## Screenshots
`docs/screenshots/<page>-<width>.png` for home, projects, project-detail, services, journal, enquiry, design-system. **Note:** they were captured in a sandbox that could not reach the Pexels CDN, so photography shows the built-in grey fallback. Re-run `npm --prefix e2e run screenshots` on your machine to capture them with real photos.

## Honest caveats
- API tests were executed against FerretDB (MongoDB-compatible) because MongoDB binaries could not be downloaded in the build sandbox. They are written against standard Mongoose/MongoDB behaviour; please run them once against your own MongoDB.
- Email was tested with a mock transport, not a live SMTP server. Cloudinary was not tested with a live account.
- No manual screen-reader testing was done.
