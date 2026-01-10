import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './components/HomePage';
import { DemandesPage } from './components/DemandesPage';
import { DemandeDetail } from './components/DemandeDetail';
import { PublishPage } from './components/PublishPage';
import { MessagesPage } from './components/MessagesPage';
import { ChatPage } from './components/ChatPage';
import { NotificationsPage } from './components/NotificationsPage';
import { ProfilePage } from './components/ProfilePage';
import { AdminPage } from './components/AdminPage';
import { Footer } from './components/Footer';
import LegalPage from './components/LegalPage';
import { useAuth } from './store/useStore';

type Page = 'home' | 'demandes' | 'publish' | 'messages' | 'profile' | 'detail' | 'chat' | 'notifications' | 'admin' | 'legal';

interface PageData {
  demandeId?: string;
  categorie?: string;
  conversationId?: string;
  demandeTitre?: string;
  otherUserId?: string;
}

export function App() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageData, setPageData] = useState<PageData>({});
  const [showAuth, setShowAuth] = useState(false);
  const [, forceUpdate] = useState({});

  // Force update when user changes
  useEffect(() => {
    forceUpdate({});
  }, [user]);

  const handleNavigate = (page: string, data?: Record<string, unknown>) => {
    setCurrentPage(page as Page);
    setPageData((data as PageData) || {});
    window.scrollTo(0, 0);
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  // Redirect to home if user logs out while on protected page
  useEffect(() => {
    if (!user && ['publish', 'messages', 'profile', 'chat', 'admin'].includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [user, currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <HomePage onNavigate={handleNavigate} onShowAuth={handleShowAuth} />
            <Footer onNavigate={handleNavigate} />
          </>
        );
      
      case 'demandes':
        return (
          <>
            <DemandesPage 
              onNavigate={handleNavigate} 
              initialCategorie={pageData.categorie}
            />
            <Footer onNavigate={handleNavigate} />
          </>
        );
      
      case 'detail':
        return (
          <DemandeDetail 
            demandeId={pageData.demandeId || ''} 
            onNavigate={handleNavigate}
            onShowAuth={handleShowAuth}
          />
        );
      
      case 'publish':
        return <PublishPage onNavigate={handleNavigate} />;
      
      case 'messages':
        return <MessagesPage onNavigate={handleNavigate} />;
      
      case 'chat':
        return (
          <ChatPage 
            conversationId={pageData.conversationId || ''}
            demandeId={pageData.demandeId || ''}
            demandeTitre={pageData.demandeTitre || ''}
            otherUserId={pageData.otherUserId || ''}
            onNavigate={handleNavigate}
          />
        );
      
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;
      
      case 'profile':
        return (
          <ProfilePage 
            onNavigate={handleNavigate}
            onShowAuth={handleShowAuth}
          />
        );
      
      case 'admin':
        return <AdminPage onNavigate={handleNavigate} />;
      
      case 'legal':
        return <LegalPage onBack={() => handleNavigate('home')} />;
      
      default:
        return <HomePage onNavigate={handleNavigate} onShowAuth={handleShowAuth} />;
    }
  };

  // Full screen pages (no layout wrapper)
  if (currentPage === 'chat' || currentPage === 'admin' || currentPage === 'legal') {
    return (
      <>
        {renderPage()}
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <>
      <Layout 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onShowAuth={handleShowAuth}
      >
        {renderPage()}
      </Layout>
      
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
