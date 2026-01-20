/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Register - Page d'inscription
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@components/common';
import { useAuth } from '@contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const defaultRole = location.state?.role || 'user';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: defaultRole,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    setIsLoading(false);

    if (result.success) {
      if (data.role === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8 flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl mb-2">Inscription</h1>
          <p className="font-body text-primary-500">
            Créez votre compte en quelques secondes
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <Input
            label="Nom complet"
            type="text"
            placeholder="Jean Dupont"
            error={errors.name?.message}
            {...register('name', {
              required: 'Nom requis',
              minLength: {
                value: 2,
                message: 'Minimum 2 caractères',
              },
            })}
          />

          <Input
            label="Téléphone"
            type="tel"
            placeholder="+228 90 00 00 00"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Téléphone requis',
              pattern: {
                value: /^\+?[0-9]{8,15}$/,
                message: 'Numéro invalide',
              },
            })}
          />

          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalide',
              },
            })}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Mot de passe requis',
              minLength: {
                value: 8,
                message: 'Minimum 8 caractères',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Doit contenir majuscule, minuscule et chiffre',
              },
            })}
          />

          <Select
            label="Je suis"
            options={[
              { value: 'user', label: 'À la recherche d\'une chambre' },
              { value: 'owner', label: 'Propriétaire d\'une chambre' },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Créer mon compte
          </Button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-8 font-body text-primary-500"
        >
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-black underline">
            Se connecter
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
