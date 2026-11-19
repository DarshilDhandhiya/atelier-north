// Captures desktop/tablet/mobile evidence for the three key flows into ../docs/screenshots
import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.evaluateOnNewDocument(() => localStorage.setItem('an_consent', 'denied'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [w, h] of [[360, 800], [768, 1024], [1024, 768], [1440, 900]]) {
  for (const [name, path] of [['home', '/'], ['projects', '/projects'], ['project-detail', '/projects/ridge-glasshouse'], ['services', '/services/architecture'], ['journal', '/journal'], ['enquiry', '/contact'], ['design-system', '/design-system']]) {
    await p.setViewport({ width: w, height: h });
    await p.goto(BASE + path, { waitUntil: 'networkidle2' }).catch(() => undefined);
    await sleep(1200);
    await p.screenshot({ path: `../docs/screenshots/${name}-${w}.png`, fullPage: w === 360 || w === 1440 });
    console.log('saved', name, w);
  }
}
await b.close();
