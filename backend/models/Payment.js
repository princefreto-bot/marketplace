/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modèle Payment - Historique des paiements
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // ─────────────────────────────────────────────────────────────────────────
  // Identifiants
  // ─────────────────────────────────────────────────────────────────────────
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Utilisateur
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
  // Type de paiement
  // ─────────────────────────────────────────────────────────────────────────
  type: {
    type: String,
    enum: {
      values: ['contact', 'commission'],
      message: 'Type de paiement invalide'
    },
    required: true
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Montant
  // ─────────────────────────────────────────────────────────────────────────
  amount: {
    type: Number,
    required: true,
    min: [0, 'Le montant doit être positif']
  },

  currency: {
    type: String,
    default: 'XOF'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Statut
  // ─────────────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      message: 'Statut invalide'
    },
    default: 'pending'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Données CinetPay
  // ─────────────────────────────────────────────────────────────────────────
  cinetpay: {
    paymentToken: String,
    paymentUrl: String,
    paymentMethod: String,
    paymentDate: Date,
    
    // Données brutes du webhook (pour debug)
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      select: false
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Métadonnées
  // ─────────────────────────────────────────────────────────────────────────
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Notes
  // ─────────────────────────────────────────────────────────────────────────
  notes: String,

  // ─────────────────────────────────────────────────────────────────────────
  // Dates importantes
  // ─────────────────────────────────────────────────────────────────────────
  completedAt: Date,
  refundedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════════════════════
// INDEX
// ═══════════════════════════════════════════════════════════════════════════

paymentSchema.index({ user: 1 });
paymentSchema.index({ room: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Marquer comme complété
 */
paymentSchema.methods.markAsCompleted = async function(cinetpayData = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  
  if (cinetpayData) {
    this.cinetpay.paymentMethod = cinetpayData.paymentMethod;
    this.cinetpay.paymentDate = cinetpayData.paymentDate || new Date();
    this.cinetpay.webhookData = cinetpayData;
  }
  
  await this.save();
};

/**
 * Marquer comme échoué
 */
paymentSchema.methods.markAsFailed = async function(reason = '') {
  this.status = 'failed';
  this.notes = reason;
  await this.save();
};

/**
 * Rembourser
 */
paymentSchema.methods.refund = async function(reason = '') {
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.notes = reason;
  await this.save();
};

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Statistiques des paiements
 */
paymentSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { status: 'completed' }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    }
  ]);

  const result = {
    totalPayments: 0,
    totalAmount: 0,
    contacts: { count: 0, total: 0 },
    commissions: { count: 0, total: 0 }
  };

  stats.forEach(s => {
    if (s._id === 'contact') {
      result.contacts = { count: s.count, total: s.total };
    } else if (s._id === 'commission') {
      result.commissions = { count: s.count, total: s.total };
    }
    result.totalPayments += s.count;
    result.totalAmount += s.total;
  });

  // Paiements en attente
  result.pending = await this.countDocuments({ status: 'pending' });

  return result;
};

/**
 * Vérifier si un utilisateur a payé pour contacter une chambre
 */
paymentSchema.statics.hasUserPaidForRoom = async function(userId, roomId) {
  const payment = await this.findOne({
    user: userId,
    room: roomId,
    type: 'contact',
    status: 'completed'
  });
  
  return !!payment;
};

/**
 * Récupérer l'historique d'un utilisateur
 */
paymentSchema.statics.getUserHistory = function(userId) {
  return this.find({ user: userId })
    .populate('room', 'quartier prixMensuel photos')
    .sort({ createdAt: -1 });
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
