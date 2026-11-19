// Generates the hi-fi desktop + mobile mockups (SVG + PNG) for Home, Project detail and Enquiry.
// Run: node design/build-mockups.mjs   (needs puppeteer-core + Chrome for the PNG step; SVGs are always written)
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'mockups');
mkdirSync(out, { recursive: true });

const C = { ink: '#1b2224', ink2: '#2b3537', paper: '#eef1ec', paper2: '#e3e8e1', white: '#fbfcfa', stone: '#cbd1ca', stone2: '#aab3ab', line: '#bcc4bb', muted: '#4a5658', fjord: '#25565c', fjord100: '#d9e7e5', danger: '#9b2626' };
const SERIF = "'Instrument Serif', Georgia, serif";
const SANS = "'Hanken Grotesk Variable', 'Hanken Grotesk', system-ui, sans-serif";
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wrap = (s, n) => { const w = s.split(' '); const l = []; let c = ''; for (const x of w) { if ((c + ' ' + x).trim().length > n) { l.push(c); c = x; } else c = (c + ' ' + x).trim(); } if (c) l.push(c); return l; };

class Sheet {
  constructor(w) { this.w = w; this.parts = []; this.y = 0; }
  rect(x, y, w, h, fill, o = {}) { this.parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1.5}"` : ''}${o.r ? ` rx="${o.r}"` : ''}/>`); }
  line(x1, y1, x2, y2, c = C.line, sw = 1) { this.parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}"/>`); }
  text(x, y, s, o = {}) {
    const { size = 17, fam = SANS, fill = C.ink, weight = 400, lh = 1.55, max = 0, anchor = 'start', ls = 0 } = o;
    const lines = max ? wrap(s, max) : [s];
    this.parts.push(`<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? size * lh : 0}">${esc(l)}</tspan>`).join('')}</text>`);
    return y + (lines.length - 1) * size * lh;
  }
  img(x, y, w, h, caption = '') {
    this.rect(x, y, w, h, C.stone);
    this.parts.push(`<path d="M${x} ${y + h} L${x + w * 0.32} ${y + h * 0.52} L${x + w * 0.5} ${y + h * 0.74} L${x + w * 0.68} ${y + h * 0.42} L${x + w} ${y + h} Z" fill="${C.stone2}" opacity=".7"/><circle cx="${x + w * 0.2}" cy="${y + h * 0.25}" r="${Math.min(w, h) * 0.06}" fill="${C.stone2}" opacity=".8"/>`);
    if (caption) this.text(x, y + h + 24, caption, { size: 14, fill: C.muted });
  }
  btn(x, y, label, o = {}) {
    const w = o.w ?? label.length * 9.2 + 48, h = o.h ?? 48;
    this.rect(x, y, w, h, o.outline ? 'none' : o.fill ?? C.fjord, { stroke: o.outline ? C.ink : undefined, r: 2 });
    this.text(x + w / 2, y + h / 2 + 5.5, label, { size: 16, weight: 600, fill: o.outline ? C.ink : C.white, anchor: 'middle' });
    return w;
  }
  field(x, y, w, label, value = '', o = {}) {
    this.text(x, y, label, { size: 14, weight: 600 });
    this.rect(x, y + 10, w, o.h ?? 46, C.white, { stroke: o.error ? C.danger : C.ink2, sw: o.error ? 2 : 1.5, r: 2 });
    if (value) this.text(x + 14, y + 39, value, { size: 16, fill: o.ph ? C.muted : C.ink });
    if (o.chev) this.text(x + w - 28, y + 38, '▾', { size: 15 });
    if (o.error) this.text(x, y + (o.h ?? 46) + 34, o.error, { size: 13.5, fill: C.danger, weight: 500 });
    return y + (o.h ?? 46) + (o.error ? 50 : 24) + 10;
  }
  header(w, mobile) {
    this.rect(0, 0, w, mobile ? 64 : 72, C.paper); this.line(0, mobile ? 64 : 72, w, mobile ? 64 : 72);
    this.text(mobile ? 20 : 48, mobile ? 40 : 46, 'Atelier North', { size: mobile ? 25 : 28, fam: SERIF });
    if (mobile) { this.rect(w - 90, 12, 70, 40, 'none', { stroke: C.ink, r: 2 }); this.text(w - 55, 38, 'Menu', { size: 15, weight: 600, anchor: 'middle' }); }
    else { ['Projects', 'Services', 'About', 'Journal'].forEach((s, i) => this.text(w - 640 + i * 88, 42, s, { size: 16, weight: 500 })); this.btn(w - 232, 14, 'Book a consultation', { h: 44 }); }
  }
  footer(y, w, mobile) {
    this.rect(0, y, w, mobile ? 470 : 300, C.ink);
    const px = mobile ? 20 : 48;
    this.text(px, y + 70, 'Atelier North', { size: 32, fam: SERIF, fill: C.white });
    this.text(px, y + 108, 'Architecture and interiors, Bergen.', { size: 15, fill: C.stone, max: 40 });
    const cols = [['Studio', 'Projects', 'Services', 'About', 'Journal'], ['Contact', 'studio@atelier-north.example', '+47 55 00 00 00', 'Book a consultation'], ['Legal', 'Privacy notice', 'Cookie choices']];
    cols.forEach((c, i) => c.forEach((s, j) => this.text(mobile ? px + (i % 2) * 170 : w - 700 + i * 230, y + (mobile ? 170 + Math.floor(i / 2) * 140 : 70) + j * 28, s, { size: j ? 14.5 : 15, weight: j ? 400 : 700, fill: j ? C.stone : C.white })));
    this.text(px, y + (mobile ? 400 : 270), '© 2026 Atelier North. Demo content: names, projects and photography are fictional or credited placeholders.', { size: 13, fill: C.stone2, max: mobile ? 46 : 130 });
  }
  svg(h) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${h}" viewBox="0 0 ${this.w} ${h}"><rect width="${this.w}" height="${h}" fill="${C.paper}"/>${this.parts.join('')}</svg>`; }
}

/* ---------------- HOME ---------------- */
function home(mobile) {
  const w = mobile ? 390 : 1440, s = new Sheet(w), px = mobile ? 20 : 48; s.header(w, mobile);
  let y = mobile ? 120 : 160;
  s.rect(0, 0, 0, 0, 'none');
  const hl = mobile ? 46 : 104;
  const lines = mobile ? ['Rooms and', 'buildings shaped', 'by light, weather', 'and the people', 'who use them.'] : ['Rooms and', 'buildings shaped', 'by light, weather', 'and the people', 'who use them.'];
  lines.forEach((l, i) => s.text(px, y + i * hl * 0.95, l, { size: hl, fam: SERIF, ls: -1 }));
  y += lines.length * hl * 0.95 + 20;
  s.text(px, y, 'Atelier North is a small studio of architects and interior designers. We design homes, workplaces and hotels that feel calm on day one and better a decade after.', { size: mobile ? 17 : 21, max: mobile ? 36 : 58, fill: C.ink2 });
  y += (mobile ? 130 : 130); s.btn(px, y, 'Book a consultation'); s.btn(px + (mobile ? 0 : 250), y + (mobile ? 64 : 0), 'See our projects', { outline: true });
  if (mobile) { y += 150; s.img(px, y, w - 40, 340, 'Photo: Pexels contributor'); y += 410; }
  else { s.img(860, 120, 532, 660, 'Photo: Pexels contributor'); s.line(838, 120, 838, 780, C.ink, 1.5); y = 860; }
  // positioning + stats
  s.line(px, y, w - px, y); y += 70;
  s.text(px, y, 'We start with how you want to live, then let the site, the climate and the budget shape the building.', { size: mobile ? 30 : 48, fam: SERIF, max: mobile ? 22 : 42, lh: 1.12 }); y += mobile ? 190 : 200;
  [['18', 'years in practice'], ['64', 'completed projects'], ['9', 'national awards']].forEach(([v, l], i) => { const x = mobile ? px : px + i * 300, yy = mobile ? y + i * 90 : y; s.text(x, yy, v, { size: 56, fam: SERIF }); s.text(x + (mobile ? 90 : 0), yy + (mobile ? -10 : 30), l, { size: 15, fill: C.muted }); });
  y += mobile ? 290 : 100;
  // selected projects
  s.text(px, y, 'Selected projects', { size: mobile ? 36 : 56, fam: SERIF }); s.text(w - px, y - 4, 'All projects', { size: 16, weight: 600, anchor: 'end', fill: C.fjord }); y += 40;
  const cw = mobile ? w - 40 : 424, ch = mobile ? 240 : 320;
  ['Ridge Glasshouse', 'Harbour Loft', 'Fjordside Cabin'].slice(0, mobile ? 2 : 3).forEach((t, i) => { const x = mobile ? px : px + i * (cw + 32), yy = mobile ? y + i * (ch + 110) : y; s.img(x, yy, cw, ch); s.text(x, yy + ch + 34, t, { size: 28, fam: SERIF }); s.text(x, yy + ch + 60, 'Residential · Bergen · 2025', { size: 14.5, fill: C.muted }); });
  y += mobile ? 2 * (ch + 110) + 20 : ch + 140;
  // services
  s.rect(0, y, w, mobile ? 720 : 420, C.paper2); y += 70;
  s.text(px, y, 'Services', { size: mobile ? 36 : 56, fam: SERIF }); y += 50;
  [['Architecture', 'New homes and extensions, from first sketch to completion.'], ['Interior design', 'Layouts, materials and furniture that suit the way you live.'], ['Renovation', 'Careful updates to existing buildings, keeping what works.']].forEach(([t, d], i) => { const x = mobile ? px : px + i * 456, yy = mobile ? y + i * 170 : y; s.line(x, yy, x + (mobile ? w - 40 : 410), yy, C.ink, 1.5); s.text(x, yy + 44, t, { size: 30, fam: SERIF }); s.text(x, yy + 76, d, { size: 16, max: mobile ? 40 : 44, fill: C.ink2 }); });
  y += mobile ? 610 : 290;
  // process
  s.text(px, y + 20, 'How a project works', { size: mobile ? 36 : 56, fam: SERIF }); y += 90;
  ['Conversation', 'Concept', 'Design development', 'Construction'].forEach((t, i) => { const x = mobile ? px : px + i * 340, yy = mobile ? y + i * 78 : y; s.text(x, yy, `${i + 1}`, { size: 40, fam: SERIF, fill: C.fjord }); s.text(x + 44, yy - 4, t, { size: 19, weight: 700 }); if (!mobile) s.text(x + 44, yy + 26, 'A short line on what happens and what you receive.', { size: 15, fill: C.muted, max: 30 }); });
  y += mobile ? 330 : 140;
  // testimonial
  s.text(px, y, '“They listened first. The house feels like it has always been there.”', { size: mobile ? 32 : 52, fam: SERIF, max: mobile ? 22 : 44, lh: 1.12 }); y += mobile ? 190 : 140; s.text(px, y, 'Ingrid Solheim, Ridge Glasshouse', { size: 16, fill: C.muted }); y += 90;
  // CTA band
  s.rect(0, y, w, mobile ? 360 : 300, C.fjord);
  s.text(px, y + 100, 'Tell us about your project', { size: mobile ? 38 : 64, fam: SERIF, fill: C.white, max: mobile ? 18 : 40, lh: 1.1 });
  s.btn(px, y + (mobile ? 230 : 160), 'Book a consultation', { fill: C.white }); s.parts[s.parts.length - 1] = s.parts[s.parts.length - 1].replace(`fill="${C.white}"`, `fill="${C.fjord}"`);
  y += mobile ? 360 : 300; s.footer(y, w, mobile); y += mobile ? 470 : 300;
  if (mobile) { s.rect(0, 744, w, 66, C.ink); s.btn(20, 752, 'Book a consultation', { w: w - 40, fill: C.white }); s.parts[s.parts.length - 1] = s.parts[s.parts.length - 1].replace(`fill="${C.white}"`, `fill="${C.ink}"`); }
  return s.svg(y);
}

/* ---------------- PROJECT DETAIL ---------------- */
function project(mobile) {
  const w = mobile ? 390 : 1440, s = new Sheet(w), px = mobile ? 20 : 48; s.header(w, mobile);
  let y = mobile ? 100 : 118; s.text(px, y, 'Projects / Residential / Ridge Glasshouse', { size: 14, fill: C.muted }); y += mobile ? 70 : 100;
  s.text(px, y, 'Ridge Glasshouse', { size: mobile ? 52 : 112, fam: SERIF, ls: -1 }); y += mobile ? 40 : 56;
  s.text(px, y, 'A long glazed house on a wind-swept ridge, cooled by deep eaves and a planted roof.', { size: mobile ? 17 : 22, fill: C.ink2, max: mobile ? 36 : 70 }); y += mobile ? 90 : 70;
  // title block
  const facts = [['Location', 'Bergen, Norway'], ['Year', '2025'], ['Area', '3,200 sq ft'], ['Category', 'Residential']];
  const bw = mobile ? w - 40 : w - 96, bh = mobile ? 200 : 96; s.rect(px, y, bw, bh, 'none', { stroke: C.ink, sw: 1.5 });
  facts.forEach(([k, v], i) => { const cw = mobile ? bw / 2 : bw / 4, x = px + (mobile ? (i % 2) * cw : i * cw), yy = y + (mobile ? Math.floor(i / 2) * 100 : 0); if (i && (!mobile || i % 2)) s.line(x, yy, x, yy + (mobile ? 100 : bh), C.ink, 1.5); s.text(x + 18, yy + 36, k, { size: 13.5, fill: C.muted, weight: 600 }); s.text(x + 18, yy + 70, v, { size: mobile ? 19 : 24, fam: SERIF }); });
  if (mobile) s.line(px, y + 100, px + bw, y + 100, C.ink, 1.5);
  y += bh + 40;
  // gallery
  if (mobile) { s.img(px, y, w - 40, 260, 'Open image gallery (1 of 4)'); y += 300; [0, 1].forEach((i) => s.img(px + i * 175, y, 165, 120)); y += 190; }
  else { s.img(px, y, 800, 540); s.img(872, y, 520, 260); s.img(872, y + 280, 520, 260); y += 600; s.text(px, y, 'Click any image to open the gallery. Arrow keys move between images, Escape closes.', { size: 14, fill: C.muted }); y += 80; }
  // brief/approach
  const colw = mobile ? w - 40 : 560;
  s.text(px, y, 'Brief', { size: 40, fam: SERIF }); s.text(px, y + 44, 'The clients wanted a house that opened to the valley without overheating in summer or losing heat in winter, built from materials that age well.', { size: 17, max: mobile ? 38 : 60 });
  const ay = mobile ? y + 200 : y; const ax = mobile ? px : 760;
  s.text(ax, ay, 'Approach', { size: 40, fam: SERIF }); s.text(ax, ay + 44, 'A single long bar with solid concrete ends and a glazed spine. Deep eaves, fixed timber louvres and a planted roof reduce solar gain.', { size: 17, max: mobile ? 38 : 60 });
  y = (mobile ? ay + 220 : y + 220);
  s.text(px, y, 'Scope of work', { size: 28, fam: SERIF }); ['Architecture', 'Landscape design', 'Interior design', 'Furniture selection'].forEach((t, i) => { s.text(px + 20, y + 40 + i * 30, '•  ' + t, { size: 16 }); }); y += 190;
  // related
  s.text(px, y, 'Related projects', { size: mobile ? 36 : 48, fam: SERIF }); y += 30;
  const rc = mobile ? 1 : 3, rw = mobile ? w - 40 : 424;
  for (let i = 0; i < rc; i++) { const x = px + i * (rw + 32); s.img(x, y, rw, mobile ? 220 : 290); s.text(x, y + (mobile ? 260 : 330), ['Harbour Loft', 'Birch Pavilion', 'Stone House'][i], { size: 26, fam: SERIF }); }
  y += mobile ? 320 : 420;
  s.rect(0, y, w, mobile ? 280 : 240, C.fjord); s.text(px, y + 90, 'Planning something similar?', { size: mobile ? 34 : 56, fam: SERIF, fill: C.white, max: mobile ? 20 : 40 }); s.btn(px, y + (mobile ? 170 : 150), 'Discuss a similar project', { fill: C.white }); s.parts[s.parts.length - 1] = s.parts[s.parts.length - 1].replace(`fill="${C.white}"`, `fill="${C.fjord}"`);
  y += mobile ? 280 : 240; s.footer(y, w, mobile); return s.svg(y + (mobile ? 470 : 300));
}

/* ---------------- ENQUIRY ---------------- */
function enquiry(mobile) {
  const w = mobile ? 390 : 1440, s = new Sheet(w), px = mobile ? 20 : 48; s.header(w, mobile);
  let y = mobile ? 130 : 180; s.text(px, y, 'Tell us about your project', { size: mobile ? 44 : 96, fam: SERIF, max: mobile ? 16 : 40, lh: 1 }); y += mobile ? 100 : 40;
  s.text(px, y + 30, 'The form takes about three minutes. We reply within two working days.', { size: mobile ? 17 : 21, fill: C.ink2, max: mobile ? 34 : 60 }); y += mobile ? 130 : 100;
  let ix = px, iy = y;
  if (!mobile) { [['Studio', 'Studio 3, Old Rope Works, Bergen'], ['Opening hours', 'Mon to Fri, 9:00 to 17:00'], ['Email', 'studio@atelier-north.example'], ['Phone', '+47 55 00 00 00'], ['Find us', 'Open the map']].forEach(([k, v], i) => { s.text(ix, iy + i * 84, k, { size: 14.5, fill: C.muted, weight: 600 }); s.text(ix, iy + 30 + i * 84, v, { size: 20, max: 28 }); }); }
  const fx = mobile ? px : 560, fw = mobile ? w - 40 : 832, fy = y - (mobile ? 20 : 20);
  s.rect(fx - (mobile ? 0 : 0), fy, fw, mobile ? 1560 : 1190, C.white, { stroke: C.line });
  let cy = fy + 36; const cx = fx + 24, inner = fw - 48;
  // error summary
  s.rect(cx, cy, inner, mobile ? 120 : 96, '#f6e3e0', { stroke: C.danger, sw: 1.5 }); s.text(cx + 18, cy + 30, 'Please fix 2 problems before sending', { size: 16, weight: 700, fill: '#5b1313' }); s.text(cx + 18, cy + 56, 'Email: Enter a valid email address.', { size: 14.5, fill: '#5b1313' }); s.text(cx + 18, cy + 78, 'Privacy: Please agree to the notice.', { size: 14.5, fill: '#5b1313' }); cy += mobile ? 150 : 130;
  const half = mobile ? inner : (inner - 24) / 2;
  const row = (a, b) => { if (mobile) { cy = s.field(cx, cy, inner, a[0], a[1], a[2]); if (b) cy = s.field(cx, cy, inner, b[0], b[1], b[2]); } else { const y1 = s.field(cx, cy, half, a[0], a[1], a[2]); const y2 = b ? s.field(cx + half + 24, cy, half, b[0], b[1], b[2]) : y1; cy = Math.max(y1, y2); } };
  row(['Your name', 'Ingrid Solheim'], ['Email', 'ingrid@example', { error: 'Enter a valid email address, like name@example.com.' }]);
  row(['Phone (optional)', '+47 900 00 000'], ['Project location', 'Bergen, Norway']);
  row(['Project type', 'Renovation', { chev: true }], ['Budget range', '$150k – $500k', { chev: true }]);
  cy = s.field(cx, cy, inner, 'Timeline', 'Within 3–6 months', { chev: true });
  cy = s.field(cx, cy, inner, 'About your project', mobile ? 'We want to renovate a 1960s house…' : 'We want to renovate a 1960s house and keep its character…', { h: 150 });
  s.text(cx, cy - 6, 'What do you want to build or change, and what matters most? 58/4000', { size: 13.5, fill: C.muted, max: mobile ? 46 : 100 }); cy += mobile ? 40 : 14;
  s.text(cx, cy, 'Attachment (optional)', { size: 14, weight: 600 }); s.rect(cx, cy + 10, inner, 64, C.white, { stroke: '#8a9690', r: 2 }); s.btn(cx + 14, cy + 22, 'Choose file', { outline: true, h: 40, w: 130 }); s.text(cx + 160, cy + 48, 'site-plan.pdf', { size: 15 }); cy += 110;
  s.rect(cx, cy, 22, 22, C.white, { stroke: C.danger, sw: 2, r: 2 }); s.text(cx + 34, cy + 16, 'I agree that Atelier North may store my details to reply, as described in the privacy notice.', { size: 15.5, max: mobile ? 40 : 90 }); s.text(cx, cy + (mobile ? 90 : 60), 'Please agree to the privacy notice so we can reply.', { size: 13.5, fill: C.danger, weight: 500 }); cy += mobile ? 130 : 100;
  s.btn(cx, cy, 'Send enquiry'); 
  const end = fy + (mobile ? 1560 : 1190) + 80; s.footer(end, w, mobile);
  return s.svg(end + (mobile ? 470 : 300));
}

const sets = [['home', home], ['project-detail', project], ['enquiry', enquiry]];
const files = [];
for (const [name, fn] of sets) for (const [suffix, mobile] of [['desktop', false], ['mobile', true]]) { const f = `${name}-${suffix}`; writeFileSync(join(out, `${f}.svg`), fn(mobile)); files.push(f); }
console.log('wrote', files.length, 'SVG mockups');

try {
  const { default: puppeteer } = await import('puppeteer-core');
  const font = (f) => readFileSync(join(here, 'fonts', f)).toString('base64');
  const css = `@font-face{font-family:'Instrument Serif';src:url(data:font/woff2;base64,${font('instrument-serif-latin-400-normal.woff2')})}@font-face{font-family:'Hanken Grotesk Variable';font-weight:100 900;src:url(data:font/woff2;base64,${font('hanken-grotesk-latin-wght-normal.woff2')})}body{margin:0}`;
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  for (const f of files) {
    const svg = readFileSync(join(out, `${f}.svg`), 'utf8'); const [, W, H] = svg.match(/width="(\d+)" height="(\d+)"/);
    await p.setViewport({ width: +W, height: +H });
    await p.setContent(`<style>${css}</style>${svg}`); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(out, `${f}.png`), clip: { x: 0, y: 0, width: +W, height: +H } });
  }
  await b.close(); console.log('rendered PNGs');
} catch (e) { console.log('PNG step skipped:', e.message); }
