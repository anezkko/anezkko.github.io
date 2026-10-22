/* ZID · core: everything the page needs straight away (helpers, sound, Radio ZID, language, the hero wall, the
   scoreboard and the page itself). The game and the Bihać ride are in js/game.js and load on demand.
   Plain script, loaded with defer; its top-level names are shared with js/game.js. */
"use strict";
/* ===== core: helpers, paint, sound, storage ===== */
const TAU = Math.PI * 2;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
/* reduced motion, kept current: turning it on mid-visit also drops the scroll-in effects at once */
const REDUCE_MQ = matchMedia('(prefers-reduced-motion: reduce)');
let REDUCED = REDUCE_MQ.matches;
REDUCE_MQ.addEventListener('change', (e) => {
  REDUCED = e.matches;
  if (REDUCED) document.documentElement.classList.remove('js-spray', 'intro-on');
});

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* Spray colours are named after Bosnian things. They are paint, so they stay the same by day and by night. */
const PAINTS = [
  { id: 'malina', name: 'Raspberry', hex: '#FF4DC4' },
  { id: 'kopriva', name: 'Nettle', hex: '#B4F53A' },
  { id: 'neretva', name: 'Neretva', hex: '#19C9AE' },
  { id: 'dunja', name: 'Quince', hex: '#FFD23F' },
  { id: 'sljiva', name: 'Plum', hex: '#9B5CFF' },
  { id: 'cilim', name: 'Kilim', hex: '#FF5A3D' },
  { id: 'krec', name: 'Whitewash', hex: '#F4F1FA' },
  { id: 'katran', name: 'Tar', hex: '#121117', glow: '#F4F1FA' },
];

/* the spray can: one drawing for the paint tray, the lives counter and the extra-can pickup in the game.
   It stands upright around 0,0 and is shown tilted, like a can in the hand; the body takes the paint colour. */
const CAN = (() => {
  const INKC = '#15121C', RIM = '#2B2934';
  /* [path, fill, line width]; fill 'C' is the paint colour, '' is a line only */
  const P = [
    ['M-10.6 21.6V24.6A10.6 3.4 0 0 0 10.6 24.6V21.6A10.6 3.4 0 0 1 -10.6 21.6Z', RIM, 1.8],
    ['M-9.6 24.1A9.6 2.9 0 0 0 9.6 24.1', '', 0.9, 'rgba(255,255,255,.2)'],
    ['M-10 -14V21.8A10 3.2 0 0 0 10 21.8V-14Z', 'C', 1.8],
    /* the label: a band of kilim, cream wool with a row of diamonds in the paint colour */
    ['M-10 -4.5A10 3.2 0 0 0 10 -4.5V9.5A10 3.2 0 0 1 -10 9.5Z', '#F1E3C6', 1.1],
    ['M-10 -2.7A10 3.2 0 0 0 10 -2.7', '', 0.9, '#A3242B'],
    ['M-10 7.7A10 3.2 0 0 0 10 7.7', '', 0.9, '#A3242B'],
    ['M-6.4 1.26L-3.7 4.96L-6.4 8.66L-9.1 4.96Z', 'C', 0.9],
    ['M0 2.00L2.7 5.70L0 9.40L-2.7 5.70Z', 'C', 0.9],
    ['M6.4 1.26L9.1 4.96L6.4 8.66L3.7 4.96Z', 'C', 0.9],
    ['M0 4.20L1.1 5.70L0 7.20L-1.1 5.70Z', '#A3242B', 0],
    ['M5.2 -14H10V21.8A10 3.2 0 0 1 5.2 24.54Z', 'rgba(0,0,0,.27)', 0],
    ['M-8.8 -13V22.5A10 3.2 0 0 0 -3.6 24.55V-13Z', 'rgba(255,255,255,.17)', 0],
    ['M-7.4 -10.6C-7.4 -12 -5.3 -12 -5.3 -10.6V-6.6C-5.3 -5.2 -7.4 -5.2 -7.4 -6.6Z', 'rgba(255,255,255,.88)', 0],
    ['M-7.4 14C-7.4 12.8 -5.3 12.8 -5.3 14V16.6C-5.3 17.8 -7.4 17.8 -7.4 16.6Z', 'rgba(255,255,255,.72)', 0],
    ['M7.2 -10V-5M7.2 13V18', '', 1.1, 'rgba(255,255,255,.22)'],
    ['M-10.6 -14A10.6 3.4 0 0 1 10.6 -14A10.6 3.4 0 0 1 -10.6 -14Z', RIM, 1.8],
    ['M-9.4 -13.1A9.4 2.7 0 0 0 9.4 -13.1', '', 0.9, 'rgba(255,255,255,.28)'],
    ['M-9.1 -14.5C-9.1 -19.3 -5.7 -21.9 0 -21.9C5.7 -21.9 9.1 -19.3 9.1 -14.5A9.1 2.9 0 0 1 -9.1 -14.5Z', '#C6C8D2', 1.6],
    ['M3.5 -21.3C7 -20.4 9.1 -18 9.1 -14.5A9.1 2.9 0 0 1 6.2 -12.38C6.4 -15.8 5.6 -18.8 3.5 -21.3Z', 'rgba(0,0,0,.2)', 0],
    ['M-6.4 -15.6C-6.2 -18.3 -4.3 -20.1 -1.2 -20.6', '', 1.3, 'rgba(255,255,255,.9)'],
    ['M-5.6 -21.5A5.6 1.9 0 0 1 5.6 -21.5A5.6 1.9 0 0 1 -5.6 -21.5Z', RIM, 1.4],
    ['M-4.5 -27.4V-21.7A4.5 1.55 0 0 0 4.5 -21.7V-27.4Z', '#E2E3EA', 1.5],
    ['M2.2 -27.2H4.5V-21.7A4.5 1.55 0 0 1 2.2 -20.3Z', 'rgba(0,0,0,.18)', 0],
    ['M-4.5 -27.4A4.5 1.55 0 0 1 4.5 -27.4A4.5 1.55 0 0 1 -4.5 -27.4Z', '#FAFAFC', 1.4],
    ['M-0.3 -24.5A1.35 1.15 0 1 1 2.4 -24.5A1.35 1.15 0 1 1 -0.3 -24.5Z', INKC, 0],
  ];
  /* the outline pass: the silhouette pieces again with a thick line, under everything */
  const SIL = [0, 2, 15, 17, 20, 21, 23];
  const TILT = 22, VB = [-22.6, -33, 45.6, 65.2];
  let svg = '';
  function markup() {
    if (svg) return svg;
    const sil = SIL.map((i) => `<path d="${P[i][0]}"/>`).join('');
    const parts = P.map(([d, f, w, s]) => {
      const fill = f === 'C' ? 'style="fill:var(--c,#FF4DC4)"' : f ? `fill="${f}"` : 'fill="none"';
      const line = w ? `stroke="${s || INKC}" stroke-width="${w}"` : '';
      return `<path d="${d}" ${fill} ${line}/>`;
    }).join('');
    svg = `<svg class="can-ic" viewBox="${VB.join(' ')}" aria-hidden="true" focusable="false"><g transform="rotate(${TILT})" stroke-linejoin="round" stroke-linecap="round"><g fill="${INKC}" stroke="${INKC}" stroke-width="4">${sil}</g>${parts}</g></svg>`;
    return svg;
  }
  /* the same drawing on a canvas, centred at 0,0 and upright (the caller rotates) */
  let paths = null;
  function draw(x, color) {
    if (!paths) paths = P.map(([d]) => new Path2D(d));
    x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
    x.fillStyle = INKC; x.strokeStyle = INKC; x.lineWidth = 4;
    for (const i of SIL) { x.fill(paths[i]); x.stroke(paths[i]); }
    P.forEach(([, f, w, s], i) => {
      if (f) { x.fillStyle = f === 'C' ? color : f; x.fill(paths[i]); }
      if (w) { x.strokeStyle = s || INKC; x.lineWidth = w; x.stroke(paths[i]); }
    });
    x.restore();
  }
  return { markup, draw, TILT, VB };
})();

const Store = {
  get(k, d) { try { const v = localStorage.getItem('zid.' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem('zid.' + k, JSON.stringify(v)); } catch (_) { /* storage blocked: keep going */ } },
};

function markCoarse() { document.documentElement.classList.add('coarse'); }
if (matchMedia('(pointer: coarse)').matches) markCoarse();

/* ---- sound: built with Web Audio, starts only after a tap or key ---- */
const Sound = (() => {
  let ac = null, master = null, noise = null, hissGain = null, on = true, level = 0;
  function ensure() {
    if (!on) return null;
    return context();
  }
  /* one audio context for sound effects and music; created on the first tap or key */
  function context() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
        master = ac.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ac.destination);
        const len = ac.sampleRate;
        noise = ac.createBuffer(1, len, ac.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5200; bp.Q.value = 0.6;
        hissGain = ac.createGain(); hissGain.gain.value = 0;
        src.connect(hp); hp.connect(bp); bp.connect(hissGain); hissGain.connect(master);
        src.start();
      } catch (_) { ac = null; return null; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function hiss(v) {
    if (!on) v = 0;
    if (v > 0) ensure();
    if (!ac || !hissGain) return;
    if (Math.abs(v - level) < 0.02) return;
    level = v;
    hissGain.gain.setTargetAtTime(v * 0.11, ac.currentTime, 0.03);
  }
  function tone(type, f0, f1, dur, vol, delay = 0) {
    const a = ensure(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gn.gain.setValueAtTime(vol, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  function burst(dur, vol, freq, type = 'lowpass') {
    const a = ensure(); if (!a || !noise) return;
    const t = a.currentTime;
    const s = a.createBufferSource(); s.buffer = noise;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const gn = a.createGain();
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(master); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
  }
  /* the bear's recorded growl (audio/growl.mp3), fetched and decoded once on first use */
  let GROWL_BUF = null, GROWL_LOADING = false;
  function bearSample() {
    if (GROWL_BUF || GROWL_LOADING) return GROWL_BUF;
    const a = ensure(); if (!a) return null;
    GROWL_LOADING = true;
    fetch('audio/growl.mp3').then((r) => r.arrayBuffer()).then((buf) => a.decodeAudioData(buf))
      .then((b) => { GROWL_BUF = b; }).catch(() => { GROWL_LOADING = false; });
    return null;
  }
  const sfx = {
    jump() { tone('square', 260, 520, 0.09, 0.03); },
    jump2() { tone('square', 400, 800, 0.09, 0.026); },
    hit() { tone('sine', 150, 45, 0.26, 0.25); burst(0.18, 0.14, 900); },
    pick() { tone('triangle', 660, 660, 0.08, 0.07); tone('triangle', 990, 990, 0.12, 0.06, 0.07); },
    score() { tone('triangle', 520, 780, 0.1, 0.045); },
    big() { tone('triangle', 523, 523, 0.1, 0.05); tone('triangle', 784, 784, 0.16, 0.05, 0.08); },
    bad() { tone('sawtooth', 210, 110, 0.24, 0.045); },
    zone() { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.15, 0.06, i * 0.09)); },
    splash() { burst(0.9, 0.32, 1400); burst(0.45, 0.2, 380); },
    rattle() { burst(0.07, 0.05, 5200, 'bandpass'); },
    /* the wheels over a rail joint: two quick knocks */
    clack() { burst(0.05, 0.07, 700); burst(0.05, 0.06, 760, 'lowpass'); setTimeout(() => burst(0.05, 0.05, 650), 90); },
    /* the page's buttons: a quiet click, well under the game's sounds */
    tick() { tone('triangle', 1500, 1100, 0.035, 0.016); },
    quack() { tone('sawtooth', 640, 420, 0.09, 0.03); tone('sawtooth', 600, 400, 0.11, 0.026, 0.13); },
    /* the bear: a full roar as it charges, a short snarl when it knocks you over */
    /* the charging bear: a real recorded growl (a short mp3 in the page); the synthesized roar is the fallback while it loads */
    growl() {
      const a = ensure(); const buf = bearSample();
      if (buf && a) {
        const s = a.createBufferSource(), g = a.createGain();
        s.buffer = buf; g.gain.value = 0.9; s.connect(g); g.connect(master); s.start(a.currentTime + 0.03);
      } else roar({ dur: 1.4, vol: 0.5, wob: true });
    },
    snarl() { roar({ dur: 0.6, pitch: 1.5, vol: 0.45, wob: true }); },
  };
  /* ---- the bear's roar ----
     A growling voice: two buzzes an octave apart (the low one is the rumble in its chest), their pitch shaken every few
     milliseconds so it never sounds like a machine, rattling about 30 times a second like a real growl. A big throat
     shapes it, opening from a closed "uh" to a wide "aa" at the top of the roar and closing again, with breath and rasp
     through it. Overdrive gives it grit and a limiter keeps it loud without breaking up: it is the loudest thing in the
     game, about twice as loud as a shout. */
  let DRIVE = null;
  function driveCurve() {
    if (!DRIVE) {
      DRIVE = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) { const x = (i / 2047) * 2 - 1; DRIVE[i] = Math.tanh(x * 2.4) / Math.tanh(2.4); }
    }
    return DRIVE;
  }
  function roar(o) {
    const a = ensure(); if (!a || !noise) return;
    const dur = o.dur || 1.5, k = o.pitch || 1, vol = o.vol || 1;
    const t = a.currentTime + 0.03 + (o.at || 0), end = t + dur;
    /* out: drive, then a limiter, then up to the master */
    const pre = a.createGain(); pre.gain.value = 1.15;
    const sh = a.createWaveShaper(); sh.curve = driveCurve(); sh.oversample = '2x';
    const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 40;
    const lim = a.createDynamicsCompressor();
    lim.threshold.value = -9; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.12;
    const out = a.createGain(); out.gain.value = 0.72 * vol;
    pre.connect(sh); sh.connect(hp); hp.connect(lim); lim.connect(out); out.connect(master);
    /* the shape of the whole roar: a quick swell, a peak about a third of the way in, a long rumbling tail */
    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.55, t + 0.08);
    env.gain.linearRampToValueAtTime(1, t + dur * 0.3);
    env.gain.linearRampToValueAtTime(0.5, t + dur * 0.65);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(pre);
    /* the rattle: the voice throbs, faster at the top of the roar */
    const am = a.createGain(); am.gain.value = 0.62;
    const lfo = a.createOscillator(); lfo.type = 'triangle';
    lfo.frequency.setValueAtTime(23, t); lfo.frequency.linearRampToValueAtTime(33, t + dur * 0.3); lfo.frequency.linearRampToValueAtTime(19, end);
    const lg = a.createGain(); lg.gain.value = 0.38;
    lfo.connect(lg); lg.connect(am.gain); am.connect(env);
    /* the voice: its pitch climbs into the roar and sinks into the rumble, shaken every 12 ms */
    const v1 = a.createOscillator(), v2 = a.createOscillator();
    v1.type = 'sawtooth'; v2.type = 'sawtooth';
    const f0 = 98 * k;
    /* the cartoon version (wob): the pitch bounces up and down like a bear hopping about, not one long grumble */
    const PATH = o.wob
      ? [[0, 0.78], [0.12, 1.2], [0.24, 0.9], [0.36, 1.3], [0.5, 0.85], [0.64, 1.25], [0.8, 0.9], [1, 0.6]]
      : [[0, 0.78], [0.1, 1.05], [0.3, 1.34], [0.55, 1.12], [0.8, 0.86], [1, 0.68]];
    const n = Math.ceil(dur / 0.012);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      let m = PATH[PATH.length - 1][1];
      for (let j = 1; j < PATH.length; j++) {
        if (u <= PATH[j][0]) { const [u0, m0] = PATH[j - 1], [u1, m1] = PATH[j]; m = m0 + ((m1 - m0) * (u - u0)) / (u1 - u0); break; }
      }
      const f = f0 * m * (0.9 + Math.random() * 0.2);
      v1.frequency.setValueAtTime(f, t + u * dur);
      v2.frequency.setValueAtTime(f * 0.5 * (0.96 + Math.random() * 0.08), t + u * dur);
    }
    const g2 = a.createGain(); g2.gain.value = 0.75;
    v2.connect(g2);
    /* the throat: the vowel filters of a big animal, closed → open → closed */
    const F = [[300, 620, 1300, 2400], [560, 1100, 2150, 2900], [350, 720, 1450, 2500]], Q = [3, 4.5, 5.5, 6], G = [3.4, 3.4, 2.2, 1.6];
    for (let i = 0; i < 4; i++) {
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = Q[i];
      bp.frequency.setValueAtTime(F[0][i] * k, t);
      bp.frequency.linearRampToValueAtTime(F[1][i] * k, t + dur * 0.3);
      bp.frequency.linearRampToValueAtTime(F[2][i] * k, end);
      const g = a.createGain(); g.gain.value = G[i];
      v1.connect(bp); g2.connect(bp); bp.connect(g); g.connect(am);
    }
    /* the chest: the low buzz straight through */
    const chest = a.createBiquadFilter(); chest.type = 'lowpass'; chest.frequency.value = 240; chest.Q.value = 1.1;
    const cg = a.createGain(); cg.gain.value = 0.3;
    v1.connect(chest); g2.connect(chest); chest.connect(cg); cg.connect(am);
    /* the rasp: breath through the open throat */
    const ns = a.createBufferSource(); ns.buffer = noise; ns.loop = true;
    const nb = a.createBiquadFilter(); nb.type = 'bandpass'; nb.Q.value = 0.8;
    nb.frequency.setValueAtTime(700 * k, t); nb.frequency.linearRampToValueAtTime(1800 * k, t + dur * 0.3); nb.frequency.linearRampToValueAtTime(800 * k, end);
    const ngn = a.createGain(); ngn.gain.value = 0.6;
    ns.connect(nb); nb.connect(ngn); ngn.connect(am);
    /* a thump in the chest as it starts, felt more than heard */
    const th = a.createOscillator(); th.type = 'sine';
    th.frequency.setValueAtTime(72, t); th.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    const tg = a.createGain();
    tg.gain.setValueAtTime(0.0001, t); tg.gain.exponentialRampToValueAtTime(0.35, t + 0.015); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    th.connect(tg); tg.connect(pre);
    huff(Math.max(a.currentTime, t - 0.16), 0.2, 2.2 * vol, 900);       /* the breath in before it */
    for (const s of [v1, v2, lfo, th]) { s.start(t); s.stop(end + 0.05); }
    ns.start(t, Math.random() * 0.5); ns.stop(end + 0.05);
  }
  /* ---- voices: a buzz shaped by three vowel filters, so a grunt sounds like a mouth and not a beep ---- */
  const VOW = { a: [780, 1180, 2650], o: [520, 880, 2550], u: [360, 800, 2350], e: [500, 1820, 2600], i: [310, 2150, 2950], uh: [620, 1200, 2500] };
  const VGAIN = 0.5, HGAIN = 0.07, FGAIN = 0.14;
  /* one syllable. f0 → f1 is the pitch slide (peak bends it up first, path sets exact notes as [Hz, 0..1]);
     v → v2 the vowel; fs moves the vowel filters (a bigger head sounds lower); h puts a breathy "h" in front;
     lp muffles it, as if through a mask */
  function syl(o) {
    const a = ensure(); if (!a) return;
    const dur = o.dur, fs = o.fs || 1, f0 = o.f0, f1 = o.f1 || f0 * 0.86;
    const t0 = a.currentTime + 0.01 + (o.at || 0), t = t0 + (o.h ? o.h * 0.55 : 0);
    if (o.h) huff(t0, o.h, o.vol || 1, 1500 * fs);
    const src = a.createOscillator(); src.type = 'sawtooth';
    src.frequency.setValueAtTime(f0, t);
    if (o.path) for (const [f, u] of o.path) src.frequency.linearRampToValueAtTime(f, t + dur * u);
    else {
      if (o.peak) src.frequency.linearRampToValueAtTime(o.peak, t + dur * 0.3);
      src.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    }
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = o.rate || 6; lg.gain.value = f0 * (o.vib || 0.015);
    lfo.connect(lg); lg.connect(src.frequency);
    const env = a.createGain();
    const V0 = VOW[o.v || 'a'], V1 = o.v2 ? VOW[o.v2] : null, amp = [1, 0.7, 0.28], q = [6, 9, 12];
    for (let i = 0; i < 3; i++) {
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q[i];
      bp.frequency.setValueAtTime(V0[i] * fs, t);
      if (V1) { bp.frequency.setValueAtTime(V0[i] * fs, t + dur * (o.v2at || 0)); bp.frequency.linearRampToValueAtTime(V1[i] * fs, t + dur * 0.92); }
      const gg = a.createGain(); gg.gain.value = amp[i];
      src.connect(bp); bp.connect(gg); gg.connect(env);
    }
    const vol = (o.vol || 1) * VGAIN, atk = o.atk || 0.02;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + atk);
    env.gain.setValueAtTime(vol, t + Math.max(atk + 0.005, dur * (o.hold || 0.5)));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = env;
    if (o.lp) { const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; env.connect(lp); out = lp; }
    out.connect(master);
    src.start(t); lfo.start(t); src.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  /* breath: the "h" in "hup" and "ha" */
  function huff(t, dur, vol, freq) {
    const a = ac; if (!a || !noise) return;
    const s = a.createBufferSource(); s.buffer = noise;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
    const gn = a.createGain();
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol * HGAIN, t + dur * 0.35); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  /* the old buzz sound: a low buzz with a jittery pitch, and a sputter or two */
  function fart(o) {
    const a = ensure(); if (!a || !noise) return;
    const t = a.currentTime + 0.01 + (o.at || 0), dur = o.dur || 0.4, vol = (o.vol || 1) * FGAIN, f0 = o.f0 || 92;
    const src = a.createOscillator(); src.type = 'sawtooth';
    const n = Math.ceil(dur / 0.016);
    for (let k = 0; k <= n; k++) src.frequency.setValueAtTime(f0 * (1 - 0.3 * (k / n)) * (0.78 + Math.random() * 0.44), t + k * 0.016);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || 560; lp.Q.value = 5;
    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    let last = t + 0.02;
    const cuts = 2 + ((Math.random() * 2) | 0);
    for (let k = 1; k <= cuts; k++) {
      const c = t + dur * (k / (cuts + 1.4)) + Math.random() * 0.02;
      if (c - 0.012 <= last) continue;
      env.gain.setValueAtTime(vol, c - 0.012); env.gain.linearRampToValueAtTime(vol * 0.18, c); env.gain.linearRampToValueAtTime(vol * 0.9, c + 0.022);
      last = c + 0.022;
    }
    env.gain.setValueAtTime(vol * 0.9, Math.max(last + 0.005, t + dur * 0.7)); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp); lp.connect(env); env.connect(master);
    const s = a.createBufferSource(); s.buffer = noise;
    const nf = a.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 420;
    const ng = a.createGain(); ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(nf); nf.connect(ng); ng.connect(master);
    src.start(t); src.stop(t + dur + 0.05); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function setOn(v) {
    on = !!v;
    if (!ac) return;
    master.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.02);
    if (!on) { if (hissGain) hissGain.gain.setTargetAtTime(0, ac.currentTime, 0.02); level = 0; }
  }
  return { ensure, context, hiss, sfx, syl, fart, roar, setOn, get on() { return on; } };
})();

/* ---- toast ---- */
/* one polite live region: the game says what happens (a zone starts, a can is lost, a fall, the final total) */
const announce = (() => {
  let el = null, timer = 0;
  return (text) => {
    if (!el) {
      el = document.createElement('p');
      el.className = 'sr-only'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    /* clear, then set a moment later, so the same words twice in a row are read twice */
    el.textContent = ''; clearTimeout(timer);
    timer = setTimeout(() => { el.textContent = text; }, 80);
  };
})();
let toastTimer = 0;
function toast(html, ms = 3200) {
  const el = $('#toast');
  el.innerHTML = html;
  el.hidden = false;
  announce(el.textContent);   /* a status that pops up hidden-then-shown is easy for screen readers to miss */
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}
  /* ===== sprites from the Gemini art: bear gallop (6 frames, one stride, and a 7th standing; bearwork/gallop_cut.py), mallard and duckling waddle (4 each), weeping willow =====
     Made by gem/cut.py from gem/sheet.jpg: cut out, lined up on the ground, shrunk, snapped to one palette per sprite.
     One art pixel is one game unit. Each frame is a string, one character per pixel ('.' is clear). */
/* ===== music: Radio ZID, four original stations composed in code =====
   No samples and no recordings: every sound is made live with Web Audio, so there is nothing to license.
   Polahko House   Balkan house, 122 BPM, A Hijaz, a darbuka pattern under four-on-the-floor drums.
   Neretva Nights  synthwave, 100 BPM, D harmonic minor: gated snare, rolling octave bass, a tambura-like arp.
   Čoček Turbo     a Balkan brass dance in 9/8 (2+2+2+3), E Hijaz: tuba bass on the beat, accordion stabs off it.
   Sevdah Deep     deep house, 118 BPM: electric-piano chords and a kaval-like flute in D harmonic minor. */
const Music = (() => {
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const VOL = 0.41;
  let ac = null, master = null, noise = null, hallBuf = null, gateBuf = null, timer = 0, trim = null, trimV = 1;
  let playing = false, wanted = false, nextT = 0, step = 0, bar = 0, S = 0.125;
  let st = null, fx = null, out = null;
  const listeners = [];
  /* the beat, for the radio to bounce to: every kick and snare is noted with the time it will sound */
  const beats = [];
  function pulse(t, k) { if (beats.length < 96) beats.push([t, k]); }

  function build() {
    ac = Sound.context();
    if (!ac) return false;
    master = ac.createGain(); master.gain.value = VOL;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    /* a fast limiter after the compressor catches the odd snare-and-kick peak before it can clip */
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    /* the trim after the limiter is how loud the game wants the music under it (1 is the radio's own level) */
    trim = ac.createGain(); trim.gain.value = trimV;
    master.connect(comp); comp.connect(lim); lim.connect(trim); trim.connect(ac.destination);
    const len = ac.sampleRate;
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const ch = noise.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return true;
  }
  /* reverbs are impulse responses made of noise: a long hall, and a short "gated" one for the eighties snare */
  function ir(sec, shape) {
    const n = Math.ceil(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * shape(i / n);
    }
    return b;
  }
  /* each station plays into its own gain and effects, so a switch fades the old one out cleanly, tails and all */
  function session() {
    const g = ac.createGain(); g.gain.value = 0; g.connect(master);
    const echo = ac.createGain(); echo.gain.value = st.echoLvl || 0.26;
    const d = ac.createDelay(1); d.delayTime.value = S * (st.echo || 3);
    const fb = ac.createGain(); fb.gain.value = 0.33;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    echo.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(g);
    const nodes = [g, echo, d, fb, lp];
    let verb = null, gate = null;
    if (st.verb) {
      if (!hallBuf) hallBuf = ir(2.6, (u) => Math.pow(1 - u, 3.2));
      verb = ac.createConvolver(); verb.buffer = hallBuf;
      const vg = ac.createGain(); vg.gain.value = st.verb; verb.connect(vg); vg.connect(g); nodes.push(verb, vg);
    }
    if (st.gate) {
      if (!gateBuf) gateBuf = ir(0.34, (u) => (u < 0.82 ? 0.55 * (1 - u * 0.35) : 0.55 * 0.71 * (1 - (u - 0.82) / 0.18)));
      gate = ac.createConvolver(); gate.buffer = gateBuf; gate.connect(g); nodes.push(gate);
    }
    return { g, echo, verb, gate, nodes };
  }
  function fadeOut(f, at) {
    f.g.gain.cancelScheduledValues(at); f.g.gain.setValueAtTime(f.g.gain.value, at); f.g.gain.linearRampToValueAtTime(0.0001, at + 0.3);
    setTimeout(() => { for (const n of f.nodes) { try { n.disconnect(); } catch (_) { /* already gone */ } } }, 3500);
  }

  /* ---------- instruments ---------- */
  function osc(type, f, t, end, det) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(t); o.stop(end); return o; }
  function kick(t, lvl = 0.95, f0 = 150, f1 = 42, dur = 0.38) {
    pulse(t, lvl);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function hit(t, type, freq, q, peak, dur, dest, attack = 0.003) {
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    return g;
  }
  function clap(t, lvl = 1) {
    pulse(t, 0.45 * lvl);
    for (const o of [0, 0.011, 0.022]) hit(t + o, 'bandpass', 1500, 0.9, 0.3 * lvl, 0.03);
    hit(t + 0.03, 'bandpass', 1300, 0.7, 0.2 * lvl, 0.2);
  }
  function hat(t, open, lvl = 0.09) { hit(t, 'highpass', 7600, 0, lvl, open ? 0.2 : 0.035); }
  function shaker(t, lvl = 0.05) { hit(t, 'highpass', 6200, 0, lvl, 0.06, null, 0.018); }
  function rim(t, lvl = 0.16) {
    hit(t, 'bandpass', 2600, 4, lvl, 0.03);
    const o = osc('triangle', 1700, t, t + 0.05), g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl * 0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g); g.connect(out);
  }
  /* the eighties snare: a crack, a short body, and a big burst of gated reverb that stops dead */
  function gsnare(t, lvl = 1) {
    pulse(t, 0.5 * lvl);
    const n = hit(t, 'bandpass', 1900, 0.8, 0.32 * lvl, 0.16);
    if (fx.gate) { const s = ac.createGain(); s.gain.value = 0.9; n.connect(s); s.connect(fx.gate); }
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * lvl, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(out); if (fx.gate) g.connect(fx.gate);
    o.start(t); o.stop(t + 0.16);
  }
  function tom(t, f, lvl = 0.5) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.62, t + 0.28);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); g.connect(out); if (fx.gate) g.connect(fx.gate);
    o.start(t); o.stop(t + 0.34);
  }
  function doum(t, lvl = 0.38) {
    pulse(t, 0.4);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(78, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
  }
  function tek(t, k) {
    hit(t, 'bandpass', 3200, 3, 0.16 * k, 0.05);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(820, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * k, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.06);
  }
  function bass(t, m, dur) {
    const f = mtof(m);
    const o = ac.createOscillator(), o2 = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f;
    lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(1100, t); lp.frequency.exponentialRampToValueAtTime(220, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.008);
    g.gain.setValueAtTime(0.3, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(out);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  }
  /* synthwave bass: a short plucked saw on every sixteenth */
  function pluckBass(t, m, dur, lvl = 0.22) {
    const f = mtof(m), end = t + dur + 0.05;
    const lp = ac.createBiquadFilter(), g = ac.createGain();
    lp.type = 'lowpass'; lp.Q.value = 5;
    lp.frequency.setValueAtTime(1500, t); lp.frequency.exponentialRampToValueAtTime(240, t + dur);
    const body = ac.createGain(); body.gain.value = 0.6; body.connect(g);
    osc('sawtooth', f, t, end, -6).connect(lp); osc('sawtooth', f, t, end, 6).connect(lp); osc('sine', f, t, end).connect(body);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(out);
  }
  /* round sub bass for deep house */
  function subBass(t, m, dur, lvl = 0.34) {
    const f = mtof(m), end = t + dur + 0.08;
    const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    osc('sine', f, t, end).connect(g); osc('triangle', f, t, end).connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.012);
    g.gain.setValueAtTime(lvl, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    g.connect(out);
  }
  /* tuba: a short brassy "bwop" on the beat */
  function tuba(t, m, dur, lvl = 0.3) {
    const f = mtof(m), end = t + dur + 0.06;
    const lp = ac.createBiquadFilter(), g = ac.createGain();
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(260, t); lp.frequency.linearRampToValueAtTime(950, t + 0.04); lp.frequency.exponentialRampToValueAtTime(420, t + dur);
    const o = osc('sawtooth', f, t, end), o2 = osc('sine', f, t, end);
    o.frequency.setValueAtTime(f * 0.96, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    o.connect(lp); o2.connect(g); lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.018);
    g.gain.setValueAtTime(lvl * 0.8, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
    g.connect(out);
  }
  function pad(t, chord, dur, dark) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(dark ? 600 : 1300, t);
    if (dark) lp.frequency.linearRampToValueAtTime(1700, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 0.35);
    g.gain.setValueAtTime(0.045, t + dur - 0.25); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
    lp.connect(g); g.connect(out);
    for (const m of chord) for (const det of [-7, 7]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.25);
    }
  }
  /* synthwave pad: wide, slow, spread left and right, into the hall */
  function widePad(t, chord, dur, lvl = 0.05, open = 1600) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(open * 0.6, t); lp.frequency.linearRampToValueAtTime(open, t + dur * 0.6);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.6);
    g.gain.setValueAtTime(lvl, t + dur - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.35);
    lp.connect(g); g.connect(out); if (fx.verb) g.connect(fx.verb);
    const end = t + dur + 0.4;
    chord.forEach((m, i) => {
      for (const [det, pan] of [[-11, -0.6], [11, 0.6]]) {
        const o = osc('sawtooth', mtof(m), t, end, det + (i % 2 ? 3 : -3)), p = ac.createStereoPanner();
        p.pan.value = pan; o.connect(p); p.connect(lp);
      }
    });
  }
  /* electric piano: a sine with a bell-like attack and a slow tremolo */
  function ep(t, chord, dur, lvl = 0.05) {
    const end = t + dur + 0.6, lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
    const trem = ac.createGain(), lfo = osc('sine', 4.2, t, end), lg = ac.createGain();
    trem.gain.value = 1; lg.gain.value = 0.22; lfo.connect(lg); lg.connect(trem.gain);
    lp.connect(trem); trem.connect(out); if (fx.verb) trem.connect(fx.verb);
    for (const m of chord) {
      const f = mtof(m), g = ac.createGain(), b = ac.createGain();
      osc('sine', f, t, end).connect(g);
      osc('sine', f * 2, t, end).connect(b); osc('sine', f * 4.01, t, t + 0.2).connect(b);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.005); g.gain.exponentialRampToValueAtTime(lvl * 0.45, t + 0.7);
      g.gain.setValueAtTime(lvl * 0.45, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
      b.gain.setValueAtTime(0.0001, t); b.gain.exponentialRampToValueAtTime(lvl * 0.35, t + 0.003); b.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      g.connect(lp); b.connect(lp);
    }
  }
  /* accordion stab: two slightly detuned reeds per note, which is what makes a musette shimmer */
  function stab(t, chord, dur, lvl = 0.035) {
    const end = t + dur + 0.08, bp = ac.createBiquadFilter(), g = ac.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.6;
    for (const m of chord) { osc('square', mtof(m), t, end, -11).connect(bp); osc('sawtooth', mtof(m), t, end, 11).connect(bp); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.006);
    g.gain.exponentialRampToValueAtTime(lvl * 0.55, t + 0.06); g.gain.setValueAtTime(lvl * 0.55, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    bp.connect(g); g.connect(out);
  }
  /* tambura-like pluck for the synthwave arp */
  function pluck(t, m, lvl = 0.05) {
    const f = mtof(m), end = t + 0.32, hp = ac.createBiquadFilter(), g = ac.createGain();
    hp.type = 'highpass'; hp.frequency.value = 280;
    osc('triangle', f, t, end).connect(hp); osc('sawtooth', f, t, end, 4).connect(hp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    hp.connect(g); g.connect(out); g.connect(fx.echo);
  }
  /* the Polahko lead: a reedy voice that bends up into each note */
  function lead(t, m, dur, soft) {
    const f = mtof(m);
    const o = ac.createOscillator(), o2 = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain();
    const bp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 6;
    for (const x of [o, o2]) { x.frequency.setValueAtTime(f * 0.944, t); x.frequency.exponentialRampToValueAtTime(f, t + 0.045); }
    lfo.frequency.value = 5.8; lg.gain.value = f * 0.007;
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    bp.type = 'bandpass'; bp.frequency.value = soft ? 1100 : 1800; bp.Q.value = 0.8;
    const pk = soft ? 0.07 : 0.12;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.012);
    g.gain.exponentialRampToValueAtTime(pk * 0.6, t + 0.12);
    g.gain.setValueAtTime(pk * 0.6, t + Math.max(0.13, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, dur + 0.08));
    o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(out); g.connect(fx.echo);
    const end = t + Math.max(0.22, dur + 0.1);
    for (const x of [o, o2, lfo]) { x.start(t); x.stop(end); }
  }
  /* a vibrato that arrives a moment after the note starts, like a singer's */
  function vibrato(t, end, freqs, rate, depth, delay) {
    const lfo = osc('sine', rate, t, end), lg = ac.createGain();
    lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + delay); lg.gain.linearRampToValueAtTime(depth, t + delay + 0.25);
    lfo.connect(lg); for (const p of freqs) lg.connect(p);
  }
  /* synthwave lead: two detuned saws through a bright filter, with portamento and late vibrato */
  function synthLead(t, m, dur, lvl = 0.085, from) {
    const f = mtof(m), end = t + dur + 0.25;
    const lp = ac.createBiquadFilter(), g = ac.createGain();
    lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 0.06);
    const os = [osc('sawtooth', f, t, end, -8), osc('sawtooth', f, t, end, 8), osc('square', f / 2, t, end)];
    if (from) for (const o of os) { const k = o.type === 'square' ? 0.5 : 1; o.frequency.setValueAtTime(mtof(from) * k, t); o.frequency.exponentialRampToValueAtTime(f * k, t + 0.06); }
    vibrato(t, end, os.map((o) => o.frequency), 5.6, f * 0.006, Math.min(0.25, dur * 0.5));
    const sq = ac.createGain(); sq.gain.value = 0.35; os[2].connect(sq); sq.connect(lp);
    os[0].connect(lp); os[1].connect(lp);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.02);
    g.gain.setValueAtTime(lvl, t + Math.max(0.03, dur - 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);
    lp.connect(g); g.connect(out); g.connect(fx.echo); if (fx.verb) g.connect(fx.verb);
  }
  /* brass: a scoop into the note, a filter that blats open, then a wide vibrato */
  function brass(t, m, dur, lvl = 0.1) {
    const f = mtof(m), end = t + dur + 0.12;
    const lp = ac.createBiquadFilter(), g = ac.createGain();
    lp.type = 'lowpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(2700, t + 0.045); lp.frequency.exponentialRampToValueAtTime(1700, t + 0.22);
    const os = [osc('sawtooth', f, t, end, -6), osc('sawtooth', f, t, end, 7)];
    for (const o of os) { o.frequency.setValueAtTime(f * 0.965, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04); o.connect(lp); }
    vibrato(t, end, os.map((o) => o.frequency), 6.3, f * 0.009, Math.min(0.18, dur * 0.6));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.024);
    g.gain.exponentialRampToValueAtTime(lvl * 0.78, t + 0.14); g.gain.setValueAtTime(lvl * 0.78, t + Math.max(0.15, dur - 0.03));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    lp.connect(g); g.connect(out); g.connect(fx.echo);
  }
  /* kaval-like flute: a pure tone, a little edge, breath on the attack, a slow vibrato */
  function flute(t, m, dur, lvl = 0.07) {
    const f = mtof(m), end = t + dur + 0.3;
    const o = osc('sine', f, t, end), o2 = osc('triangle', f * 2, t, end), g = ac.createGain(), e = ac.createGain();
    e.gain.value = 0.12; o2.connect(e); e.connect(g); o.connect(g);
    for (const x of [o, o2]) { const k = x === o ? 1 : 2; x.frequency.setValueAtTime(f * k * 0.975, t); x.frequency.exponentialRampToValueAtTime(f * k, t + 0.07); }
    vibrato(t, end, [o.frequency, o2.frequency], 5, f * 0.011, Math.min(0.3, dur * 0.5));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + 0.07);
    g.gain.setValueAtTime(lvl, t + Math.max(0.08, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.22);
    g.connect(out); g.connect(fx.echo); if (fx.verb) g.connect(fx.verb);
    hit(t, 'bandpass', Math.min(6000, f * 2), 1.5, lvl * 0.5, 0.12, null, 0.02);
  }
  function riser(t, dur) {
    const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(6000, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.1);
  }
  /* a third (two scale steps) below, inside a scale given as pitch classes */
  function below(m, scale, steps) {
    let x = m;
    for (let k = 0; k < steps; k++) { do { x--; } while (!scale.includes(((x % 12) + 12) % 12)); }
    return x;
  }

  /* ---------- 1 · Polahko House ---------- */
  const PH = {
    CHORDS: [[57, 61, 64], [57, 62, 65], [58, 62, 67], [57, 61, 64]], // A, Dm, Gm, A
    ROOTS: [45, 38, 43, 45],
    LEAD: [
      [[0, 76, 2], [2, 77, 1], [3, 76, 1], [4, 73, 2], [6, 74, 2], [8, 76, 4], [12, 73, 2], [14, 70, 2]],
      [[0, 69, 2], [2, 70, 2], [4, 73, 2], [6, 74, 2], [8, 77, 3], [11, 76, 1], [12, 74, 4]],
      [[0, 79, 2], [2, 77, 1], [3, 76, 1], [4, 74, 2], [6, 77, 2], [8, 76, 2], [10, 74, 2], [12, 73, 2], [14, 74, 2]],
      [[0, 76, 6], [6, 74, 1], [7, 73, 1], [8, 70, 2], [10, 73, 2], [12, 69, 4]],
    ],
    DOUM: [0, 8], TEK: [3, 6, 11, 14], KA: [5, 13],
  };
  function polahko(s, p, t) {
    const name = p.name, ci = p.pos % 4;
    const drums = name === 'groove' || name === 'hook' || name === 'hook2';
    if (s === 0) pad(t, PH.CHORDS[ci], 16 * S, name === 'break');
    if (drums && s % 4 === 0) kick(t);
    if (drums && (s === 4 || s === 12)) clap(t);
    if (name !== 'break' && s % 4 === 2) hat(t, drums && s === 14 && p.pos % 2 === 1);
    if (drums && s % 2 === 1) hat(t, false, 0.035);
    if (name !== 'intro' || ci >= 2) {
      if (PH.DOUM.includes(s)) doum(t);
      if (PH.TEK.includes(s)) tek(t, 1);
      if (PH.KA.includes(s)) tek(t, 0.5);
    }
    if (drums && s % 4 === 2) bass(t, PH.ROOTS[ci] + (s === 10 ? 12 : 0), S * 1.7);
    if (name === 'hook' || name === 'hook2' || name === 'break') {
      for (const [at, m, len] of PH.LEAD[ci]) if (at === s) lead(t, m + (name === 'hook2' && ci === 3 ? 12 : 0), len * S, name === 'break');
    }
    if (p.pos === 23 && s === 0) riser(t, 16 * S);
  }

  /* ---------- 2 · Neretva Nights (synthwave) ---------- */
  const NR = {
    CHORDS: [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]], // Dm, Bb, Gm, A
    ROOTS: [38, 34, 31, 33],
    ARP: [[74, 77, 81, 86], [70, 74, 77, 82], [67, 70, 74, 79], [69, 73, 76, 81]],
    LEAD: [
      [[0, 81, 3], [3, 77, 1], [4, 81, 2], [6, 82, 2], [8, 81, 4], [12, 79, 2], [14, 77, 2]],
      [[0, 77, 3], [3, 74, 1], [4, 77, 2], [6, 79, 2], [8, 77, 6], [14, 76, 1], [15, 77, 1]],
      [[0, 79, 2], [2, 82, 2], [4, 81, 2], [6, 79, 2], [8, 77, 2], [10, 76, 2], [12, 74, 4]],
      [[0, 73, 2], [2, 76, 2], [4, 81, 4], [8, 82, 2], [10, 81, 1], [11, 79, 1], [12, 77, 2], [14, 76, 2]],
      [[0, 86, 4], [4, 85, 2], [6, 86, 2], [8, 81, 4], [12, 82, 2], [14, 81, 2]],
      [[0, 79, 2], [2, 77, 2], [4, 79, 2], [6, 81, 2], [8, 82, 4], [12, 81, 4]],
      [[0, 79, 3], [3, 81, 1], [4, 82, 2], [6, 81, 2], [8, 79, 2], [10, 77, 2], [12, 76, 2], [14, 77, 2]],
      [[0, 76, 2], [2, 73, 2], [4, 76, 2], [6, 77, 1], [7, 76, 1], [8, 73, 8]],
    ],
  };
  let nrPrev = 0;
  function neretva(s, p, t) {
    const n = p.name, ci = p.pos % 4, live = n === 'verse' || n === 'hook' || n === 'hook2';
    if (s === 0) widePad(t, NR.CHORDS[ci], 16 * S, n === 'break' ? 0.06 : 0.045, n === 'intro' ? 1100 : 1700);
    if (n !== 'break') {
      const a = NR.ARP[ci], seq = [0, 1, 2, 3, 2, 1];
      if (n !== 'intro' || p.i >= 2 || s % 2 === 0) pluck(t, a[seq[s % 6]], n === 'intro' ? 0.03 : 0.04);
    }
    if (live) {
      if (s === 0 || s === 8 || (s === 10 && p.pos % 2 === 1)) kick(t, 0.9, 140, 44, 0.42);
      if (s === 4 || s === 12) gsnare(t);
      if (s % 2 === 0) hat(t, false, s % 4 === 2 ? 0.07 : 0.04);
      if (s === 14 && p.i % 2 === 1) hat(t, true, 0.05);
      const r = NR.ROOTS[ci];
      pluckBass(t, r + (s % 4 === 2 ? 12 : 0), S * 0.9);
      if (p.i === 7 && s >= 12) tom(t, [230, 190, 160, 130][s - 12]);
    } else if (n === 'intro' && p.i >= 2 && s % 4 === 0) kick(t, 0.55, 120, 44, 0.3);
    if (n === 'hook' || n === 'hook2' || n === 'break') {
      for (const [at, m, len] of NR.LEAD[p.i % 8]) if (at === s) {
        synthLead(t, m, len * S, n === 'break' ? 0.06 : 0.085, len >= 2 && Math.abs(m - nrPrev) <= 5 ? nrPrev : 0);
        if (n === 'hook2') synthLead(t, m - 12, len * S, 0.04);
        nrPrev = m;
      }
    }
    if (p.pos === 23 && s === 0) riser(t, 16 * S);
  }

  /* ---------- 3 · Čoček Turbo (9/8, 2+2+2+3) ---------- */
  /* a bar is 18 sixteenths: the beats fall on 0, 4, 8 and 12, and the last one is half again as long */
  const EH = [4, 5, 8, 9, 11, 0, 2]; // E Hijaz: E F G# A B C D
  const CK = {
    E: [64, 68, 71], Dm: [62, 65, 69],
    BARS: ['E', 'E', 'Dm', 'E', 'E', 'Dm', 'Dm', 'E'],
    MEL: [
      [[0, 76, 2], [2, 77, 2], [4, 80, 2], [6, 81, 2], [8, 83, 4], [12, 81, 2], [14, 80, 2], [16, 77, 2]],
      [[0, 76, 4], [4, 77, 2], [6, 76, 2], [8, 74, 2], [10, 76, 2], [12, 80, 6]],
      [[0, 77, 2], [2, 81, 2], [4, 86, 4], [8, 84, 2], [10, 83, 2], [12, 81, 2], [14, 80, 2], [16, 81, 2]],
      [[0, 80, 2], [2, 77, 2], [4, 76, 6], [10, 77, 1], [11, 76, 1], [12, 80, 2], [14, 77, 2], [16, 76, 2]],
      [[0, 83, 2], [2, 84, 2], [4, 86, 2], [6, 84, 2], [8, 83, 4], [12, 84, 2], [14, 83, 2], [16, 81, 2]],
      [[0, 81, 2], [2, 83, 2], [4, 84, 4], [8, 81, 2], [10, 80, 2], [12, 81, 6]],
      [[0, 77, 2], [2, 80, 2], [4, 81, 2], [6, 80, 2], [8, 77, 2], [10, 76, 2], [12, 77, 2], [14, 80, 2], [16, 77, 2]],
      [[0, 76, 6], [6, 71, 2], [8, 76, 2], [10, 80, 2], [12, 76, 6]],
    ],
  };
  function cocek(s, p, t) {
    const n = p.name, bi = p.i % 8, chord = CK[CK.BARS[bi]], root = CK.BARS[bi] === 'E' ? 40 : 38;
    const full = n !== 'intro' && n !== 'break';
    if (s === 0 || s === 8) doum(t, 0.34);
    if ([2, 6, 10, 14, 16].includes(s)) tek(t, s === 16 ? 0.8 : 1);
    if (full) {
      if (s === 0 || s === 8 || s === 16) kick(t, s === 16 ? 0.5 : 0.82, 150, 48, 0.28);
      if (s === 4 || s === 12) clap(t, 0.8);
      if (s % 2 === 0) hat(t, false, s % 4 === 0 ? 0.05 : 0.07);
      if (s === 2 || s === 6 || s === 10 || s === 14) stab(t, chord, S * 1.4);
    }
    if (n !== 'break') {
      const third = CK.BARS[bi] === 'E' ? 4 : 3, line = { 0: root, 4: root + 7, 8: root, 12: root + third, 16: root + 7 };
      if (line[s] !== undefined) tuba(t, line[s], S * 1.6, n === 'intro' ? 0.22 : 0.26);
    }
    if (n === 'a' || n === 'a2') {
      for (const [at, m, len] of CK.MEL[bi]) if (at === s) {
        brass(t, m, len * S, 0.1);
        if (n === 'a2') brass(t, below(m, EH, 2), len * S, 0.065);
      }
    }
  }

  /* ---------- 4 · Sevdah Deep (deep house) ---------- */
  const SD = {
    CHORDS: [[50, 53, 57, 60, 64], [55, 58, 62, 65], [58, 62, 65, 69], [57, 61, 64, 67, 70]], // Dm9, Gm7, Bbmaj7, A7(b9)
    ROOTS: [38, 43, 46, 45],
    MEL: [
      [[0, 81, 6], [6, 79, 1], [7, 77, 1], [8, 76, 4], [12, 77, 2], [14, 76, 2]],
      [[0, 74, 8], [8, 70, 2], [10, 74, 2], [12, 79, 4]],
      [[0, 77, 6], [6, 79, 2], [8, 81, 4], [12, 82, 2], [14, 81, 2]],
      [[0, 81, 4], [4, 82, 2], [6, 81, 2], [8, 79, 2], [10, 77, 1], [11, 76, 1], [12, 73, 4]],
      [[0, 74, 6], [6, 76, 2], [8, 77, 4], [12, 81, 4]],
      [[0, 82, 6], [6, 81, 2], [8, 79, 8]],
      [[0, 77, 4], [4, 79, 2], [6, 77, 2], [8, 74, 4], [12, 76, 2], [14, 77, 2]],
      [[0, 76, 2], [2, 73, 2], [4, 76, 4], [8, 74, 8]],
    ],
  };
  function deep(s, p, t) {
    const n = p.name, ci = p.pos % 4, groove = n === 'groove' || n === 'melody' || n === 'melody2';
    if (s === 0) ep(t, SD.CHORDS[ci], S * 6, n === 'intro' ? 0.065 : 0.08);
    if (s === 7) ep(t, SD.CHORDS[ci], S * 1.5, 0.05);
    if (s === 10) ep(t, SD.CHORDS[ci], S * 5, 0.065);
    if (n !== 'break') shaker(t, s % 2 === 1 ? 0.07 : 0.035);
    if (groove) {
      if (s % 4 === 0) kick(t, 0.72, 120, 42, 0.4);
      if (s === 4 || s === 12) rim(t, 0.2);
      if (s % 4 === 2) hat(t, true, 0.045);
      const r = SD.ROOTS[ci], line = { 0: [r, 2], 3: [r, 2], 7: [r + 12, 1], 10: [r + 7, 3] };
      if (line[s]) subBass(t, line[s][0], line[s][1] * S, 0.2);
    } else if (n === 'intro' && p.i >= 2 && s % 4 === 0) kick(t, 0.5, 110, 40, 0.3);
    if (n === 'melody' || n === 'melody2' || n === 'break') {
      for (const [at, m, len] of SD.MEL[p.i % 8]) if (at === s) {
        flute(t, m, len * S, n === 'break' ? 0.08 : 0.1);
        if (n === 'melody2') flute(t, m + 12, len * S, 0.035);
      }
    }
  }

  /* ---------- 5 · Bihać Slow (very chill: slow pads, a soft flute, almost no drums; for the Una ride) ---------- */
  const BH = {
    CHORDS: [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 56, 59, 62]], // Am9, Fmaj7, Dm7, E
    ROOTS: [45, 41, 38, 40],
    MEL: [
      [[0, 69, 6], [8, 72, 4], [12, 76, 4]],
      [[0, 76, 4], [6, 74, 2], [8, 72, 6]],
      [[0, 72, 4], [6, 76, 4], [12, 74, 4]],
      [[0, 74, 8], [10, 72, 4]],
    ],
  };
  function bihac(s, p, t) {
    const n = p.name, ci = p.pos % 4;
    if (s === 0) widePad(t, BH.CHORDS[ci], 16 * S, n === 'break' ? 0.035 : 0.03, 900);
    if (n !== 'intro' && s % 4 === 0) subBass(t, BH.ROOTS[ci], S * 3.5, 0.14);
    if (n === 'groove' || n === 'melody' || n === 'melody2') {
      if (s % 4 === 2) shaker(t, 0.025);
      if (s === 8) rim(t, 0.1);
    }
    if (n === 'melody' || n === 'melody2' || n === 'break') {
      for (const [at, m, len] of BH.MEL[p.i % 4]) if (at === s) {
        flute(t, m, len * S, n === 'break' ? 0.06 : 0.075);
        if (n === 'melody2') flute(t, m + 12, len * S, 0.025);
      }
    }
  }

  /* ---------- the stations ---------- */
  const STATIONS = [
    { id: 'polahko', name: 'Polahko House', desc: 'Balkan house · 122 BPM', s16: 60 / 122 / 4, steps: 16, swing: 0.07, echo: 3, level: 1,
      arr: [['intro', 4], ['groove', 8], ['hook', 8], ['break', 4], ['hook2', 8]], play: polahko },
    { id: 'neretva', name: 'Neretva Nights', desc: 'Synthwave · 100 BPM', s16: 60 / 100 / 4, steps: 16, swing: 0, echo: 3, echoLvl: 0.2, verb: 0.55, gate: true, level: 1.8,
      arr: [['intro', 4], ['verse', 8], ['hook', 8], ['break', 4], ['hook2', 8]], play: neretva },
    { id: 'cocek', name: 'Čoček Turbo', desc: 'Balkan brass in 9/8', s16: 0.082, steps: 18, swing: 0, echo: 4, echoLvl: 0.16, level: 1.5,
      arr: [['intro', 2], ['a', 8], ['b', 4], ['a2', 8], ['break', 2]], play: cocek },
    { id: 'sevdah', name: 'Sevdah Deep', desc: 'Deep house · 118 BPM', s16: 60 / 118 / 4, steps: 16, swing: 0.11, echo: 3, echoLvl: 0.22, verb: 0.4, level: 1.06,
      arr: [['intro', 4], ['groove', 8], ['melody', 8], ['break', 4], ['melody2', 8]], play: deep },
    { id: 'bihac', name: 'Bihać Slow', desc: 'Very chill Balkan synth · 72 BPM', s16: 60 / 72 / 4, steps: 16, swing: 0.06, echo: 3, echoLvl: 0.25, verb: 0.6, level: 0.9,
      arr: [['intro', 4], ['groove', 8], ['melody', 8], ['break', 4], ['melody2', 8]], play: bihac },
  ];
  const byId = (id) => STATIONS.find((x) => x.id === id) || STATIONS[0];
  st = byId(Store.get('station', 'polahko'));

  /* where bar b falls in the station's arrangement; after the last section it loops back to the second */
  function part(b) {
    const A = st.arr, head = A[0][1], total = A.reduce((n, a) => n + a[1], 0);
    const pos = b < total ? b : head + ((b - head) % (total - head));
    let k = pos;
    for (const [name, n] of A) { if (k < n) return { name, i: k, pos }; k -= n; }
    return { name: A[0][0], i: 0, pos: 0 };
  }
  function tick(until) {
    const end = until !== undefined ? until : ac.currentTime + 0.12;
    while (nextT < end) {
      if (step === 0) pulse(nextT, 0.22);
      st.play(step, part(bar), nextT);
      nextT += S * (st.swing ? (step % 2 === 0 ? 1 + st.swing : 1 - st.swing) : 1);
      step++;
      if (step === st.steps) { step = 0; bar++; }
    }
  }
  /* a fresh start plays the intro; a switch drops straight into the groove */
  function begin(at, skipIntro) {
    S = st.s16; step = 0; bar = skipIntro ? st.arr[0][1] : 0; nextT = at; nrPrev = 0;
    fx = session(); out = fx.g;
    fx.g.gain.setValueAtTime(0.0001, at - 0.02); fx.g.gain.linearRampToValueAtTime(st.level, at + 0.9);
  }
  function start(id, remember = true) {
    if (id) { st = byId(id); if (remember) Store.set('station', st.id); }
    if (playing) return true;
    if (!ac && !build()) return false;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    playing = true; wanted = true;
    begin(ac.currentTime + 0.08);
    clearInterval(timer);
    timer = setInterval(() => tick(), 25);
    tick();
    listeners.forEach((fn) => fn(true, st));
    return true;
  }
  /* change station: fade the old one, start the new one from its top. The game's level soundtrack doesn't change the
     station the radio remembers (remember false). */
  function set(id, remember = true) {
    const next = byId(id);
    if (remember) Store.set('station', next.id);
    if (!playing) return start(next.id, remember);
    if (next === st) return true;
    const t = ac.currentTime;
    if (fx) fadeOut(fx, t);
    st = next;
    begin(t + 0.32, true);
    tick();
    listeners.forEach((fn) => fn(true, st));
    return true;
  }
  function stop(keepWanted) {
    if (!playing) { if (!keepWanted) wanted = false; return; }
    playing = false;
    if (!keepWanted) wanted = false;
    clearInterval(timer);
    beats.length = 0;
    if (fx) { fadeOut(fx, ac.currentTime); fx = null; }
    if (!keepWanted) listeners.forEach((fn) => fn(false, st));
  }
  /* the game sets how loud the music sits under it, and dips it for a moment under a loud effect like the bear's roar */
  function level(v, tau) {
    trimV = v;
    if (!trim) return;
    const t = ac.currentTime, g = trim.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(v, t, tau === undefined ? 0.25 : tau);
  }
  function duck(depth, hold) {
    if (!trim || !playing) return;
    const t = ac.currentTime, g = trim.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(trimV * depth, t, 0.03);
    g.setTargetAtTime(trimV, t + hold, 0.35);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stop(true);
    else if (!document.hidden && wanted && !playing) start();
  });
  return {
    start, stop, set, level, duck,
    onChange(fn) { listeners.push(fn); },
    get playing() { return playing; },
    get station() { return st; },
    stations: STATIONS.map(({ id, name, desc }) => ({ id, name, desc })),
    /* what the listener hears right now, on the music's clock: the output timestamp allows for speaker and headphone delay */
    heard() {
      if (!ac) return 0;
      if (ac.getOutputTimestamp) {
        const o = ac.getOutputTimestamp();
        if (o && o.contextTime > 0 && o.performanceTime > 0) return o.contextTime + Math.max(0, performance.now() - o.performanceTime) / 1000;
      }
      return ac.currentTime - (ac.outputLatency || ac.baseLatency || 0);
    },
    /* the strongest beat that has sounded by `now` since the last call (0 if none) */
    beat(now) { let k = 0; while (beats.length && beats[0][0] <= now) k = Math.max(k, beats.shift()[1]); return k; },
    /* tests render a stretch offline: schedule everything up to `sec` seconds ahead */
    _fill(sec) { if (playing) tick(sec); },
  };
})();
/* ===== game language: English or Bosnian =====
   English unless the browser's first language is Bosnian, Croatian or Serbian; the player's choice is remembered.
   Static game text keeps its Bosnian in the page and its English in data-en (text), data-en-ph (placeholder)
   and data-en-aria (aria-label). .bs-only and .en-only show in one language; .gloss is the English under a shout. */
const Lang = (() => {
  const NATIVE = /^(bs|hr|sr|sh|cnr)\b/i;
  function detect() {
    const l = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return NATIVE.test(l) ? 'bs' : 'en';
  }
  let cur = Store.get('lang', '');
  if (cur !== 'en' && cur !== 'bs') cur = detect();
  const fns = [];
  function swap(sel, key, read, write) {
    for (const el of $$(sel)) {
      const bsKey = 'bs' + key, enKey = 'en' + key;
      if (el.dataset[bsKey] === undefined) el.dataset[bsKey] = read(el);
      write(el, cur === 'en' ? el.dataset[enKey] : el.dataset[bsKey]);
    }
  }
  function apply() {
    document.documentElement.dataset.gl = cur;
    /* screen readers pronounce the game in its own language: the section and every swapped string say which */
    for (const id of ['igra', 'ticker']) { const s = document.getElementById(id); if (s) s.lang = cur; }
    swap('[data-en]', '', (el) => el.textContent, (el, v) => { el.textContent = v; el.lang = cur; });
    swap('[data-en-ph]', 'Ph', (el) => el.getAttribute('placeholder') || '', (el, v) => el.setAttribute('placeholder', v));
    swap('[data-en-aria]', 'Aria', (el) => el.getAttribute('aria-label') || '', (el, v) => el.setAttribute('aria-label', v));
    for (const b of $$('[data-gl-btn]')) b.setAttribute('aria-pressed', String(b.dataset.glBtn === cur));
  }
  function set(l) {
    if ((l !== 'en' && l !== 'bs') || l === cur) return;
    cur = l;
    Store.set('lang', l);
    apply();
    fns.forEach((fn) => fn(l));
  }
  apply();
  for (const b of $$('[data-gl-btn]')) b.addEventListener('click', () => set(b.dataset.glBtn));
  return { get en() { return cur === 'en'; }, get cur() { return cur; }, set, on(fn) { fns.push(fn); } };
})();
/* the text for the current game language */
const L = (bs, en) => (Lang.en ? en : bs);
/* ranks are stored and sent to the scoreboard in Bosnian; English players see them translated */
const RANK_EN = { 'Kralj zida': 'King of the Wall', 'Legenda čaršije': 'Street legend', 'Majstor': 'Master', 'Grafiter': 'Writer', 'Šegrt': 'Apprentice' };
const rankName = (r) => (Lang.en && RANK_EN[r]) || r || '';
/* ===== hero: the spray wall, a photo of a real wall with a paint canvas on top ===== */
const Hero = (() => {
  const wall = $('#wall'), cv = $('#wall-canvas'), c = cv.getContext('2d');
  const hint = $('#wall-hint'), roller = $('#roller'), armBtn = $('#arm-toggle');
  const TAGFONT = '"Sedgwick Ave Display", "Marker Felt", "Segoe Print", cursive';
  let W = 0, H = 0, dpr = 1;
  let paint = PAINTS[0];
  let cap = 'fat';
  let armed = false;
  let down = false, pid = null, lx = 0, ly = 0, stillSince = 0, lastDrip = 0;
  let running = false, hinted = false;
  const drips = [], reveals = [];
  let wipe = null;
  const stamps = new Map();
  /* paint styles: r is the reach of the spray; hiss is how loud the can is; drip says how readily it runs */
  const STYLES = {
    skinny: { r: 8, hiss: 0.6, drip: [1.3, 2, 20, 60] },
    fat: { r: 24, hiss: 1, drip: [2.2, 3.6, 40, 120] },
    mist: { r: 46, hiss: 0.85, drip: null },
    splatter: { r: 20, hiss: 0.9, drip: [1.6, 2.8, 14, 50] },
    drippy: { r: 20, hiss: 1, drip: [2.4, 4, 60, 160], every: [30, 80] },
    marker: { r: 5, hiss: 0.35, drip: [1.6, 2.4, 16, 46] },
  };
  const capR = () => STYLES[cap].r;
  let travel = 0, nextRun = 60;
  /* hand speed in px per ms, smoothed: a fast pass spreads the paint wider and thinner, a slow one lays it on thick */
  let speed = 0, lastT = 0, shook = false;
  const isCoarse = () => document.documentElement.classList.contains('coarse');

  function stamp(hex, r) {
    const key = hex + '|' + r + '|' + dpr;
    let s = stamps.get(key);
    if (s) return s;
    s = document.createElement('canvas');
    const px = Math.max(2, Math.ceil(r * 2 * dpr));
    s.width = s.height = px;
    const x = s.getContext('2d');
    const gr = x.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    gr.addColorStop(0, hexA(hex, 0.9));
    gr.addColorStop(0.45, hexA(hex, 0.42));
    gr.addColorStop(1, hexA(hex, 0));
    x.fillStyle = gr;
    x.fillRect(0, 0, px, px);
    stamps.set(key, s);
    return s;
  }

  function dot(x, y, hex, r, k = 1) {
    c.globalAlpha = 0.5 * k;
    c.drawImage(stamp(hex, r), x - r, y - r, r * 2, r * 2);
    c.fillStyle = hex;
    const n = r > 12 ? 9 : 4;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, d = r * (0.55 + Math.random() * 0.85);
      const s = Math.random() * 1.4 + 0.4;
      c.globalAlpha = (0.15 + Math.random() * 0.5) * k;
      c.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s);
    }
    c.globalAlpha = 1;
  }
  function line(x0, y0, x1, y1, hex, r) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (cap === 'marker') {
      c.strokeStyle = hex; c.lineWidth = r * 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      return;
    }
    const s = clamp(speed / 1.6, 0, 1);
    const rr = Math.round(r * (1 + 0.3 * s)), k = 0.8 * (1 - 0.35 * s);   /* whole pixels, so the stamp cache stays small */
    const gap = cap === 'mist' ? rr * 0.22 : cap === 'splatter' ? rr * 0.7 : rr * 0.33;
    const n = Math.max(1, Math.ceil(d / Math.max(1, gap)));
    for (let i = 1; i <= n; i++) spray(lerp(x0, x1, i / n), lerp(y0, y1, i / n), hex, rr, k);
  }
  /* one puff of the current style */
  function spray(x, y, hex, r, k = 1) {
    painted = true;
    if (cap === 'mist') { mist(x, y, hex, r, k); return; }
    if (cap === 'splatter') { splat(x, y, hex, r, k); return; }
    if (cap === 'marker') { c.globalAlpha = Math.min(1, k * 1.25); c.fillStyle = hex; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1; return; }
    dot(x, y, hex, r, k);
  }
  /* mist: a faint, wide haze that builds up slowly */
  function mist(x, y, hex, r, k) {
    c.globalAlpha = 0.2 * k;
    c.drawImage(stamp(hex, r), x - r, y - r, r * 2, r * 2);
    c.fillStyle = hex;
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * TAU, d = r * Math.random();
      c.globalAlpha = (0.15 + Math.random() * 0.3) * k;
      c.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.2, 1.2);
    }
    c.globalAlpha = 1;
  }
  /* splatter: drops of every size flicked off the cap, the big ones sometimes run */
  function splat(x, y, hex, r, k) {
    c.fillStyle = hex;
    const n = Math.random() < k ? 3 + ((Math.random() * 4) | 0) : 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, d = r * 1.5 * Math.pow(Math.random(), 0.7);
      const big = Math.random() < 0.08;
      const s = big ? rand(3.5, 6.5) : rand(0.6, 2.4);
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      c.globalAlpha = big ? 0.95 : 0.55 + Math.random() * 0.4;
      c.beginPath(); c.ellipse(px, py, s, s * rand(0.75, 1), a, 0, TAU); c.fill();
      if (big && Math.random() < 0.25) drip(px, py + s * 0.6, hex, s * 0.55, rand(10, 40));
    }
    c.globalAlpha = 1;
  }

  /* drips run down when the can stays still */
  function drip(x, y, hex, w, len) {
    const p = { x, y, hex, w: w || rand(1.6, 3.4), len: len || rand(28, 110), vy: rand(36, 70), d: 0 };
    if (REDUCED) {
      c.strokeStyle = hex; c.lineWidth = p.w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + p.len); c.stroke();
      c.fillStyle = hex; c.beginPath(); c.arc(x, y + p.len + p.w * 0.3, p.w * 0.85, 0, TAU); c.fill();
      return;
    }
    drips.push(p);
    loop();
  }
  function stepDrips(dt) {
    for (let i = drips.length - 1; i >= 0; i--) {
      const p = drips[i];
      const dy = p.vy * dt;
      c.strokeStyle = p.hex; c.lineWidth = p.w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p.x, p.y);
      p.x += (Math.random() - 0.5) * 0.2; p.y += dy;
      c.lineTo(p.x, p.y); c.stroke();
      p.d += dy; p.vy = Math.max(10, p.vy * 0.985);
      if (p.d >= p.len) {
        c.fillStyle = p.hex; c.beginPath(); c.arc(p.x, p.y + p.w * 0.3, p.w * 0.85, 0, TAU); c.fill();
        drips.splice(i, 1);
      }
    }
  }

  /* tags in the handstyle face */
  function tagCanvas(text, size, fill, outline) {
    const m = document.createElement('canvas').getContext('2d');
    m.font = `${size}px ${TAGFONT}`;
    const tw = m.measureText(text).width;
    const pad = size * 0.35;
    const w = Math.ceil(tw + pad * 2), h = Math.ceil(size * 1.7);
    const oc = document.createElement('canvas');
    oc.width = Math.max(1, Math.ceil(w * dpr)); oc.height = Math.max(1, Math.ceil(h * dpr));
    const x = oc.getContext('2d');
    x.scale(dpr, dpr);
    x.font = `${size}px ${TAGFONT}`;
    x.textBaseline = 'middle';
    x.lineJoin = 'round';
    x.lineWidth = Math.max(3, size * 0.16); x.strokeStyle = outline;
    x.strokeText(text, pad + size * 0.05, h / 2 + size * 0.06);
    x.shadowColor = fill; x.shadowBlur = size * 0.2;
    x.fillStyle = fill; x.fillText(text, pad, h / 2);
    x.shadowBlur = 0;
    x.lineWidth = Math.max(1.5, size * 0.05); x.strokeStyle = outline; x.strokeText(text, pad, h / 2);
    x.fillText(text, pad, h / 2);
    return { img: oc, w, h };
  }
  function putTag(t, x, y, rot, fill, animate) {
    painted = true;
    const r = { t, x, y, rot, fill, p: 0, start: performance.now(), dur: animate && !REDUCED ? 650 : 0 };
    if (!r.dur) { drawSlice(r, 0, t.w); tagDrips(r); return r; }
    reveals.push(r);
    loop();
    return r;
  }
  function drawSlice(r, a, b) {
    if (b - a < 0.5) return;
    c.save();
    c.translate(r.x, r.y); c.rotate(r.rot);
    const sw = Math.min(r.t.img.width - a * dpr, (b - a) * dpr);
    if (sw > 0) c.drawImage(r.t.img, a * dpr, 0, sw, r.t.img.height, a, 0, sw / dpr, r.t.h);
    c.restore();
  }
  function stepReveals(now) {
    for (let i = reveals.length - 1; i >= 0; i--) {
      const r = reveals[i];
      const p = clamp((now - r.start) / r.dur, 0, 1);
      drawSlice(r, r.p * r.t.w, p * r.t.w);
      r.p = p;
      if (p >= 1) { reveals.splice(i, 1); tagDrips(r); }
    }
    if (!reveals.length && !down) Sound.hiss(0);
  }
  function tagDrips(r) {
    const n = 1 + ((Math.random() * 3) | 0);
    const cs = Math.cos(r.rot), sn = Math.sin(r.rot);
    for (let i = 0; i < n; i++) {
      const tx = r.t.w * (0.2 + Math.random() * 0.6), ty = r.t.h * 0.66;
      drip(r.x + tx * cs - ty * sn, r.y + tx * sn + ty * cs, r.fill, rand(1.5, 2.6), rand(18, 60));
    }
  }

  /* whitewash: a roller clears the wall */
  function whitewash() {
    hideHint();
    drips.length = 0; reveals.length = 0; painted = false;
    if (REDUCED || !W) { c.clearRect(0, 0, W, H); toast('Prekrečeno. The wall is clean again.'); return; }
    wipe = { start: performance.now(), dur: 700, x: 0 };
    roller.hidden = false;
    Sound.hiss(0.45);
    loop();
  }
  function stepWipe(now) {
    const p = clamp((now - wipe.start) / wipe.dur, 0, 1);
    const x = p * (W + 50);
    c.clearRect(Math.max(0, wipe.x - 2), 0, x - wipe.x + 2, H);
    wipe.x = x;
    roller.style.transform = `translateX(${x - 23}px)`;
    if (p >= 1) {
      c.clearRect(0, 0, W, H);
      wipe = null; roller.hidden = true; roller.style.transform = '';
      Sound.hiss(0);
      toast('Prekrečeno. The wall is clean again.');
    }
  }

  function loop() {
    if (running) return;
    running = true;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let active = false;
      if (down) {
        active = true;
        if (now - stillSince > 80) spray(lx, ly, paint.hex, capR(), 0.3);
        const dr = STYLES[cap].drip;
        if (dr && now - stillSince > 300 && now - lastDrip > 420) {
          drip(lx + rand(-0.4, 0.4) * capR(), ly + capR() * 0.45, paint.hex, rand(dr[0], dr[1]), rand(dr[2], dr[3]));
          lastDrip = now;
        }
      }
      if (drips.length) { active = true; stepDrips(dt); }
      if (reveals.length) { active = true; stepReveals(now); }
      if (wipe) { active = true; stepWipe(now); }
      if (active) requestAnimationFrame(step); else running = false;
    };
    requestAnimationFrame(step);
  }

  /* the start of every spray: the first one of a visit shakes the can, then the hiss; a small tick on phones that can */
  /* the train listens for the first spray, so it can stop (see the train block): how it started is passed on */
  let onStart = null;
  function startSpray(how) {
    if (onStart) onStart(how);
    speed = 0; lastT = 0;
    if (!shook && Sound.on) { shook = true; Sound.sfx.rattle(); setTimeout(() => Sound.sfx.rattle(), 110); }
    Sound.hiss(STYLES[cap].hiss);
    if (Sound.on && navigator.vibrate && isCoarse()) { try { navigator.vibrate(8); } catch (_) { /* haptics are optional */ } }
  }
  /* the hiss follows the hand: louder when the can moves fast */
  function moveSpeed(d, t) {
    if (lastT && t > lastT) speed = speed * 0.7 + (d / (t - lastT)) * 0.3;
    lastT = t;
    Sound.hiss(STYLES[cap].hiss * (0.75 + 0.4 * clamp(speed / 1.6, 0, 1)));
  }
  function hideHint() { if (!hinted) { hinted = true; hint.classList.add('gone'); } }
  function setArmed(v) {
    armed = !!v;
    wall.classList.toggle('armed', armed);
    armBtn.setAttribute('aria-pressed', armed ? 'true' : 'false');
    armBtn.textContent = armed ? 'Stop painting' : 'Start painting';
    if (!hinted) hint.textContent = armed ? 'Farbaj prstom · paint with your finger' : 'Dodirni boju pa farbaj · tap a colour, then paint';
  }
  function setCap(v) {
    cap = v;
    $$('[data-cap]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cap === v ? 'true' : 'false'));
    setCursor();
  }
  /* keyboard painting: the wall takes focus; the arrow keys move a nozzle (Shift for bigger steps) and holding
     Space or Enter sprays, through the same spray, line and drip code as a mouse or a finger */
  const nozzle = document.createElement('div');
  nozzle.className = 'nozzle'; nozzle.setAttribute('aria-hidden', 'true');
  cv.parentElement.appendChild(nozzle);   /* beside the canvas, so it rides with the wagon */
  let kx = 0, ky = 0, keyDown = false;
  function placeNozzle() {
    nozzle.style.transform = `translate(${kx}px, ${ky}px)`;
    nozzle.style.setProperty('--r', `${Math.min(capR(), 46)}px`);
    nozzle.style.setProperty('--c', paint.hex);
  }
  function keyStop() { if (!keyDown) return; keyDown = false; down = false; pid = null; if (!reveals.length) Sound.hiss(0); }
  function bindKeys() {
    cv.addEventListener('focus', () => {
      if (!kx && !ky) { kx = W * 0.62; ky = H * 0.55; }
      placeNozzle();
      if (!hinted && cv.matches(':focus-visible')) hint.innerHTML = '<span lang="bs">Strelice i Space</span> · arrows move, hold Space to spray';
    });
    cv.addEventListener('blur', keyStop);
    cv.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 28 : 9;
      const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (mv) {
        e.preventDefault();
        const nx = clamp(kx + mv[0], 0, W), ny = clamp(ky + mv[1], 0, H);
        if (keyDown) { line(kx, ky, nx, ny, paint.hex, capR()); stillSince = performance.now(); lx = nx; ly = ny; }
        kx = nx; ky = ny; placeNozzle();
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !wall.classList.contains('leaving')) {
        e.preventDefault();
        if (keyDown) return;
        keyDown = true; down = true; pid = 'keys';
        lx = kx; ly = ky; stillSince = performance.now();
        startSpray('keys');
        spray(lx, ly, paint.hex, capR());
        travel = 0;
        hideHint();
        loop();
      } else if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
    });
    cv.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') keyStop(); });
  }
  function setCursor() {
    /* the cursor: a ring for the reach of the spray, and the can itself up by the ring, nozzle towards it.
       Cursors can only be so big, so past 40 the ring stands for the reach. */
    const r = Math.min(capR(), 40), s = Math.round(r * 2 + 8), h = s / 2;
    const cx = Math.round(h + (r + 9) * 0.72), cy = Math.max(14, Math.round(h - (r + 9) * 0.72)), w = Math.max(s, cx + 14), ht = Math.max(s, cy + 16);
    const back = paint.glow ? 'white' : 'black';
    const can = `<g transform='translate(${cx} ${cy}) rotate(-135)'><rect x='-5' y='-3' width='10' height='16' rx='2' fill='${paint.hex}' stroke='${back === 'white' ? '#F4F1FA' : '#15121C'}' stroke-width='1.6'/><rect x='-5' y='3' width='10' height='5' fill='#F1E3C6'/><path d='M-3.6 -3 Q0 -8 3.6 -3Z' fill='#C6C8D2' stroke='#15121C' stroke-width='1.2'/><rect x='-1.6' y='-9' width='3.2' height='3' rx='.8' fill='#FAFAFC' stroke='#15121C' stroke-width='1'/></g>`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${ht}'><circle cx='${h}' cy='${h}' r='${r}' fill='none' stroke='${back}' stroke-opacity='.45' stroke-width='3'/><circle cx='${h}' cy='${h}' r='${r}' fill='none' stroke='${paint.hex}' stroke-width='1.6'/><circle cx='${h}' cy='${h}' r='1.6' fill='${paint.hex}'/>${can}</svg>`;
    cv.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${h} ${h}, crosshair`;
    placeNozzle();
  }

  function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function bindPointer() {
    cv.addEventListener('pointerdown', (e) => {
      if (wall.classList.contains('leaving')) return;   /* it's pulling away with someone's piece: wait for the next */
      if (e.pointerType === 'touch') { markCoarse(); armBtn.hidden = false; if (!armed) return; }
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* capture is optional */ }
      down = true; pid = e.pointerId;
      const p = pos(e);
      lx = p.x; ly = p.y; stillSince = performance.now();
      startSpray('pointer');
      spray(lx, ly, paint.hex, capR());
      travel = 0;
      hideHint();
      loop();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== pid) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs.length ? evs : [e]) {
        const p = pos(ev);
        const d = Math.hypot(p.x - lx, p.y - ly);
        moveSpeed(d, ev.timeStamp);
        line(lx, ly, p.x, p.y, paint.hex, capR());
        const runs = STYLES[cap].every;
        if (runs && (travel += d) > nextRun) {
          const dr = STYLES[cap].drip;
          drip(p.x + rand(-0.5, 0.5) * capR(), p.y + capR() * 0.4, paint.hex, rand(dr[0], dr[1]), rand(dr[2], dr[3]));
          travel = 0; nextRun = rand(runs[0], runs[1]);
        }
        if (d > 3) stillSince = performance.now();
        lx = p.x; ly = p.y;
      }
    });
    const end = (e) => { if (e.pointerId !== pid) return; down = false; pid = null; if (!reveals.length) Sound.hiss(0); };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('lostpointercapture', end);
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    const nw = Math.round(r.width), nh = Math.round(r.height);
    const nd = Math.min(2, window.devicePixelRatio || 1);
    if (!nw || !nh || (nw === W && nh === H && nd === dpr)) return;
    let snap = null, od = dpr;
    if (W && H && cv.width > 1) { snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; snap.getContext('2d').drawImage(cv, 0, 0); }
    W = nw; H = nh; dpr = nd;
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (snap) c.drawImage(snap, 0, 0, snap.width * (nd / od), snap.height * (nd / od));
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    stamps.clear();
  }

  /* the plaster under the paint: the fine detail of the wall photo (its light minus a blurred copy of it), drawn as
     a grey layer over the paint with CSS overlay blending, so paint sinks into the cracks and catches the bumps.
     Made once, at half size, when the browser is idle; remade when the wall changes size. */
  const tex = document.createElement('canvas');
  tex.className = 'wall-tex'; tex.setAttribute('aria-hidden', 'true');
  let texFor = '';
  function photoRect(img, w, h) {
    /* where the picture sits under the canvas (cover; the wagon fills its box exactly, so this is a plain fit) */
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
    return [(w - dw) * 0.5, (h - dh) * 0.3, dw, dh];
  }
  function buildTexture() {
    const img = $('.paint-surface', wall);
    if (!img || !img.complete || !img.naturalWidth || !W) return;
    const w = Math.max(1, Math.round(W / 2)), h = Math.max(1, Math.round(H / 2));
    const key = `${w}x${h}|${img.currentSrc}`;
    if (key === texFor) return;
    texFor = key;
    tex.width = w; tex.height = h;
    const x = tex.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, ...photoRect(img, w, h));
    const im = x.getImageData(0, 0, w, h), d = im.data, n = w * h;
    const lum = new Float32Array(n), tmp = new Float32Array(n), blur = new Float32Array(n);
    for (let i = 0; i < n; i++) lum[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    /* a box blur, across then down, with running sums so it costs the same for any radius */
    const R = 5, span = R * 2 + 1;
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let i = -R; i <= R; i++) acc += lum[y * w + clamp(i, 0, w - 1)];
      for (let xx = 0; xx < w; xx++) {
        tmp[y * w + xx] = acc / span;
        acc += lum[y * w + Math.min(w - 1, xx + R + 1)] - lum[y * w + Math.max(0, xx - R)];
      }
    }
    for (let xx = 0; xx < w; xx++) {
      let acc = 0;
      for (let i = -R; i <= R; i++) acc += tmp[clamp(i, 0, h - 1) * w + xx];
      for (let y = 0; y < h; y++) {
        blur[y * w + xx] = acc / span;
        acc += tmp[Math.min(h - 1, y + R + 1) * w + xx] - tmp[Math.max(0, y - R) * w + xx];
      }
    }
    for (let i = 0; i < n; i++) {
      const g = clamp(128 + (lum[i] - blur[i]) * 1.8, 0, 255);
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; d[i * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
  }
  /* the grain is only needed once someone paints, so it's made on the first touch of the wall (pointer, keys or a
     sprayed word), not while the page is still loading; after that it follows the wall's size */
  let wantTex = false;
  function textureSoon() {
    if (!wantTex) return;
    const go = () => { try { buildTexture(); } catch (_) { /* no texture: the paint still works */ } };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 600 }); else setTimeout(go, 200);
  }
  function textureNow() {
    if (wantTex) return;
    wantTex = true;
    try { buildTexture(); } catch (_) { /* no texture: the paint still works */ }
  }

  /* save the wall: a 1080×1350 picture (the size phones share best) of the photo, the paint and its plaster grain,
     with the ZID logo and the address underneath. Made on the device; nothing is uploaded. Phones get the share
     sheet, everything else a download. */
  let painted = false;
  function loadImg(src) {
    return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  }
  async function saveWall() {
    if (!W || !H) return;
    if (!painted) { toast('<span><b>Prvo ofarbaj vagon.</b> Paint something first.</span>'); return; }
    Sound.ensure(); Sound.sfx.rattle();
    const OW = 1080, OH = 1350, BAND = 200, AH = OH - BAND;
    const o = document.createElement('canvas'); o.width = OW; o.height = OH;
    const x = o.getContext('2d');
    x.fillStyle = '#0A090D'; x.fillRect(0, 0, OW, OH);
    /* the scene, cut to fill the top of the picture by height like on the page, with your wagon on its track */
    x.save();
    x.beginPath(); x.rect(0, 0, OW, AH); x.clip();
    const scene = $('.scene-photo', wall);
    if (scene && scene.complete && scene.naturalWidth) {
      const sw = scene.naturalWidth * AH / scene.naturalHeight;
      x.drawImage(scene, (OW - sw) / 2, 0, sw, AH);
    }
    /* the wagon: its picture, your paint and the grain, kept to the wagon's outline */
    const img = $('.paint-surface', wall), car = document.createElement('canvas');
    car.width = Math.round(W * 2); car.height = Math.round(H * 2);
    const cx = car.getContext('2d'); cx.scale(2, 2);
    const ok = img && img.complete && img.naturalWidth;
    if (ok) cx.drawImage(img, 0, 0, W, H);
    cx.drawImage(cv, 0, 0, W, H);
    try { buildTexture(); } catch (_) { /* no grain: still a good picture */ }
    if (tex.width > 1) { cx.globalCompositeOperation = 'overlay'; cx.globalAlpha = 0.6; cx.drawImage(tex, 0, 0, W, H); cx.globalAlpha = 1; }
    if (ok) { cx.globalCompositeOperation = 'destination-in'; cx.drawImage(img, 0, 0, W, H); }
    const cw = OW - 60, ch = cw * H / W;
    x.drawImage(car, 30, AH * 946 / 1184 - ch, cw, ch);
    x.restore();
    /* the band underneath: logo, a line in both languages, the address */
    const logo = await loadImg('img/02.webp');
    if (document.fonts && document.fonts.load) {
      await Promise.all([document.fonts.load('800 44px "Archivo"'), document.fonts.load('600 30px "Martian Mono"')]).catch(() => {});
    }
    if (logo) {
      x.save(); x.translate(56 + 64, AH + BAND / 2); x.rotate(-0.07);
      x.beginPath(); if (x.roundRect) x.roundRect(-64, -64, 128, 128, 28); else x.rect(-64, -64, 128, 128); x.clip();
      x.drawImage(logo, -64, -64, 128, 128); x.restore();
    }
    x.fillStyle = '#ECEAF2'; x.font = '800 44px "Archivo", Arial, sans-serif'; x.textBaseline = 'alphabetic';
    x.fillText('Ovo je moj voz.', 224, AH + 92);
    x.fillStyle = '#A9A5B6'; x.font = '400 28px "Martian Mono", "Courier New", monospace';
    x.fillText('This is my train.', 224, AH + 134);
    x.fillStyle = '#B4F53A'; x.font = '600 30px "Martian Mono", "Courier New", monospace'; x.textAlign = 'right';
    x.fillText('zidbosna.com', OW - 56, AH + 134);
    const blob = await new Promise((res) => o.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) return;
    const name = 'zid-moj-voz.jpg';
    if (isCoarse() && navigator.canShare && window.File) {
      const file = new File([blob], name, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'ZID', text: 'Moj voz · my train · zidbosna.com' }); return; }
        catch (err) { if (err && err.name === 'AbortError') return; /* otherwise fall through to a download */ }
      }
    }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('<span><b>Sačuvano.</b> Your wagon is saved as a picture.</span>');
  }

  function sprayWord(word) {
    if (!W || !H) return;
    if (onStart) onStart('word');
    textureNow();
    hideHint();
    Sound.ensure();
    const choices = PAINTS.filter((p) => p.id !== 'katran');
    const p = choices[(Math.random() * choices.length) | 0];
    const size = Math.round(Math.min(H * 0.3, W * 0.1));
    const t = tagCanvas(word, size, p.hex, '#0B0A0F');
    const x = rand(W * 0.04, Math.max(W * 0.05, W - t.w - W * 0.04));
    const y = rand(H * 0.08, Math.max(H * 0.1, H * 0.74 - t.h));   /* on the body, above the wheels */
    putTag(t, x, y, rand(-0.12, 0.08), p.hex, true);
    if (!REDUCED) Sound.hiss(0.8);
  }

  function init() {
    const box = $('#cans');
    PAINTS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'can';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', p === paint ? 'true' : 'false');
      b.style.setProperty('--c', p.hex);
      if (p.glow) b.style.setProperty('--glow', p.glow);
      b.innerHTML = `${CAN.markup()}<span class="can-n">${p.name}</span>`;
      b.addEventListener('click', () => {
        paint = p;
        $$('.can', box).forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
        setCursor();
        Sound.sfx.rattle();
        if (isCoarse() && !armed) setArmed(true);
      });
      box.appendChild(b);
    });
    box.addEventListener('keydown', (e) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const bs = $$('.can', box);
      const i = Math.max(0, bs.indexOf(document.activeElement));
      const n = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
      bs[n].focus(); bs[n].click();
    });
    $$('[data-cap]').forEach((b) => b.addEventListener('click', () => setCap(b.dataset.cap)));
    $('#whitewash').addEventListener('click', whitewash);
    $('#save-wall').addEventListener('click', () => { saveWall().catch(() => toast('<span><b>Nije uspjelo.</b> The picture couldn\u2019t be made.</span>')); });
    armBtn.addEventListener('click', () => setArmed(!armed));
    if (isCoarse()) hint.textContent = 'Dodirni boju pa farbaj · tap a colour, then paint';
    cv.after(tex);
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); textureSoon(); }).observe(wall);
    else window.addEventListener('resize', () => { resize(); textureSoon(); });
    for (const ev of ['pointerenter', 'pointerdown', 'focus']) cv.addEventListener(ev, textureNow, { once: true, passive: true });
    const photo = $('.paint-surface', wall);
    if (photo) photo.addEventListener('load', textureSoon, { once: true });   /* the wagon's picture comes after the page (see the train) */
    setCursor();
    bindPointer();
    bindKeys();
    const ready = document.fonts && document.fonts.load ? document.fonts.load(`40px ${TAGFONT}`).catch(() => {}) : Promise.resolve();
    Promise.race([ready, new Promise((r) => setTimeout(r, 1800))]).then(() => resize());
  }

  /* a fresh wagon rolls in: whatever was painted left with the last one */
  function reset() {
    drips.length = 0; reveals.length = 0; wipe = null; roller.hidden = true; painted = false; down = false; pid = null;
    if (W && H) c.clearRect(0, 0, W, H);
  }

  return { init, sprayWord, reset, get painted() { return painted; }, onStart(fn) { onStart = fn; } };
})();
  /* ===== rivals: the scores to beat =====
     This week's top 10 from the scoreboard, plus a friend's score when the page was opened from a challenge link
     (zidbosna.com/#beat=2450&by=Name; the part after # never reaches the server or the offline cache).
     The game chases them during a run; the wall and the end screen show them. */
  const Rivals = (() => {
    const NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,13}$/u;
    /* the same check the scoreboard makes, so a hand-made link can't put a slur on the wall */
    const BAD = [/jeb/, /pick/, /pizd/, /kurac/, /kurc/, /kurv/, /govn/, /sranj/, /drkad/, /peder/, /fuck/, /shit/, /cunt/,
      /nigg/, /fagg/, /whore/, /slut/, /pussy/, /bitch/, /hitler/, /nazi(?!f)/, /cetni/, /chetni/, /ustas/, /balij(?!ag)/, /genocid/];
    const isBad = (n) => {
      const f = n.toLowerCase().replace(/\u0111/g, 'dj').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
        .replace(/[^a-z]/g, '');
      return BAD.some((r) => r.test(f));
    };
    const nameError = (n) => (!NAME.test(n) ? 'name' : isBad(n) ? 'bad-name' : '');
    const okName = (n) => !nameError(n);
    let friend = null, top = null, sorted = [];
    try {
      const h = new URLSearchParams(location.hash.slice(1)), q = h.has('beat') ? h : new URLSearchParams(location.search);
      const n = Number(q.get('beat'));
      if (Number.isInteger(n) && n > 0 && n <= 17650) {
        const by = String(q.get('by') || '').normalize('NFC').replace(/\s+/g, ' ').trim();
        friend = { name: okName(by) ? by : '', total: n, friend: true };
      }
    } catch (_) { /* a broken link just means no challenge */ }
    const fns = [];
    const resort = () => { sorted = (top || []).concat(friend ? [friend] : []).sort((a, b) => b.total - a.total); };
    resort();
    return {
      okName,
      nameError,
      get friend() { return friend; },
      /* null until the scoreboard answers */
      get top() { return top; },
      set(t) { top = t; resort(); fns.forEach((fn) => fn()); },
      on(fn) { fns.push(fn); },
      /* everyone to chase during a run, highest first */
      all() { return sorted; },
      /* where a total lands on this week's board: its place and the entry just above it */
      place(total) {
        let pos = 1, above = null;
        for (const r of top || []) if (r.total >= total) { pos++; above = r; }
        return { pos, above, full: !!top && top.length >= 10 };
      },
    };
  })();

  /* ===== scoreboard: this week's and all-time top 10, from the ZID scoreboard API ===== */
  const Board = (() => {
    const API = String(window.ZID_API || '').replace(/\/+$/, '');
    /* Only the real site reaches the scoreboard server. Anywhere else (the Claude copy, a saved file) the board runs
       on example scores, clearly marked, so it can still be seen and tried; a claim there lasts for the visit only. */
    const LIVE = !!API && /(^|\.)zidbosna\.com$|^anezkko\.github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
    const DEMO = !LIVE;
    const EXAMPLE = {
      week: [['Mirza', 6450, 'Majstor'], ['Lejla', 4875, 'Grafiter'], ['Dino', 3920, 'Grafiter'], ['Amra', 2810, 'Šegrt'], ['Haris', 2105, 'Šegrt']],
      all: [['Selma', 9120, 'Legenda čaršije'], ['Mirza', 7940, 'Majstor'], ['Kenan', 6610, 'Majstor'], ['Lejla', 5230, 'Grafiter'], ['Dino', 4480, 'Grafiter'], ['Amra', 3350, 'Grafiter'], ['Haris', 2390, 'Šegrt']],
    };
    let mine = null;
    const rankOf = (total, respect) => (respect >= 70 && total >= 12000 ? 'Kralj zida' : total >= 8000 && respect >= 70 ? 'Legenda čaršije' : total >= 5500 ? 'Majstor' : total >= 3000 ? 'Grafiter' : 'Šegrt');
    /* the scoreboard server names a legend at 8,000; from 12,000 a legend is shown as King of the Wall */
    const rankShown = (r) => (r.rank === 'Legenda čaršije' && r.total >= 12000 ? 'Kralj zida' : r.rank);
    function exampleBoard(which) {
      const top = EXAMPLE[which].map(([name, total, rank]) => ({ name, total, rank, me: false }));
      if (mine) top.push({ ...mine, me: true });
      /* a tie keeps the earlier score ahead, as on the real board */
      top.sort((a, b) => b.total - a.total || Number(a.me) - Number(b.me));
      return { ok: true, board: which, top: top.slice(0, 10), me: null };
    }
    function exampleSubmit(r, name) {
      const error = Rivals.nameError(name);
      if (error) return { ok: false, error };
      const best = !mine || r.total > mine.total;
      if (best) mine = { name, total: r.total, rank: rankOf(r.total, r.respect) };
      else mine.name = name;
      const at = (w) => { const top = exampleBoard(w).top, i = top.findIndex((x) => x.me && x.total === r.total); return i >= 0 ? i + 1 : top.filter((x) => x.total >= r.total).length + 1; };
      return { ok: true, name, rank: mine.rank, posWeek: at('week'), posAll: at('all'), bestWeek: best, bestAll: best };
    }
    const SITE = 'https://zidbosna.com/';
    const box = $('#tabela'), list = $('#board-list'), meLine = $('#board-me'), tabs = $$('#tabela [data-board]');
    const form = $('#sb-form'), nameIn = $('#sb-name'), msg = $('#sb-msg'), go = form ? form.querySelector('button') : null, goT = $('#sb-go-t');
    const placeEl = $('#e-place'), shareBtn = $('#btn-share'), exNote = $('#board-ex');
    const cache = {};
    let board = 'week', run = null, last = null, claimed = false, sending = false;

    /* a random id for this device, so your own row can be marked; no account, no cookie */
    function devId() {
      let d = Store.get('dev', '');
      if (!/^[a-z0-9-]{8,48}$/i.test(String(d))) {
        try { d = crypto.randomUUID(); } catch (_) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); }
        Store.set('dev', d);
      }
      return d;
    }
    const DEV = devId();

    function note(text) {
      list.textContent = '';
      const li = document.createElement('li');
      li.className = 'board-note';
      li.textContent = text;
      list.appendChild(li);
    }
    /* #1 holds the wall; #2 and #3 stand beside it. Empty podium places stay on show as open spots. */
    function slot(i, r, which) {
      const li = document.createElement('li');
      li.className = [i < 3 ? 'p' + (i + 1) : '', r && r.me ? 'me' : '', r ? '' : 'open'].filter(Boolean).join(' ');
      const add = (tag, cls, txt) => { const el = document.createElement(tag); el.className = cls; el.textContent = txt; li.appendChild(el); return el; };
      add('span', 'pos', String(i + 1));
      if (i === 0) {
        add('span', 'ck', r
          ? (which === 'week' ? L('Drži zid ove sedmice', 'Holds the wall this week') : L('Drži zid svih vremena', 'Holds the wall, all time'))
          : (which === 'week' ? L('Kruna je ove sedmice slobodna', 'This week\u2019s crown is up for grabs') : L('Kruna je slobodna', 'The crown is up for grabs')));
      }
      add('b', 'nm', r ? r.name : i === 0 ? L('tvoje ime', 'your name') : L('slobodno', 'open'));
      add('span', 'rk', r ? rankName(rankShown(r)) : '');
      add('span', 'pts', r ? String(r.total) : '\u2014');
      if (i === 0) {
        const a = add('a', 'btn take', r && r.me ? L('Brani krunu', 'Defend the crown') : L('Uzmi krunu', 'Take the crown'));
        a.href = '#igra';
        a.dataset.play = '';
      }
      return li;
    }
    function render(data, which) {
      list.textContent = '';
      const top = data.top;
      for (let i = 0; i < Math.max(3, top.length); i++) list.appendChild(slot(i, top[i] || null, which));
      meLine.textContent = '';
      const num = (n) => { const b = document.createElement('b'); b.textContent = String(n); return b; };
      const mi = top.findIndex((r) => r.me);
      if (mi > 0) {
        const up = top[mi - 1], gap = up.total - top[mi].total + 1;
        meLine.append(L(`Ti si #${mi + 1}. Do #${mi} fali `, `You\u2019re #${mi + 1}. `), num(gap), L('.', ` more to pass ${up.name}.`));
      } else if (mi < 0 && data.me) {
        meLine.append(L('Tvoj najbolji: ', 'Your best: '), num(data.me.total));
        meLine.append(data.me.pos ? ` · #${data.me.pos}` : L(' · izvan top 100', ' · outside the top 100'));
        if (top.length >= 10) meLine.append(L(' · do top 10 fali ', ' · '), num(top[9].total - data.me.total + 1), L('', ' more for the top 10'));
      }
    }

    async function fetchBoard(which) {
      if (DEMO) {
        const data = exampleBoard(which);
        cache[which] = { t: Date.now(), data };
        if (which === 'week') Rivals.set(data.top);
        if (board === which) render(data, which);
        return data;
      }
      const c = cache[which];
      if (c && Date.now() - c.t < 30000) return c.data;
      const res = await fetch(`${API}/scores?board=${which}&dev=${encodeURIComponent(DEV)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!data || !data.ok || !Array.isArray(data.top)) throw new Error('bad reply');
      cache[which] = { t: Date.now(), data };
      if (which === 'week') Rivals.set(data.top);
      if (board === which) render(data, which);
      return data;
    }
    async function load(which) {
      board = which;
      tabs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.board === which)));
      const c = cache[which];
      if (c) render(c.data, which); else if (!DEMO) note(L('Učitavam tabelu…', 'Loading the scoreboard…'));
      try { await fetchBoard(which); } catch (_) {
        if (board === which && !cache[which]) { note(L('Tabela trenutno nije dostupna. Probaj kasnije.', 'The scoreboard isn\u2019t available right now. Try again later.')); meLine.textContent = ''; }
      }
    }

    /* the wall at the top of the page: who to beat (page text, always English) */
    function wallBeat() {
      const el = $('#wall-beat');
      if (!el) return;
      const k = $('#wb-k'), v = $('#wb-v'), f = Rivals.friend, top = Rivals.top, ex = DEMO ? 'Example · ' : '';
      v.textContent = '';
      const name = (t) => { const b = document.createElement('b'); b.className = 'wb-n'; b.textContent = t; v.append(b, ' '); };
      const score = (t) => { const s = document.createElement('span'); s.className = 'wb-s'; s.textContent = t; v.append(s); };
      if (f) { k.textContent = f.name ? `${f.name} challenged you` : 'A friend challenged you'; score(`Beat ${f.total}`); }
      else if (!top) { el.hidden = true; return; }
      else if (!top.length) { k.textContent = 'This week\u2019s #1 spot is empty'; score('Take it'); }
      else if (top[0].me) { k.textContent = `${ex}You hold #1 this week`; score(`${top[0].total} · defend it`); }
      else { k.textContent = `${ex}Score to beat this week`; name(top[0].name); score(String(top[0].total)); }
      el.hidden = false;
    }

    let cardUrl = '';
    function say(text, withLink, card) {
      msg.hidden = false;
      msg.textContent = text;
      announce(text);   /* the scoreboard's answer (your place, or why it didn't work) is read out too */
      if (withLink) {
        msg.append(' ');
        const a = document.createElement('a');
        a.href = '#tabela';
        a.textContent = L('Tabela ↓', 'Scoreboard ↓');
        msg.append(a);
      }
      /* the score card as a file to save, where it couldn't go out with the share */
      if (card) {
        if (cardUrl) URL.revokeObjectURL(cardUrl);
        cardUrl = URL.createObjectURL(card);
        msg.append(' ');
        const a = document.createElement('a');
        a.href = cardUrl;
        a.download = card.name;
        a.textContent = L('Sačuvaj sliku rezultata ↓', 'Save the score card ↓');
        msg.append(a);
      }
    }
    /* where the finished run lands, and what the name button claims */
    function placeText() {
      if (last == null || !placeEl || claimed) return;
      const t = last, f = Rivals.friend, top = Rivals.top;
      const p = top ? Rivals.place(t) : null;
      let s = '';
      if (f) {
        const who = f.name || L('Prijatelj', 'Your friend');
        s = t > f.total ? L(`${who}: ${f.total}. Oboreno!`, `${who}\u2019s ${f.total}: beaten!`)
          : L(`${who}: ${f.total} još stoji. Fali ti ${f.total - t + 1}.`, `${who}\u2019s ${f.total} still stands, ${f.total - t + 1} short.`);
      } else if (p) {
        if (p.pos === 1) s = L('To je #1 ove sedmice. Upiši se na zid.', 'That\u2019s #1 this week. Put your name on the wall.');
        else if (p.above.me) s = L(`To je #${p.pos} ove sedmice. Tvoj najbolji (#${p.pos - 1}) je i dalje jači.`, `That\u2019s #${p.pos} this week. Your best (#${p.pos - 1}) still beats it.`);
        else if (p.pos <= 10 || !p.full) s = L(`To je #${p.pos} ove sedmice. Do #${p.pos - 1} (${p.above.name}) fali ${p.above.total - t + 1}.`, `That\u2019s #${p.pos} this week, ${p.above.total - t + 1} short of #${p.pos - 1} ${p.above.name}.`);
        else s = L(`Izvan top 10 ove sedmice. Do #10 fali ${top[9].total - t + 1}.`, `Outside this week\u2019s top 10, ${top[9].total - t + 1} short of #10.`);
      }
      placeEl.textContent = s;
      placeEl.hidden = !s;
      if (goT) {
        const mine = top && top.find((r) => r.me);
        const claim = p && (p.pos <= 10 || !p.full) && !(mine && mine.total >= t);
        goT.textContent = claim ? L(`Uzmi #${p.pos}`, `Claim #${p.pos}`) : L('Upiši se', 'Add me');
      }
    }
    /* a finished run: show where it lands and offer to put it on the board */
    function onRun(e) {
      run = e.detail;
      last = run.total;
      claimed = false;
      msg.hidden = true;
      placeText();
      if (!form) return;
      form.hidden = false;
      go.disabled = false;
      $('#ov-end').classList.add('has-sb');
      nameIn.value = Store.get('name', '') || '';
    }
    async function submit(e) {
      e.preventDefault();
      if (!run || sending) return;
      const name = nameIn.value.replace(/\s+/g, ' ').trim();
      if (name.length < 2) { say(L('Upiši ime, bar 2 slova.', 'Type a name, at least 2 letters.')); nameIn.focus(); return; }
      sending = true;
      go.disabled = true;
      try {
        let data;
        if (DEMO) data = exampleSubmit(run, name);
        else {
          const res = await fetch(`${API}/scores`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ ...run, name, dev: DEV }) });
          data = await res.json().catch(() => ({}));
        }
        if (data.ok) {
          Store.set('name', data.name || name);
          run = null;
          claimed = true;
          form.hidden = true;
          placeEl.hidden = true;
          const w = data.posWeek ? L(`#${data.posWeek} ove sedmice`, `#${data.posWeek} this week`) : L('izvan top 100 ove sedmice', 'outside the top 100 this week');
          const a = data.posAll ? L(` · #${data.posAll} svih vremena`, ` · #${data.posAll} all time`) : '';
          const on = DEMO ? L('Upisano na probnu tabelu!', 'You\u2019re on the example board!') : L('Upisano!', 'You\u2019re on the board!');
          say(data.bestWeek || data.bestAll ? `${on} ${w}${a}` : L(`Ovaj krug: ${w}. Tvoj najbolji ostaje na tabeli.`, `This run: ${w}. Your best stays on the board.`), true);
          delete cache.week; delete cache.all;
          load(board);
          if (board !== 'week') fetchBoard('week').catch(() => {});
        } else {
          const why = {
            'bad-name': L('To ime ne može. Probaj drugo.', 'That name isn\u2019t allowed. Try another.'),
            name: L('Ime: 2 do 14 slova ili brojeva.', 'Names are 2 to 14 letters or numbers.'),
            slow: L('Polahko! Probaj opet za minut.', 'Polahko! Try again in a minute.'),
            run: L('Ovaj rezultat se ne može upisati.', 'This score can\u2019t go on the board.'),
          };
          say(why[data.error] || L('Nije uspjelo. Probaj opet.', 'That didn\u2019t work. Try again.'));
        }
      } catch (_) {
        say(L('Nema veze s tabelom. Probaj opet.', 'Can\u2019t reach the scoreboard. Try again.'));
      }
      sending = false;
      if (run) go.disabled = false;
    }
    /* send the score to a friend: the link opens ZID on the game, with this score as the one to beat.
       Where the phone can share pictures, the score card goes with it; elsewhere the card is offered to save. */
    async function share() {
      if (last == null) return;
      const name = String(Store.get('name', '') || nameIn.value || '').replace(/\s+/g, ' ').trim();
      const url = `${SITE}#beat=${last}${Rivals.okName(name) ? '&by=' + encodeURIComponent(name) : ''}`;
      const text = L(`Moj rezultat u igri Sprej do Mostara: ${last}. Možeš li bolje?`, `My score in Spray to Mostar: ${last}. Can you beat it?`);
      const title = L('Sprej do Mostara', 'Spray to Mostar');
      let card = null;
      try {
        const b = typeof Game !== 'undefined' ? await Game.card() : null;
        if (b) card = new File([b], `zid-${last}.jpg`, { type: b.type || 'image/jpeg' });
      } catch (_) { /* the link still goes without the picture */ }
      if (navigator.share) {
        try {
          if (card && navigator.canShare && navigator.canShare({ files: [card] })) await navigator.share({ files: [card], title, text: `${text} ${url}` });
          else {
            await navigator.share({ title, text, url });
            if (card) say(L('Hoćeš i sliku za objavu?', 'Want the picture to post too?'), false, card);
          }
          return;
        } catch (err) { if (err && err.name === 'AbortError') return; }
      }
      try { await navigator.clipboard.writeText(`${text} ${url}`); say(L('Link je kopiran. Pošalji ga raji.', 'Link copied. Send it to a friend.'), false, card); }
      catch (_) { say(`${text} ${url}`, false, card); }
    }

    /* outside the real site, say plainly that these are example scores */
    function exampleNote() {
      const ribbon = $('#demo-note');
      if (ribbon) ribbon.hidden = !DEMO;
      if (!exNote) return;
      exNote.hidden = !DEMO;
      exNote.textContent = L('Ovo su primjeri rezultata, da vidiš kako tabela radi. Pravi igrači su na tabeli na zidbosna.com.', 'These are example scores, so you can see how the board works. Real players are on the board at zidbosna.com.');
    }
    function init() {
      if (!box || !list) return;
      exampleNote();
      tabs.forEach((b) => b.addEventListener('click', () => load(b.dataset.board)));
      if (form) form.addEventListener('submit', submit);
      if (shareBtn) shareBtn.addEventListener('click', share);
      document.addEventListener('zid:run', onRun);
      /* a new run: make sure the scores being chased are fresh */
      document.addEventListener('zid:start', () => { if (API) fetchBoard('week').catch(() => {}); });
      Rivals.on(() => { wallBeat(); placeText(); });
      Lang.on(() => { const c = cache[board]; if (c) render(c.data, board); else load(board); placeText(); exampleNote(); });
      wallBeat();
      load('week');
    }
    return { init };
  })();

/* ===== page: slang stickers, sound toggle, boot ===== */
const SLANG = [
  { w: 'Polahko', say: 'PO-lah-ko', mean: 'Slowly. Take it easy. Bosnia’s unofficial motto.', ex: 'Polahko, jarane, stići ćemo.', en: 'Easy, mate, we’ll get there.' },
  { w: 'Jarane', say: 'YAH-rah-neh', mean: 'Mate, buddy. From jaran, a friend.', ex: 'Šta ima, jarane?', en: 'What’s up, mate?' },
  { w: 'Raja', say: 'RAH-yah', mean: 'Your people. The crew, the neighbourhood, the whole gang.', ex: 'Sva raja je tu.', en: 'The whole crew is here.' },
  { w: 'Bolan', say: 'BO-lahn', mean: 'A friendly “man” or “mate”. Literally “sick one”. Bona for a woman.', ex: 'Ma jok, bolan!', en: 'No way, man!' },
  { w: 'Aferim', say: 'AH-feh-reem', mean: 'Well done. Bravo.', ex: 'Aferim, majstore!', en: 'Nice one, boss!' },
  { w: 'Džaba', say: 'JAH-bah', mean: 'Free. Also “for nothing”, as in wasted effort.', ex: 'Ova stranica je džaba.', en: 'This page is free.' },
  { w: 'Ćejf', say: 'chayf', mean: 'Doing something just because you feel like it.', ex: 'Radim to na svoj ćejf.', en: 'I do it my way, for the joy of it.' },
  { w: 'Merak', say: 'MEH-rahk', mean: 'Deep, slow pleasure in small things.', ex: 'Kahva u avliji, to je merak.', en: 'Coffee in the courtyard, that’s merak.' },
  { w: 'Haman', say: 'HAH-mahn', mean: 'Almost. Nearly.', ex: 'Haman sam pao.', en: 'I nearly fell.' },
  { w: 'Kontaš?', say: 'KON-tahsh', mean: 'You get it? From kontati, to understand.', ex: 'Kontaš šta pričam?', en: 'Get what I’m saying?' },
  { w: 'Bujrum', say: 'BOOY-room', mean: 'Go ahead. Help yourself. Come in.', ex: 'Bujrum, sjedi.', en: 'Come in, sit down.' },
  { w: 'Sevdah', say: 'SEV-dah', mean: 'Longing and love-ache. Also the name for Bosnia’s old love songs.', ex: 'Pjeva sevdah do zore.', en: 'Singing sevdah till dawn.' },
];

function buildStickers() {
  const box = $('#stickers');
  const kinds = ['', 'p', 'l', 'b', 'v', '', 'l', 'p', 'b', '', 'v', 'l'];
  const rots = [-1.4, 1.1, -0.6, 1.6, -1.2, 0.5, 1.3, -0.9, 0.8, -1.6, 0.4, -0.5];
  SLANG.forEach((s, i) => {
    const a = document.createElement('article');
    a.className = 'sticker' + (kinds[i] ? ' ' + kinds[i] : '') + (i % 3 === 0 ? ' tape' : '');
    a.style.setProperty('--r', rots[i] + 'deg');
    a.innerHTML = '<h3 class="st-word" lang="bs"></h3><p class="st-say"></p><p class="st-mean"></p><p class="st-ex"><span lang="bs"></span></p><button type="button" class="st-spray">Spray it <span aria-hidden="true">↑</span></button>';
    a.querySelector('.st-word').textContent = s.w;
    a.querySelector('.st-say').textContent = s.say;
    a.querySelector('.st-mean').textContent = s.mean;
    const ex = a.querySelector('.st-ex');
    ex.querySelector('span').textContent = s.ex;
    ex.appendChild(document.createTextNode(s.en));
    const word = s.w.replace('?', '');
    const b = a.querySelector('.st-spray');
    b.setAttribute('aria-label', `Spray it: ${word}, on the train at the top of the page`);
    b.addEventListener('click', () => {
      Hero.sprayWord(word.toLowerCase());
      toast(`<span><b>${word}</b> is on the train.</span> <a href="#zid">See it ↑</a>`);
    });
    box.appendChild(a);
  });
  wordAudio();
}
/* pronunciation: the owner records the words (no synthetic voices) as audio/words/<word>.mp3 and lists them in
   data/words.json; a word gets a "Hear it" button only once its recording is listed. See _dev/RECORDING.md. */
const wordSlug = (w) => w.toLowerCase().replace(/\?/g, '').replace(/dž/g, 'dz').replace(/đ/g, 'dj').replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z');
function wordAudio() {
  const go = () => fetch('data/words.json').then((r) => (r.ok ? r.json() : null)).then((d) => {
    const have = new Set(d && Array.isArray(d.recorded) ? d.recorded : []);
    if (!have.size) return;
    $$('#stickers .sticker').forEach((a, i) => {
      const s = SLANG[i], slug = wordSlug(s.w);
      if (!s || !have.has(slug)) return;
      const word = s.w.replace('?', '');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'st-hear';
      b.innerHTML = 'Hear it <span aria-hidden="true">♪</span>';
      b.setAttribute('aria-label', `Hear it: ${word}`);
      let clip = null;
      b.addEventListener('click', () => {
        if (!clip) clip = new Audio(`audio/words/${slug}.mp3`);
        clip.currentTime = 0;
        clip.play().catch(() => toast('<span>The recording couldn\u2019t play.</span>'));
      });
      a.querySelector('.st-spray').after(b);
    });
  }).catch(() => { /* no list: no buttons */ });
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 2000);
}

function initSound() {
  const btn = $('#sound-toggle'), lbl = $('#sound-label');
  const set = (on) => {
    Sound.setOn(on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    lbl.textContent = on ? 'Sound: on' : 'Sound: off';
    Store.set('sound', on);
    document.dispatchEvent(new CustomEvent('zid:sound'));      /* the game's music follows */
  };
  /* the game's music button turns the sound back on */
  document.addEventListener('zid:want-sound', () => { set(true); Sound.ensure(); });
  set(Store.get('sound', true) !== false);
  btn.addEventListener('click', () => {
    set(!Sound.on);
    if (Sound.on) { Sound.ensure(); Sound.sfx.rattle(); }
  });
}

/* Radio ZID: the boombox in the header starts the last station; once music plays, the same boombox opens the station
   menu. While it plays, the speakers pump and their rings flash on every beat, the boombox hops a little, the display
   glows with the needle on the station, and the lights blink like a level meter. */
function initMusic() {
  const btn = $('#music-toggle'), menu = $('#radio-menu'), off = $('#radio-off'), rd = $('#rd'), dial = $('#rd-dial');
  const spk = $$('.bb-spk', rd), caps = $$('.bb-cap', rd), leds = [$$('.bb-led.l1, .bb-led.r1', rd), $$('.bb-led.l2, .bb-led.r2', rd), $$('.bb-led.l3, .bb-led.r3', rd)];
  const ids = Music.stations.map((s) => s.id);
  const items = Music.stations.map((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rm-item'; b.dataset.station = s.id;
    b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', 'false');
    b.innerHTML = '<span class="rm-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="rm-t"><b></b><small></small></span>';
    b.querySelector('b').textContent = s.name; b.querySelector('small').textContent = s.desc;
    b.addEventListener('click', () => pick(s.id));
    menu.insertBefore(b, off);
    return b;
  });
  /* where each station sits on the dial, left to right */
  const needle = (st) => rd.style.setProperty('--n', String(0.14 + 0.24 * Math.max(0, ids.indexOf(st.id))));
  let loop = 0;
  const ease = 'cubic-bezier(.2,.7,.3,1)';
  function bounce(k) {
    if (!REDUCED) {
      rd.animate([
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: `translateY(0) scale(${1 + 0.035 * k}, ${1 - 0.05 * k})`, offset: 0.14 },
        { transform: `translateY(${(-3 * k).toFixed(1)}px) scale(${1 - 0.012 * k}, ${1 + 0.025 * k})`, offset: 0.45 },
        { transform: 'translateY(0) scale(1, 1)' },
      ], { duration: 300, easing: ease });
      /* the speakers punch out and their neon rings flash; the dust caps push further than the cones */
      const z = rd.offsetHeight / 78, glow = `0 0 ${((2 + 3 * k) * z).toFixed(1)}px ${(0.5 * k * z).toFixed(1)}px rgba(255,106,213,${(0.35 + 0.4 * k).toFixed(2)})`;
      spk.forEach((s) => s.animate([
        { opacity: 1, transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,106,213,0)' },
        { opacity: 1, transform: `scale(${1 + 0.12 * k})`, boxShadow: glow, offset: 0.18 },
        { opacity: 1, transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,106,213,0)' },
      ], { duration: 280, easing: ease }));
      caps.forEach((c) => c.animate([{ transform: 'scale(1)' }, { transform: `scale(${1 + 0.32 * k})`, offset: 0.18 }, { transform: 'scale(1)' }], { duration: 280, easing: ease }));
    }
    dial.animate([{ opacity: 1 }, { opacity: 0.6 + 0.2 * (1 - k) }], { duration: 380, easing: 'ease-out' });
    /* level meter: the first light takes every beat, the others only the stronger ones */
    leds.forEach((row, i) => { if (k > [0.05, 0.45, 0.8][i]) row.forEach((l) => l.animate([{ opacity: 1 }, { opacity: 0.45 }], { duration: 320, easing: 'ease-out' })); });
  }
  function frame() {
    if (!Music.playing) { loop = 0; return; }
    const k = Music.beat(Music.heard());
    if (k > 0.05) bounce(k);
    loop = requestAnimationFrame(frame);
  }
  const show = (on, st) => {
    btn.dataset.on = on ? 'true' : 'false';
    btn.setAttribute('aria-label', on ? `Music: ${st.name}. Change station` : 'Music: off. Play Radio ZID');
    btn.title = on ? `Radio ZID · ${st.name}` : 'Radio ZID';
    items.forEach((b) => b.setAttribute('aria-checked', String(on && b.dataset.station === st.id)));
    needle(st);
    if (on && !loop) loop = requestAnimationFrame(frame);
  };
  Music.onChange(show);
  show(false, Music.station);
  const open = (focus) => {
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (focus) (items.find((b) => b.getAttribute('aria-checked') === 'true') || items[0]).focus();
  };
  const close = (refocus) => {
    if (menu.hidden) return;
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  };
  const announce = (hint) => { const s = Music.station; toast(`<span><b>${s.name}</b> · ${s.desc}${hint ? '. Tap the boombox again to change station.' : ''}</span>`, hint ? 4200 : 3000); };
  function pick(id) {
    const same = Music.playing && Music.station.id === id;
    close(true);
    if (same) return;
    if (Music.set(id)) announce(false);
    else toast('Music can’t play in this browser.');
  }
  btn.addEventListener('click', (e) => {
    if (!Music.playing) {
      if (Music.start()) announce(true);
      else toast('Music can’t play in this browser.');
      return;
    }
    if (menu.hidden) open(e.detail === 0); else close(false);
  });
  off.addEventListener('click', () => { Music.stop(); close(true); });
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) close(false); });
  menu.addEventListener('keydown', (e) => {
    const all = [...items, off], i = all.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      all[(i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length].focus();
    } else if (e.key === 'Tab') close(false);
    else if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
  });
}

/* "Get the app": only on the real site (it has a manifest), only where installing works, never inside the installed app */
function initInstall() {
  const btn = $('#btn-install');
  if (!btn || !document.querySelector('link[rel="manifest"]')) return;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; btn.hidden = false; });
  window.addEventListener('appinstalled', () => {
    deferred = null; btn.hidden = true;
    toast('<span><b>Aferim!</b> ZID is on your home screen.</span>', 4200);
  });
  if (ios) btn.hidden = false;
  btn.addEventListener('click', async () => {
    if (deferred) {
      const d = deferred;
      deferred = null;
      try {
        d.prompt();
        const r = await d.userChoice;
        if (r && r.outcome === 'accepted') btn.hidden = true;
      } catch (_) { /* the browser said no; the menu option still works */ }
      return;
    }
    if (ios) toast('<span><b>iPhone:</b> tap <b>Share</b> ↑, then <b>Add to Home Screen</b>.</span>', 9000);
    else toast('<span>Open your browser menu <b>⋮</b>, then <b>Install app</b>.</span>', 6000);
  });
}

/* the tip buttons point at whatever tip page is set in the build; with none set they are left out */
function initTip() {
  const url = String(window.ZID_TIP || '');
  $$('[data-tip]').forEach((a) => { if (/^https:\/\/[^\s"']+$/.test(url)) a.href = url; else a.remove(); });
}

/* ===== the game loads on demand =====
   js/game.js (the game, the Bihać ride and their pixel art) comes in when the game is about to scroll into view,
   when any Play link is pressed, or at once for a link straight into it (#igra, #bihac, #beat=…, #tabela).
   Until then the frame shows a shaking can. If it can't load, the can says so and offers to try again. */
let gameP = null, gameReady = false, bootData = {};
function loadGame() {
  if (gameP) return gameP;
  const box = $('#game-load');
  if (box) box.classList.remove('failed');
  gameP = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'js/game.js';
    s.onload = () => {
      try { Game.init(bootData); } catch (err) { reject(err); return; }
      gameReady = true;
      document.documentElement.classList.add('game-ready');
      if (location.hash === '#bihac') { const r = $('#btn-ride'); if (r) r.click(); }
      resolve();
    };
    s.onerror = () => { gameP = null; s.remove(); if (box) box.classList.add('failed'); reject(new Error('the game did not load')); };
    document.head.appendChild(s);
  });
  return gameP;
}
function watchGame() {
  const can = $('#game-load .gl-can');
  if (can) can.innerHTML = CAN.markup();
  const retry = $('#game-load-retry');
  if (retry) retry.addEventListener('click', () => loadGame().catch(() => {}));
  const deep = /^#(igra|bihac|beat=|tabela)/.test(location.hash) || /[?&]beat=/.test(location.search);
  const wrap = $('#game-wrap');
  if (deep || !wrap || !('IntersectionObserver' in window)) { loadGame().catch(() => {}); return; }
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); loadGame().catch(() => {}); }
  }, { rootMargin: '0px 0px 150px 0px' });   /* on most screens the game is under 800 px below the fold, so start once you scroll its way */
  io.observe(wrap);
}
/* UI sounds: a quiet click for the page's buttons and switches. It listens after the buttons' own handlers, so
   switching the sound off is silent, and like every sound it waits for the first tap and obeys the sound switch. */
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('.seg button, .tray-btn, .chip, .ov-btn, .st-spray, .st-hear, .full-x, .tk-pause, .wall-still');
  if (b && Sound.on) Sound.sfx.tick();
});

/* ===== the train on the hero =====
   A train rolls slowly along the Neretva, wagon after wagon, and stops the moment someone starts painting: a stroke
   brakes it where it is; the keys or a sprayed dictionary word bring the wagon fully into view. "Send it off" takes
   it, and the piece, away to Mostar, and the next train rolls by. The paint sits on the wagon's own canvas.
   The round button pauses the train (remembered); the headlight rests while the hero is off screen. With reduced
   motion the train simply stands there, ready. */
(() => {
  const wall = $('#wall'), train = $('#train'), btn = $('#wall-still'), send = $('#send-off');
  if (!wall || !train || !btn || !send) return;
  const car = $('.canvas-car', train);
  let state = 'away', anim = null, firstPass = true;
  /* where it stands to be painted: the wagon a little right of centre (centred on a phone), clear of the headline */
  const stopX = () => wall.clientWidth * (wall.clientWidth < 700 ? 0.5 : 0.62) - (car.offsetLeft + car.offsetWidth / 2);
  const offLeft = () => -(train.offsetWidth + 40), offRight = () => wall.clientWidth + 40;
  const speed = () => Math.max(70, wall.clientWidth * 0.11);           /* a slow roll, in pixels a second */
  const place = (x) => { train.style.transform = `translateX(${Math.round(x)}px)`; };
  const nowX = () => new DOMMatrixReadOnly(getComputedStyle(train).transform).m41;
  const still = () => wall.classList.contains('still');
  function setState(s) {
    state = s;
    wall.classList.toggle('leaving', s === 'leaving');
    wall.classList.toggle('rolling', s === 'rolling');
    send.hidden = s !== 'stopped';
  }
  function run(from, to, ms, ease, done) {
    if (anim) anim.cancel();
    if (REDUCED) { place(to); done(); return; }
    anim = train.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: ms, easing: ease, fill: 'forwards' });
    if (still()) anim.pause();
    anim.onfinish = () => { place(to); if (anim) anim.cancel(); anim = null; done(); };
  }
  /* one train rolling through, end to end; then the next. The first one comes with its wagon already on the way in;
     the next ones pull in briskly and ease down to the slow roll as their wagon comes into view, so nobody waits
     on an empty track (the end of that ease matches the roll's speed, so there's no jolt) */
  function roll() {
    if (REDUCED) { place(stopX()); setState('stopped'); return; }
    const mid = stopX() - wall.clientWidth * 0.4, to = offRight();
    const cruise = () => run(mid, to, (to - mid) / speed() * 1000, 'linear', () => { Hero.reset(); place(offLeft()); roll(); });
    setState('rolling');
    if (firstPass) { firstPass = false; cruise(); return; }
    const from = offLeft();
    run(from, mid, (mid - from) / speed() / 2.5 * 1000, 'cubic-bezier(.25,.6,.5,.8)', cruise);
  }
  /* someone started painting: brake. A stroke stops it where it is, a little further on; the keys or a sprayed word
     glide the wagon into full view first */
  function halt(how) {
    if (state !== 'rolling') return;
    const x = nowX(), v = speed();
    const to = how === 'pointer' ? x + v * 0.3 : Math.max(x + v * 0.3, stopX());
    setState('braking');
    run(x, to, Math.min(2200, 600 + (to - x) / v * 700), 'cubic-bezier(.2,.75,.3,1)', () => setState('stopped'));
  }
  /* the wheels knock on the rail joints, quicker and quicker as it pulls away (only with sound on) */
  function clack() {
    if (!Sound.on || REDUCED) return;
    Sound.ensure();
    [0, 430, 780, 1060, 1300, 1500, 1680].forEach((t) => setTimeout(() => { if (state === 'leaving') Sound.sfx.clack(); }, t));
  }
  function leave() {
    if (state !== 'stopped') return;
    toast(Hero.painted ? '<span><b>Ide za Mostar.</b> Your piece is riding to Mostar.</span>' : '<span><b>Ode prazan.</b> It left clean. The next one is yours.</span>');
    const x = nowX();
    setState('leaving');
    clack();
    run(x, offRight(), 2600, 'cubic-bezier(.5,0,.85,.35)', () => {
      Hero.reset();
      place(offLeft());
      setTimeout(roll, REDUCED ? 0 : 700);
    });
  }
  Hero.onStart(halt);
  /* the pause button */
  const set = (on) => {
    wall.classList.toggle('still', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const label = on ? L('Pokreni voz', 'Play the train') : L('Zaustavi voz', 'Pause the train');
    btn.setAttribute('aria-label', label); btn.title = label;
    if (anim) { if (on) anim.pause(); else anim.play(); }
  };
  set(Store.get('trainStill', false) === true);
  btn.hidden = false;
  btn.addEventListener('click', () => { const on = !still(); set(on); Store.set('trainStill', on); });
  Lang.on(() => set(still()));   /* the label follows the language switch */
  send.addEventListener('click', leave);
  REDUCE_MQ.addEventListener('change', () => { if (REDUCED && anim) anim.finish(); });
  /* off the track until it can roll: its pictures are fetched once the page itself has loaded (they aren't the
     first thing to see, the scene is), and it rolls when they're here and the hero is on screen */
  setState('away');
  place(-100000);
  const img = $('img', car);
  const loaded = new Promise((r) => {
    const fetchTrain = () => {
      for (const el of $$('[data-srcset]', wall)) el.srcset = el.dataset.srcset;
      for (const el of $$('img[data-src]', wall)) el.src = el.dataset.src;
      if (img.complete && img.naturalWidth) r(); else { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }
    };
    if (document.readyState === 'complete') fetchTrain(); else addEventListener('load', fetchTrain, { once: true });
  });
  let began = false;
  const begin = () => { if (!began) { began = true; roll(); } };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      for (const e of es) {
        wall.classList.toggle('wl-off', !e.isIntersecting);
        if (e.isIntersecting) loaded.then(begin);
      }
    }).observe(wall);
  } else loaded.then(begin);
  /* a new size: a standing train keeps its place */
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (state === 'stopped' && REDUCED) place(stopX()); }).observe(wall);
})();

/* ===== play fullscreen (phones) =====
   The game and its pads cover the screen. Where the browser allows it, that's real fullscreen, turned sideways;
   iPhones can't put a page fullscreen, so there it's the same cover-the-screen view with a hint to turn the phone.
   Leaving fullscreen any way (the ×, the system back gesture) puts the page back as it was. */
(() => {
  const wrap = $('#game-wrap'), btn = $('#btn-full'), x = $('#btn-full-x');
  if (!wrap || !btn || !x) return;
  const html = document.documentElement;
  function enter() {
    wrap.classList.add('full'); html.classList.add('full-on');
    loadGame().catch(() => {});
    const fs = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
    if (fs) {
      try {
        Promise.resolve(fs.call(wrap, { navigationUI: 'hide' }))
          .then(() => (screen.orientation && screen.orientation.lock ? screen.orientation.lock('landscape') : null))
          .catch(() => { /* no fullscreen or no lock: the cover-the-screen view still works */ });
      } catch (_) { /* old browsers throw instead of rejecting */ }
    }
    x.focus({ preventScroll: true });
  }
  function leave() {
    if (!wrap.classList.contains('full')) return;
    wrap.classList.remove('full'); html.classList.remove('full-on');
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (_) { /* nothing locked */ }
    btn.focus({ preventScroll: true });
    btn.scrollIntoView({ block: 'center' });
  }
  btn.addEventListener('click', enter);
  x.addEventListener('click', leave);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) leave(); });
})();

let booted = false;
function boot(data) {
  if (booted) return;
  booted = true;
  initSound();
  initMusic();
  initInstall();
  initTip();
  buildStickers();
  Hero.init();
  bootData = data || {};
  Board.init();
  watchGame();
  /* every Play button on the page, including the ones the scoreboard draws later: load the game if it isn't yet */
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('[data-play]');
    if (a) { e.preventDefault(); loadGame().then(() => Game.play(), () => {}); }
  });
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.snapshot === 'function') {
    try { hot.snapshot(() => ({ best: gameReady ? Game.best : undefined })); } catch (_) { /* hot reload is optional */ }
  }
}
(() => {
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.ready === 'function') hot.ready(boot);
  else boot((hot && hot.data) || {});
})();

/* Bosnia ticker, built from data/ticker.json (one small file to edit on GitHub, from a phone if need be).
   The last result shows for 45 days. On match day the next match says so, and it drops off 3 hours after kickoff
   until the file is updated. If the file can't load, or nothing in it is current, there is no ticker at all. */
(() => {
  const bar = $('#ticker'), track = $('#tk-track'), btn = $('#tk-pause');
  if (!bar || !track) return;
  const DAY = 864e5, HOUR = 36e5;
  let data = null;
  const pick = (o) => (o == null ? '' : typeof o === 'string' ? o : L(o.bs || '', o.en || o.bs || ''));
  /* the calendar day in Sarajevo, so "match day" is the day people there see on their phones */
  const dayIn = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Europe/Sarajevo' });
  function current(now) {
    const out = [];
    const last = data && data.last, next = data && data.next;
    const played = last && Date.parse(last.date);
    if (played && now >= played && now - played < 45 * DAY) out.push({ k: L('Zadnja utakmica', 'Last result'), b: pick(last.score), s: pick(last.note) });
    const kick = next && Date.parse(next.kickoff);
    if (kick && now < kick + 3 * HOUR) {
      const today = dayIn(now) === dayIn(kick), days = Math.ceil((kick - now) / DAY);
      out.push({
        k: today ? L('Danas igramo!', 'Match day!') : L('Sljedeća utakmica', 'Next match'), today,
        b: pick(next.team), s: pick(next.note),
        cd: today || days < 1 ? '' : L(`još ${days} ${days === 1 ? 'dan' : 'dana'}`, `${days} ${days === 1 ? 'day' : 'days'} to go`),
      });
    }
    return out;
  }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  /* two identical copies side by side make the endless scroll; only the first is read out */
  function set(list, hidden) {
    const p = el('p', 'ticker-set');
    if (hidden) p.setAttribute('aria-hidden', 'true');
    for (const it of list) {
      const item = el('span', 'tk-item' + (it.today ? ' tk-today' : ''));
      item.append(el('span', 'tk-k', it.k), ' ', el('b', '', it.b), ' ', el('span', '', it.s));
      if (it.cd) item.append(' ', el('span', 'tk-cd', it.cd));
      const sep = el('span', 'tk-sep', '◆'); sep.setAttribute('aria-hidden', 'true');
      p.append(item, sep);
    }
    return p;
  }
  function render() {
    const list = data ? current(Date.now()) : [];
    const on = list.length > 0;
    bar.hidden = !on;
    document.documentElement.classList.toggle('has-ticker', on);
    if (!on) return;
    track.replaceChildren(set(list, false), set(list, true));
    bar.setAttribute('aria-label', L('Reprezentacija BiH: zadnja i sljedeća utakmica', 'Bosnia and Herzegovina national team: last result and next match'));
    label();
  }
  function label() {
    const paused = bar.classList.contains('paused');
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? L('Pokreni traku', 'Play the ticker') : L('Zaustavi traku', 'Pause the ticker'));
  }
  btn.addEventListener('click', () => { bar.classList.toggle('paused'); label(); });
  fetch('data/ticker.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d) => { data = d; render(); setInterval(render, 10 * 60 * 1000); Lang.on(render); })
    .catch(() => { data = null; render(); });
})();

/* ===== the intro: a tap or a key skips it, and it leaves the page once it has faded ===== */
(() => {
  const el = $('#intro');
  if (!el) return;
  if (!document.documentElement.classList.contains('intro-on')) { el.remove(); return; }
  const skip = () => el.classList.add('gone');
  el.addEventListener('click', skip);
  addEventListener('keydown', skip, { once: true });
  el.addEventListener('animationend', (e) => { if (e.target === el) el.remove(); });
})();

/* ===== motion: sprayed-on headings and leaning dictionary cards ===== */
(() => {
  if (REDUCED || !('IntersectionObserver' in window)) return;
  const heads = $$('.sec h2, .board-head h3, .finale h2, .foot-big');
  document.documentElement.classList.add('js-spray');
  heads.forEach((h) => h.classList.add('spray-in'));
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const h = e.target;
      io.unobserve(h);
      h.classList.add('sprayed');
      /* once the paint is down the mask comes off, so nothing is left half-sprayed */
      setTimeout(() => h.classList.add('dry'), 1300);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.3 });
  heads.forEach((h) => io.observe(h));

  const box = $('#stickers');
  if (box && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    box.addEventListener('pointermove', (e) => {
      const st = e.target.closest('.sticker');
      if (!st) return;
      const r = st.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      st.style.setProperty('--tx', `${((u - 0.5) * 10).toFixed(2)}deg`);
      st.style.setProperty('--ty', `${((0.5 - v) * 10).toFixed(2)}deg`);
      st.style.setProperty('--mx', `${(u * 100).toFixed(1)}%`);
      st.style.setProperty('--my', `${(v * 100).toFixed(1)}%`);
    });
    box.addEventListener('pointerout', (e) => {
      const st = e.target.closest('.sticker');
      if (st && !st.contains(e.relatedTarget)) ['--tx', '--ty'].forEach((k) => st.style.removeProperty(k));
    });
  }
})();


/* ===== the route map: drawn in on scroll, pins follow the game's zones, a hovered zone lights its pin ===== */
(() => {
  const map = $('.route-map');
  if (!map) return;
  const pins = $$('.pin', map), labels = $$('.pin-l', map), lis = $$('#route li');
  pins.forEach((p, i) => { p.style.setProperty('--d', (0.25 + i * 0.42).toFixed(2)); labels[i].style.setProperty('--d', (0.35 + i * 0.42).toFixed(2)); });
  const sync = () => lis.forEach((li, i) => {
    if (!pins[i]) return;
    pins[i].classList.toggle('current', li.dataset.state === 'current');
    pins[i].classList.toggle('done', li.dataset.state === 'done');
  });
  sync();
  new MutationObserver(sync).observe($('#route'), { subtree: true, attributes: true, attributeFilter: ['data-state'] });
  lis.forEach((li, i) => {
    li.addEventListener('pointerenter', () => pins[i] && pins[i].classList.add('hot'));
    li.addEventListener('pointerleave', () => pins[i] && pins[i].classList.remove('hot'));
  });
  if (!document.documentElement.classList.contains('js-spray')) return;
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { map.classList.add('on'); io.disconnect(); }
  }, { threshold: 0.35 });
  io.observe(map);
})();

