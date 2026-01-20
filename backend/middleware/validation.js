/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Middleware de validation des données
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Gestionnaire des erreurs de validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: formattedErrors
    });
  }

  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis')
    .matches(/^\+?[0-9]{8,15}$/).withMessage('Numéro de téléphone invalide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS CHAMBRE
// ═══════════════════════════════════════════════════════════════════════════

export const validateRoom = [
  body('quartier')
    .trim()
    .notEmpty().withMessage('Le quartier est requis'),
  
  body('prixMensuel')
    .notEmpty().withMessage('Le prix mensuel est requis')
    .isInt({ min: 5000, max: 500000 }).withMessage('Le prix doit être entre 5000 et 500000 FCFA'),
  
  body('dureeContrat')
    .optional()
    .isIn([3, 6, 12, 24]).withMessage('Durée invalide'),
  
  body('dimensions.longueur')
    .notEmpty().withMessage('La longueur est requise')
    .isFloat({ min: 1, max: 20 }).withMessage('Longueur invalide'),
  
  body('dimensions.largeur')
    .notEmpty().withMessage('La largeur est requise')
    .isFloat({ min: 1, max: 20 }).withMessage('Largeur invalide'),
  
  body('defauts')
    .isArray({ min: 1 }).withMessage('Au moins un défaut est requis')
    .custom((defauts) => {
      if (defauts.some(d => typeof d !== 'string' || d.trim() === '')) {
        throw new Error('Défauts invalides');
      }
      return true;
    }),
  
  body('equipements')
    .optional()
    .isArray().withMessage('Les équipements doivent être un tableau'),
  
  handleValidationErrors
];

export const validateRoomUpdate = [
  body('prixMensuel')
    .optional()
    .isInt({ min: 5000, max: 500000 }).withMessage('Le prix doit être entre 5000 et 500000 FCFA'),
  
  body('dureeContrat')
    .optional()
    .isIn([3, 6, 12, 24]).withMessage('Durée invalide'),
  
  body('status')
    .optional()
    .isIn(['pending', 'available', 'processing', 'reserved', 'rented', 'archived']).withMessage('Statut invalide'),
  
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS PAIEMENT
// ═══════════════════════════════════════════════════════════════════════════

export const validatePaymentInit = [
  body('roomId')
    .notEmpty().withMessage('L\'ID de la chambre est requis')
    .isMongoId().withMessage('ID de chambre invalide'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message limité à 1000 caractères'),
  
  body('preferredDates')
    .optional()
    .isArray().withMessage('Les dates préférées doivent être un tableau'),
  
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS CONTACT
// ═══════════════════════════════════════════════════════════════════════════

export const validateContactUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'contacted', 'visit_scheduled', 'visit_done', 'negotiating', 'success', 'cancelled', 'failed'])
    .withMessage('Statut invalide'),
  
  body('visit.scheduledDate')
    .optional()
    .isISO8601().withMessage('Date de visite invalide'),
  
  body('visit.scheduledTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/).withMessage('Heure invalide (format HH:MM)'),
  
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS PARAMÈTRES URL
// ═══════════════════════════════════════════════════════════════════════════

export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('ID invalide'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATIONS QUERY PARAMS
// ═══════════════════════════════════════════════════════════════════════════

export const validateRoomFilters = [
  query('quartier')
    .optional()
    .trim(),
  
  query('prixMin')
    .optional()
    .isInt({ min: 0 }).withMessage('Prix minimum invalide'),
  
  query('prixMax')
    .optional()
    .isInt({ min: 0 }).withMessage('Prix maximum invalide'),
  
  query('surfaceMin')
    .optional()
    .isFloat({ min: 0 }).withMessage('Surface minimum invalide'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page invalide'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limite invalide (1-50)'),
  
  handleValidationErrors
];

export default {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateRoom,
  validateRoomUpdate,
  validatePaymentInit,
  validateContactUpdate,
  validateObjectId,
  validateRoomFilters
};
