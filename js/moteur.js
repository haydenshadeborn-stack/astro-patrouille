'use strict';
// =====================================================================
//  ASTRO PATROUILLE — style aquarelle, boss lovecraftiens
//  Toute la logique se fait dans un monde de 160 x 90 "unités".
//  Le rendu est mis à l'échelle (R pixels par unité) pour rester net.
// =====================================================================
const W = 160, H = 90, TOP = 9, TAU = Math.PI * 2;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let R = 6, scale = 1, paper = null;

function resize() {
  const s = Math.min((innerWidth - 16) / W, (innerHeight - 16) / H);
  scale = s;
  cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px';
  R = Math.min(10, Math.max(2, s * (devicePixelRatio || 1)));
  cv.width = Math.round(W * R); cv.height = Math.round(H * R);
  makePaper();
}

// ---------- outils ----------
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlap = (a, b, p = 0) =>
  a.x + p < b.x + b.w - p && a.x + a.w - p > b.x + p && a.y + p < b.y + b.h - p && a.y + a.h - p > b.y + p;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

// =====================================================================
//  PINCEAUX AQUARELLE (dessin procédural)
// =====================================================================
function blobPts(x, y, rx, ry, irr, n = 14) {
  const o = rand(0, TAU);
  return Array.from({ length: n }, (_, i) => {
    const a = o + i / n * TAU, k = 1 + (Math.random() * 2 - 1) * irr;
    return { x: x + Math.cos(a) * rx * k, y: y + Math.sin(a) * ry * k };
  });
}
function smoothClosed(g, pts) {
  const n = pts.length;
  g.beginPath();
  g.moveTo((pts[n - 1].x + pts[0].x) / 2, (pts[n - 1].y + pts[0].y) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    g.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  g.closePath();
}
// Lavis : plusieurs couches transparentes irrégulières + bord plus foncé (pigment qui s'accumule)
function wash(g, x, y, rx, ry, col, { layers = 4, alpha = .2, irr = .18, edge = .4 } = {}) {
  g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(rx, ry) * .05;
  for (let l = 0; l < layers; l++) {
    const k = 1 - l * .07;
    smoothClosed(g, blobPts(x + rand(-1, 1) * rx * .05, y + rand(-1, 1) * ry * .05, rx * k, ry * k, irr));
    g.globalAlpha = alpha; g.fill();
    if (edge) { g.globalAlpha = alpha * edge; g.stroke(); }
  }
  g.restore();
}
function speckle(g, x, y, rx, ry, col, n, alpha = .35) {
  g.save(); g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), d = Math.sqrt(Math.random());
    g.globalAlpha = alpha * rand(.4, 1);
    g.beginPath(); g.arc(x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, rand(.08, .3), 0, TAU); g.fill();
  }
  g.restore();
}
function veins(g, cx, cy, r, n, col) {
  g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let a = rand(0, TAU), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    g.globalAlpha = rand(.2, .45); g.lineWidth = rand(.12, .25);
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 4; s++) { a += rand(-.6, .6); x -= Math.cos(a) * r * .14; y -= Math.sin(a) * r * .14; g.lineTo(x, y); }
    g.stroke();
  }
  g.restore();
}
// Peint un sprite une seule fois dans une image hors-écran (PR pixels par unité)
const PR = 8;
function paint(w, h, fn, pad = 1) {
  const c = mk((w + pad * 2) * PR, (h + pad * 2) * PR), g = c.getContext('2d');
  g.scale(PR, PR); g.translate(pad, pad); fn(g, w, h);
  return { c, w, h, pad };
}
function drawP(sp, x, y, { alpha = 1, rot = 0, sx = 1, sy = 1 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(x + sp.w / 2, y + sp.h / 2);
  if (rot) ctx.rotate(rot);
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
  ctx.drawImage(sp.c, -sp.w / 2 - sp.pad, -sp.h / 2 - sp.pad, sp.w + sp.pad * 2, sp.h + sp.pad * 2);
  ctx.restore();
}
// Halo lumineux (pré-calculé par couleur)
const glowCache = {};
function glow(x, y, r, rgb, a = 1) {
  let c = glowCache[rgb];
  if (!c) {
    c = glowCache[rgb] = mk(64, 64); const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.35, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  ctx.drawImage(c, x - r, y - r, r * 2, r * 2); ctx.restore();
}
// Tentacule animée, dessinée en direct en deux passages translucides
function tentacle(x, y, ang, len, th, t, ph, col, amp = .5, suckers = false) {
  const seg = 12;
  for (let pass = 0; pass < 2; pass++) {
    const pts = []; let px = x, py = y;
    const p2 = ph + pass * .25, wk = pass ? .8 : 1;
    for (let i = 0; i <= seg; i++) {
      const f = i / seg, a = ang + Math.sin(t * 2.2 + p2 + f * 3.2) * amp * f;
      if (i) { px += Math.cos(a) * len / seg; py += Math.sin(a) * len / seg; }
      pts.push({ x: px, y: py, a, w: th * (1 - f * .9) * wk });
    }
    ctx.beginPath();
    pts.forEach((p, i) => { const nx = -Math.sin(p.a) * p.w / 2, ny = Math.cos(p.a) * p.w / 2; i ? ctx.lineTo(p.x + nx, p.y + ny) : ctx.moveTo(p.x + nx, p.y + ny); });
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; ctx.lineTo(p.x + Math.sin(p.a) * p.w / 2, p.y - Math.cos(p.a) * p.w / 2); }
    ctx.closePath();
    ctx.fillStyle = col; ctx.globalAlpha = pass ? .35 : .6; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = th * .1; ctx.globalAlpha = .4; ctx.stroke();
    if (suckers && !pass) {
      ctx.fillStyle = '#d9c3cf'; ctx.globalAlpha = .35;
      for (let i = 2; i < seg - 1; i += 2) { const p = pts[i]; ctx.beginPath(); ctx.arc(p.x + Math.sin(p.a) * p.w * .3, p.y - Math.cos(p.a) * p.w * .3, p.w * .16, 0, TAU); ctx.fill(); }
    }
  }
  ctx.globalAlpha = 1;
}
const blinkOpen = (t, ph, per) => { const k = (t + ph) % per; return k < .2 ? Math.abs(Math.cos(k / .2 * Math.PI)) : 1; };
// Œil vivant qui suit une cible
function drawEye(x, y, rx, ry, open, tx, ty, iris = '#c9d84b', slit = true) {
  const oy = ry * open;
  ctx.save();
  if (oy < .2) {
    ctx.strokeStyle = '#1a1020'; ctx.globalAlpha = .7; ctx.lineWidth = Math.max(.2, ry * .14);
    ctx.beginPath(); ctx.moveTo(x - rx, y); ctx.quadraticCurveTo(x, y + ry * .35, x + rx, y); ctx.stroke();
    ctx.restore(); return;
  }
  ctx.beginPath(); ctx.ellipse(x, y, rx, oy, 0, 0, TAU); ctx.fillStyle = '#eadfca'; ctx.fill();
  ctx.save(); ctx.clip();
  const gr = ctx.createRadialGradient(x, y, 0, x, y, rx);
  gr.addColorStop(.5, 'rgba(234,223,202,0)'); gr.addColorStop(1, 'rgba(160,60,85,.6)');
  ctx.fillStyle = gr; ctx.fillRect(x - rx, y - oy, rx * 2, oy * 2);
  const dx = tx - x, dy = ty - y, l = Math.hypot(dx, dy) || 1, m = Math.min(rx, ry) * .38;
  const ix = x + dx / l * m, iy = y + dy / l * m * .7, ir = Math.min(rx, ry) * .58;
  ctx.fillStyle = iris; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(30,20,10,.45)'; ctx.lineWidth = ir * .2; ctx.stroke();
  ctx.fillStyle = '#120a10'; ctx.beginPath();
  if (slit) ctx.ellipse(ix, iy, ir * .22, ir * .82, 0, 0, TAU); else ctx.arc(ix, iy, ir * .45, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(ix - ir * .35, iy - ir * .35, ir * .2, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,15,35,.65)'; ctx.lineWidth = Math.max(.15, ry * .1);
  ctx.beginPath(); ctx.ellipse(x, y, rx, oy, 0, 0, TAU); ctx.stroke();
  ctx.restore();
}

// Texture papier + vignette, posée par-dessus toute l'image
function makePaper() {
  const w = cv.width, h = cv.height; paper = mk(w, h);
  const g = paper.getContext('2d'), id = g.createImageData(w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.random();
    if (n < .5) { d[i] = d[i + 1] = d[i + 2] = n < .25 ? 255 : 0; d[i + 3] = Math.random() * 16; }
  }
  g.putImageData(id, 0, 0);
  const gr = g.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .62);
  gr.addColorStop(0, 'rgba(10,5,20,0)'); gr.addColorStop(1, 'rgba(10,5,20,.6)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

// =====================================================================
//  SPRITES PEINTS
// =====================================================================
function paintAst(size) {
  return paint(size, size, (g, w) => {
    const c = w / 2;
    wash(g, c, c, c * .9, c * .82, '#8a6d55', { layers: 4, alpha: .4, irr: .22 });
    wash(g, c + c * .2, c + c * .25, c * .6, c * .5, '#3a2a22', { layers: 3, alpha: .32, irr: .3 });
    wash(g, c - c * .3, c - c * .3, c * .35, c * .28, '#e2c9a6', { layers: 2, alpha: .35, irr: .3, edge: 0 });
    for (let i = 0; i < 3; i++) {
      const a = rand(0, TAU), d = rand(0, c * .5);
      wash(g, c + Math.cos(a) * d, c + Math.sin(a) * d, c * .18, c * .15, '#2a1d18', { layers: 2, alpha: .35, irr: .2 });
    }
    speckle(g, c, c, c * .8, c * .8, '#1a1220', 14, .4);
  });
}
const SP = {};
function buildSprites() {
  SP.asts = [paintAst(9), paintAst(9), paintAst(9)];
  SP.rocks = [paintAst(4.5), paintAst(4.5), paintAst(4.5)];
  SP.larve = paint(7, 5, g => {
    wash(g, 3.4, 2.5, 3.1, 2, '#5fae86', { layers: 4, alpha: .45, irr: .12 });
    wash(g, 4.3, 3, 2, 1.2, '#1f4a38', { layers: 2, alpha: .35 });
    wash(g, 2.6, 1.7, 1.2, .6, '#d4f5df', { layers: 2, alpha: .3, edge: 0 });
    g.fillStyle = '#e9f57a'; g.beginPath(); g.arc(1.7, 2.4, .55, 0, TAU); g.fill();
    g.fillStyle = '#1a1020'; g.beginPath(); g.arc(1.55, 2.4, .25, 0, TAU); g.fill();
  });
  SP.oeil = paint(6, 6, g => {
    wash(g, 3, 3, 3, 3, '#c25a78', { layers: 4, alpha: .42, irr: .14 });
    wash(g, 3.6, 3.6, 2, 2, '#3c1a2a', { layers: 2, alpha: .3 });
    veins(g, 3, 3, 2.9, 6, '#d98ba0');
  });
  // --- Boss 1 : l'Œil du Néant ---
  SP.boss0 = paint(24, 24, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    wash(g, cx, cy, w * .47, h * .47, '#7d5f94', { layers: 5, alpha: .34, irr: .1 });
    wash(g, cx + 2, cy + 2, w * .38, h * .36, '#24182f', { layers: 3, alpha: .24, irr: .18 });
    wash(g, cx - 4, cy - 5, w * .2, h * .13, '#9a7fb0', { layers: 3, alpha: .2, edge: 0 });
    veins(g, cx, cy, w * .45, 12, '#8a2f45');
    wash(g, cx - 2, cy, 9, 7, '#160d1d', { layers: 3, alpha: .32, irr: .08 });
    speckle(g, cx, cy, w * .45, h * .45, '#140c1a', 30);
  }, 2);
  // --- Boss 3 : la Masse aux Mille Yeux ---
  SP.boss2 = paint(28, 24, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    wash(g, cx, cy, w * .44, h * .44, '#4a6040', { layers: 4, alpha: .32, irr: .2 });
    for (let i = 0; i < 14; i++)
      wash(g, cx + rand(-1, 1) * w * .28, cy + rand(-1, 1) * h * .26, rand(3.5, 7), rand(3, 6),
           pick(['#4a6040', '#6b8a55', '#2c3826', '#6a5a78']), { layers: 3, alpha: .2, irr: .25 });
    g.save(); g.strokeStyle = '#a9c49a'; g.lineWidth = .2;
    for (let i = 0; i < 10; i++) { g.globalAlpha = rand(.15, .35); g.beginPath(); g.arc(cx + rand(-11, 11), cy + rand(-9, 9), rand(.4, 1.2), 0, TAU); g.stroke(); }
    g.restore();
    speckle(g, cx, cy, w * .44, h * .44, '#0c100b', 40);
  }, 2);
}

// Détoure une image : retire le fond clair (papier) en partant des bords
function cutout(img, maxW = 512, minL = 200, spread = 40, { warm = false, holes = 0, holeL = 228 } = {}) {
  const k0 = Math.min(1, maxW / img.width);
  const c = mk(img.width * k0, img.height * k0), g = c.getContext('2d');
  g.drawImage(img, 0, 0, c.width, c.height);
  try {
    const w = c.width, h = c.height, d = g.getImageData(0, 0, w, h), p = d.data;
    const bgLike = i => { const r = p[i], gg = p[i + 1], b = p[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); return mn > minL && mx - mn < spread && (!warm || r >= b - 3); };
    const seen = new Uint8Array(w * h), st = [];
    for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
    while (st.length) {
      const k = st.pop(); if (seen[k]) continue; seen[k] = 1;
      if (!bgLike(k * 4)) continue;
      p[k * 4 + 3] = 0;
      const x = k % w;
      if (x > 0) st.push(k - 1); if (x < w - 1) st.push(k + 1);
      if (k >= w) st.push(k - w); if (k < w * (h - 1)) st.push(k + w);
    }
    // poches de papier enfermées entre les tentacules : on retire les grandes zones très claires
    if (holes) {
      const lab = new Uint8Array(w * h);
      for (let s0 = 0; s0 < w * h; s0++) {
        if (lab[s0] || p[s0 * 4 + 3] === 0) continue;
        const i0 = s0 * 4; if (!(bgLike(i0) && Math.min(p[i0], p[i0 + 1], p[i0 + 2]) > holeL)) continue;
        const comp = [], q = [s0]; lab[s0] = 1;
        while (q.length) {
          const k = q.pop(); comp.push(k); const x = k % w;
          for (const n of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w]) {
            if (n < 0 || n >= w * h || lab[n] || p[n * 4 + 3] === 0) continue;
            const j = n * 4; if (bgLike(j) && Math.min(p[j], p[j + 1], p[j + 2]) > holeL - 15) { lab[n] = 1; q.push(n); }
          }
        }
        if (comp.length > holes) for (const k of comp) p[k * 4 + 3] = 0;
      }
    }
    // retire les petites taches isolées (restes de papier ou de pinceau)
    if (holes) {
      const lab = new Uint8Array(w * h);
      for (let s0 = 0; s0 < w * h; s0++) {
        if (lab[s0] || p[s0 * 4 + 3] === 0) continue;
        const comp = [], q = [s0]; lab[s0] = 1;
        while (q.length) {
          const k = q.pop(); comp.push(k); const x = k % w;
          for (const n of [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, k - w, k + w])
            if (n >= 0 && n < w * h && !lab[n] && p[n * 4 + 3] !== 0) { lab[n] = 1; q.push(n); }
        }
        if (comp.length < w * h * .004) for (const k of comp) p[k * 4 + 3] = 0;
      }
    }
    // adoucit le contour
    for (let k = w; k < w * (h - 1); k++) {
      if (p[k * 4 + 3] === 0) continue;
      if (p[(k - 1) * 4 + 3] === 0 || p[(k + 1) * 4 + 3] === 0 || p[(k - w) * 4 + 3] === 0 || p[(k + w) * 4 + 3] === 0) p[k * 4 + 3] = 150;
    }
    g.putImageData(d, 0, 0);
  } catch (e) {}
  return c;
}

// Retourne une image en miroir (gauche ↔ droite)
function flipH(src) {
  const c = mk(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c;
}
// Pivote une image d'un quart de tour vers la gauche (le haut passe à gauche)
function rotateLeft(src) {
  const c = mk(src.height, src.width), g = c.getContext('2d');
  g.translate(0, src.width); g.rotate(-Math.PI / 2); g.drawImage(src, 0, 0); return c;
}

// =====================================================================
//  SON
// =====================================================================
let actx = null, muted = false, drone = null;
function unlockAudio() {
  try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); loadSfx().then(initMusic); }
        if (actx.state === 'suspended') actx.resume(); } catch (e) {}
}
function beep(f, d, vol = .04, slide = 0, type = 'triangle') {
  if (muted || !actx) return;
  try {
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d);
  } catch (e) {}
}
// ---------- Sons et musiques (fichiers CC0 dans assets/sons, crédits dans le README) ----------
let master = null;
const SFX = {}, SFX_FILES = { tir: 'tir.mp3', triple: 'tir-triple.mp3', ennemi: 'tir-ennemi.mp3', bonus: 'bonus.mp3', bouclier: 'bouclier.mp3', laser: 'laser.m4a' };
const lastPlay = {};
async function loadSfx() {
  master = actx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(actx.destination);
  for (const [k, f] of Object.entries(SFX_FILES)) {
    try { const r = await fetch('assets/sons/' + f); SFX[k] = await actx.decodeAudioData(await r.arrayBuffer()); } catch (e) {}
  }
}
// Joue un bruitage ; dur = coupe le son (avec fondu) après dur secondes ; gap = délai mini entre deux lectures
function play(k, vol = .5, dur = 0, gap = 0) {
  const b = SFX[k]; if (!b || !actx || !master) return false;
  const t = actx.currentTime;
  if (gap && lastPlay[k] && t - lastPlay[k] < gap) return true;
  lastPlay[k] = t;
  const src = actx.createBufferSource(), g = actx.createGain();
  src.buffer = b; g.gain.value = vol; src.connect(g).connect(master); src.start(t);
  if (dur) { g.gain.setValueAtTime(vol, t + dur * .6); g.gain.linearRampToValueAtTime(.0001, t + dur); src.stop(t + dur + .02); }
  return true;
}
// Musiques : lues en flux (pas chargées entièrement en mémoire), volume réglé par fondu
const MUS = {};
function initMusic() {
  for (const [k, f, loop] of [['arrivee', 'boss-arrivee.m4a', false], ['ambiance', 'boss-ambiance.m4a', true]]) {
    const el = new Audio('assets/sons/' + f); el.loop = loop; el.preload = 'auto';
    const g = actx.createGain(); g.gain.value = 0;
    try { actx.createMediaElementSource(el).connect(g).connect(master); } catch (e) {}
    MUS[k] = { el, g, on: false, token: 0 };
  }
}
function musicPlay(k, vol = .6, fade = 1, from = 0) {
  const m = MUS[k]; if (!m) return;
  const t = actx.currentTime; m.token++; m.on = true;
  m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.linearRampToValueAtTime(vol, t + fade);
  try { m.el.currentTime = from; } catch (e) {}
  m.el.play().catch(() => {});
}
function musicStop(k, fade = 1.5) {
  const m = MUS[k]; if (!m || !m.on) return;
  const t = actx.currentTime, tok = ++m.token; m.on = false;
  m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.linearRampToValueAtTime(.0001, t + fade);
  setTimeout(() => { if (m.token === tok) m.el.pause(); }, fade * 1000 + 100);
}
function musicPauseAll(p) { for (const m of Object.values(MUS)) if (m.on) p ? m.el.pause() : m.el.play().catch(() => {}); }
// Pendant le boss : l'annonce s'efface et l'ambiance prend le relais
function droneOn() { musicStop('arrivee', 3); musicPlay('ambiance', .55, 3); }
function droneOff() { musicStop('ambiance', 1.5); musicStop('arrivee', 1); }
function setMuted(v) { muted = v; if (master) master.gain.value = v ? 0 : 1; if (v) laserSound(false); }
// Laser : boucle du son de rayon tant qu'il est actif
let laserSrc = null;
function laserSound(on) {
  if (on && !laserSrc && SFX.laser && master) {
    const src = actx.createBufferSource(), g = actx.createGain(), t = actx.currentTime;
    src.buffer = SFX.laser; src.loop = true; src.loopStart = .15; src.loopEnd = SFX.laser.duration - .15;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.35, t + .05);
    src.connect(g).connect(master); src.start(t); laserSrc = { src, g };
  } else if (!on && laserSrc) {
    const t = actx.currentTime;
    laserSrc.g.gain.setTargetAtTime(.0001, t, .03); laserSrc.src.stop(t + .2); laserSrc = null;
  }
}


// ---------- texte ----------
const blink = (hz = 2) => ((T * hz * 2) | 0) % 2 === 0;
function text(s, x, y, { size = 6, align = 'left', font = 'Caveat', color = '#f1e8ff', weight = 700, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px "${font}", cursive`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(10,5,25,.85)'; ctx.shadowBlur = R * 1.4;
  ctx.fillText(s, x, y); ctx.restore();
}
const TITLE = { font: 'IM Fell English SC', weight: 400 };
