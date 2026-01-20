/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Home - Page d'accueil avec les chambres en plein écran
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { RoomCardFull } from '@components/room';
import { PageLoader } from '@components/common';
import { useRooms } from '@hooks/useRooms';

export default function Home() {
  const [searchParams] = useSearchParams();
  const [showHero, setShowHero] = useState(true);

  // Récupérer les filtres depuis l'URL
  const filters = {
    quartier: searchParams.get('quartier') || '',
    prixMax: searchParams.get('prixMax') || '',
    surfaceMin: searchParams.get('surfaceMin') || '',
  };

  const { rooms, isLoading } = useRooms(filters);

  // Masquer le hero après scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5) {
        setShowHero(false);
      } else {
        setShowHero(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="scroll-snap-y scrollbar-hide">
      {/* Hero Section */}
      <section className="h-screen h-[100dvh] scroll-snap-start relative bg-black flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center px-6"
        >
          <span className="font-body text-sm tracking-[0.3em] uppercase opacity-60 block mb-6">
            Lomé, Togo
          </span>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-wider mb-6">
            RÉSIDENCE
          </h1>
          
          <div className="w-px h-16 bg-white mx-auto mb-6" />
          
          <p className="font-body text-lg md:text-xl italic opacity-80 max-w-md mx-auto">
            Votre intermédiaire de confiance pour trouver la chambre idéale
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-float"
        >
          <ChevronDown className="w-6 h-6 mx-auto opacity-60" />
          <span className="font-body text-xs tracking-[0.2em] uppercase opacity-60 mt-2 block">
            Défiler
          </span>
        </motion.div>
      </section>

      {/* Rooms */}
      {rooms.length > 0 ? (
        rooms.map((room, index) => (
          <RoomCardFull key={room._id} room={room} index={index} />
        ))
      ) : (
        <section className="h-screen h-[100dvh] scroll-snap-start flex flex-col items-center justify-center px-6 text-center">
          <h2 className="font-display text-3xl mb-4">Aucune chambre disponible</h2>
          <p className="font-body text-primary-500 mb-8">
            Essayez de modifier vos critères de recherche
          </p>
        </section>
      )}

      {/* Scroll Progress Dots */}
      <div className="fixed right-4 lg:right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
        {[{ id: 'hero' }, ...rooms].map((item, index) => (
          <button
            key={item._id || item.id}
            onClick={() => {
              window.scrollTo({
                top: index * window.innerHeight,
                behavior: 'smooth',
              });
            }}
            className="w-2 h-2 rounded-full bg-white/40 hover:bg-white transition-colors"
          />
        ))}
      </div>
    </div>
  );
}
