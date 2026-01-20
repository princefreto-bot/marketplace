/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Profile - Page de profil utilisateur
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Settings, LogOut, CreditCard, Heart } from 'lucide-react';
import { Button, Input, Badge } from '@components/common';
import { useAuth } from '@contexts/AuthContext';
import { useFavorites } from '@contexts/FavoritesContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout, isOwner, isAdmin } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm();

  const onProfileSubmit = async (data) => {
    setIsLoading(true);
    await updateProfile(data);
    setIsLoading(false);
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);
    const result = await changePassword(data.currentPassword, data.newPassword);
    setIsLoading(false);
    if (result.success) {
      resetPassword();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (user?.role === 'admin') return <Badge variant="admin">Admin</Badge>;
    if (user?.role === 'owner') return <Badge variant="owner">Propriétaire</Badge>;
    return <Badge variant="user">Utilisateur</Badge>;
  };

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8">
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center font-display text-3xl mx-auto mb-4">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h1 className="font-display text-2xl mb-2">{user?.name}</h1>
          <p className="font-body text-primary-500 mb-2">{user?.email}</p>
          {getRoleBadge()}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/favorites')}
            className="p-4 border border-primary-200 hover:border-black transition-colors text-center"
          >
            <Heart className="w-6 h-6 mx-auto mb-2" />
            <span className="font-body text-sm block">Favoris ({favoritesCount})</span>
          </button>
          {isOwner() && (
            <button
              onClick={() => navigate('/dashboard')}
              className="p-4 border border-primary-200 hover:border-black transition-colors text-center"
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <span className="font-body text-sm block">Mes chambres</span>
            </button>
          )}
          {isAdmin() && (
            <button
              onClick={() => navigate('/admin')}
              className="p-4 border border-primary-200 hover:border-black transition-colors text-center"
            >
              <Settings className="w-6 h-6 mx-auto mb-2" />
              <span className="font-body text-sm block">Administration</span>
            </button>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-b border-primary-200 mb-8"
        >
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 font-body text-sm tracking-wider uppercase transition-colors ${
                activeTab === 'profile'
                  ? 'text-black border-b-2 border-black -mb-px'
                  : 'text-primary-500'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-6 py-4 font-body text-sm tracking-wider uppercase transition-colors ${
                activeTab === 'password'
                  ? 'text-black border-b-2 border-black -mb-px'
                  : 'text-primary-500'
              }`}
            >
              Mot de passe
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-6"
          >
            <Input
              label="Nom complet"
              error={profileErrors.name?.message}
              {...registerProfile('name', { required: 'Nom requis' })}
            />
            <Input
              label="Téléphone"
              error={profileErrors.phone?.message}
              {...registerProfile('phone', { required: 'Téléphone requis' })}
            />
            <Button type="submit" isLoading={isLoading}>
              Mettre à jour
            </Button>
          </motion.form>
        )}

        {activeTab === 'password' && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-6"
          >
            <Input
              label="Mot de passe actuel"
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword', {
                required: 'Mot de passe actuel requis',
              })}
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword', {
                required: 'Nouveau mot de passe requis',
                minLength: {
                  value: 8,
                  message: 'Minimum 8 caractères',
                },
              })}
            />
            <Button type="submit" isLoading={isLoading}>
              Changer le mot de passe
            </Button>
          </motion.form>
        )}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-primary-200"
        >
          <Button variant="ghost" fullWidth onClick={handleLogout} icon={LogOut}>
            Déconnexion
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
