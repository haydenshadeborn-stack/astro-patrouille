# Astro Patrouille

Petit shoot'em up rétro façon écran LCD de vieux téléphone, jouable dans le navigateur.

**Jouer :** https://haydenshadeborn-stack.github.io/astro-patrouille/

## Contrôles
- Flèches / ZQSD : bouger
- Espace : tirer
- P : pause — M : son
- Mobile : glisser le doigt (tir automatique)

Tout le jeu tient dans `index.html` (HTML5 + JavaScript, sans dépendance).

## Comment se joue un voyage

On part d'une étoile à gauche de la carte et il faut atteindre l'**Étoile-objectif** à droite, en sautant d'étoile en étoile. Chaque étoile cache un **combat**, un **événement à choix**, un **dialogue**, un **comptoir** (boutique) ou une **présence ancienne** (boss). À chaque saut, **le Voile** avance depuis la gauche : une étoile qu'il a engloutie ne propose plus qu'un combat difficile. **Mort définitive** : le voyage est sauvegardé dans le navigateur (on peut fermer l'onglet et reprendre), mais une défaite l'efface.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | La page, le panneau « parchemin » des scènes |
| `js/moteur.js` | Écran, pinceaux aquarelle, détourage des images, sons |
| `js/combat.js` | Les combats (ennemis, boss, bonus, équipage en combat) |
| `js/carte.js` | La carte de la galaxie, les sauts et le Voile |
| `js/scenes.js` | Événements, dialogues et comptoir |
| `js/main.js` | Titre, sauvegarde du voyage, fins, tableau des scores, commandes |
| `data/evenements.js` | **Tous les textes** : équipage, événements, dialogues |

### Écrire un événement

Ouvre `data/evenements.js` et copie un bloc de la liste `EVENEMENTS`. Le mode d'emploi des effets est en haut du fichier. Exemple :

```js
{
  id: 'balise', titre: 'Une balise qui clignote', portrait: 'kaimana',
  texte: `Une balise émet un signal régulier, puis s'arrête quand on s'approche.`,
  choix: [
    { texte: 'L’ouvrir', alea: [
      { chance: .6, texte: 'Elle contient des munitions.', effets: { triple: 30 } },
      { chance: .4, texte: 'Elle explose !', effets: { coque: -1 } } ] },
    { equipage: 'ivar', texte: '[Ivar] La faire inspecter par les corbeaux', resultat:
      { texte: 'Les corbeaux la désamorcent.', effets: { credits: 25 } } },
    { texte: 'L’ignorer', resultat: { texte: 'Le signal reprend derrière vous.' } },
  ],
},
```

## Crédits

**Images** : décor, vaisseau, boss « Le Veilleur des Abysses » et portraits de l'équipage fournis par l'auteur du jeu.

**Sons et musiques** (tous sous licence [CC0](https://creativecommons.org/publicdomain/zero/1.0/), domaine public — crédit non obligatoire, mais mérité) :

| Fichier | Usage | Source |
|---|---|---|
| `tir.mp3`, `tir-triple.mp3`, `tir-ennemi.mp3`, `bonus.mp3`, `bouclier.mp3` | Bruitages | [63 Digital sound effects](https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc) — Kenney ([kenney.nl](https://kenney.nl)) |
| `laser.m4a` | Rayon laser | [Laser Beam](https://opengameart.org/content/laser-beam) — frosty ham |
| `boss-arrivee.m4a` | Annonce du boss | [Sinister Boss Appears!](https://opengameart.org/content/sinister-boss-appears) — cynicmusic ([cynicmusic.com](http://cynicmusic.com)) |
| `boss-ambiance.m4a` | Musique pendant les boss | [Menacing Otherworld](https://opengameart.org/content/menacing-otherworld) — Ruskerdax |

Polices : [Caveat](https://fonts.google.com/specimen/Caveat) et [IM Fell English SC](https://fonts.google.com/specimen/IM+Fell+English+SC) (Google Fonts, licence OFL).
