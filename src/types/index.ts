export type UserRole = 'acheteur' | 'vendeur' | 'admin';

export interface User {
  _id: string;
  role: UserRole;
  nom: string;
  email: string;
  telephone: string;
  localisation: string;
  avatar: string;
  isBanned: boolean;
  banType?: 'temporary' | 'permanent';
  banReason?: string;
  banExpiry?: string;
  dateCreation: string;
  lastLogin: string;
}

export type BadgeType = 'new' | 'urgent' | 'top' | 'sponsored';

export interface ImageData {
  url: string;
  publicId: string;
}

export interface Demande {
  _id: string;
  acheteurId: string;
  acheteur?: User;
  titre: string;
  description: string;
  budget: number;
  images: ImageData[];
  categorie: string;
  localisation: string;
  badge?: BadgeType;
  status: 'active' | 'closed';
  dateCreation: string;
}

export interface Reponse {
  _id: string;
  demandeId: string;
  demande?: Demande;
  vendeurId: string;
  vendeur?: User;
  message: string;
  images: ImageData[];
  dateCreation: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  demandeId: string;
  demandeTitre: string;
  senderId: string;
  receiverId: string;
  message: string;
  images: ImageData[];
  dateCreation: string;
}

export interface Conversation {
  conversationId: string;
  demandeId: string;
  demandeTitre: string;
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
}

export type NotificationType = 'message' | 'reponse' | 'nouvelle_demande' | 'admin' | 'ban';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  data: {
    title: string;
    message: string;
    demandeId?: string;
    conversationId?: string;
    senderId?: string;
  };
  read: boolean;
  dateCreation: string;
}

export interface SocialLink {
  _id: string;
  platform: string;
  url: string;
  icon: string;
  isActive: boolean;
  order: number;
}

export interface Slider {
  _id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
}

export interface Stats {
  totalUsers: number;
  totalDemandes: number;
  totalReponses: number;
  totalMessages: number;
}

export const CATEGORIES = [
  { id: 'electronique', name: 'Électronique', icon: '📱' },
  { id: 'mode', name: 'Mode & Vêtements', icon: '👗' },
  { id: 'maison', name: 'Maison & Jardin', icon: '🏠' },
  { id: 'vehicules', name: 'Véhicules', icon: '🚗' },
  { id: 'services', name: 'Services', icon: '🔧' },
  { id: 'loisirs', name: 'Loisirs & Sports', icon: '⚽' },
  { id: 'immobilier', name: 'Immobilier', icon: '🏢' },
  { id: 'autre', name: 'Autre', icon: '📦' },
];

export const BADGE_STYLES: Record<BadgeType, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-green-100', text: 'text-green-700', label: 'Nouveau' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
  top: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Top' },
  sponsored: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sponsorisé' },
};
