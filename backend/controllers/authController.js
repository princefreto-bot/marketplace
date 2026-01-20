/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Controller d'authentification
 * ═══════════════════════════════════════════════════════════════════════════
 */

import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: role === 'owner' ? 'owner' : 'user' // Seuls user et owner sont autorisés à l'inscription
    });

    // Générer le token
    const token = generateToken(user._id);

    // Réponse
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur avec le mot de passe
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Compte temporairement verrouillé. Réessayez plus tard.'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte a été désactivé'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();

    // Générer le token
    const token = generateToken(user._id);

    // Réponse
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          favorites: user.favorites,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'quartier prixMensuel photos status');

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          favorites: user.favorites,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour le profil
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Changer le mot de passe
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ajouter/Retirer des favoris
 * @route   POST /api/auth/favorites/:roomId
 * @access  Private
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const user = await User.findById(req.user._id);

    const isFavorite = user.favorites.includes(roomId);

    if (isFavorite) {
      await user.removeFromFavorites(roomId);
    } else {
      await user.addToFavorites(roomId);
    }

    res.json({
      success: true,
      message: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
      data: {
        favorites: user.favorites,
        isFavorite: !isFavorite
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir les favoris
 * @route   GET /api/auth/favorites
 * @access  Private
 */
export const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        match: { status: 'available' },
        select: 'quartier prixMensuel dimensions photos status'
      });

    res.json({
      success: true,
      data: {
        favorites: user.favorites
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  toggleFavorite,
  getFavorites
};
