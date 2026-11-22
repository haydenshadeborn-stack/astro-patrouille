# Roadmap — Astro Patrouille

## À faire

### 1. Prologue : la fuite de la planète

**But :** accrocher le joueur au scénario et l'attacher à la protagoniste (Kaimana) avant d'arriver sur la carte.

**Déroulé voulu :**

1. **Le jeu commence par un niveau en vaisseau.** Pendant ce niveau, des dialogues font comprendre que la protagoniste fuit sa planète, en train d'être engloutie.
2. **Objectif donné au joueur : aller chercher le père de Kaimana** avant de fuir la planète. Elle n'y parvient pas.
3. **Après ce premier niveau, différents dialogues** font la transition.
4. **Arrivée sur la carte de la galaxie**, là où le jeu commence actuellement.

**Décidé :**

- **À la radio : le père de Kaimana et deux amis.** Les dialogues du niveau sont leur discussion.
- **La radio des deux amis se coupe.** On ne sait pas s'ils ont survécu : le suspense est gardé.
- **Fin du niveau : un boss auquel on ne peut pas faire de dégâts.** Le père insiste à la radio pour que Kaimana quitte la planète tant qu'elle le peut. Jamais de phrase du type « tu ne peux pas le blesser », qui couperait l'immersion.
- **Les tirs sont absorbés par le boss** : ils s'y dissolvent comme de l'encre dans l'eau, sans éclat ni son d'impact, et le boss n'a pas de barre de vie. L'image fait comprendre qu'il faut fuir, sans le dire.
- **La fuite est un geste du joueur** : le père insiste, et c'est le joueur qui choisit de faire demi-tour vers le ciel. S'il s'obstine, le boss finit par détruire sa coque et le scénario continue quand même.
- **Le geste de fuite** : maintenir la touche **haut** pendant environ 2 secondes, vers le ciel, en écho aux dernières paroles du père. Le vaisseau résiste d'abord, puis se retourne, et la voix du père faiblit à mesure qu'on s'éloigne. Relâcher avant la fin ramène face au boss : le joueur peut hésiter.
- **Réplique du père** qui donne l'indication sans couper l'immersion : *« Regarde le ciel, Kaimana. Pas moi. Le ciel. »*
- **Le prologue peut être passé une fois vu.**
- **L'échec fait partie de l'histoire.** Le joueur ne parviendra pas à sauver les proches de Kaimana. L'échec au prologue mène seulement à la suite du scénario : ce n'est jamais une vraie défaite de la partie.
- **Le vaisseau est puissant pendant le prologue**, pour montrer au joueur la puissance qu'il peut obtenir. L'échec justifie en partie sa perte de puissance ensuite.

**Tâches :**

- [ ] Écrire la discussion radio et les dialogues qui suivent le niveau
- [ ] Afficher des dialogues **pendant** le vol, sans arrêter l'action (aujourd'hui, ils n'existent que dans le panneau parchemin, hors combat : `js/scenes.js`)
- [ ] Créer la rencontre « prologue » (`js/combat.js`), lancée par un nouveau voyage, avec un vaisseau au maximum de sa puissance
- [ ] Perdre toute sa coque pendant le prologue mène à la suite du scénario, sans effacer le voyage
- [ ] Boss insensible aux dégâts : tirs et laser absorbés (effet d'encre), pas de barre de vie
- [ ] Geste de fuite du joueur : touche haut maintenue environ 2 secondes (au doigt : glisser vers le haut et maintenir)
- [ ] Le prologue se joue toujours à l'horizontale : en vertical, « haut » mènerait vers le boss
- [ ] Voix du père qui faiblit pendant la fuite
- [ ] Dernier échange avec le père pendant le boss : il presse Kaimana de partir, de plus en plus fort
- [ ] Coupure radio des deux amis (son et affichage)
- [ ] Mettre en scène la perte de puissance avant l'arrivée sur la carte
- [ ] Réécrire ou intégrer la scène « Le départ » (`INTRO` dans `data/evenements.js`)
- [ ] Sauvegarder l'avancée dans le prologue
- [ ] Retenir que le prologue a été vu, et proposer de le passer au voyage suivant
- [ ] **Images :** la planète engloutie (décor)
- [ ] **Images :** les portraits du père et des deux amis
- [ ] **Images :** le boss du prologue, s'il est différent de ceux qui existent

**À décider :**

- [ ] Nom et caractère du père et des deux amis

## Mis de côté

- **Animation du vaisseau** : par le code (inclinaison, flottement, traînée d'encre, recul, dégâts), puis planches de sprites (flamme du réacteur, explosion, éclair au canon).

## Publication

- **GitHub** sert pour le moment à stocker les informations et à tester le gameplay : les fichiers de scénario peuvent y être poussés.
- **Vraie plateforme (itch.io, par exemple)** : ne pas y pousser les fichiers de scénario, dont cette roadmap.
