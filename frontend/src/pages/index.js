/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Export centralisé des pages
 * ═══════════════════════════════════════════════════════════════════════════
 */

export { default as Home } from './Home';
export { default as RoomDetail } from './RoomDetail';
export { default as Favorites } from './Favorites';
export { default as HowItWorks } from './HowItWorks';
export { default as Owner } from './Owner';
export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as Profile } from './Profile';

// Dashboard
export { default as AdminDashboard } from './dashboard/AdminDashboard';
export { default as OwnerDashboard } from './dashboard/OwnerDashboard';

// Payment
export { default as PaymentInit } from './payment/PaymentInit';
export { default as PaymentSuccess } from './payment/PaymentSuccess';
