/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RoomCard - Carte de chambre en mode plein écran
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useFavorites } from '@contexts/FavoritesContext';
import { RoomStatusBadge, Button } from '@components/common';
import RoomGallery from './RoomGallery';

/**
 * Formater le prix
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};

/**
 * Carte de chambre plein écran (pour la page d'accueil)
 */
export function RoomCardFull({ room, index }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsAnimating(true);
    toggleFavorite(room._id);
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div className="relative h-screen h-[100dvh] scroll-snap-start">
      {/* Gallery */}
      <RoomGallery photos={room.photos} roomId={room._id} />

      {/* Overlay */}
      <div className="absolute inset-0 gradient-overlay-bottom pointer-events-none" />

      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className={clsx(
          'absolute top-20 lg:top-24 right-4 lg:right-8 z-10',
          'w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full',
          'flex items-center justify-center',
          'shadow-elegant transition-transform duration-200',
          'hover:scale-110 active:scale-95',
          isAnimating && 'animate-scale-in'
        )}
      >
        <Heart
          className={clsx(
            'w-6 h-6 transition-all duration-200',
            isFavorite(room._id)
              ? 'fill-black stroke-black'
              : 'stroke-black fill-transparent'
          )}
        />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 lg:pb-12 text-white z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RoomStatusBadge status={room.status} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mt-4 mb-2"
        >
          {room.quartier}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-body text-lg opacity-80 mb-6"
        >
          {room.dimensions?.surface} m² · {room.dureeContrat} mois minimum
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-baseline gap-2 mb-8"
        >
          <span className="font-display text-4xl md:text-5xl">
            {formatPrice(room.prixMensuel)}
          </span>
          <span className="font-body text-lg opacity-60">FCFA / mois</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="secondary"
            className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-black"
            onClick={() => navigate(`/room/${room._id}`)}
          >
            Voir les détails
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Carte de chambre compacte (pour grilles)
 */
export function RoomCardCompact({ room }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <div
      className="card overflow-hidden cursor-pointer haptic"
      onClick={() => navigate(`/room/${room._id}`)}
    >
      <div className="aspect-room relative image-hover">
        <img
          src={room.photos?.[0]?.url || room.photos?.[0]}
          alt={room.quartier}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(room._id);
          }}
          className={clsx(
            'absolute top-3 right-3',
            'w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full',
            'flex items-center justify-center',
            'shadow-elegant transition-transform duration-200',
            'hover:scale-110 active:scale-95'
          )}
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
      <div className="p-4">
        <h3 className="font-display text-xl mb-1">{room.quartier}</h3>
        <p className="font-body text-primary-500 text-sm mb-3">
          {room.dimensions?.surface} m²
        </p>
        <p className="font-display text-lg">
          {formatPrice(room.prixMensuel)}{' '}
          <span className="font-body text-sm text-primary-500">FCFA/mois</span>
        </p>
      </div>
    </div>
  );
}

export default RoomCardFull;
