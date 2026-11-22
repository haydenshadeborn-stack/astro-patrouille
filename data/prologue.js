'use strict';
// =====================================================================
//  TEXTES DU PROLOGUE : la fuite de la planète
//  Pas encore chargé par le jeu (le niveau reste à créer).
//
//  Une réplique = ['qui', 'texte']. qui = kaimana, keoni, leilani, oisin,
//  ou 'radio' pour un bruit décrit (grésillement, silence, fredonnement).
//  En vol, les répliques sont courtes : on les lit en jouant.
//  Règle : ne jamais dire au joueur que le boss ne peut pas être blessé.
// =====================================================================

const PROCHES = {
  keoni:   { nom: 'Keoni',   role: 'Père de Kaimana',   portrait: 'keoni' },
  leilani: { nom: 'Leilani', role: 'Pilote de navette', portrait: 'leilani' },
  oisin:   { nom: 'Oisin',   role: 'Voix de la tour',   portrait: 'oisin' },
};

const PROLOGUE = {
  // ---------- pendant le vol : la radio, dans l'ordre ----------
  radio: [
    { id: 'decollage', quand: 'au début du niveau', lignes: [
      ['oisin',   `Ici la tour. Il pleut de l'encre, mais la fréquence est belle.`],
      ['oisin',   `Kaimana, tu es la première en l'air. Je te vois.`],
      ['leilani', `Évidemment. Elle a le vaisseau de son père. Moi, j'ai une bassine avec des ailes.`],
      ['kaimana', `Leilani, combien de personnes à bord ?`],
      ['leilani', `Trente-deux. Dont un gamin qui veut piloter.`],
      ['kaimana', `Décolle. Je vais chercher mon père et je vous rejoins là-haut.`],
      ['leilani', `La dernière en orbite paie à boire.`] ] },

    { id: 'objectif', quand: 'juste après : le but du niveau', lignes: [
      ['kaimana', `Papa ? J'arrive. Attends-moi sur le quai.`],
      ['keoni',   `Il n'y a plus de quai.`],
      ['kaimana', `Alors je me pose sur le toit de l'atelier.`],
      ['keoni',   `Hm. Tu vas me casser les tuiles.`],
      ['keoni',   `Ménage le réacteur gauche, il chauffe. Et ne traîne pas.`] ] },

    { id: 'puissance', quand: 'première grosse vague : le vaisseau montre sa force', lignes: [
      ['oisin',   `Devant toi, ça grouille. Ce ne sont pas des oiseaux.`],
      ['keoni',   `Ouvre tout. Je ne l'ai pas construit pour qu'il reste au port.`],
      ['kaimana', `Papa… qu'est-ce que tu as mis là-dedans ?`],
      ['keoni',   `Douze ans.`] ] },

    { id: 'leilani', quand: 'le décor commence à noircir ; la radio se coupe sans prévenir', lignes: [
      ['leilani', `On est en l'air ! De justesse, mais en l'air.`],
      ['kaimana', `Monte. Ne regarde pas en bas.`],
      ['leilani', `Trop tard. Kai… le lagon est noir. Tout le lagon.`],
      ['leilani', `J'ai trente-deux personnes à bord et un moteur sur deux.`],
      ['leilani', `Kaimana, je vois le ciel, je v…`],
      ['radio',   `— plus rien —`],
      ['kaimana', `Leilani ?`],
      ['kaimana', `Oisin, dis-moi que tu l'as sur tes écrans.`],
      ['oisin',   `Je ne l'entends plus. C'est tout ce que je sais. Je ne l'entends plus.`] ] },

    { id: 'oisin', quand: 'plus tard ; il choisit de couper son propre canal', lignes: [
      ['oisin',   `L'encre est dans l'escalier. La tour ne tient plus deux canaux.`],
      ['kaimana', `Garde le tien et sors de là.`],
      ['oisin',   `Je garde la ligne ouverte pour ton père. Moi, je vais me taire un peu.`],
      ['kaimana', `Oisin, non.`],
      ['oisin',   `Si un jour tu entends une chanson, quelque part… c'est que je cherche la fréquence.`],
      ['radio',   `— il fredonne, et le son s'éteint —`] ] },

    { id: 'approche', quand: 'fin des vagues, avant le boss', lignes: [
      ['kaimana', `Papa, je vois l'atelier. Je vois ta lumière.`],
      ['keoni',   `Je l'ai laissée allumée. Comme quand tu rentrais tard.`],
      ['kaimana', `Trente secondes.`],
      ['keoni',   `Kaimana. Derrière l'île. La mer se lève.`] ] },
  ],

  // ---------- le boss : la Marée Pâle ----------
  boss: {
    arrivee: [
      ['kaimana', `Qu'est-ce que c'est ?`],
      ['keoni',   `Je ne sais pas. Ça ne regarde personne.`],
      ['kaimana', `C'est entre toi et moi.`],
      ['keoni',   `Oui.`] ],

    // Le père presse Kaimana de partir, de plus en plus fort
    insistance: [
      [ ['keoni',   `Fais demi-tour tant que le passage est ouvert.`],
        ['kaimana', `Pas sans toi.`] ],
      [ ['keoni',   `Le passage se referme, ma fille. Pars. Maintenant.`],
        ['kaimana', `Je contourne. Tiens bon.`] ],
      [ ['keoni',   `J'ai construit ce vaisseau pour qu'il parte. Pas pour qu'il revienne.`],
        ['kaimana', `Grand-père non plus n'est jamais revenu !`],
        ['keoni',   `Je sais. Trente ans que je refuse de lever les yeux.`] ],
      [ ['keoni',   `Ce soir, je regarde. Il est beau, ton ciel.`],
        ['kaimana', `Papa…`] ],
    ],

    // Après cette réplique, le geste de fuite compte (haut maintenu, vaisseau en haut de l'écran)
    replique: ['keoni', `Regarde le ciel, Kaimana. Pas moi. Le ciel.`],

    // Le joueur ne fuit pas : le père reprend, toutes les quelques secondes
    attente: [
      ['keoni', `Va.`],
      ['keoni', `Pars tant que tu le peux.`],
      ['keoni', `S'il te plaît, Kaimana.`] ],

    // Le joueur commence à fuir, puis relâche
    hesitation: [
      [ ['kaimana', `Je ne peux pas.`], ['keoni', `Si. Tu sais le faire depuis toujours.`] ],
      [ ['kaimana', `Encore une seconde.`], ['keoni', `Il n'y en a plus.`] ],
    ],

    // Fin A : le joueur fuit. La voix faiblit (texte de plus en plus pâle et brouillé)
    fuite: [
      ['keoni',   `C'est ça.`],
      ['keoni',   `Doucement sur le réacteur gauche.`],
      ['keoni',   `Je te vois monter.`],
      ['keoni',   `Je te v…`],
      ['radio',   `— plus rien —`] ],

    // Fin B : la coque est détruite. Keoni prend les commandes à distance
    // (si « replique » n'a pas encore été dite, la jouer juste avant « Il m'écoute encore »)
    detruit: [
      ['kaimana', `Plus de commandes ! Papa, je n'ai plus rien !`],
      ['keoni',   `Ce vaisseau, c'est moi qui l'ai construit. Il m'écoute encore.`],
      ['kaimana', `Qu'est-ce que tu fais ? Rends-moi les commandes !`],
      ['keoni',   `Non.`],
      ['keoni',   `Je te vois monter. Je te v…`],
      ['radio',   `— plus rien —`] ],
  },

  // ---------- après le niveau : trois scènes sur le panneau parchemin ----------
  apres: [
    { titre: 'En orbite', portrait: 'kaimana', lignes: [
      ['kaimana', `Tour, ici Kaimana. Répondez.`],
      ['radio',   `— un grésillement —`],
      ['kaimana', `Navette de Leilani. N'importe qui.`],
      ['radio',   `— un grésillement —`],
      ['kaimana', `Papa ?`],
      ['kaimana', `En bas, il reste une lumière. Une seule.`],
      ['kaimana', `… Plus maintenant.`] ] },

    { titre: 'Douze ans', portrait: 'kaimana', lignes: [
      ['kaimana', `Réacteur gauche : mort. Il m'avait prévenue.`],
      ['kaimana', `Le laser, le bouclier, les canons latéraux… l'encre a tout rongé.`],
      ['kaimana', `Il y avait mis douze ans. J'ai tout brûlé en une heure.`],
      ['kaimana', `Sous la console, il a gravé quelque chose. Je ne l'avais jamais vu.`],
      ['kaimana', `« Pour qu'elle parte. »`],
      ['kaimana', `Je te réparerai, vaisseau. Pièce par pièce.`] ] },

    { titre: 'La carte de grand-père', portrait: 'kaimana', lignes: [
      ['kaimana', `Des bâtonnets, des coquillages. Les étoiles de grand-père.`],
      ['kaimana', `Il cherchait celle-là, tout à l'est. Celle que le Voile n'a jamais touchée.`],
      ['kaimana', `S'ils sont en vie, c'est là qu'ils iront. On s'était toujours dit : à l'est.`],
      ['kaimana', `Le Voile avance derrière moi. Chaque saut lui laisse le temps de me rattraper.`],
      ['kaimana', `Alors il faudra bien choisir ma route.`] ] },
  ],
};
