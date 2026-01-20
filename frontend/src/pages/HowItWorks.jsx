/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HowItWorks - Page "Comment ça marche"
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@components/common';

const steps = [
  {
    number: 1,
    title: 'Découvrez les chambres',
    description:
      'Parcourez notre sélection de chambres vérifiées à Lomé. Photos HD, dimensions exactes, défauts mentionnés — nous vous montrons tout.',
  },
  {
    number: 2,
    title: 'Contactez-nous',
    description:
      'Une chambre vous intéresse ? Payez des frais de mise en relation pour nous contacter. Nous devenons votre intermédiaire privilégié.',
  },
  {
    number: 3,
    title: 'Nous organisons la visite',
    description:
      'Nous contactons le propriétaire et organisons une visite à votre convenance. Vous ne traitez jamais directement avec le propriétaire.',
  },
  {
    number: 4,
    title: 'Location finalisée',
    description:
      'Si la chambre vous convient, nous finalisons la location. Notre commission : 1 mois de loyer, uniquement en cas de succès.',
    highlight: true,
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

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
            Notre Processus
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-5xl tracking-wide mb-6"
          >
            Comment ça fonctionne
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2 }}
            className="divider w-24 mx-auto"
          />
        </div>

        {/* Steps */}
        <div className="max-w-2xl mx-auto space-y-12 lg:space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-6 lg:gap-8"
            >
              <div
                className={`flex-shrink-0 w-16 h-16 flex items-center justify-center font-display text-2xl ${
                  step.highlight
                    ? 'bg-black text-white'
                    : 'border border-black'
                }`}
              >
                {step.number}
              </div>
              <div>
                <h3 className="font-display text-xl mb-3">{step.title}</h3>
                <p className="font-body text-primary-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button onClick={() => navigate('/')}>Voir les chambres</Button>
        </motion.div>
      </div>
    </div>
  );
}
