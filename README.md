# Color Party — site d'invitation

Site statique (HTML/CSS/JS pur) pour l'invitation à l'anniversaire thème
*color party*. L'anniversaireux gère tout depuis son propre lien : il ajoute
ou retire des invités, le site leur attribue automatiquement une couleur
d'équipe de façon équilibrée, et met à jour les infos de la soirée — tout ça
se synchronise en direct chez les invités.

## 0. Étape obligatoire : connecter une base de données (5 min, gratuit)

Contrairement à une simple invitation figée, ce site attribue les groupes
**en direct** et garde tout **synchronisé** entre l'anniversaireux et les
invités (sur des téléphones différents). Ça nécessite une base de données
partagée gratuite : Firebase Realtime Database.

1. Va sur [console.firebase.google.com](https://console.firebase.google.com),
   "Ajouter un projet" (nom libre, ex: `color-party`).
2. Dans le projet → icône `</>` "Ajouter une application Web" → Firebase
   affiche un objet `firebaseConfig` : copie ses valeurs.
3. Colle-les dans **`js/firebase-config.js`**, à la place des `"REMPLACE_MOI"`.
4. Menu de gauche → "Realtime Database" → "Créer une base de données" →
   démarrer **"en mode test"**.
5. Héberge le dossier (voir section 5) ou ouvre-le en local.

Tant que ce n'est pas fait, `host.html` affiche un écran expliquant ces
étapes, et `index.html` affiche un message "site pas encore connecté" pour
les invités — rien de cassé, juste bloqué en attendant cette étape.

**Note sécurité :** en mode test, la base est accessible en lecture *et
écriture* à qui a l'URL du projet, ce qui reste caché dans le code du site
(pas affiché aux invités). Cohérent avec le niveau de sécurité du reste du
site (liens = tickets, pas de vrais comptes) — largement suffisant pour un
anniversaire entre proches. Pour verrouiller davantage, il faudrait ajouter
l'authentification Firebase (hors périmètre ici, possible sur demande).

## 1. Le lien de l'anniversaireux — il prend les rênes

```
host.html?c=hote-2026
```

(Le code `hote-2026` est modifiable dans `js/data.js` → `HOST_CODE`. Garde-le
secret, ne le donne qu'à la personne fêtée.)

Depuis cette page, l'anniversaireux peut :

- **Remplir les infos de la soirée** (prénom, date, heure, lieu, dress code,
  message RSVP...) — visibles par tous les invités dès qu'il clique
  "Enregistrer".
- **Ajouter un invité** en tapant juste son prénom : le site lui attribue
  automatiquement la couleur d'équipe la moins remplie (répartition
  équilibrée à chaque ajout), lui génère un lien personnel, et l'affiche
  aussitôt dans la bonne équipe.
- **Retirer un invité** (bouton ✕ à côté de son nom).
- **Importer d'un coup** les 21 premiers invités listés dans `js/data.js` →
  `INITIAL_GUESTS`, via le bouton dédié (pratique pour démarrer vite ;
  n'ajoute pas les doublons si relancé).
- **Copier le lien personnel** de chaque invité dans le tableau du bas, pour
  l'envoyer par message privé.

Il n'apparaît jamais dans aucune équipe : c'est sa fête.

## 2. Le lien des invités

Chaque invité reçoit un lien du type :

```
index.html?c=roy-102
```

En l'ouvrant, il voit directement (pas de roue, pas de jeu à faire tourner) :

- La carte d'invitation avec les infos remplies par l'anniversaireux et son
  prénom affiché ("l'anniversaire de [Prénom]").
- Sa couleur d'équipe et la liste de ses coéquipiers.
- Un bouton optionnel pour voir la composition de toutes les équipes.

Si le code du lien n'existe pas encore côté organisateur (invité pas encore
ajouté, ou lien mal recopié), un message clair l'indique — sans donner
d'autre information.

## 3. Modifier la liste de départ

`js/data.js` → `INITIAL_GUESTS` contient les 21 noms fournis au départ. La
liste envoyée mentionnait "22 invités" mais ne comptait que 21 noms — 21
tombe pile juste (3 par couleur sur 7 couleurs). S'il y a bien un·e 22e
invité·e, pas besoin de toucher au code : ajoute-le/la directement depuis
`host.html`, comme n'importe quel autre invité — le site rééquilibrera tout
seul.

## 4. Comment l'équilibrage fonctionne

À chaque ajout, le site regarde combien de personnes sont déjà dans chacune
des 7 équipes et place le nouvel arrivant dans celle qui en a le moins (au
hasard s'il y a égalité). Les invités déjà attribués ne bougent jamais — pour
ne pas changer la couleur de quelqu'un après qu'on la lui ait annoncée. En
retirant des gens, les groupes peuvent devenir légèrement inégaux ; comme
chaque nouvel ajout comble toujours le groupe le plus vide, ça se
rééquilibre naturellement au fil des ajouts/retraits.

## 5. Héberger le site pour que tout le monde y accède

Le dossier est statique : héberge-le n'importe où et envoie les liens
complets (avec le nom de domaine). Options gratuites :

- **Netlify Drop** ([app.netlify.com/drop](https://app.netlify.com/drop)) :
  glisser-déposer le dossier, aucun compte requis pour un essai rapide.
- **GitHub Pages** : dépôt Git + activer "Pages" dans les réglages.

Une fois en ligne (ex: `https://tonsite.netlify.app/`), les liens deviennent :
```
https://tonsite.netlify.app/host.html?c=hote-2026
https://tonsite.netlify.app/index.html?c=roy-102
```

Tu peux aussi ouvrir `index.html` ou `host.html` en local pour tester avant
la mise en ligne (le `?c=...` fonctionne pareil).

## Structure du dossier

```
color-party/
├── index.html            → page invité (invitation + équipe, en direct)
├── host.html              → espace organisateur (gestion invités + infos)
├── css/style.css          → design (thème lounge/groove adulte)
├── js/data.js              → couleurs, code organisateur, liste de départ
├── js/firebase-config.js   → ★ à remplir : config du projet Firebase
├── js/store.js             → toute la logique Firebase (invités, groupes, event)
├── js/common.js            → fonctions partagées (liens, ambiance visuelle...)
├── js/app.js                → logique de la page invité
└── js/host.js                → logique de l'espace organisateur
```
