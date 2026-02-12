/**
 * Expose la config client Firebase depuis les variables d'environnement.
 * Réponse vide si la config n'est pas définie (pas de clés en dur côté client).
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const apiKey = process.env.FIREBASE_API_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
        return res.status(204).end();
    }

    const config = {
        apiKey,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || projectId + '.firebaseapp.com',
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || projectId + '.firebasestorage.app',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    };

    res.json(config);
});

module.exports = router;
