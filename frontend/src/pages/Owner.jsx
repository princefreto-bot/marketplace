/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Owner - Page pour les propriétaires
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Shield, Zap } from 'lucide-react';
import { Button } from '@components/common';
import { useAuth } from '@contexts/AuthContext';

const benefits = [
  {
    icon: DollarSign,
    title: 'Publication Gratuite',
    description: 'Aucun frais pour publier votre annonce sur notre plateforme.',
  },
  {
    icon: Shield,
    title: 'Protection Totale',
    description: 'Vos coordonnées ne sont jamais partagées avec les locataires.',
  },
  {
    icon: Zap,
    title: 'Gestion Simplifiée',
    description: 'Nous qualifions les demandes et organisons les visites pour vous.',
  },
];

export default function Owner() {
  const navigate = useNavigate();
  const { isAuthenticated, isOwner } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated && isOwner()) {
      navigate('/dashboard');
    } else if (isAuthenticated) {
      // L'utilisateur est connecté mais pas propriétaire
      // TODO: Implémenter la demande de rôle propriétaire
      navigate('/dashboard');
    } else {
      navigate('/register', { state: { role: 'owner' } });
    }
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8">
      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-body text-sm tracking-[0.3em] uppercase text-primary-500 block mb-4"
          >
            Espace Propriétaires
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-5xl tracking-wide mb-6"
          >
            Publiez gratuitement
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2 }}
            className="divider w-24 mx-auto mb-8"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-body text-xl text-primary-600 max-w-xl mx-auto italic"
          >
            Confiez-nous la mise en relation. Nous gérons tout, vous restez serein.
          </motion.p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 border border-primary-200 hover:border-black transition-colors"
              >
                <div className="w-12 h-12 border border-black flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg mb-3">{benefit.title}</h3>
                <p className="font-body text-primary-600">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* How it works for owners */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-display text-2xl text-center mb-8">
            Comment ça marche pour vous
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="font-display text-lg flex-shrink-0 w-8">1.</span>
              <p className="font-body text-primary-600">
                Inscrivez-vous et soumettez votre chambre avec photos et détails.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-display text-lg flex-shrink-0 w-8">2.</span>
              <p className="font-body text-primary-600">
                Notre équipe valide et publie votre annonce.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-display text-lg flex-shrink-0 w-8">3.</span>
              <p className="font-body text-primary-600">
                Nous recevons les demandes et organisons les visites.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-display text-lg flex-shrink-0 w-8">4.</span>
              <p className="font-body text-primary-600">
                En cas de location, nous prélevons 1 mois de loyer en commission.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button onClick={handleCTA}>
            {isAuthenticated && isOwner()
              ? 'Accéder à mon espace'
              : 'Publier une chambre'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
