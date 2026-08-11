/* ============================================================
   CONFIG FIREBASE — REQUISE pour ce site.
   ============================================================
   Ce site attribue les groupes en direct et synchronise tout entre
   l'anniversaireux et les invités : ça nécessite une base de données
   partagée. C'est gratuit et prend 5 minutes.

     1. https://console.firebase.google.com → "Ajouter un projet"
     2. Dans le projet → icône </> "Ajouter une application Web"
     3. Copie l'objet firebaseConfig affiché, colle ses valeurs ci-dessous
     4. Menu de gauche → "Realtime Database" → "Créer une base de données"
        → démarrer "en mode test" (règles ouvertes, suffisant pour un
        site d'anniversaire entre amis — voir la note sécurité du README)

   Tant que ce n'est pas rempli, l'espace organisateur affiche un
   message bloquant expliquant qu'il faut faire cette étape : sans
   base de données partagée, impossible d'ajouter des invités qui se
   synchronisent chez eux.
   ============================================================ */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB8Y3NLh5QZX3jMbFsxa-rQPQgENSHvkq0",
  authDomain: "bastianparty-61689.firebaseapp.com",
  databaseURL: "https://bastianparty-61689-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bastianparty-61689",
};
