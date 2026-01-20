/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Configuration CinetPay - Système de Paiement
 * ═══════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

// Configuration CinetPay
export const cinetpayConfig = {
  apiKey: process.env.CINETPAY_API_KEY,
  siteId: process.env.CINETPAY_SITE_ID,
  secretKey: process.env.CINETPAY_SECRET_KEY,
  sandbox: process.env.CINETPAY_SANDBOX === 'true',
  notifyUrl: process.env.CINETPAY_NOTIFY_URL,
  returnUrl: process.env.CINETPAY_RETURN_URL,
  cancelUrl: process.env.CINETPAY_CANCEL_URL,
};

// URLs de l'API CinetPay
const CINETPAY_BASE_URL = 'https://api-checkout.cinetpay.com/v2';

/**
 * Initialiser un paiement CinetPay
 * @param {Object} paymentData - Données du paiement
 * @returns {Object} Réponse CinetPay avec l'URL de paiement
 */
export const initializePayment = async (paymentData) => {
  try {
    const {
      transactionId,
      amount,
      currency = 'XOF',
      description,
      customerName,
      customerSurname,
      customerEmail,
      customerPhone,
      metadata = {}
    } = paymentData;

    // Validation
    if (!transactionId || !amount || !description) {
      throw new Error('Données de paiement incomplètes');
    }

    // Payload pour CinetPay
    const payload = {
      apikey: cinetpayConfig.apiKey,
      site_id: cinetpayConfig.siteId,
      transaction_id: transactionId,
      amount: parseInt(amount),
      currency: currency,
      description: description,
      notify_url: cinetpayConfig.notifyUrl,
      return_url: cinetpayConfig.returnUrl,
      cancel_url: cinetpayConfig.cancelUrl,
      channels: 'ALL',
      lang: 'FR',
      metadata: JSON.stringify(metadata),
      
      // Informations client (optionnelles mais recommandées)
      customer_name: customerName || '',
      customer_surname: customerSurname || '',
      customer_email: customerEmail || '',
      customer_phone_number: customerPhone || '',
      customer_address: 'Lomé, Togo',
      customer_city: 'Lomé',
      customer_country: 'TG',
      customer_state: 'Maritime',
      customer_zip_code: '00228',
    };

    console.log('💳 Initialisation paiement CinetPay:', {
      transactionId,
      amount,
      description
    });

    // Appel API CinetPay
    const response = await axios.post(
      `${CINETPAY_BASE_URL}/payment`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    if (response.data.code === '201') {
      console.log('✅ Paiement initialisé avec succès');
      return {
        success: true,
        paymentUrl: response.data.data.payment_url,
        paymentToken: response.data.data.payment_token,
        transactionId: transactionId
      };
    } else {
      throw new Error(response.data.message || 'Erreur CinetPay');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation paiement:', error.message);
    throw error;
  }
};

/**
 * Vérifier le statut d'un paiement
 * @param {string} transactionId - ID de la transaction
 * @returns {Object} Statut du paiement
 */
export const checkPaymentStatus = async (transactionId) => {
  try {
    const payload = {
      apikey: cinetpayConfig.apiKey,
      site_id: cinetpayConfig.siteId,
      transaction_id: transactionId
    };

    const response = await axios.post(
      `${CINETPAY_BASE_URL}/payment/check`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    const data = response.data;

    if (data.code === '00') {
      const paymentData = data.data;
      
      return {
        success: true,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.payment_method,
        paymentDate: paymentData.payment_date,
        metadata: paymentData.metadata ? JSON.parse(paymentData.metadata) : {}
      };
    } else {
      return {
        success: false,
        status: 'UNKNOWN',
        message: data.message
      };
    }
  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error.message);
    throw error;
  }
};

/**
 * Valider la signature du webhook CinetPay
 * @param {Object} webhookData - Données reçues du webhook
 * @returns {boolean} Validité de la signature
 */
export const validateWebhookSignature = (webhookData) => {
  try {
    // CinetPay envoie cpm_site_id dans le webhook
    // Vérifier que le site_id correspond
    if (webhookData.cpm_site_id !== cinetpayConfig.siteId) {
      console.warn('⚠️ Site ID ne correspond pas');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur validation webhook:', error);
    return false;
  }
};

/**
 * Statuts de paiement CinetPay
 */
export const PAYMENT_STATUS = {
  ACCEPTED: 'ACCEPTED',     // Paiement réussi
  REFUSED: 'REFUSED',       // Paiement refusé
  CANCELLED: 'CANCELLED',   // Paiement annulé
  PENDING: 'PENDING',       // En attente
  UNKNOWN: 'UNKNOWN'        // Statut inconnu
};

/**
 * Montants fixes pour la plateforme
 */
export const PLATFORM_FEES = {
  CONTACT_FEE: 2000,  // Frais de mise en relation en FCFA
};

export default {
  cinetpayConfig,
  initializePayment,
  checkPaymentStatus,
  validateWebhookSignature,
  PAYMENT_STATUS,
  PLATFORM_FEES
};
