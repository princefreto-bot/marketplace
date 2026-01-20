/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Routes des paiements
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import {
  initPayment,
  handleWebhook,
  demoCompletePayment,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentStats,
  getAllPayments
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { validatePaymentInit } from '../middleware/validation.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Webhook (public mais vérifié par signature)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/payments/webhook - Webhook CinetPay
router.post('/webhook', handleWebhook);

// ─────────────────────────────────────────────────────────────────────────────
// Routes protégées (Utilisateurs)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/payments/init - Initialiser un paiement
router.post('/init', protect, validatePaymentInit, initPayment);

// POST /api/payments/demo-complete - Compléter un paiement (mode demo)
router.post('/demo-complete', protect, demoCompletePayment);

// GET /api/payments/history - Historique des paiements
router.get('/history', protect, getPaymentHistory);

// GET /api/payments/:transactionId/status - Statut d'un paiement
router.get('/:transactionId/status', protect, getPaymentStatus);

// ─────────────────────────────────────────────────────────────────────────────
// Routes admin
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/payments/stats - Statistiques
router.get('/stats', protect, isAdmin, getPaymentStats);

// GET /api/payments/all - Tous les paiements
router.get('/all', protect, isAdmin, getAllPayments);

export default router;
