import { useState, useEffect } from 'react';
import { ArrowLeftIcon, LocationIcon, PhoneIcon, ChatIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { Button, Badge, Avatar, Card, Modal, Textarea, useToast, EmptyState } from './UI';
import { useDemandes, useReponses, useAuth, useMessages } from '../store/useStore';
import { CATEGORIES, BADGE_STYLES, Demande, Reponse, User } from '../types';

interface DemandeDetailProps {
  demandeId: string;
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
  onShowAuth: () => void;
}

export function DemandeDetail({ demandeId, onNavigate, onShowAuth }: DemandeDetailProps) {
  const { getDemandeById } = useDemandes();
  const { getReponsesByDemande, createReponse } = useReponses();
  const { startConversation } = useMessages();
  const { user } = useAuth();
  const toast = useToast();
  
  const [demande, setDemande] = useState<(Demande & { acheteur?: User }) | null>(null);
  const [reponses, setReponses] = useState<(Reponse & { vendeur?: User })[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [showRepondre, setShowRepondre] = useState(false);
  const [reponseMessage, setReponseMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = getDemandeById(demandeId);
    setDemande(d);
    if (d) {
      const r = getReponsesByDemande(d._id);
      setReponses(r);
    }
  }, [demandeId, getDemandeById, getReponsesByDemande]);

  if (!demande) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState title="Demande non trouvée" description="Cette demande n'existe pas ou a été supprimée" />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwner = user && user._id === demande.acheteurId;
  const isVendeur = user && user.role === 'vendeur';
  const hasAlreadyResponded = user && reponses.some(r => r.vendeurId === user._id);

  const handleRepondre = async () => {
    if (!user) {
      onShowAuth();
      return;
    }
    if (!reponseMessage.trim()) return;

    setLoading(true);
    const result = await createReponse({
      demandeId: demande._id,
      vendeurId: user._id,
      message: reponseMessage.trim(),
      images: [],
    });

    if (result.success) {
      toast.show('Réponse envoyée!', 'success');
      setReponseMessage('');
      setShowRepondre(false);
      setReponses(getReponsesByDemande(demande._id));
    } else {
      toast.show(result.error || "Impossible d'envoyer la réponse", 'error');
    }

    setLoading(false);
  };

  const handleContact = (vendeurId?: string) => {
    if (!user) {
      onShowAuth();
      return;
    }

    const targetUserId = vendeurId || demande.acheteurId;
    const conversationId = startConversation(demande._id, demande.titre, user._id, targetUserId);
    
    onNavigate('chat', {
      conversationId,
      demandeId: demande._id,
      demandeTitre: demande.titre,
      otherUserId: targetUserId,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-14 md:top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => onNavigate('demandes')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900 truncate">Détail de la demande</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Images */}
        {demande.images.length > 0 ? (
          <div className="relative bg-gray-100">
            <img
              src={demande.images[currentImage]?.url}
              alt={demande.titre}
              className="w-full h-64 md:h-96 object-contain"
            />
            {demande.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((prev) => (prev - 1 + demande.images.length) % demande.images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImage((prev) => (prev + 1) % demande.images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {demande.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-2 h-2 rounded-full ${idx === currentImage ? 'bg-blue-600' : 'bg-white/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
            {demande.badge && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-medium ${BADGE_STYLES[demande.badge].bg} ${BADGE_STYLES[demande.badge].text}`}>
                {BADGE_STYLES[demande.badge].label}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <span className="text-6xl">{CATEGORIES.find(c => c.id === demande.categorie)?.icon || '📦'}</span>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-6">
          <Badge variant="info" size="md">
            {CATEGORIES.find(c => c.id === demande.categorie)?.name || demande.categorie}
          </Badge>
          
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{demande.titre}</h1>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(demande.budget)}</p>
          
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <LocationIcon className="w-4 h-4" />
              {demande.localisation}
            </span>
            <span>Publié le {formatDate(demande.dateCreation)}</span>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{demande.description}</p>
          </div>

          {/* Demandeur */}
          <Card className="mt-6 p-4">
            <div className="flex items-center gap-3">
              <Avatar src={demande.acheteur?.avatar} name={demande.acheteur?.nom || 'Anonyme'} size="lg" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{demande.acheteur?.nom}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <LocationIcon className="w-3 h-3" />
                  {demande.acheteur?.localisation}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions pour vendeur */}
          {!isOwner && (
            <div className="mt-6 flex gap-3">
              {isVendeur && !hasAlreadyResponded && (
                <Button fullWidth onClick={() => setShowRepondre(true)}>
                  Répondre à cette demande
                </Button>
              )}
              {hasAlreadyResponded && (
                <p className="text-green-600 font-medium py-2">✓ Vous avez déjà répondu à cette demande</p>
              )}
              <Button variant="outline" onClick={() => handleContact()}>
                <ChatIcon className="w-5 h-5 mr-2" />
                Contacter
              </Button>
            </div>
          )}

          {/* Réponses (pour le propriétaire) */}
          {isOwner && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Réponses reçues ({reponses.length})
              </h2>
              
              {reponses.length === 0 ? (
                <EmptyState
                  title="Aucune réponse pour le moment"
                  description="Les vendeurs verront votre demande et pourront y répondre"
                />
              ) : (
                <div className="space-y-4">
                  {reponses.map((reponse) => (
                    <Card key={reponse._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar src={reponse.vendeur?.avatar} name={reponse.vendeur?.nom || 'Vendeur'} size="md" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">{reponse.vendeur?.nom}</p>
                            <span className="text-xs text-gray-500">
                              {formatDate(reponse.dateCreation)}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-2">{reponse.message}</p>
                          
                          {reponse.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {reponse.images.map((img, idx) => (
                                <img key={idx} src={img.url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleContact(reponse.vendeurId)}
                            >
                              <ChatIcon className="w-4 h-4 mr-1" />
                              Discuter
                            </Button>
                            {reponse.vendeur?.telephone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`tel:${reponse.vendeur?.telephone}`)}
                              >
                                <PhoneIcon className="w-4 h-4 mr-1" />
                                Appeler
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Répondre */}
      <Modal isOpen={showRepondre} onClose={() => setShowRepondre(false)} title="Répondre à la demande">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">{demande.titre}</p>
            <p className="font-semibold text-blue-600">{formatPrice(demande.budget)}</p>
          </div>
          
          <Textarea
            label="Votre message"
            placeholder="Décrivez votre offre, le prix proposé, les détails..."
            rows={5}
            value={reponseMessage}
            onChange={(e) => setReponseMessage(e.target.value)}
          />
          
          <Button fullWidth loading={loading} onClick={handleRepondre}>
            Envoyer ma réponse
          </Button>
        </div>
      </Modal>
    </div>
  );
}
