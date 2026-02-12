# Configuration Firebase (Firestore)

Le projet peut utiliser **Firestore** au lieu de SQLite en définissant `USE_FIREBASE=true` dans `.env`.

## 1. Activer Firebase

Dans votre fichier `.env` :

```env
USE_FIREBASE=true
JWT_SECRET=votre_secret
```

## 2. Credentials Firebase

Choisir **une** des options :

### Option A : Fichier de clé (développement local)

1. Console Firebase → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée.
2. Enregistrer le fichier JSON (ex. `serviceAccountKey.json`) en dehors du dépôt.
3. Dans `.env` :
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=C:\chemin\vers\serviceAccountKey.json
   ```

### Option B : Variable d’environnement (Cloud Run / hébergement)

Mettre le **contenu JSON** du fichier de clé dans une seule variable (tout sur une ligne) :

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

## 3. Firestore

- Les collections sont créées à la volée : `users`, `articles`, `homepage_config`, `counters`.
- Un utilisateur **superadmin** par défaut est créé au premier démarrage : `admin` / `admin123` (à changer en production).

## 4. Index Firestore (si erreur d’index)

Si une requête renvoie une erreur du type “index required”, ouvrir le lien fourni dans l’erreur pour créer l’index dans la console Firebase, ou créer manuellement les index composites suivants :

- **articles** : `category` (Ascending), `created_at` (Descending)
- **articles** : `published` (Ascending), `created_at` (Descending)
- **articles** : `live` (Ascending), `published` (Ascending), `created_at` (Descending)
- **articles** : `published` (Ascending), `on_homepage` (Ascending), `created_at` (Descending)
- **homepage_config** : `section` (Ascending), `enabled` (Ascending), `position` (Ascending)

## 5. Déploiement

- **Backend (API)** : déployer le Node (Express) sur **Cloud Run**, **App Engine** ou un VPS, avec les variables d’environnement ci‑dessus.
- **Frontend (site statique)** : déployer le dossier du site (HTML/JS/CSS) sur **Firebase Hosting** avec `firebase deploy --only hosting` (voir `firebase.json`).

Sans `USE_FIREBASE`, l’application continue d’utiliser SQLite comme avant.

---

## Config client (Analytics, pas de clés en dur)

La config Firebase du **navigateur** (Analytics) est servie par l'API pour éviter de la mettre en dur dans le front.

- **Endpoint** : `GET /api/firebase-config`
- **Réponse** : JSON avec `apiKey`, `authDomain`, `projectId`, etc. (204 si non configuré).
- **Variables d'environnement** (optionnel) dans `.env` :
  - `FIREBASE_API_KEY`
  - `FIREBASE_AUTH_DOMAIN` (défaut : `{projectId}.firebaseapp.com`)
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_STORAGE_BUCKET` (défaut : `{projectId}.firebasestorage.app`)
  - `FIREBASE_MESSAGING_SENDER_ID`
  - `FIREBASE_APP_ID`
  - `FIREBASE_MEASUREMENT_ID`

Si au moins `FIREBASE_API_KEY` et `FIREBASE_PROJECT_ID` sont définis, le front initialise Firebase (Analytics) en récupérant la config via cet endpoint.
