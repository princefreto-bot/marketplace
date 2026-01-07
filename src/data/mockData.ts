import { User, Demande, Reponse, Message, Notification, SocialLink, Slider, Conversation } from '../types';

// Users
export const mockUsers: User[] = [
  {
    _id: 'admin1',
    role: 'admin',
    nom: 'Admin Local Deals',
    email: 'admin@localdeals.tg',
    telephone: '+228 79 90 72 62',
    localisation: 'Lomé, Togo',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=2563EB&color=fff',
    isBanned: false,
    dateCreation: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    _id: 'user1',
    role: 'acheteur',
    nom: 'Marie Dupont',
    email: 'marie@test.com',
    telephone: '+228 90 12 34 56',
    localisation: 'Lomé, Togo',
    avatar: 'https://ui-avatars.com/api/?name=Marie+Dupont&background=10B981&color=fff',
    isBanned: false,
    dateCreation: '2024-01-15T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    _id: 'user2',
    role: 'vendeur',
    nom: 'Jean Kokou',
    email: 'jean@test.com',
    telephone: '+228 91 23 45 67',
    localisation: 'Kara, Togo',
    avatar: 'https://ui-avatars.com/api/?name=Jean+Kokou&background=F59E0B&color=fff',
    isBanned: false,
    dateCreation: '2024-01-20T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    _id: 'user3',
    role: 'vendeur',
    nom: 'Sophie Mensah',
    email: 'sophie@test.com',
    telephone: '+228 92 34 56 78',
    localisation: 'Sokodé, Togo',
    avatar: 'https://ui-avatars.com/api/?name=Sophie+Mensah&background=EF4444&color=fff',
    isBanned: false,
    dateCreation: '2024-02-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
];

// Demandes
export const mockDemandes: Demande[] = [
  {
    _id: 'demande1',
    acheteurId: 'user1',
    titre: 'Recherche iPhone 14 Pro Max',
    description: 'Je cherche un iPhone 14 Pro Max en bon état, de préférence couleur noir ou violet. Capacité minimum 256GB. Accessoires originaux souhaités.',
    budget: 450000,
    images: [
      { url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400', publicId: 'iphone1' },
      { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', publicId: 'iphone2' },
    ],
    categorie: 'electronique',
    localisation: 'Lomé, Togo',
    badge: 'urgent',
    status: 'active',
    dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'demande2',
    acheteurId: 'user1',
    titre: 'Appartement F3 à louer',
    description: 'Cherche un appartement F3 dans le quartier de Tokoin ou Djidjolé. Budget mensuel jusqu\'à 150 000 FCFA. Disponibilité immédiate souhaitée.',
    budget: 150000,
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', publicId: 'apt1' },
    ],
    categorie: 'immobilier',
    localisation: 'Lomé, Togo',
    badge: 'top',
    status: 'active',
    dateCreation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'demande3',
    acheteurId: 'user1',
    titre: 'Toyota Corolla 2018+',
    description: 'Recherche Toyota Corolla année 2018 ou plus récente. Kilométrage inférieur à 80 000 km. Boîte automatique de préférence.',
    budget: 8500000,
    images: [
      { url: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400', publicId: 'toyota1' },
    ],
    categorie: 'vehicules',
    localisation: 'Lomé, Togo',
    badge: 'sponsored',
    status: 'active',
    dateCreation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'demande4',
    acheteurId: 'user1',
    titre: 'Robe de soirée taille M',
    description: 'Cherche une belle robe de soirée taille M pour un mariage. Couleur bordeaux ou bleu marine de préférence.',
    budget: 35000,
    images: [
      { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', publicId: 'robe1' },
    ],
    categorie: 'mode',
    localisation: 'Lomé, Togo',
    badge: 'new',
    status: 'active',
    dateCreation: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'demande5',
    acheteurId: 'user1',
    titre: 'Réfrigérateur 2 portes',
    description: 'Recherche réfrigérateur 2 portes, capacité minimum 300L. Marque Samsung ou LG de préférence.',
    budget: 180000,
    images: [
      { url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400', publicId: 'frigo1' },
    ],
    categorie: 'maison',
    localisation: 'Sokodé, Togo',
    status: 'active',
    dateCreation: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'demande6',
    acheteurId: 'user1',
    titre: 'Professeur de maths à domicile',
    description: 'Cherche professeur de mathématiques pour cours particuliers à domicile. Niveau Terminale C. 2 à 3 séances par semaine.',
    budget: 50000,
    images: [],
    categorie: 'services',
    localisation: 'Lomé, Togo',
    status: 'active',
    dateCreation: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Réponses
export const mockReponses: Reponse[] = [
  {
    _id: 'reponse1',
    demandeId: 'demande1',
    vendeurId: 'user2',
    message: 'Bonjour! J\'ai un iPhone 14 Pro Max 256GB noir en excellent état. Utilisé pendant 6 mois seulement. Tous les accessoires originaux inclus. Prix: 420 000 FCFA négociable.',
    images: [
      { url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400', publicId: 'rep1' },
    ],
    dateCreation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'reponse2',
    demandeId: 'demande1',
    vendeurId: 'user3',
    message: 'Salut! Je vends mon iPhone 14 Pro Max 512GB violet. État neuf, acheté il y a 3 mois. Prix: 480 000 FCFA.',
    images: [],
    dateCreation: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'reponse3',
    demandeId: 'demande2',
    vendeurId: 'user2',
    message: 'J\'ai un F3 disponible à Tokoin, proche du marché. 2 chambres, salon, cuisine équipée, douche moderne. 140 000 FCFA/mois charges comprises.',
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', publicId: 'apt2' },
    ],
    dateCreation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Messages
export const mockMessages: Message[] = [
  {
    _id: 'msg1',
    conversationId: 'conv1',
    demandeId: 'demande1',
    demandeTitre: 'Recherche iPhone 14 Pro Max',
    senderId: 'user2',
    receiverId: 'user1',
    message: 'Bonjour! Êtes-vous toujours intéressé par l\'iPhone?',
    images: [],
    dateCreation: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'msg2',
    conversationId: 'conv1',
    demandeId: 'demande1',
    demandeTitre: 'Recherche iPhone 14 Pro Max',
    senderId: 'user1',
    receiverId: 'user2',
    message: 'Oui! Est-ce possible de le voir demain?',
    images: [],
    dateCreation: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'msg3',
    conversationId: 'conv1',
    demandeId: 'demande1',
    demandeTitre: 'Recherche iPhone 14 Pro Max',
    senderId: 'user2',
    receiverId: 'user1',
    message: 'Parfait! On peut se retrouver à 15h au marché de Hédzranawoé?',
    images: [],
    dateCreation: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

// Notifications
export const mockNotifications: Notification[] = [
  {
    _id: 'notif1',
    userId: 'user1',
    type: 'reponse',
    data: {
      title: 'Nouvelle réponse',
      message: 'Jean Kokou a répondu à votre demande "Recherche iPhone 14 Pro Max"',
      demandeId: 'demande1',
    },
    read: false,
    dateCreation: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif2',
    userId: 'user1',
    type: 'message',
    data: {
      title: 'Nouveau message',
      message: 'Jean Kokou vous a envoyé un message',
      conversationId: 'conv1',
      senderId: 'user2',
    },
    read: false,
    dateCreation: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    _id: 'notif3',
    userId: 'user2',
    type: 'nouvelle_demande',
    data: {
      title: 'Nouvelle demande',
      message: 'Une nouvelle demande dans "Électronique" correspond à votre profil',
      demandeId: 'demande1',
    },
    read: true,
    dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Social Links
export const mockSocialLinks: SocialLink[] = [
  { _id: 'social1', platform: 'Facebook', url: 'https://facebook.com/localdeals', icon: 'facebook', isActive: true, order: 1 },
  { _id: 'social2', platform: 'WhatsApp', url: 'https://wa.me/22879907262', icon: 'whatsapp', isActive: true, order: 2 },
  { _id: 'social3', platform: 'Instagram', url: 'https://instagram.com/localdeals', icon: 'instagram', isActive: true, order: 3 },
  { _id: 'social4', platform: 'Twitter', url: 'https://twitter.com/localdeals', icon: 'twitter', isActive: true, order: 4 },
];

// Sliders
export const mockSliders: Slider[] = [
  {
    _id: 'slider1',
    title: 'Bienvenue sur Local Deals Togo',
    description: 'La première plateforme de petites annonces 100% togolaise',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
    buttonText: 'Découvrir',
    buttonLink: '#demandes',
    isActive: true,
    order: 1,
  },
  {
    _id: 'slider2',
    title: 'Achetez et Vendez Facilement',
    description: 'Des milliers d\'offres près de chez vous',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200',
    buttonText: 'Publier une annonce',
    buttonLink: '#publier',
    isActive: true,
    order: 2,
  },
  {
    _id: 'slider3',
    title: 'Rejoignez la Communauté',
    description: 'Plus de 10 000 utilisateurs nous font confiance',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
    buttonText: 'S\'inscrire',
    buttonLink: '#inscription',
    isActive: true,
    order: 3,
  },
];

// Helper to get conversations
export const getConversations = (userId: string): Conversation[] => {
  const userMessages = mockMessages.filter(m => m.senderId === userId || m.receiverId === userId);
  const conversationMap = new Map<string, Message[]>();
  
  userMessages.forEach(msg => {
    const existing = conversationMap.get(msg.conversationId) || [];
    conversationMap.set(msg.conversationId, [...existing, msg]);
  });

  return Array.from(conversationMap.entries()).map(([convId, messages]) => {
    const sortedMessages = messages.sort((a, b) => 
      new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );
    const lastMessage = sortedMessages[0];
    const otherUserId = lastMessage.senderId === userId ? lastMessage.receiverId : lastMessage.senderId;
    const otherUser = mockUsers.find(u => u._id === otherUserId)!;
    
    return {
      conversationId: convId,
      demandeId: lastMessage.demandeId,
      demandeTitre: lastMessage.demandeTitre,
      otherUser,
      lastMessage,
      unreadCount: sortedMessages.filter(m => m.receiverId === userId).length,
    };
  });
};
