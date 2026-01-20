/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Controller Administration
 * ═══════════════════════════════════════════════════════════════════════════
 */

import User from '../models/User.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';

/**
 * @desc    Dashboard - Statistiques générales
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
export const getDashboard = async (req, res, next) => {
  try {
    // Récupérer toutes les statistiques en parallèle
    const [userStats, roomStats, paymentStats, contactStats] = await Promise.all([
      User.getStats(),
      Room.getStats(),
      Payment.getStats(),
      Contact.getStats()
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        rooms: roomStats,
        payments: paymentStats,
        contacts: contactStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GESTION DES CHAMBRES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @desc    Obtenir les chambres en attente de validation
 * @route   GET /api/admin/rooms/pending
 * @access  Private (Admin)
 */
export const getPendingRooms = async (req, res, next) => {
  try {
    const rooms = await Room.findPending();

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Valider une chambre
 * @route   PUT /api/admin/rooms/:id/approve
 * @access  Private (Admin)
 */
export const approveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    if (room.validation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette chambre a déjà été traitée'
      });
    }

    // Notes admin (optionnel)
    if (req.body.adminNotes) {
      room.validation.adminNotes = req.body.adminNotes;
    }

    await room.approve(req.user._id);

    res.json({
      success: true,
      message: 'Chambre approuvée',
      data: { room }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rejeter une chambre
 * @route   PUT /api/admin/rooms/:id/reject
 * @access  Private (Admin)
 */
export const rejectRoom = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'La raison du rejet est requise'
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    if (room.validation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette chambre a déjà été traitée'
      });
    }

    await room.reject(req.user._id, reason);

    res.json({
      success: true,
      message: 'Chambre rejetée',
      data: { room }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Changer le statut d'une chambre
 * @route   PUT /api/admin/rooms/:id/status
 * @access  Private (Admin)
 */
export const changeRoomStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'processing', 'reserved', 'rented', 'archived'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    res.json({
      success: true,
      message: `Statut changé en "${status}"`,
      data: { room }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir toutes les chambres (admin)
 * @route   GET /api/admin/rooms
 * @access  Private (Admin)
 */
export const getAllRooms = async (req, res, next) => {
  try {
    const { status, quartier, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (quartier) query.quartier = quartier;

    const rooms = await Room.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Room.countDocuments(query);

    res.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GESTION DES UTILISATEURS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @desc    Obtenir tous les utilisateurs
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir un utilisateur par ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('favorites', 'quartier prixMensuel status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les statistiques liées
    const [contacts, payments, rooms] = await Promise.all([
      Contact.countDocuments({ user: user._id }),
      Payment.countDocuments({ user: user._id, status: 'completed' }),
      Room.countDocuments({ owner: user._id })
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          contacts,
          payments,
          rooms
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour un utilisateur
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher de modifier son propre rôle admin
    if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur mis à jour',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un utilisateur
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher de se supprimer soi-même
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Utilisateur supprimé'
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GESTION DES CONTACTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @desc    Obtenir toutes les demandes de contact
 * @route   GET /api/admin/contacts
 * @access  Private (Admin)
 */
export const getAllContacts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const contacts = await Contact.find(query)
      .populate('user', 'name email phone')
      .populate('room', 'quartier prixMensuel photos')
      .populate('payment', 'amount status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour une demande de contact
 * @route   PUT /api/admin/contacts/:id
 * @access  Private (Admin)
 */
export const updateContact = async (req, res, next) => {
  try {
    const { status, visit, priority, adminNote } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Mettre à jour le statut
    if (status) {
      contact.status = status;
    }

    // Programmer une visite
    if (visit) {
      await contact.scheduleVisit(visit);
    }

    // Priorité
    if (priority) {
      contact.priority = priority;
    }

    // Ajouter une note admin
    if (adminNote) {
      await contact.addAdminNote(req.user._id, adminNote);
    }

    await contact.save();

    res.json({
      success: true,
      message: 'Demande mise à jour',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Marquer une location comme réussie
 * @route   PUT /api/admin/contacts/:id/success
 * @access  Private (Admin)
 */
export const markContactAsSuccess = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('room');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    // Marquer la chambre comme louée
    await Room.findByIdAndUpdate(contact.room._id, {
      status: 'rented',
      currentTenant: {
        user: contact.user,
        startDate: new Date()
      }
    });

    // Clôturer le contact
    await contact.closeAsSuccess();

    res.json({
      success: true,
      message: 'Location enregistrée avec succès',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboard,
  getPendingRooms,
  approveRoom,
  rejectRoom,
  changeRoomStatus,
  getAllRooms,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllContacts,
  updateContact,
  markContactAsSuccess
};
