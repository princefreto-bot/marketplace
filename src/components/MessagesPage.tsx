import { ChatIcon, ArrowRightIcon } from './Icons';
import { Card, Avatar, Badge, EmptyState } from './UI';
import { useAuth, useMessages } from '../store/useStore';
import { Conversation } from '../types';

interface MessagesPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export function MessagesPage({ onNavigate }: MessagesPageProps) {
  const { user } = useAuth();
  const { getConversationsForUser } = useMessages();

  const conversations: Conversation[] = user ? getConversationsForUser(user._id) : [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleOpenChat = (conv: Conversation) => {
    onNavigate('chat', {
      conversationId: conv.conversationId,
      demandeId: conv.demandeId,
      demandeTitre: conv.demandeTitre,
      otherUserId: conv.otherUser?._id,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-14 md:top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {conversations.length === 0 ? (
          <EmptyState
            icon={<ChatIcon className="w-16 h-16" />}
            title="Aucune conversation"
            description="Vos conversations avec les vendeurs et acheteurs apparaîtront ici"
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <Card
                key={conv.conversationId}
                className="rounded-none border-0 shadow-none"
                hover
                onClick={() => handleOpenChat(conv)}
              >
                <div className="p-4 flex items-center gap-3">
                  <div className="relative">
                    <Avatar src={conv.otherUser.avatar} name={conv.otherUser.nom} size="lg" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 truncate">{conv.otherUser.nom}</p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(conv.lastMessage.dateCreation)}
                      </span>
                    </div>
                    
                    <Badge variant="info" size="sm">
                      {conv.demandeTitre.slice(0, 30)}...
                    </Badge>
                    
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conv.lastMessage.senderId === user?._id ? 'Vous: ' : ''}
                      {conv.lastMessage.message}
                    </p>
                  </div>
                  
                  <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
