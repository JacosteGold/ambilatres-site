/**
 * Point d'entrée du layer données.
 * USE_FIREBASE=true dans .env → Firestore (Firebase).
 * Sinon → SQLite (comportement actuel).
 */
const USE_FIREBASE = process.env.USE_FIREBASE === 'true' || process.env.USE_FIREBASE === '1';

let repo;

if (USE_FIREBASE) {
    const { initFirebase } = require('./firebase-config');
    initFirebase();
    repo = require('./repository-firebase');
    repo.ensureSuperAdmin().catch((err) => console.error('ensureSuperAdmin:', err));
} else {
    require('./db'); // initialise SQLite
    repo = require('./repository-sqlite');
}

module.exports = repo;
