// The submission screen recording: ~25 s at 30 fps, 1280×720, made frame by frame on a fake clock so it's smooth
// on any machine: the hero wall gets sprayed, zone 1 is played by an autopilot, then the Stari Most dive.
//   cd _dev && node record.mjs          → out/record/zid-recording.mp4 (needs ffmpeg)
// Runs on the demo host (zid.localhost) and never submits a score. The autopilot needs a handle on the game, so
// this session's copy of js/game.js gets one line added on the way in (window.__G); the site itself is unchanged.
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out', 'record'), FR = path.join(OUT, 'frames');
fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const U = 'http://zid.localhost:8137/', DT = 32;
/* wait until the hero train's wagon is fully in view, then press its pause button so it stays there */
async function inView(p) {
  await p.waitForFunction(() => {
    const w = document.getElementById('wall').getBoundingClientRect(), c = document.querySelector('.canvas-car').getBoundingClientRect();
    return c.width > 0 && c.left > w.left + w.width * 0.2 && c.right < w.right - 8;
  }, null, { timeout: 40000 }).catch(() => {});
  await p.evaluate(() => { const b = document.getElementById('wall-still'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
}
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
/* no service worker: it would fetch js/game.js itself, past the route that adds the handle */
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.route('**/js/game.js', async (route) => {
  let js = fs.readFileSync(path.join(HERE, '..', 'js', 'game.js'), 'utf8');   /* from disk: Node can't resolve zid.localhost */
  const at = '  return { init, play, card:';
  if (!js.includes(at)) throw new Error('game.js changed: update the hook in record.mjs');
  js = js.replace(at, `  window.__G = { setupZone, showCard, beginZone, P, S, startGame,
    get state() { return state; }, get track() { return track; }, get cam() { return cam; }, get speed() { return speed; },
    get fin() { return fin; }, get PX() { return PX; } };\n` + at);
  await route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: js });
});
await p.addInitScript(() => { try { sessionStorage.setItem('zid-intro', '1'); localStorage.setItem('zid.lang', '"en"'); } catch (e) {} });
await p.goto(U, { waitUntil: 'load' });
await p.addStyleTag({ content: '.demo .demo-note,.ticker,.wall-hint{display:none!important} html{scroll-behavior:auto!important}' });
await p.waitForTimeout(1500);
await p.evaluate(() => { try { Sound.ensure(); } catch (e) {} });
/* the hero's train keeps rolling until someone paints (and before the fake clock takes over): pause it with its
   wagon in view */
await inView(p);
await p.clock.install(); await p.clock.pauseAt(Date.now() + 1000);
let n = 0;
const frame = async () => { await p.clock.runFor(DT); await p.screenshot({ path: path.join(FR, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 }); };

// A · the wall: a word goes up, then a hand-sprayed stroke (about 5 s)
await p.evaluate(() => scrollTo(0, 0));
for (let i = 0; i < 12; i++) await frame();
await p.evaluate(() => { const keep = Math.random, q = [0, 0.6, 0.3, 0.4]; Math.random = () => (q.length ? q.shift() : keep()); document.querySelectorAll('.st-spray')[4].click(); Math.random = keep; });
for (let i = 0; i < 40; i++) await frame();
await p.evaluate(() => document.querySelectorAll('.can')[1].click());
const box = await (await p.$('#wall-canvas')).boundingBox();
await p.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.78); await p.mouse.down();
for (let i = 0; i <= 60; i++) { await p.mouse.move(box.x + box.width * (0.45 + i * 0.008), box.y + box.height * (0.78 - Math.sin(i / 9) * 0.1)); await frame(); }
await p.mouse.up();
for (let i = 0; i < 30; i++) await frame();

// the game: centred on screen, zone by zone through the handle
await p.evaluate(() => { document.querySelector('[data-play]').click(); });
/* the clock is paused, so wait by running it: polling would stand still too */
for (let k = 0; k < 150 && !(await p.evaluate(() => !!window.__G)); k++) { await p.clock.runFor(100); await new Promise((r) => setTimeout(r, 50)); }
if (!(await p.evaluate(() => !!window.__G))) throw new Error('the game did not load');
await p.evaluate(() => document.getElementById('game').scrollIntoView({ block: 'center' }));
const pilot = () => p.evaluate(() => {
  const G = __G, out = { jump: false, spray: false, dive: false, state: G.state };
  if (G.state === 'aim') { out.dive = Math.abs(G.fin.m - 0.5) < 0.05; return out; }
  if (G.state !== 'run' || !G.track) return out;
  const PX = G.PX, cam = G.cam, v = Math.max(60, G.speed), P = G.P;
  for (const o of G.track.obs) {
    const sx = o.x - cam;
    if (o.hit || sx + o.w < PX - 10) continue;
    if (sx > PX + 700) break;
    if (o.air || o.type === 'grana') continue;
    const t = (sx - (PX + 22)) / v;
    if (t > 0.04 && t < 0.24 && P.onGround) out.jump = true;
    break;
  }
  for (const wl of G.track.walls) {
    const sx = wl.x - cam;
    if (sx + wl.w < PX - 10) continue;
    if (sx > PX + 260) break;
    out.spray = !!wl.paintable && !wl.bad && !wl.done;
    break;
  }
  return out;
});
let sprayDown = false, jumpHold = 0;
async function step(record) {
  const a = await pilot();
  if (a.dive) await p.keyboard.press(' ');
  if (a.jump && jumpHold === 0) { await p.keyboard.down(' '); jumpHold = 7; }
  if (jumpHold > 0 && --jumpHold === 0) await p.keyboard.up(' ');
  if (a.spray !== sprayDown) { sprayDown = a.spray; if (sprayDown) await p.keyboard.down('f'); else await p.keyboard.up('f'); }
  if (record) await frame(); else await p.clock.runFor(DT);
  return a.state;
}
// B · zone 1, played (about 12 s)
await p.evaluate(() => { __G.startGame(); __G.setupZone(0); __G.showCard(); __G.beginZone(); });
await p.evaluate(() => { document.getElementById('game').focus({ preventScroll: true }); });
for (let i = 0; i < 20; i++) await step(false);
for (let i = 0; i < 360; i++) await step(true);
// C · zone 5: run it out unrecorded, then the bridge, the dive and the splash (about 8 s)
if (sprayDown) { await p.keyboard.up('f'); sprayDown = false; }
await p.evaluate(() => { __G.setupZone(4); __G.showCard(); __G.beginZone(); });
for (let k = 0; k < 12000 && (await p.evaluate(() => __G.state)) === 'run'; k++) { await p.evaluate(() => { __G.P.inv = 1; }); await p.clock.runFor(DT * 6); }
for (let i = 0; i < 250; i++) await step(true);
await b.close();
console.log('frames', n, 'errors', errs.length ? errs : 'none');
const mp4 = path.join(OUT, 'zid-recording.mp4');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '30', '-i', path.join(FR, 'f%04d.jpg'), '-vf', 'scale=1280:720:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', mp4]);
console.log('wrote', path.relative(process.cwd(), mp4), Math.round(fs.statSync(mp4).size / 1024), 'KB');
