/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Favorites - Page des favoris
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { RoomCardCompact } from '@components/room';
import { Button, PageLoader } from '@components/common';
import { useFavorites } from '@contexts/FavoritesContext';
import roomService from '@services/roomService';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavoriteRooms = async () => {
      if (favorites.length === 0) {
        setRooms([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Charger les détails de chaque chambre favorite
        const roomPromises = favorites.map(id => roomService.getRoom(id));
        const responses = await Promise.allSettled(roomPromises);
        
        const validRooms = responses
          .filter(r => r.status === 'fulfilled' && r.value?.data?.room)
          .map(r => r.value.data.room);
        
        setRooms(validRooms);
      } catch (error) {
        console.error('Erreur chargement favoris:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavoriteRooms();
  }, [favorites]);

  if (isLoading) {
    return <PageLoader />;
  }

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
            Vos Sélections
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-5xl tracking-wide mb-6"
          >
            Favoris
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2 }}
            className="divider w-24 mx-auto"
          />
        </div>

        {/* Content */}
        {rooms.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
          >
            {rooms.map((room, index) => (
              <motion.div
                key={room._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RoomCardCompact room={room} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <Heart className="w-16 h-16 mx-auto text-primary-300 mb-6" />
            <h2 className="font-display text-2xl mb-4">Aucun favori</h2>
            <p className="font-body text-primary-500 mb-8 max-w-sm mx-auto">
              Ajoutez des chambres à vos favoris en cliquant sur le cœur pour les retrouver ici.
            </p>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Découvrir les chambres
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
