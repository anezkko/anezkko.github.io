// The one-command check for ZID: lab speed metrics, Lighthouse scores, axe-core accessibility, console errors and
// screenshots, all against a local copy on http://zid.localhost (demo scoreboard, so nothing reaches the live board).
//
//   cd _dev && npm install && node check.mjs                 full check, results in _dev/out/<time>/
//   node check.mjs --out baseline --no-lighthouse           skip Lighthouse, save into _dev/baseline/
//
// Lab settings match the brief's baseline: a 412x823 phone, 4x CPU slowdown, ~1.6 Mbps down with 150 ms latency.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PORT = +opt('--port', 8137);
const URL = `http://zid.localhost:${PORT}/`;
const OUT = path.join(HERE, opt('--out', `out/${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`));
const CHROME = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
fs.mkdirSync(OUT, { recursive: true });

/* the local server: reuse one that is already up, otherwise start ours */
async function up() { try { const r = await fetch(`http://127.0.0.1:${PORT}/`); return r.ok; } catch { return false; } }
let server = null;
if (!(await up())) {
  server = spawn('python3', [path.join(HERE, 'serve.py'), String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 50 && !(await up()); i++) await new Promise((r) => setTimeout(r, 100));
}

const browser = await chromium.launch({ executablePath: CHROME });
const report = { url: URL, when: new Date().toISOString() };
const consoleErrors = new Set();
const watch = (page, tag) => {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.add(`[${tag}] ${m.text()}`); });
  page.on('pageerror', (e) => consoleErrors.add(`[${tag}] ${e.message}`));
  page.on('requestfailed', (r) => failedRequests.add(`${r.url().slice(0, 90)} (${r.failure() && r.failure().errorText})`));
};
const failedRequests = new Set();
const PHONE = { viewport: { width: 412, height: 823 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36' };

/* 1 · lab metrics on a throttled phone, a true first visit (intro included) */
{
  const ctx = await browser.newContext(PHONE);
  const page = await ctx.newPage(); watch(page, 'lab');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let requests = 0, bytes = 0;
  cdp.on('Network.requestWillBeSent', () => requests++);
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
  await page.addInitScript(() => {
    const m = (window.__m = { lcp: 0, lcpEl: '', cls: 0, long: [], fcp: 0 });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { m.lcp = e.startTime; m.lcpEl = e.element ? (e.element.tagName.toLowerCase() + (e.element.id ? '#' + e.element.id : '') + (e.element.className && typeof e.element.className === 'string' ? '.' + e.element.className.split(' ')[0] : '')) : (e.url || ''); } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) m.long.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(6000);   // let late work and the intro settle
  const m = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const w = window.__m;
    const tbt = w.long.filter(([s]) => s >= w.fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    return { fcp: w.fcp, lcp: w.lcp, lcpEl: w.lcpEl, cls: w.cls, tbt, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd };
  });
  report.lab = { ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * (k === 'cls' ? 1000 : 1)) / (k === 'cls' ? 1000 : 1) : v])), requests, transferKB: Math.round(bytes / 1024) };
  await ctx.close();
}

/* 2 · Lighthouse, mobile preset (skip with --no-lighthouse) */
if (!flag('--no-lighthouse')) {
  try {
    const { default: lighthouse } = await import('lighthouse');
    const { launch } = await import('chrome-launcher');
    const chrome = await launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox'] });
    const r = await lighthouse(URL, { port: chrome.port, output: 'json', logLevel: 'error' });
    const c = r.lhr.categories, a = r.lhr.audits;
    report.lighthouse = {
      performance: Math.round(c.performance.score * 100), accessibility: Math.round(c.accessibility.score * 100),
      bestPractices: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
      fcp: a['first-contentful-paint'].displayValue, lcp: a['largest-contentful-paint'].displayValue,
      tbt: a['total-blocking-time'].displayValue, cls: a['cumulative-layout-shift'].displayValue,
      failing: Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary').map((x) => x.id),
    };
    fs.writeFileSync(path.join(OUT, 'lighthouse.json'), JSON.stringify(r.lhr, null, 1));
    await chrome.kill();
  } catch (e) { report.lighthouse = { error: String(e.message || e) }; }
}

/* 3 · axe-core at phone and desktop width, and 4 · screenshots */
const AXE = fs.readFileSync(path.join(HERE, 'node_modules/axe-core/axe.min.js'), 'utf8');
report.axe = {};
for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); watch(page, `${w}px`);
  await page.addInitScript(() => { try { sessionStorage.setItem('zid-intro', '1'); } catch (e) {} });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // scroll through once so scroll-in reveals have run before the full-page picture
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h * 0.7) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(220); }
  await page.waitForTimeout(1500); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `page-${w}.jpg`), fullPage: true, type: 'jpeg', quality: 78 });
  if (w !== 768) {
    await page.addScriptTag({ content: AXE });
    const res = await page.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })));
    report.axe[`${w}px`] = res;
  }
  await ctx.close();
}
report.consoleErrors = [...consoleErrors];
report.failedRequests = [...failedRequests];

await browser.close();
if (server) server.kill();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

/* the summary */
const L = report.lab, LH = report.lighthouse;
console.log(`\nZID check · ${URL} · results in ${path.relative(process.cwd(), OUT) || OUT}`);
console.log(`Lab (412px phone, 4x CPU, 1.6 Mbps/150 ms): FCP ${L.fcp} ms · LCP ${L.lcp} ms (${L.lcpEl}) · TBT ${L.tbt} ms · CLS ${L.cls} · DCL ${L.dcl} ms · ${L.requests} requests · ${L.transferKB} KB`);
if (LH) console.log(LH.error ? `Lighthouse: ${LH.error}` : `Lighthouse mobile: Performance ${LH.performance} · Accessibility ${LH.accessibility} · Best Practices ${LH.bestPractices} · SEO ${LH.seo}  (LCP ${LH.lcp}, TBT ${LH.tbt}, CLS ${LH.cls})${LH.failing.length ? `\n  failing: ${LH.failing.join(', ')}` : ''}`);
for (const [k, v] of Object.entries(report.axe)) console.log(`axe ${k}: ${v.length ? v.map((x) => `${x.id} (${x.impact}, ${x.nodes})`).join(', ') : 'no violations'}`);
console.log(`Console errors: ${report.consoleErrors.length ? '\n  ' + report.consoleErrors.join('\n  ') : 'none'}`);
if (report.failedRequests.length) console.log(`Failed requests (a sandbox without internet blocks outside hosts; check these are only that):\n  ${report.failedRequests.join('\n  ')}`);
