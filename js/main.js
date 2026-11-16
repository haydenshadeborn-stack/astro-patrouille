'use strict';
// =====================================================================
//  CHEF D'ORCHESTRE : titre, voyage (sauvegarde), écrans de fin,
//  tableau des scores, commandes et boucle principale.
//  state : 'title' | 'map' | 'scene' | 'play' (combat) | 'over' | 'win'
// =====================================================================

// ---------- voyage en cours (mort définitive : la sauvegarde est effacée à la fin) ----------
let RUN = null;
const SAVE_KEY = 'astro_voyage';
function saveRun() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(RUN)); } catch (e) {} }
function loadRun() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } }
function clearRun() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
let savedRun = loadRun();

function newRun() {
  RUN = { map: genMap(), cur: 0, voile: -1, jumps: 0, lives: 3, credits: 20, spread: 0, laser: 0, shield: 0,
          crew: ['kaimana'], score: 0, usedEvents: [], usedDialogues: [], pending: null };
  voileTex = null;
  setPending({ scene: 'intro' });
}
function continueRun() { RUN = savedRun; voileTex = null; resumePending(); }

// ---------- fin du voyage ----------
let endInfo = null;
function endRun(win) {
  closeScene(); clearRun(); savedRun = null;
  if (win) RUN.score += RUN.lives * 300 + RUN.credits;      // bonus de victoire : coque restante + crédits
  score = RUN.score;
  endInfo = { win, jumps: RUN.jumps, crew: RUN.crew.length, score: RUN.score };
  state = win ? 'win' : 'over'; overT = 1.5; myRank = -1;
  newRecord = RUN.score > hiscore;
  if (win) { droneOff(); showScene({ ...VICTOIRE, boutons: [{ label: 'Voir le tableau des scores', onClick: () => { closeScene(); state = 'win'; if (qualifies(RUN.score)) askName(); } }] }); state = 'win'; }
  else if (qualifies(RUN.score)) askName();
}

// ---------- tableau des scores (gardé dans ce navigateur) ----------
let scores = [], lastName = '', myRank = -1;
try { scores = JSON.parse(localStorage.getItem('astro_scores') || '[]'); lastName = localStorage.getItem('astro_nom') || ''; } catch (e) {}
const saveScores = () => { try { localStorage.setItem('astro_scores', JSON.stringify(scores)); localStorage.setItem('astro_nom', lastName); } catch (e) {} };
hiscore = scores.length ? scores[0].score : 0;
const qualifies = s => s > 0 && (scores.length < 10 || s > scores[scores.length - 1].score);
function addScore(name) {
  const entry = { name: name || 'Anonyme', score: endInfo.score, level: endInfo.jumps, win: endInfo.win, date: new Date().toISOString().slice(0, 10) };
  scores.push(entry); scores.sort((a, b) => b.score - a.score); scores = scores.slice(0, 10);
  myRank = scores.indexOf(entry); hiscore = scores[0].score; saveScores();
}
function drawScoreTable(x, y, n) {
  const w = 70;
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x - 3, y - 6, w + 6, 8 + n * 6.2);
  text('Meilleurs voyages', x + w / 2, y - 1.5, { align: 'center', size: 5.5, ...TITLE, color: '#d9c8ea' });
  if (!scores.length) { text('Aucun voyage pour l’instant', x + w / 2, y + 12, { align: 'center', size: 4.5, alpha: .6 }); return; }
  scores.slice(0, n).forEach((s, i) => {
    const yy = y + 6 + i * 6.2, me = i === myRank, c = me ? '#c8f0b0' : '#f1e8ff', al = me ? (blink(1.5) ? 1 : .7) : .85;
    text((i + 1) + '.', x + 4, yy, { align: 'right', size: 4.6, color: c, alpha: al });
    text(s.name, x + 6, yy, { size: 4.6, color: c, alpha: al });
    text(s.win ? '★ arrivé' : s.level + ' sauts', x + 50, yy, { align: 'right', size: 3.8, color: s.win ? '#ffe3a0' : c, alpha: al * .8 });
    text(String(s.score), x + w, yy, { align: 'right', size: 4.6, color: c, alpha: al });
  });
}

// ---------- dessin ----------
function draw() {
  ctx.setTransform(R, 0, 0, R, 0, 0);
  if (shake > 0) ctx.translate(rand(-.7, .7), rand(-.7, .7));
  drawBackground();
  if (!ready) { text('Chargement…', W / 2, H / 2, { align: 'center', size: 8 }); finishFrame(); return; }
  if (state === 'title') drawTitle();
  else if (state === 'map' || state === 'scene') { ctx.fillStyle = 'rgba(10,5,25,.25)'; ctx.fillRect(0, 0, W, H); drawMap(); }
  else if (state === 'play') drawCombat();
  else drawEnd();
  finishFrame();
}
// En vertical, le terrain est affiché pivoté d'un quart de tour (et un peu dézoomé).
// Au début de la rencontre, la caméra pivote progressivement : « le Voile tord l'espace ».
function worldTransform() {
  if (!C.vert) return 0;
  const t = C.warpT, k = t * t * (3 - 2 * t), wob = Math.sin(t * Math.PI) * .25;
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2 * k + wob);
  const z = 1 + (VZ - 1) * k - Math.sin(t * Math.PI) * .12;
  ctx.scale(z, z);
  ctx.translate(-LW / 2, -LH / 2);
  return k;
}
function drawCombat() {
  ctx.save();
  const k = worldTransform();
  for (const it of items) drawItem(it);
  for (const e of enemies) drawEnemy(e);
  if (boss) drawBoss(boss);
  drawShip(P.x, P.y, P.inv > 0 && blink(6) ? .3 : 1, P);
  ctx.save(); ctx.lineCap = 'round';
  for (const b of bullets) {
    glow(b.x + 2, b.y + .5, 2.2, b.rav ? '255,170,90' : '120,200,255', .5);
    ctx.strokeStyle = b.rav ? '#ffd9b0' : '#e4f5ff'; ctx.lineWidth = .9;
    ctx.beginPath(); ctx.moveTo(b.x, b.y + .5); ctx.lineTo(b.x + 4 - b.vy * .02, b.y + .5 + b.vy * .02); ctx.stroke();
  }
  ctx.restore();
  for (const b of ebullets) { glow(b.x + 1, b.y + 1, 2.6, b.rgb, .55); ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x + 1, b.y + 1, .8, 0, TAU); ctx.fill(); }
  drawParts();
  ctx.restore();
  if (C.vert) {   // bandes latérales assombries : on voit les bords du terrain
    const half = LH * VZ / 2 * k + (W / 2) * (1 - k), x0 = W / 2 - half, x1 = W / 2 + half;
    ctx.fillStyle = `rgba(10,5,25,${.6 * k})`; ctx.fillRect(0, 0, x0, H); ctx.fillRect(x1, 0, W - x1, H);
    ctx.fillStyle = `rgba(200,160,255,${.25 * k})`; ctx.fillRect(x0 - .3, 0, .3, H); ctx.fillRect(x1, 0, .3, H);
    if (C.warpT < 1) { ctx.fillStyle = `rgba(90,20,80,${Math.sin(C.warpT * Math.PI) * .35})`; ctx.fillRect(0, 0, W, H); }
  }
  drawHUD();
  if (phase === 'intro') {
    text(C.titre, W / 2, 36, { align: 'center', size: 13, ...TITLE });
    text(C.tag, W / 2, 48, { align: 'center', size: 6, alpha: .85 });
  }
  if (phase === 'warn') text('Quelque chose s’éveille…', W / 2, 44, { align: 'center', size: 9, ...TITLE, color: '#c8f0b0', alpha: .55 + Math.sin(T * 4) * .35 });
  if (phase === 'clear' && C.reward) {
    text(C.kind === 'final' ? 'Le gardien est vaincu' : 'Victoire', W / 2, 34, { align: 'center', size: 12, ...TITLE });
    const r = C.reward, bits = [];
    if (r.credits) bits.push('+' + r.credits + ' crédits'); if (r.coque) bits.push('+1 coque'); if (r.score) bits.push('+' + r.score + ' points');
    text(bits.join('   ·   '), W / 2, 46, { align: 'center', size: 6 });
  }
  if (banner) text(banner.text, W / 2, 17, { align: 'center', size: 7, ...TITLE, color: '#e8f6ff', alpha: Math.min(1, banner.t * 1.5) });
  if (paused) {
    ctx.fillStyle = 'rgba(10,5,25,.5)'; ctx.fillRect(0, 0, W, H);
    text('Pause', W / 2, 42, { align: 'center', size: 14, ...TITLE });
    text('P ou toucher pour reprendre', W / 2, 54, { align: 'center', size: 5, alpha: .8 });
  }
}
function drawParts() {
  for (const p of parts) {
    const f = p.life / p.max;
    ctx.globalAlpha = f * .5; ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + (1 - f) * 1.4), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawEnd() {
  ctx.fillStyle = 'rgba(10,5,25,.7)'; ctx.fillRect(0, 0, W, H);
  const win = state === 'win';
  text(win ? 'Arrivés !' : 'Englouti', 40, 20, { align: 'center', size: 13, ...TITLE, color: win ? '#fff0c8' : '#f1e8ff' });
  text(win ? 'L’Étoile-objectif est atteinte' : 'Le Voile a eu raison du vaisseau…', 40, 30, { align: 'center', size: 4.8, alpha: .8 });
  text('Score  ' + endInfo.score, 40, 41, { align: 'center', size: 8 });
  text(endInfo.jumps + ' sauts  ·  ' + endInfo.crew + ' à bord', 40, 49, { align: 'center', size: 5, alpha: .8 });
  if (newRecord && !naming) text('Nouveau record !', 40, 57, { align: 'center', size: 6, color: '#c8f0b0', alpha: blink() ? 1 : .5 });
  drawScoreTable(84, 14, 10);
  if (overT <= 0 && !naming && sceneBox.hidden) text('Espace ou toucher : retour au titre', 40, 74, { align: 'center', size: 4.8, alpha: .55 + Math.sin(T * 4) * .35 });
}
function finishFrame() {
  if (flash > 0) { ctx.fillStyle = `rgba(235,255,225,${flash * 2.5})`; ctx.fillRect(-2, -2, W + 4, H + 4); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (paper) ctx.drawImage(paper, 0, 0);
}
function drawTitle() {
  [[18, 1.3], [40, 1.7], [128, 1.5], [148, 1.25]].forEach(([x, ang], i) =>
    tentacle(x, H + 3, -ang, 22 + (i % 2) * 6, 5, T * .7, i * 2, '#2b3d34', .8, true));
  text('Astro', W / 2, 16, { align: 'center', size: 15, ...TITLE });
  text('Patrouille', W / 2, 30, { align: 'center', size: 15, ...TITLE });
  text('— au-delà du voile des étoiles —', W / 2, 40, { align: 'center', size: 5.5, alpha: .75 });
  drawShip(((T * 30) % (W + 50)) - 30, 45 + Math.sin(T * 2) * 1.5);
  const pulse = .55 + Math.sin(T * 4) * .4;
  if (savedRun) {
    text(`Espace / toucher : continuer le voyage (${savedRun.jumps} sauts)`, W / 2, 64, { align: 'center', size: 5.8, alpha: pulse });
    text('N : nouveau voyage (efface le voyage en cours)', W / 2, 71, { align: 'center', size: 4.4, alpha: .7 });
  } else text('Espace ou toucher : nouveau voyage', W / 2, 66, { align: 'center', size: 6.5, alpha: pulse });
  text('Carte : flèches + Espace, ou toucher une étoile   ·   Combat : flèches / ZQSD + Espace   ·   P : pause   ·   M : son', W / 2, 84.5, { align: 'center', size: 3.4, alpha: .6 });
}

// ---------- mise à jour générale ----------
function step(dt) {
  if (state === 'play') { update(dt); return; }
  // hors combat : seules les particules, le décor et la carte vivent
  T += dt; flash = Math.max(0, flash - dt); shake = Math.max(0, shake - dt); overT -= dt;
  bgX += 1.5 * dt;
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  parts = parts.filter(p => p.life > 0);
  if (banner && (banner.t -= dt) <= 0) banner = null;
  laserSound(false);
  if (state === 'map') updateMap(dt);
}

// =====================================================================
//  COMMANDES
// =====================================================================
const keys = {};
const KM = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up',
             ArrowDown: 'down', KeyS: 'down', Space: 'fire', KeyJ: 'fire' };  // KeyW/A/S/D = Z/Q/S/D sur AZERTY
function pressStart() {
  if (!ready || naming) return;
  if (state === 'title') { if (savedRun) continueRun(); else newRun(); }
  else if ((state === 'over' || state === 'win') && overT <= 0 && sceneBox.hidden) { state = 'title'; savedRun = loadRun(); }
}
addEventListener('keydown', e => {
  unlockAudio();
  if (naming) return;                                  // on tape son nom
  if (state === 'scene') {                             // chiffres 1-9 : choisir une option
    const n = parseInt(e.key, 10);
    if (n >= 1) { const b = sceneBox.querySelectorAll('.choix button')[n - 1]; if (b) b.click(); }
    if (e.code === 'KeyM') setMuted(!muted);
    return;
  }
  const k = KM[e.code]; if (k) { keys[k] = true; e.preventDefault(); }
  if (e.repeat) return;
  if (state === 'map') {
    if (['left', 'right', 'up', 'down'].includes(k)) mapPick(k);
    if ((e.code === 'Space' || e.code === 'Enter') && mapSel >= 0) jumpTo(mapSel);
    else if (e.code === 'Space' || e.code === 'Enter') mapPick('right');
  }
  if (state === 'title' && e.code === 'KeyN') { clearRun(); savedRun = null; newRun(); return; }
  if (e.code === 'Space' || e.code === 'Enter') pressStart();
  if ((e.code === 'KeyP' || e.code === 'Escape') && state === 'play') paused = !paused;
  if (e.code === 'KeyM') setMuted(!muted);
});
addEventListener('keyup', e => { const k = KM[e.code]; if (k) keys[k] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; touch.on = false; if (state === 'play') paused = true; });

// coordonnées du pointeur dans le monde du jeu (unités)
const toUnits = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; };
const touch = { on: false };
addEventListener('pointerdown', e => {
  unlockAudio();
  if (naming || e.target.closest('#nom') || e.target.closest('#scene')) return;
  if (state === 'map') { const [x, y] = toUnits(e); mapPointer(x, y, true); return; }
  if (state !== 'play') { pressStart(); return; }
  if (paused) { paused = false; return; }
  Object.assign(touch, { on: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, sx: P.x, sy: P.y });
});
addEventListener('pointermove', e => {
  if (state === 'map') { const [x, y] = toUnits(e); mapPointer(x, y, false); return; }
  if (!touch.on || e.pointerId !== touch.id || paused) return;
  const ddx = (e.clientX - touch.ox) / scale * 1.3, ddy = (e.clientY - touch.oy) / scale * 1.3;
  if (C && C.vert) { P.x = touch.sx - ddy / VZ; P.y = touch.sy + ddx / VZ; }   // terrain pivoté
  else { P.x = touch.sx + ddx; P.y = touch.sy + ddy; }
});
const endTouch = e => { if (e.pointerId === touch.id) touch.on = false; };
addEventListener('pointerup', endTouch); addEventListener('pointercancel', endTouch);

// ---------- saisie du nom pour le tableau des scores ----------
let naming = false;
const nomBox = document.getElementById('nom'), nomInput = nomBox.querySelector('input');
function askName() {
  naming = true; nomBox.hidden = false; nomInput.value = lastName;
  for (const k in keys) keys[k] = false; touch.on = false;
  setTimeout(() => { nomInput.focus(); nomInput.select(); }, 50);
}
nomBox.addEventListener('submit', e => {
  e.preventDefault();
  lastName = nomInput.value.trim().slice(0, 12) || 'Anonyme';
  addScore(lastName);
  naming = false; nomBox.hidden = true; nomInput.blur(); overT = .6;
});

// =====================================================================
//  DÉMARRAGE
// =====================================================================
addEventListener('resize', resize); resize();
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const fontsOk = document.fonts ? Promise.all([document.fonts.load('700 20px Caveat'), document.fonts.load('20px "IM Fell English SC"')]).catch(() => {}) : Promise.resolve();
Promise.all([loadImg('assets/fond.jpg'), loadImg('assets/vaisseau.jpg'), loadImg('assets/boss-veilleur.jpg'), fontsOk]).then(([bg, ship, bossImg]) => {
  IMG.bg = bg;
  IMG.ship = ship ? flipH(cutout(ship, 400, 215, 30)) : null;                                // nez vers la droite
  IMG.boss = bossImg ? rotateLeft(cutout(bossImg, 420, 205, 45, { warm: true, holes: 160 })) : null;  // tête vers le joueur
  buildSprites(); ready = true;
});

let last = performance.now(), wasPaused = false;
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (paused !== wasPaused) { wasPaused = paused; musicPauseAll(paused); if (paused) laserSound(false); }
  if (!paused) step(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
