/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Routes d'authentification
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  toggleFavorite,
  getFavorites
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Routes publiques
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register - Inscription
router.post('/register', validateRegister, register);

// POST /api/auth/login - Connexion
router.post('/login', validateLogin, login);

// ─────────────────────────────────────────────────────────────────────────────
// Routes protégées
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/auth/me - Profil utilisateur
router.get('/me', protect, getMe);

// PUT /api/auth/me - Mettre à jour le profil
router.put('/me', protect, updateProfile);

// PUT /api/auth/password - Changer le mot de passe
router.put('/password', protect, changePassword);

// GET /api/auth/favorites - Obtenir les favoris
router.get('/favorites', protect, getFavorites);

// POST /api/auth/favorites/:roomId - Ajouter/Retirer des favoris
router.post('/favorites/:roomId', protect, toggleFavorite);

export default router;
