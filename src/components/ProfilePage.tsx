import { useState, useEffect } from 'react';
import { UserIcon, LocationIcon, PhoneIcon, MailIcon, EditIcon, LogoutIcon, TrashIcon, ChatIcon } from './Icons';
import { Card, Avatar, Badge, Button, Tabs, EmptyState, useToast, Modal, Input } from './UI';
import { useAuth, useDemandes, useReponses, useMessages } from '../store/useStore';
import { CATEGORIES, BADGE_STYLES, Demande, Reponse } from '../types';

interface ProfilePageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
  onShowAuth: () => void;
}

export function ProfilePage({ onNavigate, onShowAuth }: ProfilePageProps) {
  const { user, logout, updateProfile } = useAuth();
  const { getMyDemandes, deleteDemande } = useDemandes();
  const { getMyReponses, getReponsesForMyDemandes } = useReponses();
  const { startConversation } = useMessages();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('demandes');
  const [myDemandes, setMyDemandes] = useState<Demande[]>([]);
  const [myReponses, setMyReponses] = useState<(Reponse & { demande?: Demande })[]>([]);
  const [receivedReponses, setReceivedReponses] = useState<(Reponse & { demande?: Demande; vendeur?: { nom: string; avatar?: string } })[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({
    nom: user?.nom || '',
    telephone: user?.telephone || '',
    localisation: user?.localisation || '',
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'acheteur') {
        setMyDemandes(getMyDemandes(user._id));
        setReceivedReponses(getReponsesForMyDemandes(user._id));
      } else if (user.role === 'vendeur') {
        setMyReponses(getMyReponses(user._id));
      }
    }
  }, [user, getMyDemandes, getMyReponses, getReponsesForMyDemandes]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connectez-vous</h2>
          <p className="text-gray-500 mb-4">Pour accéder à votre profil</p>
          <Button onClick={onShowAuth}>Se connecter</Button>
        </div>
      </div>
    );
  }

  const handleDeleteDemande = async (demandeId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      await deleteDemande(demandeId);
      setMyDemandes(getMyDemandes(user._id));
      toast.show('Demande supprimée', 'success');
    }
  };

  const handleUpdateProfile = async () => {
    await updateProfile(editData);
    setShowEditProfile(false);
    toast.show('Profil mis à jour', 'success');
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
    toast.show('Déconnexion réussie', 'success');
  };

  const handleContactVendeur = (vendeurId: string, demande: Demande) => {
    const conversationId = startConversation(demande._id, demande.titre, user._id, vendeurId);
    onNavigate('chat', {
      conversationId,
      demandeId: demande._id,
      demandeTitre: demande.titre,
      otherUserId: vendeurId,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const acheteurTabs = [
    { id: 'demandes', label: 'Mes demandes' },
    { id: 'reponses', label: 'Réponses reçues' },
  ];

  const vendeurTabs = [
    { id: 'reponses', label: 'Mes réponses' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 pt-6 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">Mon Profil</h1>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              <LogoutIcon className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar} name={user.nom} size="xl" />
            <div>
              <h2 className="text-xl font-bold text-white">{user.nom}</h2>
              <Badge 
                variant={user.role === 'vendeur' ? 'success' : 'info'} 
                size="sm"
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-14">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Informations</h3>
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <EditIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <MailIcon className="w-5 h-5" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <PhoneIcon className="w-5 h-5" />
              <span>{user.telephone || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <LocationIcon className="w-5 h-5" />
              <span>{user.localisation || 'Non renseigné'}</span>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs
            tabs={user.role === 'acheteur' ? acheteurTabs : vendeurTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="mt-4">
            {/* Mes demandes (acheteur) */}
            {user.role === 'acheteur' && activeTab === 'demandes' && (
              <div className="space-y-4">
                {myDemandes.length === 0 ? (
                  <EmptyState
                    title="Aucune demande"
                    description="Vous n'avez pas encore publié de demande"
                    action={
                      <Button onClick={() => onNavigate('publish')}>
                        Publier une demande
                      </Button>
                    }
                  />
                ) : (
                  myDemandes.map((demande) => (
                    <Card key={demande._id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                          {demande.images[0] ? (
                            <img src={demande.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {CATEGORIES.find(c => c.id === demande.categorie)?.icon || '📦'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              {demande.badge && (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${BADGE_STYLES[demande.badge].bg} ${BADGE_STYLES[demande.badge].text}`}>
                                  {BADGE_STYLES[demande.badge].label}
                                </span>
                              )}
                              <h3 className="font-semibold text-gray-900 line-clamp-1">{demande.titre}</h3>
                              <p className="text-blue-600 font-bold text-sm">{formatPrice(demande.budget)}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteDemande(demande._id)}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => onNavigate('detail', { demandeId: demande._id })}
                              className="text-sm text-blue-600 font-medium hover:underline"
                            >
                              Voir détails
                            </button>
                            <span className="text-xs text-gray-500">{formatDate(demande.dateCreation)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Réponses reçues (acheteur) */}
            {user.role === 'acheteur' && activeTab === 'reponses' && (
              <div className="space-y-4">
                {receivedReponses.length === 0 ? (
                  <EmptyState
                    title="Aucune réponse"
                    description="Vous n'avez pas encore reçu de réponse"
                  />
                ) : (
                  receivedReponses.map((reponse) => (
                    <Card key={reponse._id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar src={reponse.vendeur?.avatar} name={reponse.vendeur?.nom || 'Vendeur'} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{reponse.vendeur?.nom}</p>
                          <p className="text-xs text-gray-500">a répondu à: {reponse.demande?.titre}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{reponse.message}</p>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm"
                          onClick={() => reponse.demande && handleContactVendeur(reponse.vendeurId, reponse.demande)}
                        >
                          <ChatIcon className="w-4 h-4 mr-1" />
                          Discuter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onNavigate('detail', { demandeId: reponse.demandeId })}
                        >
                          Voir la demande
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Mes réponses (vendeur) */}
            {user.role === 'vendeur' && activeTab === 'reponses' && (
              <div className="space-y-4">
                {myReponses.length === 0 ? (
                  <EmptyState
                    title="Aucune réponse"
                    description="Vous n'avez pas encore répondu à des demandes"
                    action={
                      <Button onClick={() => onNavigate('demandes')}>
                        Voir les demandes
                      </Button>
                    }
                  />
                ) : (
                  myReponses.map((reponse) => (
                    <Card key={reponse._id} className="p-4">
                      <div className="mb-2">
                        <Badge variant="info" size="sm">{reponse.demande?.titre}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{reponse.message}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">{formatDate(reponse.dateCreation)}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onNavigate('detail', { demandeId: reponse.demandeId })}
                        >
                          Voir la demande
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Modifier le profil">
        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={editData.nom}
            onChange={(e) => setEditData(prev => ({ ...prev, nom: e.target.value }))}
          />
          <Input
            label="Téléphone"
            value={editData.telephone}
            onChange={(e) => setEditData(prev => ({ ...prev, telephone: e.target.value }))}
          />
          <Input
            label="Localisation"
            value={editData.localisation}
            onChange={(e) => setEditData(prev => ({ ...prev, localisation: e.target.value }))}
          />
          <Button fullWidth onClick={handleUpdateProfile}>
            Enregistrer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
