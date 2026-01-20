/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PaymentInit - Initialisation du paiement
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, CreditCard } from 'lucide-react';
import { Button, Input, Textarea, PageLoader } from '@components/common';
import roomService from '@services/roomService';
import paymentService from '@services/paymentService';
import toast from 'react-hot-toast';

const CONTACT_FEE = 2000; // FCFA

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};

export default function PaymentInit() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const response = await roomService.getRoom(roomId);
        setRoom(response.data.room);
      } catch (error) {
        toast.error('Chambre non trouvée');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    loadRoom();
  }, [roomId, navigate]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await paymentService.initPayment(roomId, message);
      
      if (response.data.sandbox) {
        // Mode démo - simuler le paiement
        const demoResponse = await paymentService.demoCompletePayment(
          response.data.transactionId,
          message
        );
        if (demoResponse.success) {
          navigate('/payment/success', { state: { room } });
        }
      } else {
        // Redirection vers CinetPay
        window.location.href = response.data.paymentUrl;
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8">
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-body text-primary-500 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-2xl mb-2">Contacter la plateforme</h1>
          <p className="font-body text-primary-500">
            Chambre à {room?.quartier}
          </p>
        </motion.div>

        {/* Room Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary-50 p-6 mb-8"
        >
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-16 bg-primary-200 overflow-hidden">
              <img
                src={room?.photos?.[0]?.url || room?.photos?.[0]}
                alt={room?.quartier}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-display text-lg">{room?.quartier}</h3>
              <p className="font-body text-primary-500 text-sm">
                {room?.dimensions?.surface} m² · {room?.dureeContrat} mois
              </p>
            </div>
          </div>
          <div className="border-t border-primary-200 pt-4">
            <div className="flex justify-between mb-2">
              <span className="font-body text-primary-600">Loyer mensuel</span>
              <span className="font-display">{formatPrice(room?.prixMensuel)} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="font-body text-primary-600">Commission (si location)</span>
              <span className="font-display">{formatPrice(room?.prixMensuel)} FCFA</span>
            </div>
          </div>
        </motion.div>

        {/* Message (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Textarea
            label="Message (optionnel)"
            placeholder="Présentez-vous et indiquez vos disponibilités pour une visite..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </motion.div>

        {/* Payment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black text-white p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-body">Frais de mise en relation</span>
            <span className="font-display text-xl">{formatPrice(CONTACT_FEE)} FCFA</span>
          </div>
          <div className="text-sm font-body opacity-70 flex items-start gap-2">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Paiement sécurisé. Ce montant vous permet de nous contacter pour organiser une visite.
            </span>
          </div>
        </motion.div>

        {/* Sandbox Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-primary-100 p-4 mb-6 text-center"
        >
          <p className="font-body text-sm text-primary-600">
            🔒 Mode SANDBOX - Paiement de démonstration
          </p>
        </motion.div>

        {/* Pay Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            fullWidth
            isLoading={isProcessing}
            onClick={handlePayment}
            icon={CreditCard}
          >
            Payer {formatPrice(CONTACT_FEE)} FCFA
          </Button>
        </motion.div>

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 font-body text-xs text-primary-400"
        >
          En cas de location réussie, une commission d'1 mois de loyer sera due.
        </motion.p>
      </div>
    </div>
  );
}
