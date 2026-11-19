import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
await p.evaluateOnNewDocument(() => localStorage.setItem('an_consent', 'denied'));
const pages = ['/', '/projects', '/projects/ridge-glasshouse', '/services', '/services/architecture', '/about', '/journal', '/contact', '/privacy', '/design-system', '/nope'];
let total = 0;
for (const path of pages) {
  await p.goto((process.env.BASE_URL ?? 'http://127.0.0.1:5173') + path); await new Promise(r => setTimeout(r, 1800));
  await p.evaluate(axeSrc);
  const res = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));
  total += res.violations.length;
  console.log(path, res.violations.length ? '' : 'OK', res.violations.map(v => `${v.id}(${v.nodes.length}): ${v.nodes[0].target}`).join(' | '));
}
console.log('TOTAL violations', total); await b.close(); process.exit(total ? 1 : 0);
