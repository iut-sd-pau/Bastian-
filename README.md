# Color Party — site d'invitation

Site statique (HTML/CSS/JS pur) pour l'invitation à l'anniversaire thème
*color party*. L'anniversaireux gère tout depuis son propre lien : il ajoute
ou retire des invités et des couleurs d'équipe, le site attribue
automatiquement une couleur équilibrée à chaque nouvel invité, et il n'y a
**qu'un seul lien** à envoyer à tout le monde — chacun s'identifie avec son
prénom en l'ouvrant.

## 0. Étape obligatoire : connecter une base de données (5 min, gratuit)

Ce site attribue les groupes **en direct** et garde tout **synchronisé**
entre l'anniversaireux et les invités (sur des téléphones différents). Ça
nécessite une base de données partagée gratuite : Firebase Realtime Database.

1. Va sur [console.firebase.google.com](https://console.firebase.google.com),
   "Ajouter un projet" (nom libre, ex: `color-party`).
2. Dans le projet → icône `</>` "Ajouter une application Web" → Firebase
   affiche un objet `firebaseConfig` : copie ses valeurs.
3. Colle-les dans **`js/firebase-config.js`**, à la place des `"REMPLACE_MOI"`.
4. Menu de gauche → "Realtime Database" → "Créer une base de données" →
   démarrer **"en mode test"**.
5. Héberge le dossier (voir section 6) ou ouvre-le en local pour tester.

Tant que ce n'est pas fait, `host.html` affiche un écran expliquant ces
étapes, et `index.html` affiche un message "site pas encore connecté".

**Note sécurité :** en mode test, la base est accessible en lecture *et
écriture* à qui connaît l'URL du projet Firebase (pas affichée aux invités,
seulement présente dans le code source). Cohérent avec le reste du site
(prénom = ticket d'accès, pas de vrais comptes) — largement suffisant pour un
anniversaire entre proches. Pour verrouiller davantage, il faudrait ajouter
l'authentification Firebase (possible sur demande, hors périmètre ici).

## 1. Le lien de l'anniversaireux

```
host.html?c=hote-2026
```

(Le code `hote-2026` est modifiable dans `js/data.js` → `HOST_CODE`. Garde-le
secret, ne le donne qu'à la personne fêtée.)

Depuis cette page, l'anniversaireux peut :

- **Copier le lien général** à envoyer à tout le monde (voir section 2).
- **Remplir les infos de la soirée** (prénom, date, heure, lieu, dress
  code...) — visibles par tous dès qu'il clique "Enregistrer".
- **Ajouter des couleurs d'équipe** si le nombre d'invités grandit (nom +
  teinte au choix). Une couleur ne peut être retirée que si plus personne n'y
  est actuellement.
- **Ajouter un invité** en tapant son prénom : couleur attribuée
  automatiquement (la moins remplie du moment), lien recalculé aussitôt.
- **Retirer un invité** (bouton ✕).
- **Importer d'un coup** les 21 premiers invités listés dans `js/data.js` →
  `INITIAL_GUESTS` (ignore les doublons si relancé).
- **Voir qui boit ou non** : chaque nom affiche 🍸 ou 🙅 une fois que
  l'invité a répondu, plus un résumé chiffré au-dessus de la liste.

Il n'apparaît jamais dans aucune équipe : c'est sa fête.

## 2. Le lien des invités — un seul lien pour tout le monde

```
index.html
```

C'est **le même lien pour tous** : plus besoin d'en envoyer un par personne.
En l'ouvrant, chaque invité :

1. Tape son prénom (suggestions automatiques parmi les invités déjà ajoutés
   par l'organisateur — s'il n'y est pas encore, il doit lui demander de
   l'ajouter).
2. Voit directement (pas de roue, pas de jeu) sa couleur d'équipe, ses
   coéquipiers, et peut afficher la composition des autres équipes.
3. Répond en un clic à "tu bois de l'alcool ?" (Oui/Non, modifiable à tout
   moment) — ça remonte aussitôt dans l'espace organisateur.

Le navigateur retient l'identité choisie (via le stockage local du
téléphone) : au prochain passage sur le lien, pas besoin de retaper son
prénom. Un bouton "Ce n'est pas moi, changer" permet d'en choisir un autre si
besoin (appareil partagé, erreur de sélection...).

**Limite à connaître :** l'identification se fait par prénom exact, sans mot
de passe — cohérent avec un site entre amis, mais ça veut dire qu'en théorie
n'importe qui pourrait taper le prénom de quelqu'un d'autre pour voir/changer
sa réponse alcool. Si deux invités ont exactement le même prénom, demande à
l'organisateur d'ajouter une initiale (ex: "Michel D.") pour les distinguer.

## 3. Modifier la liste de départ

`js/data.js` → `INITIAL_GUESTS` contient les 21 noms fournis au départ (la
liste envoyée mentionnait "22 invités" mais 21 tombaient pile juste sur 7
couleurs — si un·e 22e existe bien, ajoute-le/la depuis `host.html` comme
n'importe quel autre invité, pas besoin de toucher au code).

`js/data.js` → `INITIAL_COLORS` contient les 7 couleurs de départ ; ce n'est
qu'un point de départ importé une seule fois dans Firebase — les
modifications ultérieures se font depuis `host.html`, pas dans ce fichier.

## 4. Comment l'équilibrage fonctionne

À chaque ajout, le site regarde combien de personnes sont déjà dans chaque
couleur existante et place le nouvel arrivant dans celle qui en a le moins
(au hasard s'il y a égalité) — y compris les couleurs ajoutées en cours de
route. Les invités déjà attribués ne bougent jamais, pour ne pas changer la
couleur de quelqu'un après coup. En retirant des gens, les groupes peuvent
devenir légèrement inégaux ; comme chaque nouvel ajout comble toujours le
groupe le plus vide, ça se rééquilibre naturellement au fil du temps.

## 5. Ce que voit l'anniversaireux côté alcool

Chaque invité qui répond apparaît avec 🍸 (boit) ou 🙅 (ne boit pas) à côté de
son nom dans les groupes, et un résumé chiffré ("🍸 14 · 🙅 5 · ❓ 2 pas encore
répondu") s'affiche au-dessus de la liste des invités.

## 6. Héberger le site pour que tout le monde y accède

Le dossier est statique : héberge-le n'importe où et envoie le lien complet
(avec le nom de domaine). Options gratuites :

- **Netlify Drop** ([app.netlify.com/drop](https://app.netlify.com/drop)) :
  glisser-déposer le dossier, aucun compte requis pour un essai rapide.
- **GitHub Pages** : dépôt Git + activer "Pages" dans les réglages.

Une fois en ligne (ex: `https://tonsite.netlify.app/`), les liens deviennent :
```
https://tonsite.netlify.app/host.html?c=hote-2026   → anniversaireux
https://tonsite.netlify.app/                          → tous les invités
```

Tu peux aussi ouvrir `index.html` ou `host.html` en local pour tester avant
la mise en ligne.

## Structure du dossier

```
color-party/
├── index.html            → page invité : identification + équipe + alcool
├── host.html              → espace organisateur (couleurs, invités, infos)
├── css/style.css          → design (thème lounge/groove adulte)
├── js/data.js              → couleurs de départ, code organisateur, liste de départ
├── js/firebase-config.js   → ★ à remplir : config du projet Firebase
├── js/store.js             → toute la logique Firebase (couleurs, invités, event)
├── js/common.js            → fonctions partagées (liens, ambiance visuelle...)
├── js/app.js                → logique de la page invité
└── js/host.js                → logique de l'espace organisateur
```
