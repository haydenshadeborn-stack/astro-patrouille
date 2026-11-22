# Roadmap — Astro Patrouille

## À faire

### 1. Prologue : la fuite de la planète

**But :** accrocher le joueur au scénario et l'attacher à la protagoniste (Kaimana) avant d'arriver sur la carte.

**Déroulé voulu :**

1. **Le jeu commence par un niveau en vaisseau.** Pendant ce niveau, des dialogues font comprendre que la protagoniste fuit sa planète, en train d'être engloutie.
2. **Elle tente de récupérer ses proches, sans y parvenir**, avant de fuir la planète.
3. **Après ce premier niveau, différents dialogues** font la transition.
4. **Arrivée sur la carte de la galaxie**, là où le jeu commence actuellement.

**Décidé :**

- **L'échec fait partie de l'histoire.** Le joueur ne parviendra pas à sauver les proches de Kaimana. L'échec au prologue mène seulement à la suite du scénario : ce n'est jamais une vraie défaite de la partie.
- **Le vaisseau est puissant pendant le prologue**, pour montrer au joueur la puissance qu'il peut obtenir. L'échec justifie en partie sa perte de puissance ensuite.

**Pistes (à confirmer) :**

- Les dialogues du niveau seraient une **discussion radio avec des amis et/ou de la famille** de Kaimana.
- Le niveau se terminerait par un **boss auquel on ne peut pas faire de dégâts**.

**Tâches :**

- [ ] Écrire la discussion radio et les dialogues qui suivent le niveau
- [ ] Afficher des dialogues **pendant** le vol, sans arrêter l'action (aujourd'hui, ils n'existent que dans le panneau parchemin, hors combat : `js/scenes.js`)
- [ ] Créer la rencontre « prologue » (`js/combat.js`), lancée par un nouveau voyage, avec un vaisseau au maximum de sa puissance
- [ ] Perdre toute sa coque pendant le prologue mène à la suite du scénario, sans effacer le voyage
- [ ] Boss insensible aux dégâts, si la piste est retenue
- [ ] Mettre en scène la perte de puissance avant l'arrivée sur la carte
- [ ] Réécrire ou intégrer la scène « Le départ » (`INTRO` dans `data/evenements.js`)
- [ ] Sauvegarder l'avancée dans le prologue
- [ ] **Images :** la planète engloutie (décor)
- [ ] **Images :** les portraits des proches de Kaimana
- [ ] **Images :** le boss du prologue, s'il est différent de ceux qui existent

**À décider :**

- [ ] Qui sont les proches de Kaimana, et combien ?
- [ ] Comment le joueur comprend-il qu'il faut fuir le boss plutôt que le battre ?
- [ ] Le prologue se rejoue-t-il à chaque nouveau voyage, ou peut-on le passer une fois vu ? (avec la mort définitive, il reviendrait souvent)

## Mis de côté

- **Animation du vaisseau** : par le code (inclinaison, flottement, traînée d'encre, recul, dégâts), puis planches de sprites (flamme du réacteur, explosion, éclair au canon).

## Publication

- **GitHub** sert pour le moment à stocker les informations et à tester le gameplay : les fichiers de scénario peuvent y être poussés.
- **Vraie plateforme (itch.io, par exemple)** : ne pas y pousser les fichiers de scénario, dont cette roadmap.
