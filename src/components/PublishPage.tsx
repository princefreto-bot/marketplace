import { useState } from 'react';
import { ArrowLeftIcon, CameraIcon, CloseIcon } from './Icons';
import { Button, Input, Textarea, Select, useToast } from './UI';
import { useDemandes, useAuth } from '../store/useStore';
import { CATEGORIES } from '../types';

interface PublishPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export function PublishPage({ onNavigate }: PublishPageProps) {
  const { createDemande } = useDemandes();
  const { user } = useAuth();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    budget: '',
    categorie: '',
    localisation: user?.localisation || '',
  });
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (images.length >= 5) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [
          ...prev,
          { url: reader.result as string, publicId: `img_${Date.now()}` }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titre.trim()) newErrors.titre = 'Le titre est obligatoire';
    if (!formData.description.trim()) newErrors.description = 'La description est obligatoire';
    if (!formData.budget || Number(formData.budget) <= 0) newErrors.budget = 'Le budget doit être supérieur à 0';
    if (!formData.categorie) newErrors.categorie = 'Veuillez choisir une catégorie';
    if (!formData.localisation.trim()) newErrors.localisation = 'La localisation est obligatoire';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    if (!user) return;
    
    setLoading(true);
    
    const result = await createDemande({
      acheteurId: user._id,
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      budget: Number(formData.budget),
      images,
      categorie: formData.categorie,
      localisation: formData.localisation.trim(),
    });
    
    if (result.success) {
      toast.show('Demande publiée avec succès!', 'success');
      onNavigate('detail', { demandeId: result.demande?._id });
    } else {
      toast.show('Erreur lors de la publication', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-14 md:top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">Publier une demande</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (max 5)
            </label>
            <div className="flex gap-3 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  <img src={img.url} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <CameraIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Titre */}
          <Input
            label="Titre de la demande *"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            placeholder="Ex: Recherche iPhone 14 Pro Max"
            error={errors.titre}
          />

          {/* Description */}
          <Textarea
            label="Description détaillée *"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Décrivez précisément ce que vous recherchez, les caractéristiques souhaitées, l'état, etc."
            rows={5}
            error={errors.description}
          />

          {/* Budget */}
          <Input
            label="Budget maximum (FCFA) *"
            name="budget"
            type="number"
            value={formData.budget}
            onChange={handleChange}
            placeholder="150000"
            error={errors.budget}
          />

          {/* Catégorie */}
          <Select
            label="Catégorie *"
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            options={[
              { value: '', label: 'Choisir une catégorie' },
              ...CATEGORIES.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))
            ]}
            error={errors.categorie}
          />

          {/* Localisation */}
          <Input
            label="Localisation *"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            placeholder="Ex: Lomé, Togo"
            error={errors.localisation}
          />

          {/* Submit */}
          <div className="pt-4">
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Publier ma demande
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            En publiant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </form>
      </div>
    </div>
  );
}
