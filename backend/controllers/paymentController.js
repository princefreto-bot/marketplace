/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Controller des paiements
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/Payment.js';
import Contact from '../models/Contact.js';
import Room from '../models/Room.js';
import {
  initializePayment,
  checkPaymentStatus,
  validateWebhookSignature,
  PAYMENT_STATUS,
  PLATFORM_FEES
} from '../config/cinetpay.js';

/**
 * @desc    Initialiser un paiement pour contacter la plateforme
 * @route   POST /api/payments/init
 * @access  Private
 */
export const initPayment = async (req, res, next) => {
  try {
    const { roomId, message, preferredDates } = req.body;

    // Vérifier que la chambre existe et est disponible
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'available') {
      return res.status(404).json({
        success: false,
        message: 'Chambre non disponible'
      });
    }

    // Vérifier si l'utilisateur a déjà payé pour cette chambre
    const existingPayment = await Payment.hasUserPaidForRoom(req.user._id, roomId);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà payé pour contacter cette chambre'
      });
    }

    // Générer un ID de transaction unique
    const transactionId = `RES-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Créer le paiement en attente
    const payment = await Payment.create({
      transactionId,
      user: req.user._id,
      room: roomId,
      type: 'contact',
      amount: PLATFORM_FEES.CONTACT_FEE,
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Mode sandbox/demo
    if (process.env.CINETPAY_SANDBOX === 'true') {
      // Simuler un paiement réussi en mode demo
      return res.json({
        success: true,
        message: 'Mode démo - Paiement simulé',
        data: {
          transactionId,
          amount: PLATFORM_FEES.CONTACT_FEE,
          paymentUrl: `${process.env.FRONTEND_URL}/payment/demo?txn=${transactionId}`,
          sandbox: true
        }
      });
    }

    // Initialiser le paiement CinetPay
    const cinetpayResponse = await initializePayment({
      transactionId,
      amount: PLATFORM_FEES.CONTACT_FEE,
      description: `Frais de mise en relation - Chambre ${room.quartier}`,
      customerName: req.user.name.split(' ')[0],
      customerSurname: req.user.name.split(' ').slice(1).join(' ') || '',
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      metadata: {
        userId: req.user._id.toString(),
        roomId: roomId,
        message,
        preferredDates
      }
    });

    // Mettre à jour le paiement avec les infos CinetPay
    payment.cinetpay = {
      paymentToken: cinetpayResponse.paymentToken,
      paymentUrl: cinetpayResponse.paymentUrl
    };
    await payment.save();

    res.json({
      success: true,
      message: 'Paiement initialisé',
      data: {
        transactionId,
        amount: PLATFORM_FEES.CONTACT_FEE,
        paymentUrl: cinetpayResponse.paymentUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Webhook CinetPay - Notification de paiement
 * @route   POST /api/payments/webhook
 * @access  Public (vérifié par signature)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;

    console.log('📥 Webhook CinetPay reçu:', webhookData);

    // Valider la signature
    if (!validateWebhookSignature(webhookData)) {
      console.warn('⚠️ Signature webhook invalide');
      return res.status(400).json({ message: 'Signature invalide' });
    }

    const transactionId = webhookData.cpm_trans_id;
    const status = webhookData.cpm_result;

    // Trouver le paiement
    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      console.warn(`⚠️ Paiement non trouvé: ${transactionId}`);
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    // Vérifier le statut auprès de CinetPay
    const paymentStatus = await checkPaymentStatus(transactionId);

    if (paymentStatus.status === PAYMENT_STATUS.ACCEPTED) {
      // Paiement réussi
      await payment.markAsCompleted({
        paymentMethod: paymentStatus.paymentMethod,
        paymentDate: paymentStatus.paymentDate,
        ...webhookData
      });

      // Créer la demande de contact
      await createContactRequest(payment, paymentStatus.metadata);

      // Incrémenter le compteur de contacts de la chambre
      await Room.findByIdAndUpdate(payment.room, {
        $inc: { 'stats.contacts': 1 }
      });

      console.log(`✅ Paiement réussi: ${transactionId}`);
    } else if (paymentStatus.status === PAYMENT_STATUS.REFUSED) {
      await payment.markAsFailed('Paiement refusé');
      console.log(`❌ Paiement refusé: ${transactionId}`);
    } else if (paymentStatus.status === PAYMENT_STATUS.CANCELLED) {
      payment.status = 'cancelled';
      await payment.save();
      console.log(`🚫 Paiement annulé: ${transactionId}`);
    }

    res.json({ message: 'OK' });
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * @desc    Simuler un paiement réussi (mode demo)
 * @route   POST /api/payments/demo-complete
 * @access  Private
 */
export const demoCompletePayment = async (req, res, next) => {
  try {
    if (process.env.CINETPAY_SANDBOX !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Mode démo non activé'
      });
    }

    const { transactionId, message, preferredDates } = req.body;

    const payment = await Payment.findOne({
      transactionId,
      user: req.user._id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Paiement déjà complété'
      });
    }

    // Marquer comme complété
    await payment.markAsCompleted({
      paymentMethod: 'DEMO',
      paymentDate: new Date()
    });

    // Créer la demande de contact
    await createContactRequest(payment, { message, preferredDates });

    // Incrémenter le compteur
    await Room.findByIdAndUpdate(payment.room, {
      $inc: { 'stats.contacts': 1 }
    });

    res.json({
      success: true,
      message: 'Paiement simulé avec succès',
      data: {
        payment: {
          _id: payment._id,
          transactionId: payment.transactionId,
          status: 'completed'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une demande de contact après paiement
 */
async function createContactRequest(payment, metadata = {}) {
  try {
    const contact = await Contact.create({
      user: payment.user,
      room: payment.room,
      payment: payment._id,
      message: metadata.message || '',
      preferredDates: metadata.preferredDates || [],
      status: 'pending'
    });

    return contact;
  } catch (error) {
    console.error('Erreur création contact:', error);
    throw error;
  }
}

/**
 * @desc    Vérifier le statut d'un paiement
 * @route   GET /api/payments/:transactionId/status
 * @access  Private
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      transactionId: req.params.transactionId,
      user: req.user._id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Historique des paiements de l'utilisateur
 * @route   GET /api/payments/history
 * @access  Private
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.getUserHistory(req.user._id);

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Statistiques des paiements (admin)
 * @route   GET /api/payments/stats
 * @access  Private (Admin)
 */
export const getPaymentStats = async (req, res, next) => {
  try {
    const stats = await Payment.getStats();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Liste de tous les paiements (admin)
 * @route   GET /api/payments/all
 * @access  Private (Admin)
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('room', 'quartier prixMensuel')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
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

export default {
  initPayment,
  handleWebhook,
  demoCompletePayment,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentStats,
  getAllPayments
};
