import { useState } from 'react';
import { ArrowLeftIcon, CameraIcon, CloseIcon } from './Icons';
import { Button, Input, Textarea, Select, useToast } from './UI';
import { useAuth } from '../store/useStore';
import { CATEGORIES } from '../types';

interface PublishPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export function PublishPage({ onNavigate }: PublishPageProps) {
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

  const handleChange = (e: React.ChangeEvent<any>) => {
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
    if (!formData.budget || Number(formData.budget) <= 0) newErrors.budget = 'Budget invalide';
    if (!formData.categorie) newErrors.categorie = 'Choisissez une catégorie';
    if (!formData.localisation.trim()) newErrors.localisation = 'Localisation requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const res = await fetch('/api/demandes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titre: formData.titre.trim(),
          description: formData.description.trim(),
          budget: Number(formData.budget),
          images,
          categorie: formData.categorie,
          localisation: formData.localisation.trim()
        })
      });

      if (!res.ok) throw new Error();

      const demande = await res.json();

      toast.show('Demande publiée avec succès 🎉', 'success');
      onNavigate('detail', { demandeId: demande._id });

    } catch {
      toast.show('Erreur lors de la publication', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-14 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => onNavigate('home')}>
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold">Publier une demande</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Images */}
          <div>
            <label className="text-sm font-medium">Photos</label>
            <div className="flex gap-3 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  <img src={img.url} className="w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="w-24 h-24 border-dashed border rounded-xl flex flex-col items-center justify-center cursor-pointer">
                  <CameraIcon className="w-6 h-6" />
                  <input type="file" multiple hidden onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <Input label="Titre *" name="titre" value={formData.titre} onChange={handleChange} error={errors.titre} />
          <Textarea label="Description *" name="description" value={formData.description} onChange={handleChange} error={errors.description} />
          <Input label="Budget *" name="budget" type="number" value={formData.budget} onChange={handleChange} error={errors.budget} />

          <Select
            label="Catégorie *"
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            options={[
              { value: '', label: 'Choisir' },
              ...CATEGORIES.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))
            ]}
            error={errors.categorie}
          />

          <Input label="Localisation *" name="localisation" value={formData.localisation} onChange={handleChange} error={errors.localisation} />

          <Button type="submit" fullWidth loading={loading}>
            Publier ma demande
          </Button>
        </form>
      </div>
    </div>
  );
}
