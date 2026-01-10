import { useState, useEffect } from 'react';
import { ArrowLeftIcon, BellIcon, ChatIcon, CheckIcon } from './Icons';
import { EmptyState, Badge } from './UI';
import { useAuth, useNotifications } from '../store/useStore';
import { Notification } from '../types';

interface NotificationsPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { user } = useAuth();
  const { getNotifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    setNotifications(getNotifications(user._id));
    // Refresh from API in background
    void refreshNotifications(user._id).then(() => {
      setNotifications(getNotifications(user._id));
    });
  }, [user, getNotifications, refreshNotifications]);

  const handleNotificationClick = async (notif: Notification) => {
    await markAsRead(notif._id);
    if (user) setNotifications(getNotifications(user._id));

    // Redirect based on notification type
    switch (notif.type) {
      case 'message':
        if (notif.data.conversationId) {
          onNavigate('chat', {
            conversationId: notif.data.conversationId,
            demandeId: notif.data.demandeId || '',
            demandeTitre: '',
            otherUserId: notif.data.senderId || '',
          });
        }
        break;
      case 'reponse':
      case 'nouvelle_demande':
        if (notif.data.demandeId) {
          onNavigate('detail', { demandeId: notif.data.demandeId });
        }
        break;
      case 'admin':
      case 'ban':
        // Just mark as read, no redirect
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user._id);
    setNotifications(getNotifications(user._id));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <ChatIcon className="w-5 h-5 text-blue-600" />;
      case 'reponse':
        return <span className="text-lg">💬</span>;
      case 'nouvelle_demande':
        return <span className="text-lg">📢</span>;
      case 'admin':
        return <span className="text-lg">⚙️</span>;
      case 'ban':
        return <span className="text-lg">🚫</span>;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationStyle = (type: Notification['type'], read: boolean) => {
    if (read) return 'bg-white';
    switch (type) {
      case 'message':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'reponse':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'nouvelle_demande':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'admin':
        return 'bg-purple-50 border-l-4 border-purple-500';
      case 'ban':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-gray-50';
    }
  };

  const getIconBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100';
      case 'reponse':
        return 'bg-green-100';
      case 'nouvelle_demande':
        return 'bg-orange-100';
      case 'admin':
        return 'bg-purple-100';
      case 'ban':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'Nouveau message';
      case 'reponse':
        return 'Nouvelle réponse';
      case 'nouvelle_demande':
        return 'Nouvelle demande';
      case 'admin':
        return 'Message admin';
      case 'ban':
        return 'Avertissement';
      default:
        return 'Notification';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-14 md:top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">{unreadCount}</Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              <CheckIcon className="w-4 h-4" />
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="w-16 h-16" />}
            title="Aucune notification"
            description="Vous n'avez pas de notification pour le moment"
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <button
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full p-4 flex items-start gap-3 text-left hover:bg-gray-100/50 transition-all ${getNotificationStyle(notif.type, notif.read)}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBgColor(notif.type)}`}>
                  {getNotificationIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        notif.type === 'message' ? 'bg-blue-200 text-blue-800' :
                        notif.type === 'reponse' ? 'bg-green-200 text-green-800' :
                        notif.type === 'nouvelle_demande' ? 'bg-orange-200 text-orange-800' :
                        notif.type === 'admin' ? 'bg-purple-200 text-purple-800' :
                        notif.type === 'ban' ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {getTypeLabel(notif.type)}
                      </span>
                      <p className={`font-semibold mt-1 ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.data.title}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 bg-white/50 px-2 py-1 rounded">
                      {formatTime(notif.dateCreation)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.data.message}</p>
                  
                  {/* Call to action */}
                  <div className="mt-2">
                    <span className="text-xs text-blue-600 font-medium">
                      {notif.type === 'message' ? 'Ouvrir la conversation →' :
                       notif.type === 'reponse' ? 'Voir la réponse →' :
                       notif.type === 'nouvelle_demande' ? 'Voir la demande →' :
                       'Voir les détails →'}
                    </span>
                  </div>
                </div>
                
                {!notif.read && (
                  <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-2 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
