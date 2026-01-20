/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modèle Contact - Demandes de contact / Mise en relation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  // ─────────────────────────────────────────────────────────────────────────
  // Utilisateur demandeur
  // ─────────────────────────────────────────────────────────────────────────
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Chambre concernée
  // ─────────────────────────────────────────────────────────────────────────
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Paiement associé
  // ─────────────────────────────────────────────────────────────────────────
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Message de l'utilisateur
  // ─────────────────────────────────────────────────────────────────────────
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message limité à 1000 caractères']
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Disponibilités pour la visite
  // ─────────────────────────────────────────────────────────────────────────
  preferredDates: [{
    date: Date,
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening']
    }
  }],

  // ─────────────────────────────────────────────────────────────────────────
  // Statut de la demande
  // ─────────────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: {
      values: [
        'pending',      // En attente de traitement
        'contacted',    // Propriétaire contacté
        'visit_scheduled', // Visite programmée
        'visit_done',   // Visite effectuée
        'negotiating',  // En négociation
        'success',      // Location conclue
        'cancelled',    // Annulée
        'failed'        // Échouée
      ],
      message: 'Statut invalide'
    },
    default: 'pending'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Visite programmée
  // ─────────────────────────────────────────────────────────────────────────
  visit: {
    scheduledDate: Date,
    scheduledTime: String,
    address: String, // Adresse de RDV (pas forcément l'adresse exacte)
    notes: String,
    completedAt: Date,
    userAttended: Boolean,
    feedback: String
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Suivi admin
  // ─────────────────────────────────────────────────────────────────────────
  adminNotes: [{
    note: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ─────────────────────────────────────────────────────────────────────────
  // Résultat final
  // ─────────────────────────────────────────────────────────────────────────
  outcome: {
    result: {
      type: String,
      enum: ['rented', 'not_interested', 'price_issue', 'other_reason', 'pending']
    },
    reason: String,
    closedAt: Date,
    commissionPaid: {
      type: Boolean,
      default: false
    },
    commissionPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Priorité
  // ─────────────────────────────────────────────────────────────────────────
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Assigné à (admin qui gère le dossier)
  // ─────────────────────────────────────────────────────────────────────────
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════════════════════
// INDEX
// ═══════════════════════════════════════════════════════════════════════════

contactSchema.index({ user: 1 });
contactSchema.index({ room: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ assignedTo: 1 });
contactSchema.index({ priority: 1, createdAt: -1 });

// Empêcher les doublons (un utilisateur ne peut avoir qu'une demande active par chambre)
contactSchema.index(
  { user: 1, room: 1 },
  { 
    unique: true,
    partialFilterExpression: {
      status: { $nin: ['cancelled', 'failed', 'success'] }
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ajouter une note admin
 */
contactSchema.methods.addAdminNote = async function(adminId, note) {
  this.adminNotes.push({
    note,
    adminId,
    createdAt: new Date()
  });
  await this.save();
};

/**
 * Programmer une visite
 */
contactSchema.methods.scheduleVisit = async function(visitData) {
  this.visit = {
    scheduledDate: visitData.date,
    scheduledTime: visitData.time,
    address: visitData.address,
    notes: visitData.notes
  };
  this.status = 'visit_scheduled';
  await this.save();
};

/**
 * Marquer la visite comme effectuée
 */
contactSchema.methods.completeVisit = async function(attended, feedback) {
  this.visit.completedAt = new Date();
  this.visit.userAttended = attended;
  this.visit.feedback = feedback;
  this.status = 'visit_done';
  await this.save();
};

/**
 * Clôturer avec succès (location conclue)
 */
contactSchema.methods.closeAsSuccess = async function(commissionPaymentId) {
  this.status = 'success';
  this.outcome = {
    result: 'rented',
    closedAt: new Date(),
    commissionPaid: !!commissionPaymentId,
    commissionPaymentId
  };
  await this.save();
};

/**
 * Clôturer comme échec
 */
contactSchema.methods.closeAsFailed = async function(reason, details) {
  this.status = 'failed';
  this.outcome = {
    result: reason,
    reason: details,
    closedAt: new Date()
  };
  await this.save();
};

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Statistiques des contacts
 */
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    contacted: 0,
    visit_scheduled: 0,
    visit_done: 0,
    negotiating: 0,
    success: 0,
    cancelled: 0,
    failed: 0
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  // Taux de succès
  const completed = result.success + result.failed;
  result.successRate = completed > 0 
    ? ((result.success / completed) * 100).toFixed(1) 
    : 0;

  return result;
};

/**
 * Demandes en attente (pour dashboard admin)
 */
contactSchema.statics.getPendingRequests = function() {
  return this.find({
    status: { $in: ['pending', 'contacted', 'visit_scheduled'] }
  })
  .populate('user', 'name email phone')
  .populate('room', 'quartier prixMensuel photos')
  .sort({ priority: -1, createdAt: 1 });
};

/**
 * Historique d'un utilisateur
 */
contactSchema.statics.getUserHistory = function(userId) {
  return this.find({ user: userId })
    .populate('room', 'quartier prixMensuel photos status')
    .sort({ createdAt: -1 });
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
