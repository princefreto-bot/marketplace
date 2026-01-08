import { useState } from 'react';
import { Modal, Input, Button, Select, useToast } from './UI';
import { EyeIcon, EyeOffIcon } from './Icons';
import { useAuth } from '../store/useStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'acheteur' as 'acheteur' | 'vendeur',
    telephone: '',
    localisation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const result = await login(formData.email, formData.password);
      setLoading(false);
      if (result.success) {
        toast.show('Connexion réussie! Bienvenue!', 'success');
        resetForm();
        // Small delay to ensure state is updated before closing
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        setError(result.error || 'Erreur de connexion');
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }
      
      const result = await register({
        nom: formData.nom,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        telephone: formData.telephone,
        localisation: formData.localisation,
      });
      
      setLoading(false);
      if (result.success) {
        toast.show('Inscription réussie! Bienvenue!', 'success');
        resetForm();
        // Small delay to ensure state is updated before closing
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        setError(result.error || 'Erreur d\'inscription');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'acheteur',
      telephone: '',
      localisation: '',
    });
    setError('');
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'login' ? 'Connexion' : 'Inscription'}>
      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
        <button
          onClick={() => switchMode('login')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Connexion
        </button>
        <button
          onClick={() => switchMode('register')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Inscription
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <>
            <Input
              label="Nom complet"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Votre nom complet"
              required
            />
            <Select
              label="Vous êtes"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: 'acheteur', label: 'Acheteur - Je cherche des produits/services' },
                { value: 'vendeur', label: 'Vendeur - Je propose des produits/services' },
              ]}
            />
          </>
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="votre@email.com"
          required
        />

        <div className="relative">
          <Input
            label="Mot de passe"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>

        {mode === 'register' && (
          <>
            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <Input
              label="Téléphone"
              name="telephone"
              type="tel"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="+228 XX XX XX XX"
              required
            />
            <Input
              label="Localisation"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              placeholder="Lomé, Togo"
              required
            />
          </>
        )}

        <Button type="submit" fullWidth loading={loading}>
          {mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
        </Button>
      </form>

      {/* Section de test supprimée - Site en production */}
    </Modal>
  );
}
