# ZID: award submission kit

Everything to paste into Awwwards, CSS Design Awards, The FWA and the Webby Awards. Lines in **[brackets]** are
yours to fill in. Submission fees and deadlines change every year: check each site before paying, and decide on
any fee yourself.

## Title and address
- **Title:** ZID
- **Subtitle:** Ovo je zid. Ofarbaj ga. / This is a wall. Paint it.
- **URL:** https://zidbosna.com
- **Press kit:** https://zidbosna.com/press/

## Taglines
| | Bosnian | English |
|---|---|---|
| Main | Ovo je zid. Ofarbaj ga. | This is a wall. Paint it. |
| Game | Sprejom do Mostara. | Spray your way to Mostar. |
| Short | Džaba. Bez registracije, bez reklama. | Free. No sign-up, no ads. |

## 50 words
**English:** ZID is a free, bilingual web page about Bosnian street walls. Spray paint on a real wall, learn twelve
words of street slang, then play Spray to Mostar, a pixel-art run from Bosanski Novi to the dive off the Stari Most.
No sign-up, no ads, no cookies. By @anezkko.

**Bosanski:** ZID je besplatna dvojezična stranica o bosanskim uličnim zidovima. Ofarbaj pravi zid sprejom, nauči
dvanaest riječi uličnog slenga, pa zaigraj Sprej do Mostara, piksel-art trku od Bosanskog Novog do skoka sa Starog
mosta. Bez registracije, bez reklama, bez kolačića. Autor: @anezkko.

## 150 words
**English:** ZID (Bosnian for “wall”) is a free, bilingual page about Bosnian street walls, made by @anezkko. It
opens on a real wall you can spray, with eight colours, six paint styles and paint that sinks into the plaster. Then
comes Spray to Mostar, a pixel-art game across five zones from Bosanski Novi to the Stari Most: paint the concrete,
leave the old stone and the stećci alone, jump the bears, and finish with a dive into the Neretva. Mirna vožnja:
Bihać is a calm ride along the Una with twenty short memos on history, the war and Bosnian talent, each linked to its
source. Radio ZID plays six stations composed in code, with no licensed music. The page works on any phone or
computer, works offline once loaded, installs as an app, and asks for nothing: no sign-up, no ads, no cookies. The
weekly scoreboard is optional: your name only goes up if you type one.

**Bosanski:** ZID je besplatna dvojezična stranica o bosanskim uličnim zidovima, autora @anezkko. Otvara se pravim
zidom koji možeš farbati: osam boja, šest vrsta spreja i boja koja se upija u malter. Zatim dolazi Sprej do Mostara,
piksel-art igra kroz pet zona od Bosanskog Novog do Starog mosta: farbaj beton, ne diraj stari kamen i stećke,
preskači medvjede i na kraju skoči u Neretvu. Mirna vožnja: Bihać je lagana vožnja uz Unu sa dvadeset kratkih
bilješki o historiji, ratu i bosanskim talentima, svaka s linkom na izvor. Radio ZID svira šest stanica napisanih kao
kod, bez licencirane muzike. Stranica radi na svakom telefonu i računaru, radi i bez interneta kad se jednom učita,
instalira se kao aplikacija i ništa ne traži: bez registracije, bez reklama, bez kolačića. Sedmična tabela je
neobavezna: tvoje ime ide gore samo ako ga upišeš.

## Tags
graffiti, street art, browser game, pixel art, runner, Bosnia and Herzegovina, Sarajevo, Mostar, Stari Most,
bilingual, culture, history, generative music, Web Audio, canvas, PWA, offline, accessibility, no cookies, free

## Credits
- **Creator:** Anezkko (Instagram [@anezkko](https://www.instagram.com/anezkko/))
- **Pixel art:** **[who made it, and how]**
- **Illustrations** (Stari Most finale, street-law stickers, zone landmarks, stećci, share image): made with Google
  Gemini, then cut out and fitted to the page
- **The hero wall:** Anezkko
- **Music:** Radio ZID, six stations composed in code (Web Audio), with the calm Sumrak fading in on the first tap; no samples, no licensed tracks
- **Type:** Bricolage Grotesque (Mathieu Triay), Archivo (Omnibus-Type), Martian Mono (Evil Martians), Sedgwick Ave Display;
  all SIL Open Font License
- **Facts:** 20 memos, each linked to its source (Wikipedia, UNESCO, N1, UN, nobelprize.org, UEFA, Berlinale);
  checked October 2026
- **Thanks:** **[friends, testers]**

## Tech notes (for the developer / technical juries)
- One page, plain HTML, CSS and JavaScript: no framework, no build step, hosted on GitHub Pages.
- Hero wall: Canvas 2D spray engine (6 styles, speed-dependent overspray, drips), a plaster-grain layer made from
  the photo's own detail and overlay-blended over the paint; "Save the wall" makes a 1080×1350 picture on the
  device and hands it to the Web Share API.
- Game: a hand-written Canvas 2D engine with pixel-art sprites, five zones, an aim-and-dive finale, a weekly and
  all-time scoreboard (optional name), and a separate calm ride with 20 sourced memos. Loads on demand, so the first
  visit doesn't pay for it.
- Sound: everything synthesised with Web Audio, including six full music stations; the only recording is the
  bear's growl.
- Speed (lab: 412 px phone, 4× CPU, 1.6 Mbps): Lighthouse mobile Performance 95–96, Accessibility 100, SEO 100;
  LCP 0.8 s lab / 2.7 s Lighthouse-simulated; CLS 0.03; first visit 15 requests, ~300 KB.
- Self-hosted subset fonts with metric-matched fallbacks; AVIF/WebP art-directed hero; a service worker for offline
  play; installable PWA with shortcuts.
- Accessibility: keyboard painting and play, labelled dialogs and focus management, a live region for game events,
  44 px touch targets, `lang` switching for screen readers, live reduced-motion support; zero axe-core violations.
- Phones: fullscreen play turned sideways with a pad under each thumb; iPhone gets a full-screen view.
- Motion: one set of easing and duration tokens; View Transitions between game cards; everything off under reduced
  motion.
- Privacy: no cookies, no trackers beyond cookieless Cloudflare Web Analytics, no sign-up.

## Where to submit (check the current rules first)
| Platform | What to enter | Notes |
|---|---|---|
| **Awwwards** | Site of the Day (judged on Design, Usability, Creativity, Content) | Paid submission. Also scored for Developer and Mobile Excellence. Suggested categories: Games & Entertainment, Culture & Education, Illustration. |
| **CSS Design Awards** | Website of the Day (UI, UX, Innovation) | Paid submission. Mention the spray engine, the no-build stack and the accessibility work. |
| **The FWA** | FWA of the Day | Values experimentation and technical craft: lead with the spray, the generated music and the dive. |
| **Webby Awards** | **[check the current category list]**; likely candidates are under Websites & Mobile Sites (games, culture) and Games (browser games, art direction, sound) | Paid entry; check the deadline. People's Voice voting rewards sharing: plan a push. |

## Before you submit
- [ ] Fill in the About section's **[your words]** and thanks (they show only on preview hosts until you do).
- [ ] Proofread every Bosnian string (lists are in PRs #4, #5 and the Phase 4–6 PR).
- [ ] Play it start to finish on a real iPhone (Safari), an Android phone (Chrome), and desktop Firefox, Safari and
      Edge. Claude's cloud checks only covered Chromium.
- [ ] A quick VoiceOver and TalkBack pass (see `_dev/BACKLOG.md`).
- [ ] Open each external link once (list: `node _dev/qa.mjs` writes `out/qa/external-links.txt`).
- [ ] Check the social card in each network's preview/debug tool.
- [ ] Optional: record the 12 dictionary words (`_dev/RECORDING.md`).
- [ ] Run `node _dev/check.mjs` and `node _dev/qa.mjs` one last time; everything should pass.
- [ ] Screenshots: `press/img/` (1600×1000). Video: `node _dev/record.mjs` → `_dev/out/record/zid-recording.mp4`.
