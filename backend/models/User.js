/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Modèle User - Utilisateurs de la plateforme
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ─────────────────────────────────────────────────────────────────────────
  // Informations de base
  // ─────────────────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },

  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },

  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true,
    match: [
      /^\+?[0-9]{8,15}$/,
      'Veuillez fournir un numéro de téléphone valide'
    ]
  },

  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false // Ne pas inclure par défaut dans les requêtes
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Rôle et permissions
  // ─────────────────────────────────────────────────────────────────────────
  role: {
    type: String,
    enum: {
      values: ['user', 'owner', 'admin'],
      message: 'Rôle invalide'
    },
    default: 'user'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Statut du compte
  // ─────────────────────────────────────────────────────────────────────────
  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Informations propriétaire (si role === 'owner')
  // ─────────────────────────────────────────────────────────────────────────
  ownerInfo: {
    address: {
      type: String,
      trim: true
    },
    idNumber: {
      type: String,
      trim: true
    },
    idType: {
      type: String,
      enum: ['cni', 'passport', 'permis'],
      default: 'cni'
    },
    verifiedAt: Date
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Favoris (pour les utilisateurs)
  // ─────────────────────────────────────────────────────────────────────────
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],

  // ─────────────────────────────────────────────────────────────────────────
  // Token de réinitialisation
  // ─────────────────────────────────────────────────────────────────────────
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // ─────────────────────────────────────────────────────────────────────────
  // Métadonnées
  // ─────────────────────────────────────────────────────────────────────────
  lastLogin: Date,

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: Date

}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════════════════════════
// INDEX
// ═══════════════════════════════════════════════════════════════════════════

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ═══════════════════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════════════════

// Chambres du propriétaire
userSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'owner',
  justOne: false
});

// Contacts de l'utilisateur
userSchema.virtual('contacts', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════════════════════

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe est modifié
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES D'INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comparer le mot de passe
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Vérifier si le compte est verrouillé
 */
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Incrémenter les tentatives de connexion
 */
userSchema.methods.incLoginAttempts = async function() {
  // Reset si le verrouillage est expiré
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Verrouiller après 5 tentatives
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 heures
  }

  return this.updateOne(updates);
};

/**
 * Réinitialiser les tentatives de connexion
 */
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 }
  });
};

/**
 * Ajouter aux favoris
 */
userSchema.methods.addToFavorites = async function(roomId) {
  if (!this.favorites.includes(roomId)) {
    this.favorites.push(roomId);
    await this.save();
  }
  return this.favorites;
};

/**
 * Retirer des favoris
 */
userSchema.methods.removeFromFavorites = async function(roomId) {
  this.favorites = this.favorites.filter(
    id => id.toString() !== roomId.toString()
  );
  await this.save();
  return this.favorites;
};

// ═══════════════════════════════════════════════════════════════════════════
// MÉTHODES STATIQUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Trouver par email (inclut le mot de passe)
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Statistiques utilisateurs
 */
userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    users: 0,
    owners: 0,
    admins: 0
  };

  stats.forEach(s => {
    result[s._id + 's'] = s.count;
    result.total += s.count;
  });

  // Nouveaux ce mois
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  result.newThisMonth = await this.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  return result;
};

const User = mongoose.model('User', userSchema);

export default User;
