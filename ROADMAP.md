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
- **Le geste de fuite** : maintenir la touche **haut** pendant environ 2 secondes, vers le ciel, en écho aux dernières paroles du père. Le vaisseau résiste d'abord, puis se retourne, et la voix du père faiblit à mesure qu'on s'éloigne. Relâcher avant la fin ramène face au boss : le joueur peut hésiter. Le geste ne compte **qu'après la réplique du père**, et seulement si **le vaisseau est déjà le plus haut possible sur l'écran**.
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
- [ ] Geste de fuite du joueur : touche haut maintenue environ 2 secondes (au doigt : glisser vers le haut et maintenir), comptée seulement après la réplique du père et une fois le vaisseau en haut de l'écran
- [ ] Le prologue se joue toujours à l'horizontale : en vertical, « haut » mènerait vers le boss
- [ ] Voix du père qui faiblit pendant la fuite
- [ ] Dernier échange avec le père pendant le boss : il presse Kaimana de partir, de plus en plus fort
- [ ] Coupure radio des deux amis (son et affichage)
- [ ] Mettre en scène la perte de puissance avant l'arrivée sur la carte
- [ ] Réécrire ou intégrer la scène « Le départ » (`INTRO` dans `data/evenements.js`)
- [ ] Sauvegarder l'avancée dans le prologue
- [ ] Retenir que le prologue a été vu, et proposer de le passer au voyage suivant
- [x] **Images :** la planète engloutie, avant et après (`assets/fond-prologue-avant.jpg`, `assets/fond-prologue-apres.jpg`)
- [ ] Passer d'un décor à l'autre en fondu pendant le niveau, en gardant le ciel toujours visible en haut
- [x] **Images :** les portraits du père et des deux amis (`assets/equipage/keoni.jpg`, `leilani.jpg`, `oisin.jpg`)
- [ ] **Images :** le boss du prologue, s'il est différent de ceux qui existent

**Personnages du prologue :**

#### Keoni : le père

- **Lien :** il a construit le vaisseau de Kaimana. Son propre père (le grand-père que Kaimana cite déjà dans le jeu) est parti un jour lire les étoiles et n'est jamais revenu. Depuis, Keoni refuse de lever les yeux.
- **Caractère :** bourru, pudique. Il parle du vaisseau quand il veut parler d'elle.
- **Apparence :** près de 70 ans, mains de charpentier, cheveux blancs attachés, tablier taché d'huile. Une étoile gravée sur un vieux pendentif retourné contre sa peau.
- **À la radio :** phrases courtes, souvent techniques. *« Ménage le réacteur gauche, il chauffe. Et ne traîne pas. »*
- **Dernières paroles :** *« Regarde le ciel, Kaimana. Pas moi. Le ciel. »* Venant de l'homme qui a toujours refusé de le regarder, c'est sa façon de la laisser partir.

#### Leilani : l'amie d'enfance

- **Lien :** elles ont appris à piloter ensemble, et rivalisent depuis toujours.
- **Caractère :** moqueuse, généreuse, incapable d'abandonner quelqu'un.
- **Apparence :** la quarantaine, cheveux courts décolorés par le soleil, veste de pilote trop grande, une cicatrice au menton.
- **Pendant la fuite :** elle pilote une navette remplie d'habitants.
- **À la radio :** elle plaisante pour ne pas trembler. *« La dernière en orbite paie à boire. »*
- **Coupure :** *« J'ai trente-deux personnes à bord et un moteur sur deux. Kaimana, je vois le ciel, je v… »*

#### Oisin : la voix de la tour

- **Lien :** ami de longue date, opérateur radio et musicien. Il guide les vols de Kaimana depuis toujours.
- **Inspiration :** Oisín, le héros irlandais parti dans un autre monde, qui revient en découvrant que des siècles ont passé.
- **Caractère :** rêveur et calme, il fredonne quand il a peur.
- **Apparence :** grand, roux, barbe courte, un casque radio bricolé et une petite harpe à cordes de cuivre près de sa console.
- **À la radio :** *« Ici la tour. Il pleut de l'encre, mais la fréquence est belle. »*
- **Coupure :** la tour n'a plus assez d'énergie pour deux canaux. Il sacrifie le sien : *« Je garde la ligne ouverte pour ton père. Moi, je vais me taire un peu. »* Puis il fredonne, et le son s'éteint.

**Pistes (à confirmer) :**

- Ordre des coupures : Leilani d'abord, par surprise, puis Oisin, par choix. Il ne reste que la voix du père, face au boss.
- Retour possible des amis pendant le voyage : la navette de Leilani au détour d'une étoile, Oisin vieilli parce que le temps n'a pas passé de la même façon pour lui.
- La chanson d'Oisin pourrait ressembler à l'événement « Un chant dans le vide ».

## Mis de côté

- **Animation du vaisseau** : par le code (inclinaison, flottement, traînée d'encre, recul, dégâts), puis planches de sprites (flamme du réacteur, explosion, éclair au canon).

## Publication

- **GitHub** sert pour le moment à stocker les informations et à tester le gameplay : les fichiers de scénario peuvent y être poussés.
- **Vraie plateforme (itch.io, par exemple)** : ne pas y pousser les fichiers de scénario, dont cette roadmap.
