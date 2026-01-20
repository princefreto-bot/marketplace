/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Utilitaires et helpers
 * ═══════════════════════════════════════════════════════════════════════════
 */

import User from '../models/User.js';

/**
 * Créer l'administrateur par défaut si aucun admin n'existe
 */
export const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('✅ Admin existant trouvé');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrateur';
    const adminPhone = process.env.ADMIN_PHONE || '+22890000000';

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️ Variables ADMIN_EMAIL et ADMIN_PASSWORD non définies');
      return;
    }

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: 'admin',
      isActive: true,
      isVerified: true
    });

    console.log(`✅ Admin créé: ${admin.email}`);
  } catch (error) {
    console.error('❌ Erreur création admin:', error.message);
  }
};

/**
 * Formater un prix en FCFA
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

/**
 * Générer un slug à partir d'un texte
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Paginer les résultats
 */
export const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, skip };
};

/**
 * Générer les métadonnées de pagination
 */
export const paginationMeta = (total, page, limit) => {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

/**
 * Valider un ObjectId MongoDB
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Nettoyer les données sensibles d'un utilisateur
 */
export const sanitizeUser = (user) => {
  const sanitized = user.toObject ? user.toObject() : { ...user };
  delete sanitized.password;
  delete sanitized.resetPasswordToken;
  delete sanitized.resetPasswordExpire;
  delete sanitized.loginAttempts;
  delete sanitized.lockUntil;
  return sanitized;
};

/**
 * Générer un ID de transaction unique
 */
export const generateTransactionId = (prefix = 'RES') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

/**
 * Calculer la distance entre deux points GPS (formule de Haversine)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Logger d'activité (pour audit)
 */
export const logActivity = (action, userId, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId: userId?.toString(),
    details
  };
  
  // En production, envoyer vers un service de logging
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Activity:', JSON.stringify(logEntry));
  }
  
  return logEntry;
};

export default {
  createDefaultAdmin,
  formatPrice,
  slugify,
  paginate,
  paginationMeta,
  isValidObjectId,
  sanitizeUser,
  generateTransactionId,
  calculateDistance,
  logActivity
};
