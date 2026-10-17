// Press screenshots: six 1600×1000 JPEGs of the real page, written to press/img/. Run with _dev/serve.py going:
//   cd _dev && node press-shots.mjs
// Uses the demo host (zid.localhost), hides the preview banner, and never touches the live scoreboard.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'press', 'img');
const U = 'http://zid.localhost:8137/';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const SEED = Number(process.env.SEED || 11);
async function page(hash = '') {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  /* a fixed random seed, so the sprayed words land in the same places every time */
  await p.addInitScript((seed) => {
    try { sessionStorage.setItem('zid-intro', '1'); localStorage.setItem('zid.lang', '"en"'); } catch (e) {}
    let s = seed; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  }, SEED);
  await p.goto(U + hash, { waitUntil: 'load' });
  await p.addStyleTag({ content: '.demo .demo-note{display:none!important} .ticker{display:none!important} html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(1500);
  return { ctx, p };
}
const shot = (p, name) => p.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 86 });
// 1 · the hero wall
{ const { ctx, p } = await page(); await p.addStyleTag({ content: '.hero-text, .hero ~ *{visibility:hidden}' }); await shot(p, '1-wall.jpg');
  // 2 · the same wall, painted: two dictionary words and a few strokes
  await p.evaluate(() => { try { Sound.ensure(); } catch (e) {} });   /* the sound engine draws its noise with Math.random: start it first */
  /* two words, placed by hand: the random numbers sprayWord asks for are colour, across, down, tilt */
  for (const [i, r] of [[0, [0, 0.66, 0.62, 0.55]], [4, [0.33, 0.6, 0.27, 0.35]]]) {
    await p.evaluate(([i, r]) => {
      const keep = Math.random, q = [...r];
      Math.random = () => (q.length ? q.shift() : keep());
      document.querySelectorAll('.st-spray')[i].click();
      Math.random = keep;
    }, [i, r]);
    await p.waitForTimeout(900);
  }
  await p.evaluate(() => { scrollTo(0, 0); document.querySelectorAll('.can')[1].click(); });
  const box = await (await p.$('#wall-canvas')).boundingBox();
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.84); await p.mouse.down();
  for (let i = 0; i < 40; i++) { await p.mouse.move(box.x + box.width * (0.5 + i * 0.011), box.y + box.height * (0.84 - Math.sin(i / 6) * 0.06)); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(2500);
  await shot(p, '2-painted.jpg'); await ctx.close(); }
// 3 · the game, zone 1, running
{ const { ctx, p } = await page('#igra');
  await p.waitForFunction(() => document.documentElement.classList.contains('game-ready'));
  await p.evaluate(() => document.getElementById('game').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400);
  await p.click('#btn-start'); await p.waitForTimeout(700); await p.click('#btn-zone'); await p.waitForTimeout(3200);
  await shot(p, '3-game.jpg'); await ctx.close(); }
// 4 · the Bihać ride with a memo open
{ const { ctx, p } = await page('#bihac'); await p.waitForTimeout(5000);
  await p.evaluate(() => document.getElementById('game').scrollIntoView({ block: 'center' }));
  await p.evaluate(() => Ride._.card(0)); await p.waitForTimeout(800);
  await shot(p, '4-bihac.jpg'); await ctx.close(); }
// 5 · the street dictionary
{ const { ctx, p } = await page(); await p.evaluate(() => { const h = document.querySelector('#rjecnik .kicker'); scrollTo(0, scrollY + h.getBoundingClientRect().top - 70); }); await p.waitForTimeout(1800);
  await shot(p, '5-dictionary.jpg'); await ctx.close(); }
// 6 · the Stari Most finale
{ const { ctx, p } = await page(); await p.evaluate(() => document.querySelector('.finale').scrollIntoView({ block: 'center' })); await p.waitForTimeout(2000);
  await shot(p, '6-stari-most.jpg'); await ctx.close(); }
await b.close();
console.log('press shots written to', OUT);
