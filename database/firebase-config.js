/**
 * Configuration et initialisation Firebase Admin (Firestore).
 * Utilisé lorsque USE_FIREBASE=true dans .env
 */
let admin = null;
let db = null;

function initFirebase() {
    if (db) return db;

    try {
        admin = require('firebase-admin');

        if (admin.apps.length > 0) {
            db = admin.firestore();
            return db;
        }

        // Clé de compte de service : fichier ou JSON en variable d'environnement
        const credentials = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined;

        if (!credentials && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            throw new Error(
                'Firebase: définir FIREBASE_SERVICE_ACCOUNT (JSON string) ou GOOGLE_APPLICATION_CREDENTIALS (chemin fichier)'
            );
        }

        admin.initializeApp(
            credentials
                ? { credential: admin.credential.cert(credentials) }
                : { credential: admin.credential.applicationDefault() }
        );

        db = admin.firestore();
        console.log('✅ Connecté à Firestore (Firebase)');
        return db;
    } catch (err) {
        console.error('❌ Erreur d\'initialisation Firebase:', err.message);
        throw err;
    }
}

function getDb() {
    if (!db) initFirebase();
    return db;
}

module.exports = { initFirebase, getDb };
