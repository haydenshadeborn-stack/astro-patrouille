'use strict';
// =====================================================================
//  TEXTES DU JEU : équipage, événements à choix, dialogues
//  Ce fichier peut être modifié sans toucher au reste du code.
//
//  EFFETS possibles (dans « effets ») :
//    credits: 20 / -10        coque: 1 / -1          triple: 40 (salves)
//    laser: 5 (secondes)      bouclier: 1            score: 100
//    voile: 0.5 (le Voile avance d'une demi-colonne ; négatif = il recule)
//    recrue: 'ivar'           (rejoint l'équipage ; s'il est déjà à bord → +30 crédits)
//    combat: 'combat' | 'elite'   (lance un combat après le texte)
//
//  Un CHOIX peut avoir :
//    equipage: 'ren'   → visible seulement si ce membre est à bord
//    cout: 20          → coûte des crédits (grisé si pas assez)
//    resultat: { texte, effets }              → issue certaine
//    alea: [{ chance: .7, texte, effets }, …] → issues au hasard (les chances s'additionnent à 1)
// =====================================================================

const EQUIPAGE = {
  kaimana: { nom: 'Kaimana',       role: 'Navigatrice',     portrait: 'kaimana',
             capacite: 'Lecture des étoiles : on voit ce qui attend sur les étoiles voisines.' },
  ren:     { nom: 'Ren',           role: 'Onmyōji des sceaux', portrait: 'ren',
             capacite: 'Sceau de papier : fige le boss 3 secondes quand il faiblit.' },
  ivar:    { nom: 'Ivar',          role: 'Vigie',           portrait: 'ivar',
             capacite: 'Pensée et Mémoire : deux corbeaux-drones tirent avec toi.' },
  yaga:    { nom: 'Mère Yaga',     role: 'Mécanicienne',    portrait: 'yaga',
             capacite: 'Pacte de sorcière : -25 % sur tous les prix en boutique.' },
  nefer:   { nom: 'Nefer-Sekha',   role: 'Canonnière',      portrait: 'nefer',
             capacite: 'Colère solaire : +50 % de dégâts contre les boss.' },
};

// Texte de départ (première étoile)
const INTRO = {
  portrait: 'kaimana', titre: 'Le départ',
  texte: `Les cartes anciennes parlent d'une étoile, tout à l'est du secteur, que le Voile n'a jamais touchée.
Derrière nous, il avance déjà : une encre noire qui avale les étoiles une à une.
Nous irons d'étoile en étoile. Choisis bien notre route : chaque saut lui laisse le temps de nous rattraper.`,
};

const EVENEMENTS = [
  {
    id: 'epave', titre: 'Une épave à la dérive', portrait: 'kaimana',
    texte: `Une coque éventrée tourne lentement sur elle-même. Ses soutes semblent intactes… ou presque.`,
    choix: [
      { texte: 'Fouiller l’épave', alea: [
        { chance: .7, texte: 'Les soutes sont pleines : crédits et munitions récupérés.', effets: { credits: 25, triple: 20 } },
        { chance: .3, texte: 'Un piège ! Une charge explose contre la coque.', effets: { coque: -1, credits: 10 } } ] },
      { equipage: 'ivar', texte: '[Ivar] Envoyer les corbeaux en éclaireurs', resultat:
        { texte: 'Les corbeaux désamorcent le piège et rapportent tout ce qui brille.', effets: { credits: 30, laser: 3 } } },
      { texte: 'Passer son chemin', resultat: { texte: 'Mieux vaut ne pas réveiller les morts.' } },
    ],
  },
  {
    id: 'debris', titre: 'Le champ de débris', portrait: 'kaimana',
    texte: `Un champ de roches et de métal barre la route. Le passage est étroit, et les débris bougent.`,
    choix: [
      { texte: '[Kaimana] Lire la houle des étoiles', resultat:
        { texte: 'Kaimana sent le courant des débris et trouve une passe sûre. Au passage, une capsule de ravitaillement.', effets: { credits: 15, score: 100 } } },
      { texte: 'Foncer à travers', alea: [
        { chance: .5, texte: 'Le vaisseau passe de justesse.', effets: { score: 50 } },
        { chance: .5, texte: 'Un rocher racle la coque.', effets: { coque: -1 } } ] },
    ],
  },
  {
    id: 'chant', titre: 'Un chant dans le vide', portrait: 'kaimana',
    texte: `Les haut-parleurs grésillent. Une voix douce, sans source, chante une berceuse dans une langue qui n'existe pas.`,
    choix: [
      { texte: 'Écouter', alea: [
        { chance: .5, texte: 'Un étrange apaisement. Les fissures de la coque se referment toutes seules.', effets: { coque: 1 } },
        { chance: .5, texte: 'La berceuse attire quelque chose. Le Voile se rapproche.', effets: { voile: .6 } } ] },
      { equipage: 'ren', texte: '[Ren] Sceller le chant', resultat:
        { texte: 'Ren colle un talisman sur la console. Le chant se tait, et le papier se met à briller comme un bouclier.', effets: { bouclier: 1, score: 150 } } },
      { texte: 'Couper les haut-parleurs', resultat: { texte: 'Le silence revient. Personne n’en parle.' } },
    ],
  },
  {
    id: 'marchand', titre: 'Le marchand silencieux', portrait: 'kaimana',
    texte: `Un vaisseau sans lumière s'aligne sur le vôtre. Sur son écran, un seul mot : « ÉCHANGE ». On vous propose une batterie de laser… contre un morceau de votre coque.`,
    choix: [
      { texte: 'Accepter (−1 coque, +8 s de laser)', resultat: { texte: 'Des bras mécaniques découpent une plaque de blindage et déposent la batterie.', effets: { coque: -1, laser: 8 } } },
      { texte: 'Payer en crédits', cout: 30, resultat: { texte: 'Le marchand accepte les crédits, sans un mot.', effets: { credits: -30, laser: 6 } } },
      { texte: 'Refuser', resultat: { texte: 'Le vaisseau s’éteint et disparaît.' } },
    ],
  },
  {
    id: 'nid', titre: 'Le nid de larves', portrait: 'kaimana',
    texte: `Un astéroïde grouille de larves verdâtres. Elles ne vous ont pas encore remarqués.`,
    choix: [
      { texte: 'Attaquer le nid', resultat: { texte: 'Le nid se réveille !', effets: { combat: 'combat', credits: 15 } } },
      { equipage: 'nefer', texte: '[Nefer-Sekha] Bombarder de loin', resultat:
        { texte: 'Un seul tir de son canon, et le nid n’est plus qu’une flaque d’encre.', effets: { credits: 25, score: 200 } } },
      { texte: 'Contourner discrètement', resultat: { texte: 'Le détour prend du temps. Le Voile gagne du terrain.', effets: { voile: .3 } } },
    ],
  },
  {
    id: 'miroir', titre: 'La nébuleuse-miroir', portrait: 'kaimana',
    texte: `Dans cette nébuleuse, votre reflet flotte à côté du vaisseau. Il ne bouge pas tout à fait comme vous.`,
    choix: [
      { texte: 'Fixer le reflet', alea: [
        { chance: .4, texte: 'Le reflet sourit et vous tend quelque chose avant de se dissoudre.', effets: { coque: 1, credits: 40 } },
        { chance: .6, texte: 'Le reflet ouvre une bouche bien trop grande…', effets: { combat: 'elite' } } ] },
      { texte: 'Détourner les yeux et fuir', resultat: { texte: 'Vous ne vous retournez pas.' } },
    ],
  },
  {
    id: 'temple', titre: 'Le temple flottant', portrait: 'kaimana',
    texte: `Un temple de pierre dérive dans le vide, couvert de glyphes qui changent quand on ne les regarde pas.`,
    choix: [
      { texte: 'Prier', alea: [
        { chance: .6, texte: 'Une chaleur bienveillante enveloppe le vaisseau.', effets: { bouclier: 1 } },
        { chance: .4, texte: 'Quelque chose a répondu à la prière. Ce n’était pas un dieu.', effets: { coque: -1, score: 100 } } ] },
      { texte: 'Piller les offrandes', resultat: { texte: 'Les coffres sont pleins… et le Voile semble vous avoir remarqués.', effets: { credits: 45, voile: .5 } } },
      { texte: 'Repartir', resultat: { texte: 'Certains lieux sont faits pour rester seuls.' } },
    ],
  },
  // ---- recrues ----
  {
    id: 'vigie', titre: 'La station de guet', portrait: 'ivar', recrue: 'ivar',
    texte: `Une vieille station de guet, presque éteinte. Un homme à la barbe grise vous observe à travers une lentille bleue. Deux corbeaux de métal tournent la tête en même temps que lui.
« Mes corbeaux ont vu votre vaisseau trois sauts avant que vous arriviez. Le Voile aussi. »`,
    choix: [
      { texte: 'L’inviter à bord', resultat: { texte: '« Enfin quelqu’un qui va dans le bon sens. » Ivar rejoint l’équipage.', effets: { recrue: 'ivar' } } },
      { texte: 'Lui laisser des vivres', resultat: { texte: 'Il hoche la tête. Ses corbeaux vous suivent un moment, puis font demi-tour.', effets: { score: 100 } } },
    ],
  },
  {
    id: 'sanctuaire', titre: 'Le sanctuaire de papier', portrait: 'ren', recrue: 'ren',
    texte: `Un sanctuaire flotte, entouré de milliers de bandes de papier calligraphié. Au centre, un jeune homme en robe blanche et indigo s'incline.
« Je scelle ce qui sort du Voile depuis des années. Mes sceaux ne suffiront plus. Les vôtres, peut-être, si nous les unissons. »`,
    choix: [
      { texte: 'Accepter son aide', resultat: { texte: 'Ren rassemble ses talismans et monte à bord.', effets: { recrue: 'ren' } } },
      { texte: 'Prendre seulement un talisman', resultat: { texte: 'Il vous tend un talisman protecteur, sans rancune.', effets: { bouclier: 1 } } },
    ],
  },
  {
    id: 'capsule', titre: 'La capsule de survie', portrait: 'nefer', recrue: 'nefer',
    texte: `Une capsule de survie dorée, frappée d'un scarabée. À l'intérieur, une femme aux yeux d'ambre serre un canon énorme contre elle.
« Mon vaisseau a été avalé. Je n'ai plus de navire. J'ai encore de la colère. »`,
    choix: [
      { texte: 'L’accueillir à bord', resultat: { texte: 'Nefer-Sekha installe son canon dans la soute. Personne n’ose lui dire qu’il est trop grand.', effets: { recrue: 'nefer' } } },
      { texte: 'Récupérer seulement ses munitions', resultat: { texte: 'Elle vous lance une caisse avec mépris.', effets: { triple: 40 } } },
    ],
  },
];

// =====================================================================
//  DIALOGUES DE BORD
//  Kaimana (l'héroïne) parle avec un équipier tiré au hasard parmi ceux
//  qui sont à bord. Sans équipier, c'est un monologue de Kaimana.
//    avec: null      → monologue de Kaimana
//    avec: 'ivar'    → conversation Kaimana ↔ Ivar (seulement s'il est à bord)
//    lignes: [ ['qui', 'réplique'], … ]   (qui = kaimana, ivar, ren, yaga, nefer)
//    effets: petit bonus à la fin (facultatif)
// =====================================================================
const DIALOGUES = [
  // ---- monologues de Kaimana ----
  { avec: null, titre: 'Sous les étoiles', effets: { score: 50 }, lignes: [
    ['kaimana', `Mon grand-père disait qu'on ne se perd jamais tant qu'on sait d'où vient la houle.`],
    ['kaimana', `Ici, la houle vient de derrière nous. Et elle a faim.`],
    ['kaimana', `Alors on avance. Une étoile après l'autre.`] ] },
  { avec: null, titre: 'Le carnet de bord', effets: { credits: 10 }, lignes: [
    ['kaimana', `Journal de bord. Le vaisseau tient. Moi aussi, à peu près.`],
    ['kaimana', `Les étoiles devant nous sont plus calmes. Pour l'instant.`],
    ['kaimana', `Si quelqu'un lit ce carnet un jour… gardez le cap à l'est.`] ] },
  { avec: null, titre: 'Le silence', effets: { bouclier: 1 }, lignes: [
    ['kaimana', `Il n'y a personne à qui parler, alors je parle au vaisseau.`],
    ['kaimana', `Il répond à sa façon : un cliquetis, un souffle dans les conduits.`],
    ['kaimana', `Tiens bon, mon vieux. On n'a pas fini notre traversée.`] ] },

  // ---- Ivar ----
  { avec: 'ivar', titre: 'Pensée et Mémoire', effets: { score: 80 }, lignes: [
    ['kaimana', `Tes corbeaux ne dorment jamais ?`],
    ['ivar', `Pensée revient toujours la première. Mémoire, elle, traîne.`],
    ['ivar', `Elle regarde trop longtemps ce qu'on laisse derrière nous.`],
    ['kaimana', `Alors on a un point commun, elle et moi.`],
    ['ivar', `Hm. Ne lui dis pas. Elle deviendrait insupportable.`] ] },
  { avec: 'ivar', titre: 'La lentille bleue', effets: { laser: 2 }, lignes: [
    ['kaimana', `Qu'est-ce que tu vois, avec cet œil-là ?`],
    ['ivar', `Ce qui bouge derrière les étoiles. Ce que le Voile pousse devant lui.`],
    ['kaimana', `Et en ce moment ?`],
    ['ivar', `Rien de bon. Mais rien de plus rapide que nous. Continue.`] ] },

  // ---- Ren ----
  { avec: 'ren', titre: 'Les talismans', effets: { bouclier: 1 }, lignes: [
    ['kaimana', `Tu écris encore. Tu ne t'arrêtes jamais ?`],
    ['ren', `Chaque sceau porte un nom. Si on oublie le nom, le sceau se brise.`],
    ['ren', `Alors je les écris tous, chaque soir.`],
    ['kaimana', `Chez moi, on chantait les noms des étoiles pour ne pas les oublier.`],
    ['ren', `Alors vous aussi, vous scellez quelque chose. Vous scellez la route.`] ] },
  { avec: 'ren', titre: 'La politesse', effets: { score: 80 }, lignes: [
    ['ren', `Capitaine, permettez-moi une question.`],
    ['kaimana', `Ren, ça fait trois sauts que je te dis de m'appeler Kaimana.`],
    ['ren', `… Kaimana. Avez-vous peur ?`],
    ['kaimana', `Tout le temps. C'est pour ça que je regarde les étoiles, et pas derrière nous.`] ] },

  // ---- Mère Yaga ----
  { avec: 'yaga', titre: 'L’atelier', effets: { coque: 1 }, lignes: [
    ['yaga', `Ta coque tient avec de la ficelle et des prières, gamine.`],
    ['kaimana', `Gamine ? J'ai quarante-trois ans.`],
    ['yaga', `Et moi, j'en ai trois cents. Tiens ta clé et tais-toi.`],
    ['yaga', `Voilà. Elle tiendra. Les prières, c'est toi qui les fournis.`] ] },
  { avec: 'yaga', titre: 'Les pattes de poule', effets: { credits: 20 }, lignes: [
    ['kaimana', `Pourquoi ton atelier a des pattes de poule ?`],
    ['yaga', `Parce qu'une maison qui ne peut pas s'enfuir est une maison morte.`],
    ['kaimana', `… C'est la chose la plus sage que j'aie entendue depuis le départ.`],
    ['yaga', `Ne t'y habitue pas. Et paye-moi pour le conseil.`] ] },

  // ---- Nefer-Sekha ----
  { avec: 'nefer', titre: 'La canonnière', effets: { triple: 20 }, lignes: [
    ['nefer', `Les gros mollusques ont un point faible. Entre les yeux.`],
    ['kaimana', `Ils en ont beaucoup, des yeux.`],
    ['nefer', `Justement. Je ne manque jamais.`] ] },
  { avec: 'nefer', titre: 'La colère', effets: { score: 80 }, lignes: [
    ['kaimana', `Tu n'as pas dormi. Tu penses à ton vaisseau ?`],
    ['nefer', `Je pense à ceux qui étaient dedans. La colère me tient éveillée.`],
    ['kaimana', `Garde-la. Mais garde aussi un peu de place pour autre chose.`],
    ['nefer', `… Pour quoi ?`],
    ['kaimana', `Pour l'arrivée. On va l'atteindre, cette étoile.`] ] },
];

const VICTOIRE = {
  portrait: 'kaimana', titre: 'L’Étoile-objectif',
  texte: `La lumière de l'étoile est chaude, réelle. Derrière vous, le Voile s'arrête net, comme une marée qui touche un mur.
« On l'a fait. On a trouvé une étoile qu'il ne peut pas avaler. »`,
};
