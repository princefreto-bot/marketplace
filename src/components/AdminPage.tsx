import { useState, useEffect } from 'react';
import { ArrowLeftIcon, UsersIcon, ChartIcon, GridIcon, TrashIcon, BanIcon, CheckIcon, EditIcon } from './Icons';
import { Card, Avatar, Badge, Button, Tabs, useToast, Modal, Input, Textarea } from './UI';
import { useAuth, useAdmin } from '../store/useStore';
import { User, Demande, SocialLink, Slider, Stats, CATEGORIES } from '../types';

interface AdminPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { user } = useAuth();
  const { getStats, getAllUsers, getAllPosts, banUser, unbanUser, deletePost, getSocialLinks, getSliders, updateSliders } = useAdmin();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalDemandes: 0, totalReponses: 0, totalMessages: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<(Demande & { acheteur?: User })[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [banReason, setBanReason] = useState('');
  
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [sliderForm, setSliderForm] = useState({
    title: '',
    description: '',
    image: '',
    buttonText: '',
    buttonLink: '',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(getStats());
    setUsers(getAllUsers());
    setPosts(getAllPosts());
    setSocialLinks(getSocialLinks());
    setSliders(getSliders());
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6">
          <BanIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-500 mb-4">Cette page est réservée aux administrateurs</p>
          <Button onClick={() => onNavigate('home')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.show('Veuillez indiquer une raison', 'error');
      return;
    }
    await banUser(selectedUserId, banReason);
    setShowBanModal(false);
    setBanReason('');
    setSelectedUserId('');
    refreshData();
    toast.show('Utilisateur banni', 'success');
  };

  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
    refreshData();
    toast.show('Utilisateur débanni', 'success');
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      await deletePost(postId);
      refreshData();
      toast.show('Post supprimé', 'success');
    }
  };

  const handleSaveSlider = async () => {
    const newSlider: Slider = {
      _id: editingSlider?._id || `slider${Date.now()}`,
      ...sliderForm,
      isActive: true,
      order: editingSlider?.order || sliders.length + 1,
    };

    if (editingSlider) {
      const updated = sliders.map(s => s._id === editingSlider._id ? newSlider : s);
      await updateSliders(updated);
    } else {
      await updateSliders([...sliders, newSlider]);
    }
    
    setShowSliderModal(false);
    setEditingSlider(null);
    setSliderForm({ title: '', description: '', image: '', buttonText: '', buttonLink: '' });
    refreshData();
    toast.show('Slider sauvegardé', 'success');
  };

  const handleDeleteSlider = async (sliderId: string) => {
    const updated = sliders.filter(s => s._id !== sliderId);
    await updateSliders(updated);
    refreshData();
    toast.show('Slider supprimé', 'success');
  };

  const openEditSlider = (slider: Slider) => {
    setEditingSlider(slider);
    setSliderForm({
      title: slider.title,
      description: slider.description,
      image: slider.image,
      buttonText: slider.buttonText,
      buttonLink: slider.buttonLink,
    });
    setShowSliderModal(true);
  };

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartIcon className="w-4 h-4" /> },
    { id: 'users', label: 'Utilisateurs', icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'posts', label: 'Posts', icon: <GridIcon className="w-4 h-4" /> },
    { id: 'sliders', label: 'Sliders' },
    { id: 'social', label: 'Réseaux' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="overflow-x-auto hide-scrollbar">
          <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-gray-500">Utilisateurs</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalDemandes}</div>
                <div className="text-sm text-gray-500">Demandes</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.totalReponses}</div>
                <div className="text-sm text-gray-500">Réponses</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalMessages}</div>
                <div className="text-sm text-gray-500">Messages</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setActiveTab('users')}>
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Gérer les utilisateurs
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('posts')}>
                  <GridIcon className="w-4 h-4 mr-2" />
                  Gérer les posts
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('sliders')}>
                  <EditIcon className="w-4 h-4 mr-2" />
                  Modifier les sliders
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{users.length} utilisateurs</h2>
            
            {users.map((u) => (
              <Card key={u._id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar src={u.avatar} name={u.nom} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{u.nom}</p>
                      <Badge 
                        variant={u.role === 'vendeur' ? 'success' : 'info'} 
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                      {u.isBanned && <Badge variant="danger" size="sm">Banni</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400">Inscrit le {formatDate(u.dateCreation)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {u.isBanned ? (
                      <Button size="sm" variant="outline" onClick={() => handleUnbanUser(u._id)}>
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Débannir
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => { setSelectedUserId(u._id); setShowBanModal(true); }}
                      >
                        <BanIcon className="w-4 h-4 mr-1" />
                        Bannir
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Posts */}
        {activeTab === 'posts' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{posts.length} posts</h2>
            
            {posts.map((post) => (
              <Card key={post._id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                    {post.images[0] ? (
                      <img src={post.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {CATEGORIES.find(c => c.id === post.categorie)?.icon || '📦'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{post.titre}</h3>
                    <p className="text-sm text-gray-500">par {post.acheteur?.nom}</p>
                    <p className="text-xs text-gray-400">{formatDate(post.dateCreation)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onNavigate('detail', { demandeId: post._id })}
                    >
                      Voir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleDeletePost(post._id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Sliders */}
        {activeTab === 'sliders' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sliders Hero</h2>
              <Button onClick={() => { setEditingSlider(null); setSliderForm({ title: '', description: '', image: '', buttonText: '', buttonLink: '' }); setShowSliderModal(true); }}>
                Ajouter un slider
              </Button>
            </div>
            
            {sliders.map((slider) => (
              <Card key={slider._id} className="overflow-hidden">
                <div className="flex">
                  <div className="w-32 h-24 flex-shrink-0 bg-gray-100">
                    <img src={slider.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-semibold text-gray-900">{slider.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{slider.description}</p>
                  </div>
                  <div className="p-4 flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditSlider(slider)}>
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteSlider(slider._id)}>
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Social Links */}
        {activeTab === 'social' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Réseaux sociaux</h2>
            
            {socialLinks.map((link) => (
              <Card key={link._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      {link.icon === 'facebook' && <span>📘</span>}
                      {link.icon === 'whatsapp' && <span>💬</span>}
                      {link.icon === 'instagram' && <span>📷</span>}
                      {link.icon === 'twitter' && <span>🐦</span>}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{link.platform}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{link.url}</p>
                    </div>
                  </div>
                  <Badge variant={link.isActive ? 'success' : 'default'} size="sm">
                    {link.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ban Modal */}
      <Modal isOpen={showBanModal} onClose={() => setShowBanModal(false)} title="Bannir l'utilisateur">
        <div className="space-y-4">
          <Textarea
            label="Raison du bannissement"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Indiquez la raison du bannissement..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowBanModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" fullWidth onClick={handleBanUser}>
              Confirmer le ban
            </Button>
          </div>
        </div>
      </Modal>

      {/* Slider Modal */}
      <Modal isOpen={showSliderModal} onClose={() => setShowSliderModal(false)} title={editingSlider ? 'Modifier le slider' : 'Ajouter un slider'}>
        <div className="space-y-4">
          <Input
            label="Titre"
            value={sliderForm.title}
            onChange={(e) => setSliderForm(prev => ({ ...prev, title: e.target.value }))}
          />
          <Textarea
            label="Description"
            value={sliderForm.description}
            onChange={(e) => setSliderForm(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <Input
            label="URL de l'image"
            value={sliderForm.image}
            onChange={(e) => setSliderForm(prev => ({ ...prev, image: e.target.value }))}
            placeholder="https://..."
          />
          <Input
            label="Texte du bouton"
            value={sliderForm.buttonText}
            onChange={(e) => setSliderForm(prev => ({ ...prev, buttonText: e.target.value }))}
          />
          <Input
            label="Lien du bouton"
            value={sliderForm.buttonLink}
            onChange={(e) => setSliderForm(prev => ({ ...prev, buttonLink: e.target.value }))}
          />
          <Button fullWidth onClick={handleSaveSlider}>
            Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
