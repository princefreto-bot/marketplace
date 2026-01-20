/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OwnerDashboard - Tableau de bord propriétaire
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, Calendar, CheckCircle } from 'lucide-react';
import { Button, Modal, Input, Textarea, Select, PageLoader, RoomStatusBadge } from '@components/common';
import { useMyRooms } from '@hooks/useRooms';
import toast from 'react-hot-toast';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};

const quartiers = [
  'Agbalépédogan',
  'Tokoin',
  'Bè',
  'Adidogomé',
  'Nyékonakpoè',
  'Agoè-Nyivé',
  'Kodjoviakopé',
  'Hédzranawoé',
  'Autre',
];

const equipements = [
  'Ventilateur',
  'Climatisation',
  'Douche intérieure',
  'Toilette privée',
  'Placard',
  'Moustiquaire',
  'Eau courante',
  'Électricité',
];

export default function OwnerDashboard() {
  const { rooms, stats, isLoading, createRoom } = useMyRooms();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    quartier: '',
    prixMensuel: '',
    dureeContrat: '12',
    longueur: '',
    largeur: '',
    equipements: [],
    defauts: '',
    photos: ['', '', ''],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEquipementToggle = (eq) => {
    setFormData(prev => ({
      ...prev,
      equipements: prev.equipements.includes(eq)
        ? prev.equipements.filter(e => e !== eq)
        : [...prev.equipements, eq],
    }));
  };

  const handlePhotoChange = (index, value) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      newPhotos[index] = value;
      return { ...prev, photos: newPhotos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const roomData = {
        quartier: formData.quartier,
        prixMensuel: parseInt(formData.prixMensuel),
        dureeContrat: parseInt(formData.dureeContrat),
        dimensions: {
          longueur: parseFloat(formData.longueur),
          largeur: parseFloat(formData.largeur),
        },
        equipements: formData.equipements,
        defauts: formData.defauts.split('\n').filter(d => d.trim()),
        photos: formData.photos.filter(p => p.trim()).map(url => ({ url })),
      };

      const result = await createRoom(roomData);
      
      if (result.success) {
        toast.success('Chambre soumise pour validation');
        setIsModalOpen(false);
        setFormData({
          quartier: '',
          prixMensuel: '',
          dureeContrat: '12',
          longueur: '',
          largeur: '',
          equipements: [],
          defauts: '',
          photos: ['', '', ''],
        });
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8 bg-primary-50">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <span className="font-body text-sm tracking-[0.2em] uppercase text-primary-500">
              Espace Propriétaire
            </span>
            <h1 className="font-display text-3xl md:text-4xl mt-1">Mes chambres</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Ajouter une chambre
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white p-6 border border-primary-200">
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Publiées
            </span>
            <p className="font-display text-3xl mt-2">{stats?.available || 0}</p>
          </div>
          <div className="bg-white p-6 border border-primary-200">
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              En attente
            </span>
            <p className="font-display text-3xl mt-2">{stats?.pending || 0}</p>
          </div>
          <div className="bg-white p-6 border border-primary-200">
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Louées
            </span>
            <p className="font-display text-3xl mt-2">{stats?.rented || 0}</p>
          </div>
          <div className="bg-white p-6 border border-primary-200">
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Vues totales
            </span>
            <p className="font-display text-3xl mt-2">{stats?.totalViews || 0}</p>
          </div>
        </motion.div>

        {/* Rooms List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-primary-200"
        >
          <div className="p-6 border-b border-primary-200">
            <h2 className="font-display text-xl">Vos chambres</h2>
          </div>
          
          {rooms.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-body text-primary-500 mb-4">
                Vous n'avez pas encore de chambre publiée
              </p>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Ajouter votre première chambre
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-primary-100">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-20 h-16 bg-primary-100 overflow-hidden flex-shrink-0">
                    <img
                      src={room.photos?.[0]?.url || room.photos?.[0]}
                      alt={room.quartier}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-lg">{room.quartier}</h3>
                      <RoomStatusBadge status={room.status} />
                    </div>
                    <p className="font-body text-primary-600">
                      {formatPrice(room.prixMensuel)} FCFA/mois
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Eye className="w-4 h-4 text-primary-400" />
                      <span className="font-display text-xl">{room.stats?.views || 0}</span>
                    </div>
                    <span className="font-body text-sm text-primary-400">vues</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Add Room Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Ajouter une chambre"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Photos */}
            <div>
              <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-2">
                Photos (URLs) - Minimum 3
              </label>
              {formData.photos.map((photo, index) => (
                <Input
                  key={index}
                  placeholder={`URL de la photo ${index + 1}`}
                  value={photo}
                  onChange={(e) => handlePhotoChange(index, e.target.value)}
                  containerClassName="mb-2"
                />
              ))}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, photos: [...prev.photos, ''] }))}
                className="font-body text-sm text-primary-500 hover:text-black"
              >
                + Ajouter une photo
              </button>
            </div>

            {/* Quartier */}
            <Select
              label="Quartier"
              name="quartier"
              value={formData.quartier}
              onChange={handleInputChange}
              options={quartiers.map(q => ({ value: q, label: q }))}
              required
            />

            {/* Prix & Durée */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prix mensuel (FCFA)"
                name="prixMensuel"
                type="number"
                placeholder="45000"
                value={formData.prixMensuel}
                onChange={handleInputChange}
                required
              />
              <Select
                label="Durée minimum"
                name="dureeContrat"
                value={formData.dureeContrat}
                onChange={handleInputChange}
                options={[
                  { value: '6', label: '6 mois' },
                  { value: '12', label: '12 mois' },
                  { value: '24', label: '24 mois' },
                ]}
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Longueur (m)"
                name="longueur"
                type="number"
                step="0.1"
                placeholder="4.5"
                value={formData.longueur}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Largeur (m)"
                name="largeur"
                type="number"
                step="0.1"
                placeholder="3.5"
                value={formData.largeur}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Équipements */}
            <div>
              <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-2">
                Équipements
              </label>
              <div className="grid grid-cols-2 gap-2">
                {equipements.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => handleEquipementToggle(eq)}
                    className={`p-3 border text-sm font-body text-left transition-colors ${
                      formData.equipements.includes(eq)
                        ? 'border-black bg-black text-white'
                        : 'border-primary-200 hover:border-black'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            {/* Défauts */}
            <Textarea
              label="Défauts à signaler (un par ligne)"
              name="defauts"
              placeholder="Ex: Peinture à rafraîchir&#10;Fenêtre côté rue bruyante"
              value={formData.defauts}
              onChange={handleInputChange}
              helperText="La transparence renforce la confiance"
              required
            />

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                fullWidth
              >
                Annuler
              </Button>
              <Button type="submit" isLoading={isSubmitting} fullWidth>
                Soumettre
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
