/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AdminDashboard - Tableau de bord administrateur
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Building, 
  Users, 
  CreditCard, 
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { Button, Badge, PageLoader, RoomStatusBadge, RoleBadge } from '@components/common';
import adminService from '@services/adminService';
import toast from 'react-hot-toast';

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Statistiques Dashboard
 */
function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await adminService.getDashboard();
        setStats(response.data);
      } catch (error) {
        toast.error('Erreur chargement statistiques');
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (isLoading) return <PageLoader />;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 border border-primary-200">
        <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
          Chambres
        </span>
        <p className="font-display text-3xl mt-2">{stats?.rooms?.total || 0}</p>
        <span className="font-body text-xs text-primary-400">
          {stats?.rooms?.awaitingValidation || 0} en attente
        </span>
      </div>
      <div className="bg-white p-6 border border-primary-200">
        <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
          Utilisateurs
        </span>
        <p className="font-display text-3xl mt-2">{stats?.users?.total || 0}</p>
        <span className="font-body text-xs text-primary-400">
          +{stats?.users?.newThisMonth || 0} ce mois
        </span>
      </div>
      <div className="bg-white p-6 border border-primary-200">
        <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
          Paiements
        </span>
        <p className="font-display text-3xl mt-2">{stats?.payments?.totalPayments || 0}</p>
        <span className="font-body text-xs text-primary-400">
          {formatPrice(stats?.payments?.totalAmount || 0)} FCFA
        </span>
      </div>
      <div className="bg-white p-6 border border-primary-200">
        <span className="font-body text-sm text-primary-500 uppercase tracking-wider">
          Taux succès
        </span>
        <p className="font-display text-3xl mt-2">{stats?.contacts?.successRate || 0}%</p>
        <span className="font-body text-xs text-primary-400">
          {stats?.contacts?.success || 0} locations
        </span>
      </div>
    </div>
  );
}

/**
 * Liste des chambres en attente
 */
function PendingRooms() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingRooms();
  }, []);

  const loadPendingRooms = async () => {
    try {
      const response = await adminService.getPendingRooms();
      setRooms(response.data.rooms);
    } catch (error) {
      toast.error('Erreur chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.approveRoom(id);
      toast.success('Chambre approuvée');
      loadPendingRooms();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet :');
    if (!reason) return;
    
    try {
      await adminService.rejectRoom(id, reason);
      toast.success('Chambre rejetée');
      loadPendingRooms();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) return <PageLoader />;

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 mx-auto text-primary-300 mb-4" />
        <p className="font-body text-primary-500">Aucune chambre en attente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <div key={room._id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-primary-200 hover:border-black transition-colors">
          <div className="w-24 h-20 bg-primary-100 overflow-hidden flex-shrink-0">
            <img
              src={room.photos?.[0]?.url || room.photos?.[0]}
              alt={room.quartier}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg">{room.quartier}</h3>
            <p className="font-body text-primary-500 text-sm">
              {formatPrice(room.prixMensuel)} FCFA/mois · {room.dimensions?.surface} m²
            </p>
            <p className="font-body text-primary-400 text-sm">
              Par {room.owner?.name} · {formatDate(room.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleApprove(room._id)}>
              Approuver
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleReject(room._id)}>
              Rejeter
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Liste des utilisateurs
 */
function UsersList() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await adminService.getAllUsers();
        setUsers(response.data.users);
      } catch (error) {
        toast.error('Erreur chargement');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  if (isLoading) return <PageLoader />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary-200">
            <th className="text-left py-3 px-4 font-body text-sm text-primary-500 uppercase tracking-wider">
              Nom
            </th>
            <th className="text-left py-3 px-4 font-body text-sm text-primary-500 uppercase tracking-wider">
              Email
            </th>
            <th className="text-left py-3 px-4 font-body text-sm text-primary-500 uppercase tracking-wider">
              Rôle
            </th>
            <th className="text-left py-3 px-4 font-body text-sm text-primary-500 uppercase tracking-wider">
              Inscrit le
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b border-primary-100 hover:bg-primary-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-display text-sm">
                    {user.name?.charAt(0)}
                  </div>
                  <span className="font-display">{user.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 font-body text-primary-600">{user.email}</td>
              <td className="py-3 px-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="py-3 px-4 font-body text-primary-500">
                {formatDate(user.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Dashboard principal
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'pending', label: 'En attente', icon: Clock },
    { id: 'rooms', label: 'Chambres', icon: Building },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-24 lg:pb-8 bg-primary-50">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <span className="font-body text-sm tracking-[0.2em] uppercase text-primary-500">
              Administration
            </span>
            <h1 className="font-display text-3xl md:text-4xl mt-1">Tableau de bord</h1>
          </div>
        </motion.div>

        {/* Stats */}
        <DashboardStats />

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-primary-200"
        >
          {/* Tab Headers */}
          <div className="flex border-b border-primary-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-body text-sm tracking-wider uppercase whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-black border-b-2 border-black -mb-px'
                      : 'text-primary-500 hover:text-black'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="font-display text-xl mb-4">Activité récente</h3>
                <p className="font-body text-primary-500">
                  Bienvenue dans votre tableau de bord administrateur.
                </p>
              </div>
            )}
            {activeTab === 'pending' && <PendingRooms />}
            {activeTab === 'users' && <UsersList />}
            {activeTab === 'rooms' && (
              <div className="text-center py-12">
                <Building className="w-12 h-12 mx-auto text-primary-300 mb-4" />
                <p className="font-body text-primary-500">
                  Liste complète des chambres (à implémenter)
                </p>
              </div>
            )}
            {activeTab === 'payments' && (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-primary-300 mb-4" />
                <p className="font-body text-primary-500">
                  Historique des paiements (à implémenter)
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
