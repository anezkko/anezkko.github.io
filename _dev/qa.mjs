// ZID's pre-submit QA in Chromium: every width, reduced motion, offline, internal links, the social card, and the
// keyboard path into a run. Run with _dev/serve.py going:   cd _dev && node qa.mjs [--out out/qa]
// It plays on the demo host (zid.localhost) only and never submits a score.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'out/qa');
fs.mkdirSync(OUT, { recursive: true });
const U = 'http://zid.localhost:8137/';
const IGNORE = /cloudflareinsights|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/;
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const rows = [];
const row = (check, ok, note = '') => { rows.push({ check, ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${check}${note ? '  · ' + note : ''}`); };
async function open(url, ctxOpts = {}) {
  const ctx = await b.newContext(ctxOpts);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { try { sessionStorage.setItem('zid-intro', '1'); } catch (e) {} });
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  return { ctx, p, errs };
}
// 1 · widths, phone-like below 800
for (const w of [360, 390, 768, 1440, 2560]) {
  const phone = w < 800;
  const { ctx, p, errs } = await open(U, { viewport: { width: w, height: phone ? 800 : 1000 }, isMobile: phone, hasTouch: phone, deviceScaleFactor: phone ? 2 : 1 });
  await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
  await p.waitForTimeout(800);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await p.screenshot({ path: path.join(OUT, `w${w}.jpg`), type: 'jpeg', quality: 60, fullPage: true });
  row(`${w} px: no sideways scroll, no errors`, wide <= 0 && !errs.length, wide > 0 ? `${wide}px too wide` : errs.join(' | '));
  await ctx.close();
}
// 2 · reduced motion from the start
{
  const { ctx, p, errs } = await open(U, { viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const st = await p.evaluate(() => ({ intro: document.documentElement.classList.contains('intro-on'), spray: document.documentElement.classList.contains('js-spray') }));
  row('Reduced motion: no intro, no spray-in', !st.intro && !st.spray && !errs.length, JSON.stringify(st));
  await ctx.close();
}
// 3 · offline after one visit and one game load (the service worker needs a real origin: zid.localhost is fine)
{
  const { ctx, p } = await open(U + '#igra', { viewport: { width: 1280, height: 860 } });
  await p.waitForFunction(() => document.documentElement.classList.contains('game-ready'), null, { timeout: 15000 });
  await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 10000 }).catch(() => {});
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2500);   /* a second load, now through the worker, saves the game files */
  await ctx.setOffline(true);
  await p.reload({ waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  const off = await p.evaluate(() => ({ h1: !!document.querySelector('#hero-h'), game: document.documentElement.classList.contains('game-ready') }));
  row('Offline after one visit: page and game load', off.h1 && off.game, JSON.stringify(off));
  await ctx.close();
}
// 4 · internal links on the home page, the press kit and the 404 page
{
  const seen = new Set(), bad = [], ext = new Set();
  for (const page of ['', 'press/', 'no-such-wall']) {
    const { ctx, p } = await open(U + page, { viewport: { width: 1280, height: 860 } });
    const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href], link[href], img[src], source[srcset]')].map((e) => e.href || e.src || (e.srcset || '').split(',').map((x) => new URL(x.trim().split(' ')[0], location.href).href)).flat());
    for (const h of hrefs) {
      const u = new URL(h, U + page);
      if (u.origin !== new URL(U).origin) { if (/^https?:/.test(u.protocol)) ext.add(u.origin + u.pathname); continue; }
      const key = u.origin + u.pathname;
      if (seen.has(key)) continue; seen.add(key);
      const st = await p.evaluate((k) => fetch(k, { cache: 'no-store' }).then((r) => r.status, () => 0), key);   /* from the page: Node can't resolve zid.localhost */
      if (!st || st >= 400) bad.push(`${st || 'x'} ${u.pathname} (on /${page})`);
    }
    // in-page anchors
    const missing = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !/^#(beat=|bihac$|igra$|tabela$)/.test(h) && !document.getElementById(h.slice(1))));
    for (const m of missing) bad.push(`missing anchor ${m} (on /${page})`);
    await ctx.close();
  }
  row(`Internal links and files (${seen.size} checked)`, !bad.length, bad.join(' | '));
  fs.writeFileSync(path.join(OUT, 'external-links.txt'), [...ext].sort().join('\n') + '\n');
  row(`External links listed for a manual check (${ext.size})`, true, 'external-links.txt');
}
// 5 · the social card
{
  const { ctx, p } = await open(U, { viewport: { width: 1280, height: 860 } });
  const og = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map((m) => [m.getAttribute('property') || m.getAttribute('name'), m.content])));
  const img = await p.evaluate(() => fetch('og-image.jpg', { cache: 'no-store' }).then((r) => r.status, () => 0));
  const need = ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card'];
  const miss = need.filter((k) => !og[k]);
  row('Social card tags and image', !miss.length && img === 200, miss.length ? 'missing ' + miss.join(', ') : `${og['og:title']} · image ${img}`);
  await ctx.close();
}
// 6 · keyboard: Tab to Start (PRESS START), Enter: the run begins at once and has the keys
{
  const { ctx, p } = await open(U + '#igra', { viewport: { width: 1280, height: 860 } });
  await p.waitForFunction(() => document.documentElement.classList.contains('game-ready'));
  let i = 0; for (; i < 120; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement.id === 'btn-start')) break; }
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  const z = await p.evaluate(() => document.activeElement.id);
  const run = await p.evaluate(() => document.activeElement.id === 'game' && document.getElementById('game').classList.contains('playing'));
  row('Keyboard only: Tab → Press start → run', run, `Start after ${i + 1} Tabs; then ${z}`);
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify(rows, null, 1));
console.log(`\n${rows.filter((r) => r.ok).length}/${rows.length} passed · screenshots and lists in ${path.relative(process.cwd(), OUT)}`);
