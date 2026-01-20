# 🚀 Guide de Déploiement RÉSIDENCE sur Render

## ⚠️ IMPORTANT : Structure Monorepo

Ce projet contient **2 applications séparées** dans des sous-dossiers :
- `backend/` → API Node.js/Express
- `frontend/` → Application React/Vite

Vous devez créer **2 services séparés** sur Render.

---

## 📋 Étape 1 : Préparer MongoDB Atlas

1. Aller sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Créer un compte gratuit
3. Créer un cluster gratuit (M0)
4. **Database Access** : Créer un utilisateur avec mot de passe
5. **Network Access** : Ajouter `0.0.0.0/0` (accès depuis partout)
6. **Connect** : Copier la connection string

```
mongodb+srv://USERNAME:PASSWORD@cluster.xxxxx.mongodb.net/residence?retryWrites=true&w=majority
```

---

## 📋 Étape 2 : Déployer le Backend

### 2.1 Créer le service

1. Aller sur [Render Dashboard](https://dashboard.render.com)
2. Cliquer sur **New +** → **Web Service**
3. Connecter votre repository GitHub

### 2.2 Configuration CRITIQUE

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `residence-api` |
| **Region** | Frankfurt (EU) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **NE PAS OUBLIER** |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### 2.3 Variables d'environnement

Cliquer sur **Advanced** → **Add Environment Variable** :

| Clé | Valeur |
|-----|--------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://...` (votre URI MongoDB) |
| `JWT_SECRET` | (générer : `openssl rand -base64 64`) |
| `JWT_EXPIRES_IN` | `7d` |
| `CINETPAY_API_KEY` | (votre clé CinetPay) |
| `CINETPAY_SITE_ID` | (votre site ID) |
| `CINETPAY_SECRET_KEY` | (votre secret) |
| `CINETPAY_SANDBOX` | `true` |
| `FRONTEND_URL` | `https://residence-web.onrender.com` |
| `ADMIN_EMAIL` | `admin@residence.tg` |
| `ADMIN_PASSWORD` | (mot de passe fort) |
| `ADMIN_NAME` | `Administrateur` |
| `ADMIN_PHONE` | `+22890000000` |

### 2.4 Déployer

Cliquer sur **Create Web Service**

Attendre que le déploiement soit terminé (3-5 minutes).

**Vérifier** : Aller sur `https://residence-api.onrender.com/api/health`

Réponse attendue :
```json
{"status":"OK","message":"RÉSIDENCE API is running"}
```

---

## 📋 Étape 3 : Déployer le Frontend

### 3.1 Créer le service

1. Retourner sur [Render Dashboard](https://dashboard.render.com)
2. Cliquer sur **New +** → **Static Site**
3. Connecter le même repository GitHub

### 3.2 Configuration CRITIQUE

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `residence-web` |
| **Branch** | `main` |
| **Root Directory** | `frontend` ⚠️ **NE PAS OUBLIER** |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 3.3 Variables d'environnement

| Clé | Valeur |
|-----|--------|
| `VITE_API_URL` | `https://residence-api.onrender.com/api` |
| `VITE_MODE` | `production` |

### 3.4 Déployer

Cliquer sur **Create Static Site**

Attendre que le déploiement soit terminé (2-3 minutes).

---

## 📋 Étape 4 : Configurer les Redirects (SPA)

Pour que React Router fonctionne, ajouter une règle de redirect :

1. Aller dans les **Settings** du Static Site
2. Section **Redirects/Rewrites**
3. Ajouter :

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/index.html` | Rewrite |

---

## 📋 Étape 5 : Mettre à jour FRONTEND_URL

Maintenant que le frontend est déployé :

1. Aller dans les **Settings** du Backend (residence-api)
2. **Environment** → Modifier `FRONTEND_URL`
3. Mettre l'URL exacte du frontend : `https://residence-web.onrender.com`
4. Sauvegarder (le backend redémarrera automatiquement)

---

## ✅ Vérification finale

1. **Backend Health** : `https://residence-api.onrender.com/api/health`
2. **Frontend** : `https://residence-web.onrender.com`
3. **Connexion Admin** : 
   - Email : `admin@residence.tg`
   - Mot de passe : celui configuré dans `ADMIN_PASSWORD`

---

## 🔧 Dépannage

### Erreur "ENOENT package.json"

**Cause** : Root Directory non configuré

**Solution** : Vérifier que `Root Directory` est bien défini :
- Backend : `backend`
- Frontend : `frontend`

### Erreur MongoDB connection

**Cause** : URI incorrecte ou accès réseau bloqué

**Solution** :
1. Vérifier l'URI dans MongoDB Atlas
2. S'assurer que Network Access a `0.0.0.0/0`
3. Vérifier username/password

### Erreur CORS

**Cause** : FRONTEND_URL incorrect

**Solution** : Vérifier que `FRONTEND_URL` correspond exactement à l'URL du frontend (sans `/` final)

### Le frontend affiche une page blanche

**Cause** : Problème de build ou routes

**Solution** :
1. Vérifier les logs de build
2. S'assurer que le Redirect `/* → /index.html` est configuré

---

## 🔐 Sécurité Production

Avant de passer en production réelle :

1. Désactiver le mode sandbox CinetPay : `CINETPAY_SANDBOX=false`
2. Utiliser un JWT_SECRET fort et unique
3. Restreindre CORS au domaine exact
4. Configurer un domaine personnalisé
5. Activer HTTPS (automatique sur Render)

---

## 📞 Support

En cas de problème, vérifier :
1. Les logs Render (onglet "Logs" du service)
2. La console du navigateur (F12)
3. Les variables d'environnement
