/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RÉSIDENCE - Application principale
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { FullScreenLoader } from '@components/common';
import { Layout, AdminRoute, OwnerRoute, ProtectedRoute } from '@components/layout';

// Pages
import Home from '@pages/Home';
import RoomDetail from '@pages/RoomDetail';
import Favorites from '@pages/Favorites';
import HowItWorks from '@pages/HowItWorks';
import Owner from '@pages/Owner';
import Login from '@pages/Login';
import Register from '@pages/Register';
import Profile from '@pages/Profile';

// Dashboard Pages
import AdminDashboard from '@pages/dashboard/AdminDashboard';
import OwnerDashboard from '@pages/dashboard/OwnerDashboard';

// Payment Pages
import PaymentInit from '@pages/payment/PaymentInit';
import PaymentSuccess from '@pages/payment/PaymentSuccess';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      {/* Routes avec Layout */}
      <Route path="/" element={<Layout />}>
        {/* Pages publiques */}
        <Route index element={<Home />} />
        <Route path="room/:id" element={<RoomDetail />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="owner" element={<Owner />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Pages protégées (utilisateur connecté) */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Paiement */}
        <Route
          path="payment/:roomId"
          element={
            <ProtectedRoute>
              <PaymentInit />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Propriétaire */}
        <Route
          path="dashboard"
          element={
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          }
        />

        {/* Dashboard Admin */}
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Route>

      {/* Page 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="font-display text-4xl mb-4">404</h1>
            <p className="font-body text-primary-500 mb-8">Page non trouvée</p>
            <a href="/" className="btn-secondary">
              Retour à l'accueil
            </a>
          </div>
        }
      />
    </Routes>
  );
}
