# Walkthrough script (5–8 minutes)

Record with any screen recorder (QuickTime, OBS, Loom). Start with API and frontend running and a freshly seeded database (`npm run seed -- --reset` from `backend/` if needed). Use a 1440×900 window first, then narrow to mobile width in step 8.

| Time | Show | Say |
|---|---|---|
| 0:00 | Home page | Who it is for and the structure: hero, positioning, selected projects, services, process, testimonial, consultation CTA. Point at the persistent header CTA (and the sticky bottom bar on mobile). |
| 0:45 | Projects page | Filter by category, location, search "glass", change sort, paginate. Note URL updates. Reload to show state persists. |
| 1:30 | Project detail | Title block, gallery. Open lightbox, use arrow keys, Esc, show focus returns. Related projects. "Discuss a similar project" prefilled enquiry. |
| 2:30 | Services, About, Journal | Service page (deliverables, steps, FAQ, CTA). Journal category filter, article with reading time. |
| 3:15 | Contact: validation | Submit empty: error summary and focus. Fix fields. Try a 12 MB file to show the file error. |
| 4:00 | Contact: success | Submit valid form with PDF. Show reference ID. |
| 4:30 | Admin: enquiries | Sign in as admin. Open enquiry, change status, assign, add note. Show email status (MailHog or *skipped/failed*), click *Retry email*. Export CSV. |
| 5:30 | Admin: content | Create project (blank slug, alt text required), upload image, publish; show it live. Reorder featured projects. Unpublish. |
| 6:30 | Roles | Sign in as editor: Enquiries/Users/Settings absent; open the URL directly to show "no access". |
| 7:00 | Quality | Resize to 360px. Show `/design-system`, sitemap.xml. Mention tests: 70 API, 12 UI, 30 browser checks, axe 0 violations. |
| 7:45 | Wrap | Limitations and next steps from the design note. |
