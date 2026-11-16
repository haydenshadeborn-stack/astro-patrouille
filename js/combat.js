'use strict';
// =====================================================================
//  ÉTAT DU JEU
// =====================================================================
const BOSSES = [
  { name: "L'Œil du Néant",          tag: 'Un regard vous observe…',         sp: 'boss0', w: 24, h: 24, attacks: ['aim', 'ring', 'spread'] },
  { name: 'Le Veilleur des Abysses', tag: 'Mille yeux s’ouvrent dans le noir…', sp: 'veilleur', w: 32, h: 32, attacks: ['eyes', 'spread', 'spawn'],
    // positions des yeux sur l'image (0 → 1), pour les tirs et les lueurs
    // (image pivotée d'un quart de tour : la tête regarde vers la gauche, les tentacules traînent à droite)
    eyes: [[.27, .38, 2.2], [.28, .515, 1.4], [.31, .27, 1.3], [.34, .60, 1.2], [.40, .50, 1.4], [.41, .27, 1.3], [.20, .58, .8]],
    mouth: [.30, .45] },
  { name: 'La Masse aux Mille Yeux', tag: 'Ça grouille au-delà des étoiles…', sp: 'boss2', w: 28, h: 24, attacks: ['eyes', 'ring', 'spawnEye'] },
];
const DEF = {
  ast:     { w: 9,   h: 9,   hp: 3, pts: 20, v: 22 },
  rock:    { w: 4.5, h: 4.5, hp: 1, pts: 5,  v: 34 },
  fighter: { w: 7,   h: 5,   hp: 1, pts: 15, v: 30 },
  diver:   { w: 6,   h: 6,   hp: 2, pts: 25, v: 26 },
};
let ready = false, IMG = {};
let state = 'title', phase = 'intro', phaseT = 0, levelT = 0, spawnT = 0;
let level = 1, score = 0, hiscore = 0, newRecord = false;
let banner = null;
let P = null, boss = null, paused = false, flash = 0, shake = 0, overT = 0, T = 0, bgX = 0;
let bullets = [], ebullets = [], enemies = [], parts = [], items = [];
const stars = [];
for (let i = 0; i < 40; i++) stars.push({ x: rand(0, W), y: rand(TOP, H), v: rand(6, 40), s: rand(.6, 1.6) });


// Vaisseau : 17 x 8,3 unités ; zone de collision plus petite que le dessin (plus juste)
const pHB = () => ({ x: P.x + 3, y: P.y + 2.4, w: 11, h: 4 });

// =====================================================================
//  RENCONTRE DE COMBAT
//  Une étoile « combat » lance une rencontre. Le vaisseau garde d'une
//  rencontre à l'autre sa coque, ses munitions et son bouclier (voir RUN).
//    kind : 'combat' (vagues seules), 'elite' (vagues courtes + boss),
//           'final' (gardien de l'étoile-objectif), 'voile' (étoile engloutie)
// =====================================================================
let C = null;   // description de la rencontre en cours
// Terrain de combat, en « avancée » (LW, vers la droite à l'écran en horizontal)
// et « latéral » (LH). En vertical, le même terrain est affiché pivoté d'un quart de tour.
let LW = W, LH = H, LT = TOP;
const VZ = .7;                     // dézoom en vertical (on voit plus loin)
const VERT = { LW: H / VZ, LH: 150, LT: 2, spd: .85 };
const COMBATS = {
  combat: { titre: 'Rencontre',            tag: 'Des formes approchent…',            vagues: d => 20 + d * 3, boss: false },
  voile:  { titre: 'Engeance du Voile',    tag: 'Le Voile vomit ses créatures…',     vagues: d => 26 + d * 2, boss: false },
  elite:  { titre: 'Présence ancienne',    tag: 'Quelque chose garde cette étoile…', vagues: d => 10,         boss: true },
  final:  { titre: 'L’Étoile-objectif',     tag: 'Mille yeux s’ouvrent dans le noir…', vagues: d => 14,       boss: true },
};
const hasCrew = id => RUN && RUN.crew.includes(id);
function startCombat(kind, diff) {
  const k = COMBATS[kind];
  C = { kind, ...k, diff };
  // Surprise : 1 rencontre sur 4 se joue de bas en haut (jamais le boss final)
  C.vert = kind !== 'final' && Math.random() < .25;
  if (C.vert) { LW = VERT.LW; LH = VERT.LH; LT = VERT.LT; C.spd = VERT.spd; C.tag = 'Le Voile tord l’espace…'; C.warpT = 0; }
  else { LW = W; LH = H; LT = TOP; C.spd = 1; C.warpT = 1; }
  level = diff + (kind === 'voile' ? 2 : 0);   // la difficulté pilote vitesse, cadence de tir, etc.
  if (kind === 'final') { C.bossDef = BOSSES[1]; C.bossHp = 70 + diff * 10; }
  if (kind === 'elite') { C.bossDef = pick([BOSSES[0], BOSSES[2]]); C.bossHp = 22 + diff * 9; C.tag = C.bossDef.tag; }
  score = RUN.score;
  P = { x: 8, y: LH / 2, w: 17, h: 8.3, lives: RUN.lives, cd: 0, inv: 2, spread: RUN.spread, laser: RUN.laser, shield: RUN.shield, lz: 0, rav: 0 };
  bullets = []; ebullets = []; enemies = []; items = []; boss = null; banner = null;
  phase = 'intro'; phaseT = C.vert ? 3.2 : 2.6; levelT = k.vagues(diff); spawnT = .5;
  if (C.vert) { play('bouclier', .5); beep(260, 1.4, .05, -180, 'sine'); }
  for (const kk in keys) keys[kk] = false;
  state = 'play'; paused = false;
}

// ---------- ennemis ----------
function addE(kind, y, x = LW + 4) {
  const d = DEF[kind];
  const e = { kind, x, y, by: y, w: d.w, h: d.h, hp: d.hp + (kind === 'ast' && level > 2 ? 1 : 0), pts: d.pts,
              vx: -(d.v + level * 3) * rand(.85, 1.15) * C.spd, vy: kind === 'ast' || kind === 'rock' ? rand(-6, 6) : 0,
              t: rand(0, 6), fire: rand(1, 3), hit: 0, rot: rand(0, TAU), spin: rand(-1.5, 1.5) };
  if (kind === 'ast') e.sp = pick(SP.asts);
  if (kind === 'rock') e.sp = pick(SP.rocks);
  enemies.push(e);
}
// Apparition des ennemis : petits groupes répartis dans tout le terrain,
// plutôt que de longues files sur une même ligne.
const recentY = [];
// délai entre deux apparitions : plus court qu'avant, car les groupes sont plus petits
const spawnDelay = () => Math.max(.28, .92 - level * .07) * rand(.7, 1.3);
// position latérale éloignée des dernières apparitions (on tire 5 candidats, on garde le plus isolé)
function freeY(marge = 10) {
  let best = 0, bd = -1;
  for (let i = 0; i < 5; i++) {
    const y = rand(LT + 2, LH - marge);
    const d = recentY.length ? Math.min(...recentY.map(r => Math.abs(r - y))) : 99;
    if (d > bd) { bd = d; best = y; }
  }
  recentY.push(best); if (recentY.length > 4) recentY.shift();
  return best;
}
function spawn() {
  const r = Math.random(), x0 = LW + 4;
  if (r < .32) addE('ast', freeY());
  else if (r < .47) {                                   // deux rochers, écartés
    const y = freeY();
    for (let i = 0; i < 2; i++) addE('rock', clamp(y + rand(-14, 14), LT + 1, LH - 6), x0 + i * rand(10, 20));
  } else if (r < .82) {                                 // larves : seules ou en petit groupe décalé
    const n = Math.random() < .4 ? 1 : 2 + (Math.random() * Math.min(level, 2) | 0);
    const y0 = freeY(14), dir = pick([-1, 1]), forme = pick(['diagonale', 'v', 'dispersé']);
    for (let i = 0; i < n; i++) {
      const y = forme === 'diagonale' ? y0 + dir * i * 8
              : forme === 'v' ? y0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 8
              : y0 + rand(-16, 16);
      addE('fighter', clamp(y, LT + 4, LH - 14), x0 + i * rand(10, 16));
    }
  } else addE('diver', freeY());
}

// ---------- boss ----------
function spawnBoss() {
  const def = C.bossDef, hp = C.bossHp;
  boss = { def, sp: SP[def.sp], x: LW + 6, y: 0, w: def.w, h: def.h, tx: LW - def.w - 8, hp, max: hp, t: 0, fire: 2.5, n: 0, hit: 0 };
  boss.cy = LT + (LH - LT - boss.h) / 2; boss.amp = (LH - LT - boss.h) / 2 - 2; boss.y = boss.cy;
  if (def.eyes) boss.eyes = def.eyes.map(([x, y, r]) => ({ x: x * boss.w, y: y * boss.h, r, col: '#ffb347', ph: rand(0, 6) }));
  if (def.sp === 'boss2') {
    boss.eyes = Array.from({ length: 9 }, () => {
      const a = rand(0, TAU), d = Math.sqrt(Math.random()) * .8;
      return { x: boss.w / 2 + Math.cos(a) * d * boss.w * .4, y: boss.h / 2 + Math.sin(a) * d * boss.h * .38,
               r: rand(1.2, 2.6), ph: rand(0, 6), per: rand(3, 7), col: pick(['#c9d84b', '#e07a5f', '#9ad1d4', '#d4a5e8']) };
    });
  }
  droneOn();
}
function bossMouth(b) {
  if (b.def.sp === 'boss0') return [b.x + b.w / 2 - 3, b.y + b.h / 2];
  if (b.def.mouth) return [b.x + b.w * b.def.mouth[0], b.y + b.h * b.def.mouth[1]];
  return [b.x + 4, b.y + b.h / 2];
}
const rgbOf = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).join(',');
function shoot(x, y, ang, sp, col = '#a6f07a') {
  sp *= C.spd;
  ebullets.push({ x: x - 1, y: y - 1, w: 2, h: 2, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, col, rgb: rgbOf(col) });
  play('ennemi', .2, .3, .07);
}
function bossAttack(b) {
  const [cx, cy] = bossMouth(b), sp = 48 + level * 6, kind = b.def.attacks[b.n++ % b.def.attacks.length];
  const toP = (x, y) => Math.atan2(P.y + 3 - y, P.x + 10 - x);
  if (kind === 'aim') {
    const a = toP(cx, cy);
    (level === 1 ? [0] : [-.12, 0, .12]).forEach(o => shoot(cx, cy, a + o, sp, '#e05fb0'));
    beep(300, .15, .04, -150);
  } else if (kind === 'spread') {
    (level === 1 ? [-.3, 0, .3] : [-.5, -.25, 0, .25, .5]).forEach(o => shoot(cx, cy, Math.PI + o, sp));
    beep(220, .2, .04, -100);
  } else if (kind === 'ring') {
    const n = 8 + level * 2, o = rand(0, TAU);
    for (let i = 0; i < n; i++) shoot(b.x + b.w / 2, b.y + b.h / 2, o + i / n * TAU, sp * .65, '#c78bf0');
    beep(140, .35, .05, 80, 'sine');
  } else if (kind === 'spawn') {
    if (level === 1) { shoot(cx, cy, toP(cx, cy), sp, '#e05fb0'); return; }
    addE('fighter', clamp(cy - 4, LT + 1, LH - 6), cx); addE('fighter', clamp(cy + 2, LT + 1, LH - 6), cx + 3);
    beep(180, .3, .04, -60, 'sine');
  } else if (kind === 'spawnEye') {
    addE('diver', clamp(b.y, LT + 1, LH - 7), b.x); addE('diver', clamp(b.y + b.h - 6, LT + 1, LH - 7), b.x);
    beep(180, .3, .04, -60, 'sine');
  } else if (kind === 'eyes') {
    const es = [...b.eyes].sort(() => Math.random() - .5).slice(0, 2 + Math.min(level, 3));
    es.forEach(e => { const x = b.x + e.x, y = b.y + e.y; shoot(x, y, toP(x, y), sp * .9, e.col); });
    beep(400, .12, .03, -200);
  }
}

// ---------- effets ----------
function explode(x, y, n, cols, size = 1.5) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), v = rand(4, 30), life = rand(.4, 1.1);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, r: rand(.5, 1.2) * size, col: pick(cols) });
  }
}
const ROCK = ['#a08060', '#4a3628', '#e2c9a6'], ICHOR = ['#5fae86', '#c8f59a', '#1f4a38'], EYE = ['#c96f84', '#eadfca', '#6a2038'];
function kill(e) {
  e.dead = true; score += e.pts;
  explode(e.x + e.w / 2, e.y + e.h / 2, 10, e.kind === 'ast' || e.kind === 'rock' ? ROCK : e.kind === 'diver' ? EYE : ICHOR, e.w / 5);
  beep(140, .22, .05, -90, 'sawtooth');
  if (Math.random() < .09) dropItem(e.x, e.y);
}
// Bonus : tir triple, bouclier, laser
const ITEMS = {
  spread: { rgb: '150,230,200', label: 'Tir triple' },
  shield: { rgb: '120,210,255', label: 'Bouclier' },
  laser:  { rgb: '255,120,200', label: 'Laser' },
};
function dropItem(x, y, type = pick(['spread', 'shield', 'laser'])) { items.push({ x, y: clamp(y, LT, LH - 6), w: 6, h: 6, type }); }
function pickItem(it) {
  score += 50; banner = { text: ITEMS[it.type].label, t: 1.6 };
  if (it.type === 'spread') P.spread = Math.min(99, P.spread + 40);   // 40 salves de tir triple
  if (it.type === 'shield') P.shield = 1;
  if (it.type === 'laser') P.laser = Math.min(15, P.laser + 5);       // 5 secondes de rayon
  if (!play('bonus', .45)) { beep(660, .12); setTimeout(() => beep(990, .2), 100); }
}
function killBoss() {
  score += 500 * level;
  for (let i = 0; i < 10; i++) explode(boss.x + rand(0, boss.w), boss.y + rand(0, boss.h), 14, ['#3b2a4a', '#9be37a', '#c24d8a', '#1a1022', '#eadfca'], 3);
  const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;
  boss = null; ebullets = []; enemies.forEach(e => e.dead = true);
  dropItem(bx, by);
  flash = .25; shake = .8; phase = 'clear'; phaseT = 4.5;
  C.reward = combatReward();
  droneOff();
  beep(90, 1, .08, -50, 'sawtooth'); setTimeout(() => beep(523, .2), 700); setTimeout(() => beep(659, .2), 850); setTimeout(() => beep(784, .5), 1000);
}
function hurt() {
  if (P.shield > 0) {             // le bouclier absorbe le coup
    P.shield = 0; P.inv = 1.2; ebullets = [];
    explode(P.x + 8, P.y + 4, 18, ['#bfe9ff', '#7fc8ff', '#ffffff'], 1.6);
    if (!play('bouclier', .55)) beep(500, .3, .05, -300, 'sine');
    return;
  }
  explode(P.x + 10, P.y + 3, 22, ['#bfe6ff', '#6f86c9', '#eae6ff'], 2);
  shake = .5; beep(80, .5, .07, -40, 'sawtooth');
  P.lives--; P.inv = 2.5; P.spread = 0; P.laser = 0; ebullets = [];
  if (P.lives <= 0) {
    droneOff(); laserSound(false);
    RUN.lives = 0; RUN.score = score;
    endRun(false);
  }
}

// =====================================================================
//  MISE À JOUR
// =====================================================================
function update(dt) {
  T += dt; flash = Math.max(0, flash - dt); shake = Math.max(0, shake - dt); overT -= dt;
  const slow = phase === 'boss' && state === 'play' ? .35 : 1;
  bgX += 3 * dt * slow;
  const vert = C && C.vert && state === 'play';
  for (const s of stars) {
    if (vert) { s.y += s.v * dt * slow; if (s.y > H + 2) { s.y = -2; s.x = rand(0, W); } }
    else { s.x -= s.v * dt * slow; if (s.x < -2) { s.x = W + 2; s.y = rand(TOP, H); } }
  }
  if (C && C.warpT < 1) C.warpT = Math.min(1, C.warpT + dt / 1.4);
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; p.life -= dt; }
  parts = parts.filter(p => p.life > 0);
  if (banner && (banner.t -= dt) <= 0) banner = null;
  if (state !== 'play') { laserSound(false); return; }

  phaseT -= dt;
  if (phase === 'intro' && phaseT <= 0) phase = 'waves';
  else if (phase === 'waves') {
    levelT -= dt; spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = spawnDelay(); }
    if (levelT <= 0) {
      if (C.boss) { phase = 'warn'; phaseT = 3.5; if (MUS.arrivee) musicPlay('arrivee', .75, .4); }
      else phase = 'sweep';                        // plus de renforts : on finit les ennemis restants
    }
  } else if (phase === 'sweep') {
    if (enemies.length === 0) { phase = 'clear'; phaseT = 3; C.reward = combatReward(); }
  } else if (phase === 'warn') {
    if (!MUS.arrivee && (phaseT * 1.2 | 0) !== ((phaseT + dt) * 1.2 | 0)) beep(65, .6, .06, -15, 'sine');
    shake = Math.max(shake, .05);
    if (phaseT <= 0 && enemies.length === 0) { phase = 'boss'; spawnBoss(); }
  } else if (phase === 'clear' && phaseT <= 0) { endCombat(); return; }

  // joueur
  if (!touch.on) {
    const sx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), sy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const [dx, dy] = C.vert ? [-sy, sx] : [sx, sy];   // flèches toujours dans le sens de l'écran
    P.x += dx * 70 * dt; P.y += dy * 70 * dt;
  }
  P.x = clamp(P.x, 0, LW * .6); P.y = clamp(P.y, LT - 1, LH - P.h);
  P.cd -= dt; P.inv -= dt;
  const firing = (keys.fire || touch.on) && phase !== 'clear';
  // Munitions spéciales : consommées dès qu'on tire, qu'il y ait une cible ou non
  P.beam = firing && P.laser > 0;
  if (P.beam) P.laser = Math.max(0, P.laser - dt);
  laserSound(P.beam);
  if (firing && !P.beam && P.cd <= 0) {
    P.cd = .16; const bx = P.x + 15, by = P.y + 4.2;
    bullets.push({ x: bx, y: by, w: 4, h: 1, vx: 150, vy: 0 });
    if (P.spread > 0) { P.spread--; bullets.push({ x: bx, y: by, w: 4, h: 1, vx: 145, vy: -40 }, { x: bx, y: by, w: 4, h: 1, vx: 145, vy: 40 }); }
    if (!play(P.spread > 0 ? 'triple' : 'tir', P.spread > 0 ? .3 : .22, .25)) beep(900, .05, .015, 300);
  }

  if (hasCrew('ivar') && phase !== 'clear' && (enemies.length || boss)) {
    P.rav -= dt;
    if (P.rav <= 0) {
      P.rav = .55;
      bullets.push({ x: P.x + 10, y: P.y - 3, w: 3, h: 1, vx: 140, vy: 0, rav: 1 }, { x: P.x + 10, y: P.y + 11, w: 3, h: 1, vx: 140, vy: 0, rav: 1 });
    }
  }
  for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x > LW || b.y < LT - 2 || b.y > LH) b.dead = true; }
  for (const b of ebullets) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < -4 || b.x > LW + 4 || b.y < LT - 4 || b.y > LH + 2) b.dead = true; }
  for (const it of items) { it.x -= 20 * dt; if (it.x < -8) it.dead = true; }

  for (const e of enemies) {
    e.t += dt; e.hit -= dt; e.x += e.vx * dt;
    if (e.kind === 'ast' || e.kind === 'rock') {
      e.rot += e.spin * dt; e.y += e.vy * dt;
      if (e.y < LT || e.y > LH - e.h) e.vy *= -1;
    } else if (e.kind === 'fighter') {
      e.y = e.by + Math.sin(e.t * 3) * 8;
      if (e.x < LW - 8 && e.x > P.x + 22) {
        e.fire -= dt;
        if (e.fire <= 0) { e.fire = rand(2, 4) / (1 + level * .15); shoot(e.x, e.y + 2.5, Math.PI, 60 + level * 5); }
      }
    } else if (e.kind === 'diver' && e.x > P.x + 6) {
      e.y += clamp((P.y + 1 - e.y) * 1.5, -28, 28) * dt;
    }
    e.y = clamp(e.y, LT, LH - e.h);
    if (e.x < -24) e.dead = true;
  }

  if (boss) {
    const b = boss; b.hit -= dt;
    if (hasCrew('ren') && !b.sealed && b.hp < b.max * .6) {      // Ren : sceau de papier
      b.sealed = true; b.frozen = 3; banner = { text: 'Ren : Sceau de papier !', t: 2 }; play('bonus', .4);
    }
    if (b.frozen > 0) { b.frozen -= dt; } else {
    b.t += dt;
    if (b.x > b.tx) b.x -= 16 * dt;
    b.y = b.cy + Math.sin(b.t * (.9 + level * .1)) * b.amp;
    if (b.x <= b.tx + 1) {
      b.fire -= dt;
      if (b.fire <= 0) { bossAttack(b); b.fire = Math.max(.45, 1.6 - level * .15) * (b.hp < b.max / 2 ? .65 : 1); }
    }
    }
  }

  // laser : rayon continu qui traverse tout et inflige des dégâts en continu
  if (P.beam) {
    const nx = P.x + 16, ny = P.y + 4.4, beam = { x: nx, y: ny - 1.3, w: LW - nx, h: 2.6 };
    for (const e of enemies) {
      if (e.dead || !overlap(beam, e)) continue;
      e.lz = (e.lz || 0) + dt * 14; e.hit = .05;
      while (e.lz >= 1 && e.hp > 0) { e.lz--; e.hp--; }
      if (e.hp <= 0) kill(e);
    }
    if (boss && boss.x < LW - 6 && overlap(beam, boss, 2)) {
      boss.lz = (boss.lz || 0) + dt * 7; boss.hit = .05;
      while (boss.lz >= 1 && boss.hp > 0) { boss.lz--; boss.hp -= hasCrew('nefer') ? 1.5 : 1; explode(boss.x + 3, ny, 2, ['#ff9ad5', '#ffffff'], .7); }
      if (boss.hp <= 0) killBoss();
    }
  }

  // collisions : tirs du joueur
  for (const b of bullets) {
    if (b.dead) continue;
    for (const e of enemies) {
      if (!e.dead && overlap(b, e)) {
        b.dead = true; e.hp--; e.hit = .1;
        if (e.hp <= 0) kill(e); else beep(260, .04, .02);
        break;
      }
    }
    if (!b.dead && boss && boss.x < LW - 6 && overlap(b, boss, 2)) {
      b.dead = true; boss.hp -= hasCrew('nefer') ? 1.5 : 1; boss.hit = .08; beep(160, .04, .025);
      explode(b.x + 2, b.y, 2, ['#9be37a', '#3b2a4a'], .8);
      if (boss.hp <= 0) killBoss();
    }
  }
  // collisions : joueur
  const hb = pHB();
  for (const it of items) if (!it.dead && overlap(hb, it)) { it.dead = true; pickItem(it); }
  if (P.inv <= 0 && phase !== 'clear') {
    let hit = false;
    for (const e of enemies) if (!e.dead && overlap(hb, e, .5)) { kill(e); hit = true; break; }
    if (!hit) for (const b of ebullets) if (!b.dead && overlap(hb, b)) { b.dead = true; hit = true; break; }
    if (!hit && boss && overlap(hb, boss, 3)) hit = true;
    if (hit) hurt();
  }

  bullets = bullets.filter(b => !b.dead); ebullets = ebullets.filter(b => !b.dead);
  enemies = enemies.filter(e => !e.dead); items = items.filter(i => !i.dead);
}

// =====================================================================
//  AFFICHAGE
// =====================================================================

function drawBackground() {
  const img = IMG.bg;
  if (img) {
    // l'image est agrandie et dérive lentement (pas de raccord visible)
    const k = Math.max(W / img.width, H / img.height) * 1.25, dw = img.width * k, dh = img.height * k;
    const ox = (W - dw) / 2 * (1 + Math.sin(bgX * .011));
    const oy = (H - dh) / 2 * (1 + Math.sin(bgX * .007 + 1) * .9);
    ctx.drawImage(img, ox, oy, dw, dh);
  } else { ctx.fillStyle = '#231a3d'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(14,8,30,.42)'; ctx.fillRect(0, 0, W, H);
  // teinte maladive quand un boss approche
  if (state === 'play' && (phase === 'warn' || phase === 'boss')) {
    const a = (phase === 'warn' ? clamp((3.5 - phaseT) / 3.5, 0, 1) : 1) * (.14 + Math.sin(T * 1.5) * .05);
    ctx.fillStyle = `rgba(30,70,45,${a})`; ctx.fillRect(0, 0, W, H);
  }
  for (const s of stars) glow(s.x, s.y, s.s, '225,220,255', .55 * Math.min(1, s.v / 25));
}
function drawShip(x, y, alpha = 1, p = null) {
  if (p && p.beam) drawBeam(x + 16, y + 4.4);
  glow(x + .8, y + 4.6, 2.4 + Math.random() * .7, '120,255,210', .8 * alpha);   // réacteur arrière
  ctx.save(); ctx.globalAlpha = alpha;
  if (IMG.ship) ctx.drawImage(IMG.ship, x, y, 17, 8.3);
  ctx.restore();
  if (p && p.shield > 0) drawShield(x + 8.5, y + 4.2);
  if (p && hasCrew('ivar')) [y - 3.5, y + 10.5].forEach((ry, i) => drawRaven(x + 7, ry + Math.sin(T * 4 + i * 2) * .6));
}
// Bouclier : bulle d'aquarelle qui ondule autour du vaisseau
function drawShield(x, y) {
  glow(x, y, 13, '120,210,255', .18);
  ctx.save(); ctx.strokeStyle = '#bfe9ff'; ctx.fillStyle = 'rgba(140,210,255,.10)';
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * TAU, wob = 1 + Math.sin(a * 5 + T * 3 + pass) * .04;
      const px = x + Math.cos(a) * 11.5 * wob, py = y + Math.sin(a) * 7 * wob;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.globalAlpha = pass ? .25 : .55; ctx.lineWidth = pass ? 1.2 : .45;
    if (!pass) ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = .5; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x - 5, y - 4, 2.5, .8, -.3, 0, TAU); ctx.fill();
  ctx.restore();
}
// Laser : rayon rose qui ondule légèrement
function drawBeam(x, y) {
  glow(x, y, 4 + Math.random(), '255,140,210', .9);
  ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
  [[3.2, .25, '#ff6fc1'], [1.8, .45, '#ff9ad5'], [.7, .95, '#fff4fb']].forEach(([w, a, c], k) => {
    ctx.strokeStyle = c; ctx.globalAlpha = a; ctx.lineWidth = w + Math.random() * .3;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let px = x + 4; px <= LW + 4; px += 4) ctx.lineTo(px, y + Math.sin(px * .35 - T * 30 + k) * .35 * (k < 2 ? 1 : .3));
    ctx.stroke();
  });
  ctx.restore();
}
function drawEnemy(e) {
  const a = e.hit > 0 ? .55 : 1, j = e.hit > 0 ? .5 : 0;
  if (e.kind === 'ast' || e.kind === 'rock') { drawP(e.sp, e.x + j, e.y, { rot: e.rot, alpha: a }); return; }
  if (e.kind === 'fighter') {
    [-.35, 0, .35].forEach((o, i) => tentacle(e.x + 5.5, e.y + 2.6, o, 6, 1.3, T, e.t + i * 1.3, '#4f9a76', .9));
    drawP(SP.larve, e.x + j, e.y, { alpha: a });
    glow(e.x + 1.7, e.y + 2.4, 1.4, '230,245,120', .35);
  } else if (e.kind === 'diver') {
    [-.6, -.2, .2, .6].forEach((o, i) => tentacle(e.x + 4.8, e.y + 3, o, 5, .9, T, e.t + i, '#b85470', 1));
    drawP(SP.oeil, e.x + j, e.y, { alpha: a });
    drawEye(e.x + 3, e.y + 3, 2.2, 2.2, blinkOpen(T, e.t, 4), P ? P.x + 10 : 0, P ? P.y + 3 : H / 2, '#7fc4c8', false);
  }
}
function drawBoss(b) {
  const t = b.t, cx = b.x + b.w / 2, cy = b.y + b.h / 2, px = P.x + 10, py = P.y + 3;
  const br = 1 + Math.sin(t * 2) * .025, a = b.hit > 0 ? .7 : 1, j = b.hit > 0 ? .6 : 0;
  const k = b.def.sp;
  glow(cx, cy, b.w * .95, '140,220,170', .16 + Math.sin(t * 2) * .04);
  if (k === 'boss0') {
    for (let i = 0; i < 8; i++) {
      const ang = (-.75 + i / 7 * 1.5) * Math.PI;
      tentacle(cx + Math.cos(ang) * b.w * .38, cy + Math.sin(ang) * b.h * .38, ang, 13 + (i % 3) * 3, 3.2, t, i * 1.7, '#6a4a80', .9, true);
    }
    drawP(b.sp, b.x + j, b.y, { sx: br, sy: br, alpha: a });
    drawEye(cx - 2 + j, cy, 7.2, 5.2, blinkOpen(t, 0, 5), px, py, '#c9d84b', true);
  } else if (k === 'veilleur') {
    // Image peinte, découpée en bandes horizontales : le bas ondule comme des tentacules
    const img = IMG.boss;
    if (img) {
      const n = 32, sw = img.width / n, sy = 2 - br, dw = b.w * br, dh = b.h * sy, x0 = cx - dw / 2, y0 = cy - dh / 2;
      ctx.save(); ctx.globalAlpha = a;
      for (let i = 0; i < n; i++) {
        const f = i / n, wav = Math.sin(t * 2.4 - f * 6) * 2.2 * Math.max(0, f - .4);
        ctx.drawImage(img, i * sw, 0, sw + .6, img.height, x0 + f * dw + j, y0 + wav, dw / n + .1, dh);
      }
      ctx.restore();
    }
    for (const e of b.eyes) glow(b.x + e.x, b.y + e.y, e.r * 2, '255,170,60', .22 + .18 * Math.sin(t * 3 + e.ph));
  } else {
    for (let i = 0; i < 7; i++) {
      const ang = i / 7 * TAU + .3;
      tentacle(cx + Math.cos(ang) * b.w * .38, cy + Math.sin(ang) * b.h * .36, ang, 6 + (i % 3) * 2, 3.8, t * .7, i, '#56744a', .6);
    }
    drawP(b.sp, b.x + j, b.y, { sx: br, sy: 2 - br, alpha: a });
    for (const e of b.eyes) drawEye(b.x + e.x + j, b.y + e.y, e.r, e.r * .8, blinkOpen(t, e.ph, e.per), px, py, e.col, e.r > 1.8);
  }
}
function drawItem(it) {
  const x = it.x + 3, y = it.y + 3, d = ITEMS[it.type];
  glow(x, y, 5.5, d.rgb, .55 + Math.sin(T * 5) * .15);
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = .45; ctx.lineJoin = 'round';
  if (it.type === 'spread') {            // étoile : tir triple
    ctx.rotate(T * 1.5); ctx.strokeStyle = '#e4fff3'; ctx.beginPath();
    for (let i = 0; i <= 5; i++) { const a = i * 4 * Math.PI / 5 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 2.6, Math.sin(a) * 2.6); }
    ctx.stroke();
  } else if (it.type === 'shield') {     // bulle : bouclier
    ctx.strokeStyle = '#d9f2ff'; ctx.fillStyle = 'rgba(140,210,255,.25)';
    ctx.beginPath(); ctx.arc(0, 0, 2.6 + Math.sin(T * 4) * .15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(-1, -1.2, .9, .4, -.5, 0, TAU); ctx.fill();
  } else {                                // éclair : laser
    ctx.strokeStyle = '#ffe3f4'; ctx.beginPath();
    ctx.moveTo(.8, -2.8); ctx.lineTo(-1, .2); ctx.lineTo(.6, .2); ctx.lineTo(-.8, 2.8); ctx.stroke();
  }
  ctx.restore();
}

function drawHUD() {
  const gr = ctx.createLinearGradient(0, 0, 0, TOP + 2);
  gr.addColorStop(0, 'rgba(10,5,25,.75)'); gr.addColorStop(1, 'rgba(10,5,25,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, TOP + 2);
  for (let i = 0; i < Math.min(P.lives, 5); i++) if (IMG.ship) ctx.drawImage(IMG.ship, 2 + i * 7.5, 1.6, 6.2, 3);
  // bonus actifs (clignotent quand ils vont s'arrêter)
  // (sur une 2e ligne sous les vies, pour ne jamais chevaucher le nom du boss)
  let bx = 2.5;
  const tag = (label, col, tLeft) => { if (!(tLeft < 2 && !blink(4))) text(label, bx, 9.4, { size: 4.3, color: col, alpha: .9 }); bx += label.length * 2.1 + 3.5; };
  if (P.spread > 0) tag('✦ Triple ' + P.spread, '#c8f0dc', P.spread / 5);
  if (P.laser > 0) tag('Laser ' + P.laser.toFixed(1).replace('.', ',') + ' s', '#ffb3de', P.laser);
  if (P.shield > 0) tag('Bouclier', '#bfe9ff', 99);
  text(String(score).padStart(6, '0'), W - 2, 3.8, { align: 'right', size: 6 });
  if (boss) {
    text(boss.def.name, W / 2, 2.7, { align: 'center', size: 4.2, ...TITLE, color: '#d9c8ea' });
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(W / 2 - 25, 5.2, 50, 1.3);
    const g2 = ctx.createLinearGradient(W / 2 - 25, 0, W / 2 + 25, 0);
    g2.addColorStop(0, '#7ad08a'); g2.addColorStop(1, '#c24d8a');
    ctx.fillStyle = g2; ctx.fillRect(W / 2 - 25, 5.2, 50 * boss.hp / boss.max, 1.3);
  } else text(C.titre, W / 2, 3.8, { align: 'center', size: 5.5, alpha: .85 });
}

// Petit corbeau-drone d'Ivar
function drawRaven(x, y) {
  glow(x + 2.6, y + .4, 1.2, '255,150,80', .6);
  ctx.save(); ctx.fillStyle = '#1c1a22'; ctx.globalAlpha = .9; ctx.beginPath();
  ctx.moveTo(x + 3.4, y); ctx.lineTo(x + 1, y - .9 - Math.abs(Math.sin(T * 12)) * .9); ctx.lineTo(x - .6, y + .2);
  ctx.lineTo(x + 1, y + .9); ctx.closePath(); ctx.fill(); ctx.restore();
}
// Récompense d'une rencontre gagnée
function combatReward() {
  const d = C.diff;
  if (C.kind === 'final') return { credits: 0, score: 3000 };
  if (C.kind === 'elite') return { credits: 35 + d * 6, coque: 1, score: 300 };
  if (C.kind === 'voile') return { credits: 10 + d * 3, score: 100 };
  return { credits: 14 + d * 4, score: 100 };
}
// Fin de rencontre gagnée : le vaisseau garde son état, puis retour à la carte
function endCombat() {
  const r = C.reward || { credits: 0 };
  RUN.credits += r.credits || 0;
  RUN.lives = Math.min(5, P.lives + (r.coque || 0));
  RUN.spread = P.spread; RUN.laser = P.laser; RUN.shield = P.shield;
  RUN.score = score + (r.score || 0);
  boss = null; laserSound(false); droneOff();
  if (C.kind === 'final') { endRun(true); return; }
  RUN.pending = null; saveRun(); state = 'map';
}
