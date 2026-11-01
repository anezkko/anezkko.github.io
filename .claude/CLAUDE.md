# ZID (zidbosna.com)

A free, bilingual (Bosnian/English) page about Bosnian street walls: a sprayable train in the hero (it rolls in
along the Neretva at dusk, you paint the wagon, "Send it off" takes it away; js: the train block in core.js), the browser game
**Sprej do Mostara / Spray to Mostar** (5 zones, Bosanski Novi → the Stari Most dive) plus the **Mirna vožnja:
Bihać** chill ride (20 history memos), a 12-word street dictionary, 4 street-law rules, a weekly/all-time
scoreboard and Radio ZID (music generated in code). Owner: @anezkko. Goal: award-ready (Awwwards, CSSDA, FWA,
Webby) without losing what makes it ZID.

## Files
- `index.html`: the page, its CSS inline (~90 KB). Tiny head scripts: language before first paint, the preview
  (`demo`) class, intro flag, config (`ZID_API`, `ZID_TIP`), service-worker registration.
- `js/core.js` (deferred): everything the page needs straight away (helpers, sound, Radio ZID, language, the hero
  wall, scoreboard, ticker, fullscreen). `js/game.js` (~820 KB, loaded on demand by `loadGame()`): the game, the
  Bihać ride, the memos (with sources) and the pixel-art tables. They share top-level names; no modules.
- `data/ticker.json` (match ticker) and `data/words.json` (which dictionary words have a recording in
  `audio/words/`): owner-editable, each with a `_help` line.
- `press/`: the press kit (`press/index.html`, six screenshots from `_dev/press-shots.mjs`, the logo PNG).
- `img/`, `fonts/` (self-hosted WOFF2 + OFL), `audio/`, icons, `manifest.json`, `sw.js` (network-first cache,
  version in `CACHE`), `404.html`, `robots.txt`, `sitemap.xml`, `CNAME`.
- `_dev/` dev-only tools, never published (GitHub Pages skips `_` folders): `serve.py`, `check.mjs`,
  `build_fonts.py`, `make_train.py` (the train hero, from `art/train/`), `make_wolf.py` (the wolf companion, from `art/wolf/`), `press-shots.mjs`, `qa.mjs`, `record.mjs`, `baseline/`,
  `BACKLOG.md`, `RECORDING.md`, `awards/`. Don't add `.nojekyll`.
- `main` is the live site (GitHub Pages, DNS on Cloudflare).
- Placeholders for the owner's own words use `.ph` / `.ph-card` / `.ph-sec`: shown on preview hosts only, never live.

## Rules
1. Branches, small commits, PRs. Never push to `main`.
2. No build step: plain HTML/CSS/JS (ES modules fine). Optimise images/fonts once and commit the output.
3. Keep the identity: dark wall world, pink `#FF4DC4`, lime `#B4F53A`, violet `#8B3DFF`, Press Start 2P
   pixel headlines (yellow with a stepped pink 3D shadow; Jersey 10 inside the game's cards) + Archivo (text) +
   Sedgwick Ave Display + Martian Mono (Bricolage Grotesque stays for the share pictures drawn on canvas), stickers/tape/drips, the official Z logo.
   Evolve, don't replace.
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

## Accessibility conventions
- Game events a screen reader should hear go through `announce(text)` (js/core.js, one polite live region), bilingual
  with `L(bs, en)`. Short, gender-neutral Bosnian.
- Game cards are `role="dialog"` with `aria-labelledby` on their heading. When a card closes for a run, call
  `focusFrame()`; when one opens, `focusBtn()` its main button.
- Small controls get the invisible 44×44 hit area (the `::after` rule near `.lang-sw` in index.html); add new
  control classes there rather than making the pills bigger.
- A visible label must start the accessible name (axe `label-content-name-mismatch`): prefer `sr-only` text inside
  the control to an `aria-label` that rewords it.
- Anything that moves checks `REDUCED` (live: it follows the system setting during a visit).

## How to test
```
cd _dev && npm install          # once: playwright, axe-core, lighthouse (git-ignored)
python3 serve.py                # http://zid.localhost:8137/ (gzip, 404.html, demo board)
node check.mjs                  # lab metrics, Lighthouse, axe, console errors, screenshots → _dev/out/<time>/
node check.mjs --no-lighthouse  # faster
node qa.mjs                     # widths 360–2560, reduced motion, offline, links, social card, keyboard → out/qa/
node press-shots.mjs            # the six press screenshots → press/img/
node record.mjs                 # the ~25 s submission video → out/record/zid-recording.mp4
```
The submission kit (texts, credits, checklist) is `_dev/awards/SUBMISSION.md`.
Chromium is at `/opt/pw-browsers/chromium` in Claude's cloud sessions (set `CHROME_PATH` elsewhere). Compare
against `_dev/baseline/README.md`. Re-run the check after every change and don't merge regressions. A sandbox
with no internet can't load the Cloudflare beacon; that one failed request is expected there.

## Award targets
Lighthouse mobile Performance ≥ 90, Accessibility/Best Practices/SEO 100 · LCP ≤ 2.5 s · TBT ≤ 200 ms ·
CLS ≤ 0.05 · INP ≤ 200 ms · first visit ≤ ~600 KB before the game opens · 60 fps · zero console errors and axe
violations · 360–2560 px, all major browsers, keyboard-only, offline.

Ideas for later live in `_dev/BACKLOG.md`.
