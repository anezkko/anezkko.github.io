# ZID (zidbosna.com)

A free, bilingual (Bosnian/English) page about Bosnian street walls: a sprayable hero wall, the browser game
**Sprej do Mostara / Spray to Mostar** (5 zones, Bosanski Novi → the Stari Most dive) plus the **Mirna vožnja:
Bihać** chill ride (20 history memos), a 12-word street dictionary, 4 street-law rules, a weekly/all-time
scoreboard and Radio ZID (music generated in code). Owner: @anezkko. Goal: award-ready (Awwwards, CSSDA, FWA,
Webby) without losing what makes it ZID.

## Files
- `index.html` is the whole site (~1.1 MB): inline CSS (~70 KB) and one inline script (~950 KB) that holds the
  pixel-art tables `PIXOBS`/`PIXSCN` and `GROWL_B64` audio. Tiny head scripts: language before first paint,
  intro flag, config (`ZID_API`, `ZID_TIP`), service-worker registration.
- `img/` sprites and art (WebP for the zone/law stickers and finale), `og-image.jpg`, icons, `manifest.json`,
  `sw.js` (network-first cache `zid-v1`), `CNAME`.
- `_dev/` dev-only tools, never published (GitHub Pages skips `_` folders): `serve.py`, `check.mjs`,
  `baseline/`. Don't add `.nojekyll`.
- `main` is the live site (GitHub Pages, DNS on Cloudflare).

## Rules
1. Branches, small commits, PRs. Never push to `main`.
2. No build step: plain HTML/CSS/JS (ES modules fine). Optimise images/fonts once and commit the output.
3. Keep the identity: dark wall world, pink `#FF4DC4`, lime `#B4F53A`, violet `#8B3DFF`, Archivo + Sedgwick Ave
   Display + Martian Mono, stickers/tape/drips, the official Z logo. Evolve, don't replace.
4. Bilingual always: `L(bs, en)` in JS, `data-en` (and `data-en-ph`, `data-en-aria`) in HTML. List new Bosnian
   strings in the PR for the owner to check.
5. Free, no sign-up, no ads, no cookies, no new third-party trackers or services.
6. Don't touch the scoreboard contract (API calls, run payload, scoring, zone count). **Never send test scores to
   the live board**: test on `http://zid.localhost:<port>` (demo board). On plain `localhost` the real API is on,
   so never submit a name there.
7. History stays respectful and sourced. War history (sieges, Sarajevo Roses) is never points, targets or effects.
8. No licensed music, copyrighted characters or brand assets. Radio ZID stays generated in code.
9. No accessibility or reduced-motion regressions; every new animation has a reduced-motion fallback.
10. Bump the `sw.js` cache version when cached files change; keep offline working.
11. Match the code style: small plain functions, plain-English comments that say why.
12. Ask the owner before: game rules or difficulty, removing a section, a big visual change, anything about
    Ko-fi or money, any outside service.

## How to test
```
cd _dev && npm install          # once: playwright, axe-core, lighthouse (git-ignored)
python3 serve.py                # http://zid.localhost:8137/ (gzip, 404.html, demo board)
node check.mjs                  # lab metrics, Lighthouse, axe, console errors, screenshots → _dev/out/<time>/
node check.mjs --no-lighthouse  # faster
```
Chromium is at `/opt/pw-browsers/chromium` in Claude's cloud sessions (set `CHROME_PATH` elsewhere). Compare
against `_dev/baseline/README.md`. Re-run the check after every change and don't merge regressions. A sandbox
with no internet can't load the Cloudflare beacon; that one failed request is expected there.

## Award targets
Lighthouse mobile Performance ≥ 90, Accessibility/Best Practices/SEO 100 · LCP ≤ 2.5 s · TBT ≤ 200 ms ·
CLS ≤ 0.05 · INP ≤ 200 ms · first visit ≤ ~600 KB before the game opens · 60 fps · zero console errors and axe
violations · 360–2560 px, all major browsers, keyboard-only, offline.

Ideas for later live in `_dev/BACKLOG.md`.
