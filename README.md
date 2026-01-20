# 🏛️ RÉSIDENCE

> Plateforme d'intermédiation immobilière premium - Lomé, Togo

[![Made with React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb)](https://mongodb.com/)
[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com/)

---

## 📋 Description

**RÉSIDENCE** est une application web d'intermédiation immobilière qui connecte les personnes à la recherche d'une chambre avec les propriétaires à Lomé (Togo).

### 🎯 Proposition de valeur

- **Tiers de confiance** : Les utilisateurs ne contactent jamais directement les propriétaires
- **Transparence totale** : Photos HD, dimensions exactes, défauts mentionnés
- **Commission au succès** : Frais uniquement en cas de location effective

---

## 🏗️ Architecture

```
residence/
├── frontend/               # Application React (Vite)
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── services/       # Services API
│   │   ├── contexts/       # Contextes React
│   │   └── config/         # Configuration
│   └── ...
│
├── backend/                # API Node.js (Express)
│   ├── config/             # Configuration DB, CinetPay
│   ├── controllers/        # Logique métier
│   ├── middleware/         # Auth, validation
│   ├── models/             # Modèles MongoDB
│   ├── routes/             # Routes API
│   └── utils/              # Utilitaires
│
└── README.md
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)
- Compte CinetPay (pour les paiements)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Éditer .env.local avec l'URL de l'API
npm run dev
```

---

## ⚙️ Configuration

### Variables d'environnement Backend (.env)

```env
# Serveur
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/residence

# JWT
JWT_SECRET=votre_secret_jwt_super_long
JWT_EXPIRES_IN=7d

# CinetPay
CINETPAY_API_KEY=your_api_key
CINETPAY_SITE_ID=your_site_id
CINETPAY_SECRET_KEY=your_secret_key
CINETPAY_SANDBOX=true

# URLs
FRONTEND_URL=http://localhost:5173
CINETPAY_NOTIFY_URL=https://your-backend.onrender.com/api/payments/webhook
CINETPAY_RETURN_URL=https://your-frontend.onrender.com/payment/success
CINETPAY_CANCEL_URL=https://your-frontend.onrender.com/payment/cancel

# Admin par défaut
ADMIN_EMAIL=admin@residence.tg
ADMIN_PASSWORD=AdminResidence2024!
ADMIN_NAME=Administrateur
ADMIN_PHONE=+22890000000
```

### Variables d'environnement Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5000/api
VITE_MODE=development
```

---

## 📦 Déploiement sur Render

### ⚠️ IMPORTANT : Structure du projet

Ce projet utilise une architecture **monorepo** avec `backend/` et `frontend/` dans des sous-dossiers. Vous devez configurer le **Root Directory** correctement.

### Option A : Déploiement via Blueprint (Recommandé)

1. Fork/Push ce repository sur GitHub
2. Aller sur [Render Dashboard](https://dashboard.render.com)
3. Cliquer sur **New** → **Blueprint**
4. Connecter votre repository
5. Render détectera automatiquement le fichier `render.yaml`
6. Configurer les variables secrètes manuellement :
   - `MONGODB_URI`
   - `CINETPAY_API_KEY`
   - `CINETPAY_SITE_ID`
   - `CINETPAY_SECRET_KEY`
   - `ADMIN_PASSWORD`

### Option B : Déploiement Manuel

#### 1. Backend (Web Service)

1. Créer un nouveau **Web Service** sur Render
2. Connecter votre repository GitHub
3. **⚠️ Configuration IMPORTANTE** :
   - **Root Directory**: `backend` ← NE PAS OUBLIER !
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. Ajouter les **Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | (générer une clé sécurisée) |
| `JWT_EXPIRES_IN` | `7d` |
| `CINETPAY_API_KEY` | (votre clé) |
| `CINETPAY_SITE_ID` | (votre site ID) |
| `CINETPAY_SECRET_KEY` | (votre secret) |
| `CINETPAY_SANDBOX` | `true` |
| `FRONTEND_URL` | `https://votre-frontend.onrender.com` |
| `ADMIN_EMAIL` | `admin@residence.tg` |
| `ADMIN_PASSWORD` | (mot de passe fort) |

#### 2. Frontend (Static Site)

1. Créer un nouveau **Static Site** sur Render
2. Connecter votre repository GitHub
3. **⚠️ Configuration IMPORTANTE** :
   - **Root Directory**: `frontend` ← NE PAS OUBLIER !
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Ajouter les **Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://votre-backend.onrender.com/api` |
| `VITE_MODE` | `production` |

### 3. MongoDB Atlas

1. Créer un cluster gratuit sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Créer un utilisateur de base de données
3. **Network Access** : Ajouter `0.0.0.0/0` (autoriser toutes les IPs pour Render)
4. Copier la connection string et remplacer `<password>` par le mot de passe
5. Coller dans `MONGODB_URI` sur Render

### 4. Vérification du déploiement

1. Backend : Visiter `https://votre-backend.onrender.com/api/health`
   - Réponse attendue : `{"status":"OK","message":"RÉSIDENCE API is running"}`
2. Frontend : Visiter `https://votre-frontend.onrender.com`
3. Tester la connexion admin avec les identifiants configurés

---

## 🔐 Rôles et Permissions

| Rôle | Permissions |
|------|-------------|
| **User** | Consulter chambres, favoris, payer pour contacter |
| **Owner** | Tout User + publier des chambres |
| **Admin** | Tout + valider chambres, gérer utilisateurs, voir paiements |

---

## 💰 Modèle Économique

1. **Frais de mise en relation** : 2 000 FCFA pour contacter la plateforme
2. **Commission** : 1 mois de loyer (uniquement si location réussie)

---

## 🎨 Design System

- **Palette** : Noir & Blanc exclusivement
- **Typographie** : Playfair Display (titres) + Cormorant Garamond (corps)
- **Animations** : Framer Motion (subtiles et élégantes)
- **Approche** : Mobile-first, "Old Money" aesthetic

---

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `/` | Chambres en plein écran avec scroll snap |
| Détail chambre | `/room/:id` | Galerie swipeable, infos complètes |
| Favoris | `/favorites` | Chambres sauvegardées |
| Comment ça marche | `/how-it-works` | Explication du processus |
| Propriétaires | `/owner` | Landing page propriétaires |
| Connexion | `/login` | Authentification |
| Inscription | `/register` | Création de compte |
| Profil | `/profile` | Gestion du compte |
| Paiement | `/payment/:roomId` | Initiation paiement |
| Dashboard Owner | `/dashboard` | Gestion des chambres |
| Dashboard Admin | `/admin` | Administration complète |

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil
- `PUT /api/auth/me` - Modifier profil
- `POST /api/auth/favorites/:roomId` - Toggle favori

### Rooms
- `GET /api/rooms` - Liste des chambres
- `GET /api/rooms/:id` - Détail chambre
- `POST /api/rooms` - Créer (owner)
- `PUT /api/rooms/:id` - Modifier
- `GET /api/rooms/owner/my-rooms` - Mes chambres

### Payments
- `POST /api/payments/init` - Initialiser paiement
- `POST /api/payments/webhook` - Webhook CinetPay
- `GET /api/payments/history` - Historique

### Admin
- `GET /api/admin/dashboard` - Statistiques
- `GET /api/admin/rooms/pending` - Chambres à valider
- `PUT /api/admin/rooms/:id/approve` - Approuver
- `PUT /api/admin/rooms/:id/reject` - Rejeter
- `GET /api/admin/users` - Liste utilisateurs

---

## 🧪 Mode Développement

Le backend inclut un mode **SANDBOX** pour CinetPay qui simule les paiements sans transaction réelle.

```env
CINETPAY_SANDBOX=true
```

---

## 📄 License

Propriétaire - RÉSIDENCE © 2024

---

## 🤝 Contact

Pour toute question concernant le développement ou le déploiement, contactez l'équipe technique.
