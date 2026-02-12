const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Vérifier les variables d'environnement critiques
if (!process.env.JWT_SECRET) {
    console.error('❌ ERREUR: JWT_SECRET n\'est pas défini dans .env');
    console.error('⚠️  Créez un fichier .env avec JWT_SECRET=<votre_secret_securise>');
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname)));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/homepage', require('./routes/homepage'));
app.use('/api/workflow', require('./routes/workflow'));
app.use('/api/firebase-config', require('./routes/firebase-config'));

// Route pour servir l'index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Une erreur est survenue' 
            : err.message
    });
});

// Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrer le serveur
const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur AMBILATRES démarré sur le port ${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
    console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur fermé proprement');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur fermé proprement');
        process.exit(0);
    });
});
