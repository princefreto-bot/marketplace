/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modèle Room - Chambres à louer
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  // ─────────────────────────────────────────────────────────────────────────
  // Propriétaire
  // ─────────────────────────────────────────────────────────────────────────
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire est requis']
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Photos (URLs ou chemins)
  // ─────────────────────────────────────────────────────────────────────────
  photos: {
    type: [{
      url: {
        type: String,
        required: true
      },
      thumbnail: String,
      order: {
        type: Number,
        default: 0
      }
    }],
    validate: {
      validator: function(photos) {
        return photos && photos.length >= 3;
      },
      message: 'Minimum 3 photos requises'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Localisation
  // ─────────────────────────────────────────────────────────────────────────
  quartier: {
    type: String,
    required: [true, 'Le quartier est requis'],
    trim: true,
    enum: {
      values: [
        'Agbalépédogan',
        'Tokoin',
        'Bè',
        'Adidogomé',
        'Nyékonakpoè',
        'Agoè-Nyivé',
        'Kodjoviakopé',
        'Hédzranawoé',
        'Djidjolé',
        'Akodésséwa',
        'Kégué',
        'Agoe',
        'Adakpamé',
        'Aflao-Gakli',
        'Amadahomé',
        'Baguida',
        'Cacavéli',
        'Autre'
      ],
      message: 'Quartier invalide'
    }
  },

  // Adresse précise (non visible pour les utilisateurs)
  adresseComplete: {
    type: String,
    trim: true,
    select: false // Jamais envoyé aux utilisateurs
  },

  // Coordonnées GPS (optionnel)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [1.2255, 6.1319] // Centre de Lomé par défaut
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Prix et contrat
  // ─────────────────────────────────────────────────────────────────────────
  prixMensuel: {
    type: Number,
    required: [true, 'Le prix mensuel est requis'],
    min: [5000, 'Le prix minimum est 5000 FCFA'],
    max: [500000, 'Le prix maximum est 500000 FCFA']
  },

  dureeContrat: {
    type: Number,
    required: [true, 'La durée du contrat est requise'],
    enum: {
      values: [3, 6, 12, 24],
      message: 'Durée invalide (3, 6, 12 ou 24 mois)'
    },
    default: 12
  },

  // Caution (nombre de mois)
  caution: {
    type: Number,
    default: 1,
    min: 0,
    max: 6
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Dimensions
  // ─────────────────────────────────────────────────────────────────────────
  dimensions: {
    longueur: {
      type: Number,
      required: [true, 'La longueur est requise'],
      min: [1, 'Longueur minimum 1m'],
      max: [20, 'Longueur maximum 20m']
    },
    largeur: {
      type: Number,
      required: [true, 'La largeur est requise'],
      min: [1, 'Largeur minimum 1m'],
      max: [20, 'Largeur maximum 20m']
    },
    surface: {
      type: Number
      // Calculé automatiquement
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Équipements
  // ─────────────────────────────────────────────────────────────────────────
  equipements: [{
    type: String,
    enum: [
      'Ventilateur',
      'Climatisation',
      'Douche intérieure',
      'Toilette privée',
      'Placard',
      'Moustiquaire',
      'Eau courante',
      'Électricité',
      'Internet/Wifi',
      'Cuisine partagée',
      'Cuisine privée',
      'Balcon',
      'Parking',
      'Gardien'
    ]
  }],

  // ─────────────────────────────────────────────────────────────────────────
  // Défauts (OBLIGATOIRE - Transparence totale)
  // ─────────────────────────────────────────────────────────────────────────
  defauts: {
    type: [{
      type: String,
      trim: true
    }],
    validate: {
      validator: function(defauts) {
        return defauts && defauts.length >= 1;
      },
      message: 'Au moins un défaut ou "Aucun défaut constaté" est requis'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Description
  // ─────────────────────────────────────────────────────────────────────────
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description limitée à 1000 caractères']
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Statut
  // ─────────────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: {
      values: ['pending', 'available', 'processing', 'reserved', 'rented', 'archived'],
      message: 'Statut invalide'
    },
    default: 'pending'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Validation admin
  // ─────────────────────────────────────────────────────────────────────────
  validation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: Date,
    rejectionReason: String,
    adminNotes: {
      type: String,
      select: false // Notes internes
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Statistiques
  // ─────────────────────────────────────────────────────────────────────────
  stats: {
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    contacts: {
      type: Number,
      default: 0
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Locataire actuel (si louée)
  // ─────────────────────────────────────────────────────────────────────────
  currentTenant: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    endDate: Date
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Disponibilité
  // ─────────────────────────────────────────────────────────────────────────
  availableFrom: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════════════════════
// INDEX
// ═══════════════════════════════════════════════════════════════════════════

roomSchema.index({ status: 1 });
roomSchema.index({ quartier: 1 });
roomSchema.index({ prixMensuel: 1 });
roomSchema.index({ owner: 1 });
roomSchema.index({ 'validation.status': 1 });
roomSchema.index({ createdAt: -1 });
roomSchema.index({ location: '2dsphere' });

// Index composé pour les recherches courantes
roomSchema.index({ status: 1, quartier: 1, prixMensuel: 1 });

// ═══════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════

// Montant total du contrat
roomSchema.virtual('montantTotal').get(function() {
  return this.prixMensuel * this.dureeContrat;
});

// Commission plateforme (1 mois de loyer)
roomSchema.virtual('commission').get(function() {
  return this.prixMensuel;
});

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════════════════════

// Calculer la surface avant sauvegarde
roomSchema.pre('save', function(next) {
  if (this.dimensions && this.dimensions.longueur && this.dimensions.largeur) {
    this.dimensions.surface = parseFloat(
      (this.dimensions.longueur * this.dimensions.largeur).toFixed(2)
    );
  }
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Incrémenter les vues
 */
roomSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  await this.save();
};

/**
 * Approuver la chambre
 */
roomSchema.methods.approve = async function(adminId) {
  this.validation.status = 'approved';
  this.validation.adminId = adminId;
  this.validation.validatedAt = new Date();
  this.status = 'available';
  await this.save();
};

/**
 * Rejeter la chambre
 */
roomSchema.methods.reject = async function(adminId, reason) {
  this.validation.status = 'rejected';
  this.validation.adminId = adminId;
  this.validation.validatedAt = new Date();
  this.validation.rejectionReason = reason;
  this.status = 'archived';
  await this.save();
};

/**
 * Marquer comme louée
 */
roomSchema.methods.markAsRented = async function(tenantId, startDate, endDate) {
  this.status = 'rented';
  this.currentTenant = {
    user: tenantId,
    startDate: startDate || new Date(),
    endDate: endDate
  };
  await this.save();
};

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chambres disponibles (pour les utilisateurs)
 */
roomSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    status: 'available',
    'validation.status': 'approved'
  };

  if (filters.quartier) {
    query.quartier = filters.quartier;
  }

  if (filters.prixMin || filters.prixMax) {
    query.prixMensuel = {};
    if (filters.prixMin) query.prixMensuel.$gte = filters.prixMin;
    if (filters.prixMax) query.prixMensuel.$lte = filters.prixMax;
  }

  if (filters.surfaceMin) {
    query['dimensions.surface'] = { $gte: filters.surfaceMin };
  }

  return this.find(query)
    .populate('owner', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Chambres en attente de validation
 */
roomSchema.statics.findPending = function() {
  return this.find({
    'validation.status': 'pending'
  })
  .populate('owner', 'name email phone')
  .sort({ createdAt: 1 });
};

/**
 * Statistiques des chambres
 */
roomSchema.statics.getStats = async function() {
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
    available: 0,
    processing: 0,
    reserved: 0,
    rented: 0,
    archived: 0
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  // Chambres en attente de validation
  result.awaitingValidation = await this.countDocuments({
    'validation.status': 'pending'
  });

  return result;
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
