/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Middleware de gestion des rôles et permissions
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Vérifier si l'utilisateur a un des rôles requis
 * @param {...string} roles - Rôles autorisés
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle "${req.user.role}" non autorisé.`
      });
    }

    next();
  };
};

/**
 * Vérifier si l'utilisateur est admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

/**
 * Vérifier si l'utilisateur est propriétaire
 */
export const isOwner = (req, res, next) => {
  if (!req.user || !['owner', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux propriétaires'
    });
  }
  next();
};

/**
 * Vérifier si l'utilisateur est propriétaire de la ressource
 * @param {string} resourceField - Champ contenant l'ID du propriétaire
 */
export const isResourceOwner = (resourceField = 'owner') => {
  return (req, res, next) => {
    const resource = req.resource; // Doit être attaché par un middleware précédent

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource non trouvée'
      });
    }

    const ownerId = resource[resourceField]?._id || resource[resourceField];
    const isOwner = ownerId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette ressource'
      });
    }

    next();
  };
};

/**
 * Vérifier si l'utilisateur peut accéder à son propre profil ou est admin
 */
export const isSelfOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.userId || req.params.id;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }

  const isSelf = req.user._id.toString() === requestedUserId;
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce profil'
    });
  }

  next();
};

/**
 * Middleware pour vérifier les permissions spécifiques
 */
export const checkPermission = (permission) => {
  const permissions = {
    // Chambres
    'room:create': ['owner', 'admin'],
    'room:update': ['owner', 'admin'],
    'room:delete': ['admin'],
    'room:validate': ['admin'],
    
    // Utilisateurs
    'user:list': ['admin'],
    'user:update': ['admin'],
    'user:delete': ['admin'],
    
    // Paiements
    'payment:view_all': ['admin'],
    'payment:refund': ['admin'],
    
    // Contacts
    'contact:view_all': ['admin'],
    'contact:assign': ['admin'],
    'contact:update_status': ['admin']
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const allowedRoles = permissions[permission];

    if (!allowedRoles) {
      console.warn(`Permission "${permission}" non définie`);
      return res.status(500).json({
        success: false,
        message: 'Erreur de configuration des permissions'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée'
      });
    }

    next();
  };
};

export default {
  authorize,
  isAdmin,
  isOwner,
  isResourceOwner,
  isSelfOrAdmin,
  checkPermission
};
