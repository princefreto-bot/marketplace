import { useState, useEffect } from 'react';
import { SearchIcon, FilterIcon, LocationIcon } from './Icons';
import { Card, Badge, Input, Select, EmptyState } from './UI';
import { useDemandes } from '../store/useStore';
import { CATEGORIES, BADGE_STYLES, Demande } from '../types';

interface DemandesPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
  initialCategorie?: string;
}

export function DemandesPage({ onNavigate, initialCategorie }: DemandesPageProps) {
  const { getDemandes } = useDemandes();
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState(initialCategorie || '');
  const [demandes, setDemandes] = useState<(Demande & { acheteur?: { nom: string } })[]>([]);

  useEffect(() => {
    const filtered = getDemandes({ search, categorie });
    setDemandes(filtered);
  }, [search, categorie, getDemandes]);

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
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 sticky top-14 md:top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une annonce..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<SearchIcon className="w-5 h-5" />}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                options={[
                  { value: '', label: 'Toutes les catégories' },
                  ...CATEGORIES.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Pills */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setCategorie('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categorie === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FilterIcon className="w-4 h-4 inline mr-1" />
              Tous
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategorie(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categorie === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {demandes.length} résultat{demandes.length > 1 ? 's' : ''}
          </h2>
        </div>

        {demandes.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="w-16 h-16" />}
            title="Aucune demande trouvée"
            description="Essayez de modifier vos critères de recherche"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {demandes.map((demande) => (
              <Card 
                key={demande._id}
                hover
                onClick={() => onNavigate('detail', { demandeId: demande._id })}
              >
                <div className="relative h-44">
                  {demande.images[0] ? (
                    <img
                      src={demande.images[0].url}
                      alt={demande.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-5xl">{CATEGORIES.find(c => c.id === demande.categorie)?.icon || '📦'}</span>
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
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
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
        )}
      </div>
    </div>
  );
}
