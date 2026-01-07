import { useState, useEffect } from 'react';
import { HomeIcon, SearchIcon, PlusIcon, ChatIcon, UserIcon, BellIcon, MenuIcon, CloseIcon, LogoutIcon, SettingsIcon } from './Icons';
import { Avatar, Badge } from './UI';
import { useAuth, useNotifications } from '../store/useStore';

type Page = 'home' | 'demandes' | 'publish' | 'messages' | 'profile' | 'detail' | 'chat' | 'notifications' | 'admin';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page, data?: Record<string, unknown>) => void;
  onShowAuth: () => void;
}

export function Layout({ children, currentPage, onNavigate, onShowAuth }: LayoutProps) {
  const { user, logout } = useAuth();
  const { getUnreadCount } = useNotifications();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      setUnreadCount(getUnreadCount(user._id));
    }
  }, [user, getUnreadCount]);

  const navItems = [
    { id: 'home' as Page, icon: HomeIcon, label: 'Accueil' },
    { id: 'demandes' as Page, icon: SearchIcon, label: 'Demandes' },
    { id: 'publish' as Page, icon: PlusIcon, label: 'Publier', special: true },
    { id: 'messages' as Page, icon: ChatIcon, label: 'Messages', badge: unreadCount },
    { id: 'profile' as Page, icon: UserIcon, label: 'Profil' },
  ];

  const handleNavClick = (page: Page) => {
    if ((page === 'publish' || page === 'messages' || page === 'profile') && !user) {
      onShowAuth();
      return;
    }
    if (page === 'profile' && user?.role === 'admin') {
      onNavigate('admin');
      return;
    }
    onNavigate(page);
  };

  // Hide bottom nav on chat and detail pages on mobile
  const hideBottomNav = currentPage === 'chat' || currentPage === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">LD</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Local Deals <span className="text-blue-600">Togo</span>
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="flex items-center gap-6">
              <button 
                onClick={() => onNavigate('home')}
                className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Accueil
              </button>
              <button 
                onClick={() => onNavigate('demandes')}
                className={`text-sm font-medium transition-colors ${currentPage === 'demandes' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Demandes
              </button>
              <button 
                onClick={() => handleNavClick('publish')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Publier une annonce
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button 
                    onClick={() => onNavigate('notifications')}
                    className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <BellIcon className="w-6 h-6 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleNavClick('messages')}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <ChatIcon className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Avatar src={user.avatar} name={user.nom} size="md" />
                    </button>
                    
                    {showMobileMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMobileMenu(false)}
                        />
                        <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="font-semibold text-gray-900">{user.nom}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'vendeur' ? 'success' : 'info'} size="sm">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </div>
                          <button 
                            onClick={() => { handleNavClick('profile'); setShowMobileMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            <SettingsIcon className="w-5 h-5" />
                            {user.role === 'admin' ? 'Admin Dashboard' : 'Mon Profil'}
                          </button>
                          <button 
                            onClick={() => { logout(); setShowMobileMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-gray-50"
                          >
                            <LogoutIcon className="w-5 h-5" />
                            Déconnexion
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={onShowAuth}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LD</span>
            </div>
            <span className="font-bold text-gray-900">
              Local Deals <span className="text-blue-600">Togo</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={() => onNavigate('notifications')}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BellIcon className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MenuIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-900">Menu</span>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            {user ? (
              <>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} name={user.nom} size="lg" />
                    <div>
                      <p className="font-semibold text-gray-900">{user.nom}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'vendeur' ? 'success' : 'info'} size="sm">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { handleNavClick('profile'); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <SettingsIcon className="w-5 h-5" />
                    {user.role === 'admin' ? 'Admin Dashboard' : 'Mon Profil'}
                  </button>
                  <button 
                    onClick={() => { logout(); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-gray-50 rounded-xl"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4">
                <button 
                  onClick={() => { onShowAuth(); setShowMobileMenu(false); }}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700"
                >
                  Connexion / Inscription
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`pb-20 md:pb-0 ${hideBottomNav ? 'pb-0' : ''}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              if (item.special) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="-mt-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
                  >
                    <PlusIcon className="w-7 h-7 text-white" />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="flex flex-col items-center gap-1 py-2 px-4"
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
