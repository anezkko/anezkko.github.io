# Baseline, 16 October 2026 (before the award work)

Recorded with `node _dev/check.mjs --out baseline` against `main` at `2a12d49`, served by `_dev/serve.py`
(gzip, like GitHub Pages) on `http://zid.localhost:8137/` so the scoreboard is in demo mode.

**Lab run:** a 412×823 phone (DPR 2.625), 4× CPU slowdown, ~1.6 Mbps down / 150 ms latency, cache off. It is a
true first visit, so the intro runs. Two runs, to show how much the numbers move:

| | FCP | LCP | TBT | CLS | DOMContentLoaded | Requests | Transferred |
|---|---|---|---|---|---|---|---|
| Run 1 | 1.16 s | 7.24 s | 3.46 s | 0.165 | 7.83 s | 70 | 1 731 KB |
| Run 2 | 0.94 s | 6.21 s | 1.65 s | 0.165 | 6.50 s | 70 | 1 731 KB |

The LCP element is `div#wall.wall`, painted by the `--tagwall` texture that `buildTagWall()` makes at runtime, so
the biggest paint waits for the ~950 KB inline script.

**Lighthouse 13.5 (mobile preset, simulated throttling):** Performance 60 · Accessibility 100 ·
Best Practices 96 · SEO 100 (LCP 8.2 s). Failing: `errors-in-console` (only the Cloudflare beacon, which this
sandbox can't reach), `valid-source-maps`, `label-content-name-mismatch`. Lighthouse reports TBT as 0 ms here,
which disagrees with the lab trace; trust the lab TBT.

**axe-core 4.14:** `label-content-name-mismatch` (serious, 13 elements) and `region` (moderate, 1), at both 390 px
and 1440 px.

**Console errors:** none from ZID itself. The only failed request is `static.cloudflareinsights.com/beacon.min.js`,
blocked by the sandbox's network; it loads on the real site.

**Compared with the brief's numbers** (LCP ~4.7–4.9 s, TBT ~1.0–1.2 s, CLS 0.056, ~60 requests, ~1.5 MB): this
run is slower and shifts more. The page has grown since then (route map, finale art, stickers, intro), and the
lab here counts the intro. Phase 2 measures against this file.

Screenshots: `page-390.jpg`, `page-768.jpg`, `page-1440.jpg` (full page, intro skipped). Numbers: `report.json`.
