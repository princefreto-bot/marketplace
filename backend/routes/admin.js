/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Routes d'administration
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
  getDashboard,
  getPendingRooms,
  approveRoom,
  rejectRoom,
  changeRoomStatus,
  getAllRooms,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllContacts,
  updateContact,
  markContactAsSuccess
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { validateObjectId, validateContactUpdate } from '../middleware/validation.js';

const router = express.Router();

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(protect);
router.use(isAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/dashboard - Tableau de bord
router.get('/dashboard', getDashboard);

// ─────────────────────────────────────────────────────────────────────────────
// Gestion des chambres
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/rooms - Toutes les chambres
router.get('/rooms', getAllRooms);

// GET /api/admin/rooms/pending - Chambres en attente
router.get('/rooms/pending', getPendingRooms);

// PUT /api/admin/rooms/:id/approve - Approuver une chambre
router.put('/rooms/:id/approve', validateObjectId('id'), approveRoom);

// PUT /api/admin/rooms/:id/reject - Rejeter une chambre
router.put('/rooms/:id/reject', validateObjectId('id'), rejectRoom);

// PUT /api/admin/rooms/:id/status - Changer le statut
router.put('/rooms/:id/status', validateObjectId('id'), changeRoomStatus);

// ─────────────────────────────────────────────────────────────────────────────
// Gestion des utilisateurs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/users - Tous les utilisateurs
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - Un utilisateur
router.get('/users/:id', validateObjectId('id'), getUser);

// PUT /api/admin/users/:id - Modifier un utilisateur
router.put('/users/:id', validateObjectId('id'), updateUser);

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', validateObjectId('id'), deleteUser);

// ─────────────────────────────────────────────────────────────────────────────
// Gestion des contacts
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/contacts - Toutes les demandes
router.get('/contacts', getAllContacts);

// PUT /api/admin/contacts/:id - Modifier une demande
router.put('/contacts/:id', validateObjectId('id'), validateContactUpdate, updateContact);

// PUT /api/admin/contacts/:id/success - Marquer comme réussie
router.put('/contacts/:id/success', validateObjectId('id'), markContactAsSuccess);

export default router;
