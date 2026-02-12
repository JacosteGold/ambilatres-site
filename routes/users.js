const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const repo = require('../database');
const { sanitizeText } = require('../utils/sanitize');

const router = express.Router();

router.use(authenticate);

// Lister tous les utilisateurs (admin et superadmin uniquement)
router.get('/', requireRole('admin', 'superadmin'), async (req, res) => {
    try {
        const users = await repo.getUsers();
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Obtenir un utilisateur par ID
router.get('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
    try {
        const user = await repo.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }
        delete user.password;
        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un nouvel utilisateur (admin et superadmin uniquement)
router.post('/', requireRole('admin', 'superadmin'), [
    body('username').notEmpty().withMessage('Le nom d\'utilisateur est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('role').isIn(['editor', 'admin', 'superadmin']).withMessage('Rôle invalide')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role } = req.body;

        const sanitizedUsername = sanitizeText(username);
        const sanitizedEmail = email.toLowerCase().trim();

        const existingUser = await repo.findUserByUsernameOrEmail(sanitizedUsername, sanitizedEmail);
        if (existingUser) {
            return res.status(400).json({ error: 'Un utilisateur avec ce nom ou cet email existe déjà' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await repo.createUser({
            username: sanitizedUsername,
            email: sanitizedEmail,
            password: hashedPassword,
            role
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre à jour un utilisateur
router.put('/:id', requireRole('admin', 'superadmin'), [
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('password').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('role').optional().isIn(['editor', 'admin', 'superadmin']).withMessage('Rôle invalide')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role } = req.body;
        const userId = req.params.id;

        const user = await repo.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const updates = {};
        if (email) {
            const sanitizedEmail = email.toLowerCase().trim();
            const existingEmail = await repo.findUserByEmailExcludingId(sanitizedEmail, userId);
            if (existingEmail) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }
            updates.email = sanitizedEmail;
        }
        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }
        if (role) {
            updates.role = role;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Aucune modification à effectuer' });
        }

        const updatedUser = await repo.updateUser(userId, updates);
        res.json(updatedUser);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un utilisateur (superadmin uniquement)
router.delete('/:id', requireRole('superadmin'), async (req, res) => {
    try {
        const userId = req.params.id;

        if (parseInt(userId, 10) === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        const user = await repo.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        await repo.deleteUser(userId);
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
