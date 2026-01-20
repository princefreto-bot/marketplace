/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Routes utilisateurs (Contacts et historique)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express from 'express';
import Contact from '../models/Contact.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Routes protégées
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Obtenir l'historique des contacts de l'utilisateur
 * @route   GET /api/users/contacts
 * @access  Private
 */
router.get('/contacts', protect, async (req, res, next) => {
  try {
    const contacts = await Contact.getUserHistory(req.user._id);

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Obtenir le détail d'un contact
 * @route   GET /api/users/contacts/:id
 * @access  Private
 */
router.get('/contacts/:id', protect, async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('room', 'quartier prixMensuel photos status dimensions')
    .populate('payment', 'amount status completedAt');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Annuler une demande de contact
 * @route   PUT /api/users/contacts/:id/cancel
 * @access  Private
 */
router.put('/contacts/:id/cancel', protect, async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Ne peut annuler que les demandes en attente
    if (!['pending', 'contacted'].includes(contact.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette demande ne peut plus être annulée'
      });
    }

    contact.status = 'cancelled';
    contact.outcome = {
      result: 'other_reason',
      reason: 'Annulé par l\'utilisateur',
      closedAt: new Date()
    };
    await contact.save();

    res.json({
      success: true,
      message: 'Demande annulée',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Confirmer la présence à une visite
 * @route   PUT /api/users/contacts/:id/confirm-visit
 * @access  Private
 */
router.put('/contacts/:id/confirm-visit', protect, async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'visit_scheduled'
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Visite non trouvée'
      });
    }

    // Confirmer la visite (l'utilisateur viendra)
    contact.visit.userConfirmed = true;
    await contact.save();

    res.json({
      success: true,
      message: 'Présence confirmée',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
