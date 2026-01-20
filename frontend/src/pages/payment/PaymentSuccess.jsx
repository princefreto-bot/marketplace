/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PaymentSuccess - Page de confirmation de paiement
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@components/common';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const room = location.state?.room;

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8 flex items-center justify-center">
      <div className="w-full max-w-md px-6 text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="mb-8"
        >
          <CheckCircle className="w-20 h-20 mx-auto text-black" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-3xl mb-4"
        >
          Paiement réussi !
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-body text-primary-600 mb-8"
        >
          Votre demande a été enregistrée. Nous vous contacterons très rapidement pour organiser une visite.
        </motion.p>

        {/* Room Info */}
        {room && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-primary-50 p-6 mb-8 text-left"
          >
            <h3 className="font-display text-lg mb-2">{room.quartier}</h3>
            <p className="font-body text-primary-500">
              {room.dimensions?.surface} m² · {room.prixMensuel?.toLocaleString('fr-FR')} FCFA/mois
            </p>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-left mb-8 space-y-4"
        >
          <h4 className="font-display text-lg mb-4 text-center">Prochaines étapes</h4>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-primary-700">
                Notre équipe vous contactera sous 24h pour confirmer votre demande.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-primary-700">
                Nous organiserons une visite à votre convenance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-primary-700">
                Vous recevrez un email de confirmation avec tous les détails.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Button fullWidth onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/favorites')}>
            Voir mes favoris
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
