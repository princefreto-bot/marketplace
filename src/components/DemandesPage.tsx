import { useEffect, useState } from "react";
import { SearchIcon, FilterIcon, LocationIcon } from "./Icons";
import { Card, Badge, Input, Select, EmptyState } from "./UI";
import { useDemandes } from "../store/useStore";
import { CATEGORIES, BADGE_STYLES } from "../types";

export function DemandesPage({ onNavigate, initialCategorie }: any) {
  const { demandes, fetchDemandes, loading } = useDemandes();

  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");

  useEffect(() => {
    fetchDemandes();
  }, []);

  const filtered = demandes.filter((d: any) => {
    const matchSearch =
      d.titre.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());

    const matchCategorie = !categorie || d.categorie === categorie;

    return matchSearch && matchCategorie;
  });

  const formatDate = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Recherche */}
      <div className="bg-white border-b sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4">
          <Input
            placeholder="Rechercher une demande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon className="w-5 h-5" />}
          />
          <Select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            options={[
              { value: "", label: "Toutes catégories" },
              ...CATEGORIES.map(c => ({
                value: c.id,
                label: `${c.icon} ${c.name}`
              }))
            ]}
          />
        </div>
      </div>

      {/* Résultats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="w-16 h-16" />}
            title="Aucune demande trouvée"
            description="Essayez un autre filtre"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d: any) => (
              <Card
                key={d._id}
                hover
                onClick={() => onNavigate("detail", { demandeId: d._id })}
              >
                <div className="h-40 bg-gray-100">
                  {d.images?.[0] ? (
                    <img
                      src={d.images[0].url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">
                      📦
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <Badge size="sm">{d.categorie}</Badge>
                  <h3 className="font-semibold mt-2">{d.titre}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {d.description}
                  </p>

                  <p className="text-blue-600 font-bold mt-2">
                    {d.budget.toLocaleString()} FCFA
                  </p>

                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <LocationIcon className="w-3 h-3" />
                      {d.localisation}
                    </span>
                    <span>{formatDate(d.createdAt)}</span>
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

