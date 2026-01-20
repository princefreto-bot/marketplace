/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Routes des chambres
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getMyRooms,
  getQuartiers,
  getRoomStats
} from '../controllers/roomController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { authorize, isAdmin } from '../middleware/roles.js';
import {
  validateRoom,
  validateRoomUpdate,
  validateObjectId,
  validateRoomFilters
} from '../middleware/validation.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Routes publiques
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/rooms - Liste des chambres disponibles
router.get('/', validateRoomFilters, getRooms);

// GET /api/rooms/quartiers - Liste des quartiers
router.get('/quartiers', getQuartiers);

// GET /api/rooms/:id - Détails d'une chambre
router.get('/:id', optionalAuth, validateObjectId('id'), getRoom);

// ─────────────────────────────────────────────────────────────────────────────
// Routes protégées (Propriétaires)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/rooms/my-rooms - Mes chambres (propriétaire)
router.get('/owner/my-rooms', protect, authorize('owner', 'admin'), getMyRooms);

// POST /api/rooms - Créer une chambre
router.post('/', protect, authorize('owner', 'admin'), validateRoom, createRoom);

// PUT /api/rooms/:id - Mettre à jour une chambre
router.put('/:id', protect, authorize('owner', 'admin'), validateObjectId('id'), validateRoomUpdate, updateRoom);

// ─────────────────────────────────────────────────────────────────────────────
// Routes admin
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/rooms/admin/stats - Statistiques (admin)
router.get('/admin/stats', protect, isAdmin, getRoomStats);

// DELETE /api/rooms/:id - Supprimer une chambre (admin only)
router.delete('/:id', protect, isAdmin, validateObjectId('id'), deleteRoom);

export default router;
