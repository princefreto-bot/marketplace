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
  const { getNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      setNotifications(getNotifications(user._id));
    }
  }, [user, getNotifications]);

  const handleNotificationClick = async (notif: Notification) => {
    await markAsRead(notif._id);
    setNotifications(getNotifications(user!._id));

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
    if (user) {
      await markAllAsRead(user._id);
      setNotifications(getNotifications(user._id));
    }
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
                className={`w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors ${
                  !notif.read ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notif.data.title}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(notif.dateCreation)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{notif.data.message}</p>
                </div>
                
                {!notif.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
