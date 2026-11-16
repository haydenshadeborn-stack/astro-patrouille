'use strict';
// =====================================================================
//  SCÈNES : dialogues, événements à choix, comptoir (boutique)
//  Affichées dans un panneau HTML « parchemin » par-dessus le jeu.
// =====================================================================
const sceneBox = document.getElementById('scene');
const $ = sel => sceneBox.querySelector(sel);

// portrait : un personnage ; portrait2 : un second (conversations) ; actif : celui qui parle
function showScene({ portrait, portrait2, actif, titre, texte, html, boutons, extra = '' }) {
  state = 'scene';
  for (const k in keys) keys[k] = false;
  const setImg = (img, id) => {
    if (id) { if (!img.src.endsWith('/' + id + '.jpg')) img.src = 'assets/equipage/' + id + '.jpg'; img.alt = EQUIPAGE[id] ? EQUIPAGE[id].nom : ''; img.hidden = false; }
    else img.hidden = true;
    img.classList.toggle('muet', !!actif && id !== actif);
  };
  setImg($('.portrait'), portrait); setImg($('.portrait2'), portrait2);
  sceneBox.classList.toggle('duo', !!portrait2);
  $('h2').textContent = titre;
  $('.texte').innerHTML = html || '';
  if (!html) for (const para of String(texte).split('\n')) { const p = document.createElement('p'); p.textContent = para; $('.texte').append(p); }
  $('.extra').innerHTML = extra;
  const zone = $('.choix'); zone.innerHTML = '';
  boutons.forEach((b, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.disabled = !!b.disabled;
    el.innerHTML = `<span class="num">${i + 1}</span> ${b.label}`;
    el.addEventListener('click', () => { if (!el.disabled) { play('tir', .15, .15); b.onClick(); } });
    zone.append(el);
  });
  $('.ressources').textContent = `Coque ${RUN.lives}/5  ·  ${RUN.credits} crédits  ·  Triple ${RUN.spread}  ·  Laser ${RUN.laser.toFixed(1).replace('.', ',')} s  ·  ${RUN.shield ? 'Bouclier actif' : 'Pas de bouclier'}`;
  sceneBox.hidden = false;
  setTimeout(() => { const f = zone.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true }); }, 30);
}
function closeScene() { sceneBox.hidden = true; }
// Termine une scène : retour à la carte (ou combat si l'événement en lance un)
function sceneDone(next) {
  closeScene();
  if (RUN.lives <= 0) { endRun(false); return; }
  if (next && next.combat) { const d = 1 + Math.floor(curNode().c / 2); setPending({ combat: next.combat, diff: d }); return; }
  RUN.pending = null; saveRun(); state = 'map';
}

// ---------- effets ----------
function applyEffects(e = {}) {
  const out = [];
  if (e.credits) { RUN.credits = Math.max(0, RUN.credits + e.credits); out.push((e.credits > 0 ? '+' : '') + e.credits + ' crédits'); }
  if (e.coque) { const v = clamp(RUN.lives + e.coque, 0, 5); if (v !== RUN.lives) out.push((e.coque > 0 ? '+' : '') + e.coque + ' coque'); RUN.lives = v; }
  if (e.triple) { RUN.spread = Math.min(99, RUN.spread + e.triple); out.push('+' + e.triple + ' salves de tir triple'); }
  if (e.laser) { RUN.laser = Math.min(15, RUN.laser + e.laser); out.push('+' + e.laser + ' s de laser'); }
  if (e.bouclier) { if (!RUN.shield) out.push('Bouclier activé'); RUN.shield = 1; }
  if (e.score) { RUN.score += e.score; out.push('+' + e.score + ' points'); }
  if (e.voile) { RUN.voile += e.voile; out.push(e.voile > 0 ? 'Le Voile se rapproche' : 'Le Voile recule'); }
  if (e.recrue) {
    if (RUN.crew.includes(e.recrue)) { RUN.credits += 30; out.push('+30 crédits'); }
    else { RUN.crew.push(e.recrue); out.push(EQUIPAGE[e.recrue].nom + ' rejoint l’équipage — ' + EQUIPAGE[e.recrue].capacite); }
  }
  return out;
}
const effetsHTML = list => list.length ? '<ul class="effets">' + list.map(t => `<li>${t}</li>`).join('') + '</ul>' : '';

// ---------- départ ----------
function runIntro() {
  showScene({ ...INTRO, boutons: [{ label: 'En route', onClick: () => sceneDone() }],
    extra: `<p class="note">${EQUIPAGE.kaimana.capacite}</p>` });
}

// ---------- événement à choix ----------
function runEvent(eventId) {
  let ev = EVENEMENTS.find(e => e.id === eventId);
  if (!ev) {
    const dispo = EVENEMENTS.filter(e => !RUN.usedEvents.includes(e.id) && !(e.recrue && RUN.crew.includes(e.recrue)));
    ev = pick(dispo.length ? dispo : EVENEMENTS.filter(e => !e.recrue));
    RUN.usedEvents.push(ev.id); RUN.pending = { scene: 'event', eventId: ev.id }; saveRun();
  }
  const boutons = ev.choix.filter(ch => !ch.equipage || RUN.crew.includes(ch.equipage)).map(ch => ({
    label: ch.texte + (ch.cout ? ` <em>(${ch.cout} crédits)</em>` : ''),
    disabled: ch.cout && RUN.credits < ch.cout,
    onClick: () => {
      let issue = ch.resultat;
      if (ch.alea) { let r = Math.random(); issue = ch.alea.find(a => (r -= a.chance) < 0) || ch.alea[ch.alea.length - 1]; }
      const eff = issue.effets || {};
      const res = applyEffects(eff);
      showScene({ portrait: ev.portrait, titre: ev.titre, texte: issue.texte, extra: effetsHTML(res),
        boutons: [{ label: eff.combat ? 'Au combat !' : 'Continuer', onClick: () => sceneDone(eff.combat ? { combat: eff.combat } : null) }] });
    },
  }));
  showScene({ portrait: ev.portrait, titre: ev.titre, texte: ev.texte, boutons });
}

// ---------- dialogue de bord ----------
// Kaimana parle avec un équipier tiré au hasard parmi ceux à bord ; sans équipier, elle parle seule.
function chooseDialogue() {
  const idx = (f) => DIALOGUES.map((d, i) => i).filter(i => f(DIALOGUES[i]));
  const neuf = l => l.filter(i => !RUN.usedDialogues.includes(i));
  const equipiers = RUN.crew.filter(id => id !== 'kaimana');
  if (equipiers.length) {
    // un équipier au hasard, de préférence avec une conversation pas encore entendue
    for (const id of [...equipiers].sort(() => Math.random() - .5)) { const l = neuf(idx(d => d.avec === id)); if (l.length) return pick(l); }
    const toutes = idx(d => equipiers.includes(d.avec)); if (toutes.length) return pick(toutes);
  }
  const mono = idx(d => !d.avec); return pick(neuf(mono).length ? neuf(mono) : mono);
}
const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function runDialogue(idx) {
  if (idx == null) { idx = chooseDialogue(); RUN.usedDialogues.push(idx); RUN.pending = { scene: 'dialogue', dlg: idx }; saveRun(); }
  const d = DIALOGUES[idx], duo = d.avec || null;
  let n = 1;   // nombre de répliques affichées
  const render = (extra = '') => {
    const lignes = d.lignes.slice(0, n), qui = lignes[lignes.length - 1][0];
    const html = lignes.map(([id, t], i) => `<p class="ligne${i === n - 1 ? ' neuve' : ''}"><b class="qui q-${id}">${EQUIPAGE[id].nom}</b> ${esc(t)}</p>`).join('');
    const fini = n >= d.lignes.length;
    showScene({ portrait: 'kaimana', portrait2: duo, actif: duo ? qui : null, titre: d.titre, html, extra,
      boutons: [{ label: 'Continuer', onClick: () => {
        if (!fini) { n++; render(); return; }
        if (!extra) { const res = applyEffects(d.effets); if (res.length) { render(effetsHTML(res)); return; } }
        sceneDone();
      } }] });
  };
  render();
}

// ---------- comptoir ----------
function runShop() {
  const yaga = RUN.crew.includes('yaga'), rabais = yaga ? .75 : 1;
  const prix = p => Math.round(p * rabais);
  const offres = [
    { label: 'Réparer la coque (+1)', p: 30, ok: () => RUN.lives < 5, fx: { coque: 1 } },
    { label: '40 salves de tir triple', p: 25, ok: () => RUN.spread < 99, fx: { triple: 40 } },
    { label: '5 secondes de laser', p: 35, ok: () => RUN.laser < 15, fx: { laser: 5 } },
    { label: 'Bouclier', p: 30, ok: () => !RUN.shield, fx: { bouclier: 1 } },
  ];
  if (!yaga) offres.push({ label: 'Convaincre Mère Yaga de monter à bord', p: 80, ok: () => true, fx: { recrue: 'yaga' } });
  const render = (msg = '') => showScene({
    portrait: 'yaga',
    titre: yaga ? 'Un comptoir dérivant' : 'Le comptoir de Mère Yaga',
    texte: yaga ? `Mère Yaga renifle les étagères. « Je connais le patron. Il me doit des services. On va lui faire un prix. »`
                : `Une cabine-atelier sur pattes mécaniques s'accroche à votre coque. Une vieille femme aux lunettes de soudeuse vous dévisage.
« Tout se vend, tout s'achète, gamine. Même moi, si tu y mets le prix. »`,
    extra: msg,
    boutons: [
      ...offres.map(o => ({ label: `${o.label} <em>— ${prix(o.p)} crédits</em>`, disabled: !o.ok() || RUN.credits < prix(o.p),
        onClick: () => { RUN.credits -= prix(o.p); const res = applyEffects(o.fx); play('bonus', .4); saveRun();
          if (o.fx.recrue) { runShop(); return; } render(effetsHTML(res)); } })),
      { label: 'Reprendre la route', onClick: () => sceneDone() },
    ],
  });
  render();
}
