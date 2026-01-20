/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Middleware d'authentification JWT
 * ═══════════════════════════════════════════════════════════════════════════
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware de protection des routes
 * Vérifie le token JWT et ajoute l'utilisateur à req.user
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token du header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Veuillez vous connecter.'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Ce compte a été désactivé'
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur auth middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

/**
 * Middleware optionnel - Ajoute l'utilisateur si connecté, mais ne bloque pas
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalide, on continue sans utilisateur
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Générer un token JWT
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Décoder un token sans vérifier (pour debug)
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export default {
  protect,
  optionalAuth,
  generateToken,
  decodeToken
};
