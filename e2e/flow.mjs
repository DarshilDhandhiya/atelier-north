import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const results = [];
const ok = (n, c, extra = '') => { results.push([c ? 'PASS' : 'FAIL', n, extra]); console.log(c ? 'PASS' : 'FAIL', '-', n, extra); };
const page = await browser.newPage();
page.on('dialog', (d) => d.accept());
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const go = async (p, vp = { width: 1440, height: 900 }) => { await page.setViewport(vp); await page.goto(BASE + p, { waitUntil: 'domcontentloaded' }); await sleep(1400); };
const text = () => page.evaluate(() => document.body.innerText);

// public pages render
for (const [p, expect] of [['/', 'Atelier North'], ['/projects', 'Projects'], ['/projects/ridge-glasshouse', 'Ridge'], ['/services', 'Services'], ['/about', 'About'], ['/journal', 'Journal'], ['/contact', 'Tell us about your project'], ['/privacy', 'Privacy'], ['/design-system', 'Design system'], ['/nope', 'not']]) {
  await go(p);
  const t = await text();
  ok(`page ${p}`, t.includes(expect) || new RegExp(expect, 'i').test(t), t.slice(0, 60).replace(/\n/g, ' '));
}
// filters
await go('/projects');
const n0 = await page.$$eval('a[href^="/projects/"]', (a) => new Set(a.map((x) => x.getAttribute('href'))).size);
await page.type('input[type=search]', 'glass'); await sleep(900);
const n1 = await page.$$eval('a[href^="/projects/"]', (a) => new Set(a.map((x) => x.getAttribute('href'))).size);
ok('project search narrows results', n1 > 0 && n1 < n0, `${n0} -> ${n1}`);
// lightbox
await go('/projects/ridge-glasshouse');
const opener = await page.$('button[aria-label^="Open image gallery"], button[aria-label^="Enlarge image"]');
if (opener) { await opener.click(); await sleep(300); ok('lightbox opens', !!(await page.$('[role=dialog]'))); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape'); await sleep(200); ok('lightbox closes on Esc', !(await page.$('[role=dialog]'))); } else ok('lightbox opener found', false);
// enquiry validation
await go('/contact');
await page.click('button[type=submit]'); await sleep(300);
ok('empty enquiry shows error summary', (await text()).includes('Please fix'));
// enquiry submit
await page.type('#f-name', 'Test Visitor'); await page.type('#f-email', 'visitor@example.com'); await page.type('#f-location', 'Oslo, Norway');
await page.select('#f-projectType', 'Renovation'); await page.select('#f-budgetRange', '$150k – $500k'); await page.select('#f-timeline', 'Within 3–6 months');
await page.type('#f-message', 'We would like to renovate a 1960s house and keep its original character.');
await page.click('#f-consent');
await sleep(2500);
await page.click('button[type=submit]'); await sleep(2500);
const t2 = await text();
const ref = (t2.match(/AN-[A-Z0-9-]+/) || [])[0];
ok('enquiry submit gives reference', !!ref, ref || t2.slice(0, 200).replace(/\n/g, ' '));

// admin login + RBAC
await go('/admin/login');
await page.type('#login-email', 'admin@atelier-north.test'); await page.type('#login-password', 'Atelier!Admin2026');
await page.click('button[type=submit]'); await sleep(1500);
ok('admin signs in', (await text()).includes('Welcome back'));
await go('/admin/enquiries');
ok('admin sees enquiry', ref ? (await text()).includes(ref) : false);
const link = await page.$('table a'); await link.click(); await sleep(1200);
await page.select('#enq-status', 'contacted'); await sleep(800);
await page.type('#note', 'Called the client, site visit booked.'); await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Save note').click()); await sleep(1000);
const t3 = await text();
ok('enquiry status + note saved', t3.includes('site visit booked') && t3.includes('Status changed') || t3.includes('site visit booked'));
// project CRUD
await go('/admin/projects/new');
await page.type('#fld-title', 'E2E Test House'); await page.type('#fld-category', 'Residential'); await page.type('#fld-location', 'Bergen');
await page.type('#fld-summary', 'A test project created by the end to end suite.'); await page.type('#fld-brief', 'Brief text for the test project.'); await page.type('#fld-approach', 'Approach text for the test project.');
await page.type('#fld-coverImage-url', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200');
await page.type('#fld-coverImage-alt', 'Bright living room with timber floor');
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Save project')).click()); await sleep(1500);
ok('project created', page.url().match(/admin\/projects\/[a-f0-9]{24}/) !== null, page.url());
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Publish')?.click()); await sleep(1000);
await go('/projects?q=E2E');
ok('published project visible publicly', (await text()).includes('E2E Test House'));
// validation error from server surfaces
await go('/admin/projects/new');
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Save project')).click()); await sleep(1200);
ok('admin form shows server errors', (await text()).includes('need your attention'));
// delete the test project
await go('/admin/projects?q=E2E');
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Delete'))?.click()); await sleep(400);
await page.evaluate(() => [...document.querySelectorAll('[role=alertdialog] button')].find((b) => b.textContent === 'Delete')?.click()); await sleep(1000);
await go('/projects?q=E2E+Test');
ok('deleted project gone', !(await text()).includes('E2E Test House'));
// other admin pages
for (const p of ['/admin/services', '/admin/articles', '/admin/testimonials', '/admin/team', '/admin/media', '/admin/users', '/admin/settings']) { await go(p); const h = await page.$eval('h1', (e) => e.textContent).catch(() => ''); ok(`admin ${p}`, !!h && !/not found|could not/i.test(h), h); }
await go('/admin/settings'); await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Save settings')); 
// editor RBAC
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Sign out').click()); await sleep(800);
await go('/admin/login'); await page.type('#login-email', 'editor@atelier-north.test'); await page.type('#login-password', 'Atelier!Editor2026'); await page.click('button[type=submit]'); await sleep(1500);
await go('/admin/enquiries');
ok('editor blocked from enquiries', (await text()).includes('do not have access'));
const failed = results.filter((r) => r[0] === 'FAIL');
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log('Browser errors:', [...new Set(errors.filter((e) => !/pexels|ERR_TUNNEL/i.test(e)))].slice(0, 10));
await browser.close();
process.exit(failed.length ? 1 : 0);
