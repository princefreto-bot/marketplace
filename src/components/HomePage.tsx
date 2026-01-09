import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, LocationIcon } from './Icons';
import { Card, Badge, Button } from './UI';
import { useAdmin, useDemandes } from '../store/useStore';
import { CATEGORIES, BADGE_STYLES, Demande } from '../types';

interface HomePageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
  onShowAuth: () => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { getSliders, getStats } = useAdmin();
  const { getDemandes } = useDemandes();
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliders = getSliders();
  const stats = getStats();
  const demandes = getDemandes();
  const topDemandes: Demande[] = demandes.filter((d) => d.badge).slice(0, 6);

  useEffect(() => {
    if (sliders.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [sliders.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {sliders.map((slide, index) => (
          <div
            key={slide._id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ))}

        {/* Slider Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
              {sliders[currentSlide]?.title || 'Bienvenue sur Local Deals Togo'}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              {sliders[currentSlide]?.description || 'La première plateforme de petites annonces 100% togolaise'}
            </p>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-white/70 text-sm">Utilisateurs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stats.totalDemandes}</div>
                <div className="text-white/70 text-sm">Demandes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stats.totalReponses}</div>
                <div className="text-white/70 text-sm">Offres</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => onNavigate('demandes')}
              >
                Découvrir les annonces
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onNavigate('publish')}
                className="bg-white/10 border-white text-white hover:bg-white hover:text-blue-600"
              >
                Publier une demande
              </Button>
            </div>
          </div>
        </div>

        {/* Slider Navigation */}
        {sliders.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % sliders.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {sliders.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'w-8 bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Categories */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Catégories</h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('demandes', { categorie: cat.id })}
                className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:shadow-md transition-all group"
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className="text-xs md:text-sm text-gray-700 text-center font-medium group-hover:text-blue-600">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Top Annonces */}
      {topDemandes.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Top Annonces</h2>
              <button 
                onClick={() => onNavigate('demandes')}
                className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline"
              >
                Voir tout <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {topDemandes.map((demande) => (
                <Card 
                  key={demande._id} 
                  className="flex-shrink-0 w-72"
                  hover
                  onClick={() => onNavigate('detail', { demandeId: demande._id })}
                >
                  <div className="relative h-40">
                    {demande.images[0] ? (
                      <img
                        src={demande.images[0].url}
                        alt={demande.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl">{CATEGORIES.find(c => c.id === demande.categorie)?.icon || '📦'}</span>
                      </div>
                    )}
                    {demande.badge && (
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${BADGE_STYLES[demande.badge].bg} ${BADGE_STYLES[demande.badge].text}`}>
                        {BADGE_STYLES[demande.badge].label}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Badge variant="info" size="sm">
                      {CATEGORIES.find(c => c.id === demande.categorie)?.name || demande.categorie}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 mt-2 line-clamp-1">{demande.titre}</h3>
                    <p className="text-blue-600 font-bold mt-1">{formatPrice(demande.budget)}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <LocationIcon className="w-3 h-3" />
                        {demande.localisation}
                      </span>
                      <span>{formatDate(demande.dateCreation)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Demandes */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Dernières Demandes</h2>
            <button 
              onClick={() => onNavigate('demandes')}
              className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline"
            >
              Voir tout <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getDemandes().slice(0, 8).map((demande) => (
              <Card 
                key={demande._id}
                hover
                onClick={() => onNavigate('detail', { demandeId: demande._id })}
              >
                <div className="relative h-40">
                  {demande.images[0] ? (
                    <img
                      src={demande.images[0].url}
                      alt={demande.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl">{CATEGORIES.find(c => c.id === demande.categorie)?.icon || '📦'}</span>
                    </div>
                  )}
                  {demande.badge && (
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${BADGE_STYLES[demande.badge].bg} ${BADGE_STYLES[demande.badge].text}`}>
                      {BADGE_STYLES[demande.badge].label}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <Badge variant="info" size="sm">
                    {CATEGORIES.find(c => c.id === demande.categorie)?.name || demande.categorie}
                  </Badge>
                  <h3 className="font-semibold text-gray-900 mt-2 line-clamp-1">{demande.titre}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{demande.description}</p>
                  <p className="text-blue-600 font-bold mt-2">{formatPrice(demande.budget)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <LocationIcon className="w-3 h-3" />
                      {demande.localisation}
                    </span>
                    <span>{formatDate(demande.dateCreation)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Vous avez quelque chose à vendre ?
          </h2>
          <p className="text-white/90 mb-8">
            Rejoignez notre communauté et commencez à vendre dès aujourd'hui !
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => onNavigate('publish')}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Publier une annonce gratuitement
          </Button>
        </div>
      </section>
    </div>
  );
}
