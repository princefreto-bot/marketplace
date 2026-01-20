/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SearchModal - Modal de recherche et filtres
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal, Button, Select } from '@components/common';
import roomService from '@services/roomService';

const PRICE_MAX = 100000;
const PRICE_MIN = 10000;

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [quartiers, setQuartiers] = useState([]);
  const [filters, setFilters] = useState({
    quartier: searchParams.get('quartier') || '',
    prixMax: parseInt(searchParams.get('prixMax')) || PRICE_MAX,
    surfaceMin: parseInt(searchParams.get('surfaceMin')) || 0,
  });

  // Charger les quartiers
  useEffect(() => {
    const loadQuartiers = async () => {
      try {
        const response = await roomService.getQuartiers();
        setQuartiers(response.data.quartiers.map(q => ({ value: q, label: q })));
      } catch (error) {
        console.error('Erreur chargement quartiers:', error);
      }
    };
    loadQuartiers();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    const params = new URLSearchParams();
    if (filters.quartier) params.set('quartier', filters.quartier);
    if (filters.prixMax < PRICE_MAX) params.set('prixMax', filters.prixMax.toString());
    if (filters.surfaceMin > 0) params.set('surfaceMin', filters.surfaceMin.toString());
    
    navigate(`/?${params.toString()}`);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      quartier: '',
      prixMax: PRICE_MAX,
      surfaceMin: 0,
    });
    navigate('/');
    onClose();
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrer"
      variant="bottom-sheet"
    >
      <div className="p-6 space-y-8">
        {/* Quartier */}
        <div>
          <Select
            label="Quartier"
            value={filters.quartier}
            onChange={(e) => handleFilterChange('quartier', e.target.value)}
            options={quartiers}
            placeholder="Tous les quartiers"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-4">
            Budget maximum
          </label>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={5000}
            value={filters.prixMax}
            onChange={(e) => handleFilterChange('prixMax', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="font-display text-2xl mt-4">
            {formatPrice(filters.prixMax)} FCFA
          </p>
        </div>

        {/* Surface */}
        <div>
          <label className="block font-body text-sm text-primary-500 uppercase tracking-[0.1em] mb-4">
            Surface minimum
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 10, 15, 20].map((surface) => (
              <button
                key={surface}
                onClick={() => handleFilterChange('surfaceMin', surface)}
                className={`py-3 border text-sm font-body transition-colors ${
                  filters.surfaceMin === surface
                    ? 'border-black bg-black text-white'
                    : 'border-primary-200 hover:border-black'
                }`}
              >
                {surface === 0 ? 'Tout' : `${surface}m²+`}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="secondary"
            onClick={handleReset}
            fullWidth
          >
            Réinitialiser
          </Button>
          <Button
            onClick={handleApply}
            fullWidth
          >
            Appliquer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
