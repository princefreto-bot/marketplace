/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RoomDetail - Page de détail d'une chambre
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { RoomGallery } from '@components/room';
import { Button, PageLoader, RoomStatusBadge } from '@components/common';
import { useFavorites } from '@contexts/FavoritesContext';
import { useAuth } from '@contexts/AuthContext';
import roomService from '@services/roomService';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        setIsLoading(true);
        const response = await roomService.getRoom(id);
        setRoom(response.data.room);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoom();
  }, [id]);

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/payment/${id}` } });
    } else {
      navigate(`/payment/${id}`);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h2 className="font-display text-2xl mb-4">Chambre non trouvée</h2>
        <p className="font-body text-primary-500 mb-8">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const photoUrls = room.photos?.map(p => p.url || p) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-primary-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-primary-100 rounded-full transition-colors haptic"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-display text-lg">{room.quartier}</span>
          <button
            onClick={() => toggleFavorite(room._id)}
            className="p-2 hover:bg-primary-100 rounded-full transition-colors haptic"
          >
            <Heart
              className={clsx(
                'w-5 h-5',
                isFavorite(room._id)
                  ? 'fill-black stroke-black'
                  : 'stroke-black fill-transparent'
              )}
            />
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="h-[55vh] pt-14">
        <RoomGallery photos={photoUrls} roomId={room._id} />
      </div>

      {/* Content */}
      <div className="p-6 pb-40 lg:pb-32">
        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl">{formatPrice(room.prixMensuel)}</span>
            <span className="font-body text-primary-500">FCFA / mois</span>
          </div>
          <p className="font-body text-primary-500 mt-1">
            Total sur {room.dureeContrat} mois : {formatPrice(room.prixMensuel * room.dureeContrat)} FCFA
          </p>
        </motion.div>

        <div className="divider mb-8" />

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-6 mb-8"
        >
          <div>
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Surface
            </span>
            <p className="font-display text-xl mt-1">{room.dimensions?.surface} m²</p>
          </div>
          <div>
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Dimensions
            </span>
            <p className="font-display text-xl mt-1">
              {room.dimensions?.longueur} × {room.dimensions?.largeur} m
            </p>
          </div>
          <div>
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Durée minimum
            </span>
            <p className="font-display text-xl mt-1">{room.dureeContrat} mois</p>
          </div>
          <div>
            <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
              Quartier
            </span>
            <p className="font-display text-xl mt-1">{room.quartier}</p>
          </div>
        </motion.div>

        {/* Équipements */}
        {room.equipements?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="font-display text-xl mb-4">Équipements</h3>
            <div className="flex flex-wrap gap-2">
              {room.equipements.map((eq) => (
                <span
                  key={eq}
                  className="font-body text-sm border border-primary-200 px-3 py-1"
                >
                  {eq}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <div className="divider mb-8" />

        {/* Défauts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="font-display text-xl mb-4">Points d'attention</h3>
          <p className="font-body text-primary-500 text-sm italic mb-4">
            Nous vous indiquons tous les défauts constatés lors de notre visite
          </p>
          <ul className="space-y-3">
            {room.defauts?.map((defaut, index) => (
              <li key={index} className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="font-body text-primary-700">{defaut}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="divider mb-8" />

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary-50 p-6 -mx-6"
        >
          <h3 className="font-display text-xl mb-2">Intéressé(e) ?</h3>
          <p className="font-body text-primary-600 mb-6">
            Payez les frais de mise en relation pour nous contacter. Nous organiserons une visite pour vous.
          </p>
          <Button fullWidth onClick={handleContact}>
            Contacter la plateforme
          </Button>
          <p className="font-body text-sm text-primary-400 text-center mt-4">
            Commission : 1 mois de loyer uniquement si vous louez
          </p>
        </motion.div>
      </div>
    </div>
  );
}
