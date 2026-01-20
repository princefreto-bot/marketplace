/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Controller des chambres
 * ═══════════════════════════════════════════════════════════════════════════
 */

import Room from '../models/Room.js';

/**
 * @desc    Obtenir toutes les chambres disponibles (public)
 * @route   GET /api/rooms
 * @access  Public
 */
export const getRooms = async (req, res, next) => {
  try {
    const {
      quartier,
      prixMin,
      prixMax,
      surfaceMin,
      page = 1,
      limit = 20
    } = req.query;

    // Construire les filtres
    const filters = {};

    if (quartier) {
      filters.quartier = quartier;
    }

    if (prixMin || prixMax) {
      filters.prixMensuel = {};
      if (prixMin) filters.prixMensuel.$gte = parseInt(prixMin);
      if (prixMax) filters.prixMensuel.$lte = parseInt(prixMax);
    }

    if (surfaceMin) {
      filters['dimensions.surface'] = { $gte: parseFloat(surfaceMin) };
    }

    // Récupérer les chambres disponibles
    const rooms = await Room.findAvailable(filters)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Compter le total
    const total = await Room.countDocuments({
      status: 'available',
      'validation.status': 'approved',
      ...filters
    });

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

/**
 * @desc    Obtenir une chambre par ID
 * @route   GET /api/rooms/:id
 * @access  Public
 */
export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'name');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Incrémenter les vues
    await room.incrementViews();

    // Ne pas montrer les chambres non disponibles aux utilisateurs normaux
    if (
      room.status !== 'available' &&
      (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== room.owner._id.toString()))
    ) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non disponible'
      });
    }

    res.json({
      success: true,
      data: { room }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Créer une nouvelle chambre (propriétaire)
 * @route   POST /api/rooms
 * @access  Private (Owner, Admin)
 */
export const createRoom = async (req, res, next) => {
  try {
    const {
      photos,
      quartier,
      prixMensuel,
      dureeContrat,
      dimensions,
      equipements,
      defauts,
      description,
      adresseComplete,
      caution
    } = req.body;

    // Créer la chambre
    const room = await Room.create({
      owner: req.user._id,
      photos: photos.map((url, index) => ({ url, order: index })),
      quartier,
      prixMensuel,
      dureeContrat: dureeContrat || 12,
      dimensions,
      equipements: equipements || [],
      defauts,
      description,
      adresseComplete,
      caution: caution || 1,
      status: 'pending',
      validation: {
        status: 'pending'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Chambre soumise pour validation',
      data: { room }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour une chambre
 * @route   PUT /api/rooms/:id
 * @access  Private (Owner de la chambre, Admin)
 */
export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    // Vérifier les droits
    const isOwner = room.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette chambre'
      });
    }

    // Champs modifiables par le propriétaire
    const ownerFields = [
      'photos', 'prixMensuel', 'dureeContrat', 'dimensions',
      'equipements', 'defauts', 'description', 'caution'
    ];

    // Champs modifiables uniquement par l'admin
    const adminFields = ['status', 'adresseComplete', 'quartier'];

    // Appliquer les modifications
    ownerFields.forEach(field => {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    });

    if (isAdmin) {
      adminFields.forEach(field => {
        if (req.body[field] !== undefined) {
          room[field] = req.body[field];
        }
      });
    }

    // Si le propriétaire modifie, remettre en attente de validation
    if (isOwner && !isAdmin) {
      room.validation.status = 'pending';
      room.status = 'pending';
    }

    await room.save();

    res.json({
      success: true,
      message: 'Chambre mise à jour',
      data: { room }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer une chambre
 * @route   DELETE /api/rooms/:id
 * @access  Private (Admin only)
 */
export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }

    await room.deleteOne();

    res.json({
      success: true,
      message: 'Chambre supprimée'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir les chambres du propriétaire connecté
 * @route   GET /api/rooms/my-rooms
 * @access  Private (Owner)
 */
export const getMyRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    // Stats
    const stats = {
      total: rooms.length,
      pending: rooms.filter(r => r.validation.status === 'pending').length,
      available: rooms.filter(r => r.status === 'available').length,
      rented: rooms.filter(r => r.status === 'rented').length,
      totalViews: rooms.reduce((sum, r) => sum + r.stats.views, 0)
    };

    res.json({
      success: true,
      data: {
        rooms,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir les quartiers disponibles
 * @route   GET /api/rooms/quartiers
 * @access  Public
 */
export const getQuartiers = async (req, res, next) => {
  try {
    const quartiers = await Room.distinct('quartier', {
      status: 'available',
      'validation.status': 'approved'
    });

    res.json({
      success: true,
      data: { quartiers }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Statistiques des chambres (admin)
 * @route   GET /api/rooms/stats
 * @access  Private (Admin)
 */
export const getRoomStats = async (req, res, next) => {
  try {
    const stats = await Room.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getMyRooms,
  getQuartiers,
  getRoomStats
};
