'use strict';
// =====================================================================
//  CARTE DE LA GALAXIE
//  9 colonnes d'étoiles, du départ (à gauche) à l'Étoile-objectif (à droite).
//  On saute d'une étoile à une étoile reliée. À chaque saut, le Voile
//  (une encre noire) avance depuis la gauche. Une étoile qu'il recouvre
//  ne propose plus qu'un combat contre ses créatures, plus dur.
// =====================================================================
const COLS = 9;
const MAP_X0 = 16, MAP_X1 = W - 16, MAP_Y0 = TOP + 12, MAP_Y1 = H - 14;
const colX = c => MAP_X0 + c * (MAP_X1 - MAP_X0) / (COLS - 1);
const colOf = x => (x - MAP_X0) / ((MAP_X1 - MAP_X0) / (COLS - 1));   // position en « colonnes »
const VOILE_PAS = .8;       // avance du Voile à chaque saut (en colonnes)

const TYPES = {
  depart:   { nom: 'Départ',             rgb: '200,230,255' },
  combat:   { nom: 'Combat',             rgb: '255,140,120' },
  elite:    { nom: 'Présence ancienne',  rgb: '255,90,160' },
  event:    { nom: 'Événement',          rgb: '230,210,140' },
  dialogue: { nom: 'Dialogue',           rgb: '160,220,200' },
  shop:     { nom: 'Comptoir',           rgb: '255,210,110' },
  final:    { nom: 'Étoile-objectif',    rgb: '255,240,190' },
};

function genMap() {
  const nodes = [];
  for (let c = 0; c < COLS; c++) {
    const n = c === 0 || c === COLS - 1 ? 1 : 2 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? (MAP_Y0 + MAP_Y1) / 2 : MAP_Y0 + (i + .5) * (MAP_Y1 - MAP_Y0) / n + rand(-3, 3);
      const x = colX(c) + (n === 1 ? 0 : rand(-3.5, 3.5));
      nodes.push({ id: nodes.length, c, x, y, type: null, nb: [], done: false, seen: false });
    }
  }
  const col = c => nodes.filter(n => n.c === c);
  const link = (a, b) => { if (a !== b && !a.nb.includes(b.id)) { a.nb.push(b.id); b.nb.push(a.id); } };
  for (let c = 0; c < COLS - 1; c++) {
    const A = col(c), B = col(c + 1);
    for (const a of A) {
      const s = [...B].sort((p, q) => Math.abs(p.y - a.y) - Math.abs(q.y - a.y));
      link(a, s[0]); if (s[1] && Math.random() < .5) link(a, s[1]);
    }
    for (const b of B) if (!b.nb.some(id => nodes[id].c === c)) link(b, [...A].sort((p, q) => Math.abs(p.y - b.y) - Math.abs(q.y - b.y))[0]);
    // liens verticaux entre étoiles voisines d'une même colonne (détours possibles)
    const sorted = [...A].sort((p, q) => p.y - q.y);
    for (let i = 0; i < sorted.length - 1; i++) if (c > 0 && Math.random() < .55) link(sorted[i], sorted[i + 1]);
  }
  // types des étoiles
  const bag = [['combat', 38], ['event', 32], ['dialogue', 12], ['shop', 10], ['elite', 8]];
  const draw = () => { let r = Math.random() * 100; for (const [t, w] of bag) if ((r -= w) < 0) return t; return 'combat'; };
  for (const n of nodes) n.type = n.c === 0 ? 'depart' : n.c === COLS - 1 ? 'final' : n.c === 1 ? pick(['combat', 'event', 'event', 'dialogue']) : draw();
  // au moins un comptoir au milieu du voyage et une présence ancienne avant la fin
  const mid = nodes.filter(n => n.c >= 3 && n.c <= 6);
  if (!mid.some(n => n.type === 'shop')) pick(mid).type = 'shop';
  const late = nodes.filter(n => n.c >= 4 && n.c <= 7 && n.type !== 'shop');
  if (!late.some(n => n.type === 'elite')) pick(late).type = 'elite';
  nodes[0].done = nodes[0].seen = true;
  return nodes;
}

// ---------- état de la carte ----------
let mapSel = -1, mapHover = -1, mapAnim = null;
const curNode = () => RUN.map[RUN.cur];
const reachable = () => curNode().nb.map(id => RUN.map[id]);
const inVoile = n => colOf(n.x) <= RUN.voile;
// Kaimana (Lecture des étoiles) : on voit le type des étoiles voisines
const revealed = n => n.seen || n.type === 'shop' || n.type === 'final' || (hasCrew('kaimana') && curNode().nb.includes(n.id));

function jumpTo(id) {
  if (mapAnim || !reachable().some(n => n.id === id)) return;
  mapAnim = { from: RUN.cur, to: id, t: 0 };
  play('bonus', .25);
}
function updateMap(dt) {
  if (!mapAnim) return;
  mapAnim.t += dt / .7;
  if (mapAnim.t >= 1) { const id = mapAnim.to; mapAnim = null; arrive(id); }
}
function arrive(id) {
  RUN.cur = id; RUN.jumps++; RUN.voile += VOILE_PAS; RUN.score += 50;
  const n = curNode(); n.seen = true; mapSel = -1;
  const d = 1 + Math.floor(n.c / 2);              // difficulté : 1 → 5 selon l'avancée
  if (n.type === 'final') { setPending({ combat: 'final', diff: d + 1 }); return; }
  if (n.done) { saveRun(); return; }                // étoile déjà visitée : rien ne se passe
  if (inVoile(n)) { n.done = true; setPending({ combat: 'voile', diff: d }); return; }
  n.done = n.type !== 'shop';
  if (n.type === 'combat') setPending({ combat: 'combat', diff: d });
  else if (n.type === 'elite') setPending({ combat: 'elite', diff: d });
  else if (n.type === 'event') setPending({ scene: 'event' });
  else if (n.type === 'dialogue') setPending({ scene: 'dialogue' });
  else if (n.type === 'shop') setPending({ scene: 'shop' });
}
// La rencontre est notée dans la sauvegarde avant de commencer : fermer l'onglet ne permet pas d'y échapper
function setPending(p) { RUN.pending = p; saveRun(); resumePending(); }
function resumePending() {
  const p = RUN.pending; if (!p) { state = 'map'; return; }
  const d = 1 + Math.floor(curNode().c / 2);
  if (p.combat) startCombat(p.combat, p.diff || d);
  else if (p.scene === 'event') runEvent(p.eventId);
  else if (p.scene === 'dialogue') runDialogue(p.dlg);
  else if (p.scene === 'shop') runShop();
  else if (p.scene === 'intro') runIntro();
}

// ---------- texture du Voile (peinte une fois) ----------
let voileTex = null;
function paintVoile() {
  voileTex = paint(60, H, g => {
    for (let i = 0; i < 70; i++)
      wash(g, rand(0, 60), rand(-4, H + 4), rand(4, 12), rand(4, 12), pick(['#1a0a24', '#3a0f3a', '#5a1a4a', '#0e0614', '#6a2058']), { layers: 2, alpha: .3, irr: .3 });
    speckle(g, 30, H / 2, 30, H / 2, '#c24d8a', 60, .5);
  }, 0);
}
function drawVoile() {
  const vx = MAP_X0 + RUN.voile * (MAP_X1 - MAP_X0) / (COLS - 1);
  if (vx < -8) return;
  if (!voileTex) paintVoile();
  ctx.save();
  // bord irrégulier qui ondule
  ctx.beginPath(); ctx.moveTo(-2, -2);
  for (let y = -2; y <= H + 2; y += 3) ctx.lineTo(vx + Math.sin(y * .25 + T * 1.3) * 2.2 + Math.sin(y * .07 - T * .6) * 3, y);
  ctx.lineTo(-2, H + 2); ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(14,4,20,.78)'; ctx.fillRect(-2, -2, vx + 10, H + 4);
  for (let x = vx - 60; x > -70; x -= 58) ctx.drawImage(voileTex.c, x + Math.sin(T * .3) * 2, 0, 62, H);
  ctx.restore();
  // lueur malsaine sur la lisière
  for (let y = 4; y < H; y += 9) glow(vx + Math.sin(y * .25 + T * 1.3) * 2.2, y, 6, '200,60,150', .22 + Math.sin(T * 2 + y) * .08);
}

// ---------- dessin ----------
function nodeIcon(n, x, y, show) {
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = .45; ctx.strokeStyle = '#fff8ea'; ctx.fillStyle = '#fff8ea'; ctx.lineCap = 'round';
  const t = show ? n.type : '?';
  if (t === '?') text('?', 0, .2, { align: 'center', size: 4.5, alpha: .7 });
  else if (t === 'combat') { ctx.beginPath(); ctx.moveTo(-1.6, -1.6); ctx.lineTo(1.6, 1.6); ctx.moveTo(1.6, -1.6); ctx.lineTo(-1.6, 1.6); ctx.stroke(); }
  else if (t === 'elite') drawEye(0, 0, 2.2, 1.5, 1, P0x, P0y, '#ff6fb0', true);
  else if (t === 'event') text('!', 0, .2, { align: 'center', size: 4.5 });
  else if (t === 'dialogue') { ctx.beginPath(); ctx.ellipse(0, -.3, 2, 1.4, 0, 0, TAU); ctx.moveTo(-.6, .9); ctx.lineTo(-1.4, 2); ctx.lineTo(.2, 1); ctx.stroke(); }
  else if (t === 'final') {             // étoile dorée à quatre branches
    const k = 1 + Math.sin(T * 2) * .12; ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = (i % 2 ? 1.1 : 4.2) * k; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  }
  else if (t === 'shop') { ctx.beginPath(); ctx.arc(0, 0, 1.7, 0, TAU); ctx.stroke(); text('¤', 0, .25, { align: 'center', size: 3.4 }); }
  ctx.restore();
}
let P0x = 0, P0y = 0;   // point que regardent les yeux des étoiles « présence ancienne »
function drawMap() {
  const reach = new Set(reachable().map(n => n.id));
  const cur = curNode();
  // position du vaisseau (pendant un saut, il glisse d'une étoile à l'autre)
  let sx = cur.x, sy = cur.y;
  if (mapAnim) { const a = RUN.map[mapAnim.from], b = RUN.map[mapAnim.to], k = mapAnim.t * mapAnim.t * (3 - 2 * mapAnim.t); sx = a.x + (b.x - a.x) * k; sy = a.y + (b.y - a.y) * k; }
  P0x = sx; P0y = sy;
  // liaisons
  ctx.save(); ctx.lineCap = 'round';
  for (const n of RUN.map) for (const id of n.nb) if (id > n.id) {
    const m = RUN.map[id], hot = (n.id === cur.id && reach.has(id)) || (m.id === cur.id && reach.has(n.id));
    ctx.strokeStyle = hot ? 'rgba(255,240,200,.8)' : 'rgba(215,205,255,.32)'; ctx.lineWidth = hot ? .55 : .4;
    ctx.setLineDash(hot ? [1.2, 1.2] : [.6, 1.4]); ctx.lineDashOffset = hot ? -T * 4 : 0;
    ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
  }
  ctx.restore();
  drawVoile();
  // étoiles
  for (const n of RUN.map) {
    const tp = TYPES[n.type], show = revealed(n), r = reach.has(n.id), sel = n.id === mapSel || n.id === mapHover;
    const pulse = r ? .25 + Math.sin(T * 4 + n.id) * .15 : 0;
    const big = n.type === 'final' ? 2 : 1;
    glow(n.x, n.y, (sel ? 7 : 5) * big, inVoile(n) ? '200,60,150' : show ? tp.rgb : '200,200,230', (n.done && n.type !== 'shop' ? .25 : .55) + pulse);
    ctx.fillStyle = n.done && n.type !== 'shop' && n.type !== 'depart' ? 'rgba(255,255,255,.35)' : '#fffaf0';
    ctx.beginPath(); ctx.arc(n.x, n.y, (sel ? 2.8 : 2.3) * big, 0, TAU); ctx.globalAlpha = .25; ctx.fill(); ctx.globalAlpha = 1;
    if (!(n.done && n.type !== 'shop')) nodeIcon(n, n.x, n.y, show);
    if (sel) { ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(n.x, n.y, 4.2 * big, 0, TAU); ctx.stroke(); }
  }
  text('Départ', RUN.map[0].x, RUN.map[0].y + 7, { align: 'center', size: 3.8, alpha: .7 });
  const fin = RUN.map[RUN.map.length - 1];
  text('Étoile-objectif', fin.x, fin.y + 9, { align: 'center', size: 4.2, color: '#fff0c8' });
  // vaisseau
  if (IMG.ship) { glow(sx - 3, sy - 4, 3, '120,255,210', .5); ctx.drawImage(IMG.ship, sx - 5.5, sy - 7.5, 9, 4.4); }
  drawMapHUD();
  // info-bulle de l'étoile visée
  const tip = RUN.map[mapHover >= 0 ? mapHover : mapSel];
  if (tip && tip.id !== cur.id) {
    const lbl = (revealed(tip) ? TYPES[tip.type].nom : 'Inconnu') + (tip.done && tip.type !== 'shop' ? ' (visitée)' : '') + (inVoile(tip) || colOf(tip.x) <= RUN.voile + VOILE_PAS ? ' — dans le Voile !' : '');
    const half = lbl.length * 1.05 + 2, tx = clamp(tip.x, half + 1, W - half - 1), ty = tip.y < 30 ? tip.y + 10 : tip.y - 9;
    ctx.fillStyle = 'rgba(14,8,30,.8)'; ctx.fillRect(tx - lbl.length * 1.05 - 2, ty - 3.2, lbl.length * 2.1 + 4, 6.4);
    text(lbl, tx, ty, { align: 'center', size: 4.2 });
  }
  text(mapAnim ? 'Saut en cours…' : reach.size ? 'Choisis ta prochaine étoile' : '', W / 2, H - 4, { align: 'center', size: 5, alpha: .55 + Math.sin(T * 3) * .25 });
}
function drawMapHUD() {
  const gr = ctx.createLinearGradient(0, 0, 0, TOP + 4);
  gr.addColorStop(0, 'rgba(10,5,25,.85)'); gr.addColorStop(1, 'rgba(10,5,25,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, TOP + 4);
  text('Coque', 2, 3.8, { size: 4.2, alpha: .7 });
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = i < RUN.lives ? 1 : .2;
    if (IMG.ship) ctx.drawImage(IMG.ship, 14 + i * 6.5, 2.2, 5.6, 2.7);
  }
  ctx.globalAlpha = 1;
  text('¤ ' + RUN.credits + ' crédits', 50, 3.8, { size: 4.6, color: '#ffe3a0' });
  let x = 80;
  if (RUN.spread > 0) { text('✦ ' + RUN.spread, x, 3.8, { size: 4.4, color: '#c8f0dc' }); x += 12; }
  if (RUN.laser > 0) { text('Laser ' + RUN.laser.toFixed(1).replace('.', ',') + ' s', x, 3.8, { size: 4.4, color: '#ffb3de' }); x += 22; }
  if (RUN.shield > 0) { text('Bouclier', x, 3.8, { size: 4.4, color: '#bfe9ff' }); }
  text(String(RUN.score).padStart(6, '0'), W - 2, 3.8, { align: 'right', size: 5.5 });
  // équipage
  text('Équipage : ' + RUN.crew.map(id => EQUIPAGE[id].nom).join(' · '), 2, 9.6, { size: 3.9, alpha: .75 });
}

// ---------- commandes de la carte ----------
function mapPick(dir) {   // flèches : passe d'une étoile atteignable à l'autre
  const r = reachable(); if (!r.length) return;
  const cur = curNode();
  const from = mapSel >= 0 ? RUN.map[mapSel] : cur;
  let best = null, bd = 1e9;
  for (const n of r) {
    if (n.id === from.id) continue;
    const dx = n.x - from.x, dy = n.y - from.y;
    const ok = dir === 'right' ? dx > 1 : dir === 'left' ? dx < -1 : dir === 'up' ? dy < -1 : dy > 1;
    const d = Math.hypot(dx, dy);
    if (ok && d < bd) { bd = d; best = n; }
  }
  if (!best && mapSel < 0) best = r.sort((a, b) => b.x - a.x)[0];
  if (best) mapSel = best.id;
}
function mapPointer(ux, uy, click) {
  let hit = -1;
  for (const n of reachable()) if (Math.hypot(n.x - ux, n.y - uy) < 5) hit = n.id;
  mapHover = hit;
  if (click && hit >= 0) jumpTo(hit);
}
