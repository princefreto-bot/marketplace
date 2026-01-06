const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════════════
//                         🔧 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Variables d'environnement (à configurer sur Render)
const JWT_SECRET = process.env.JWT_SECRET || 'marketplace_pro_secret_key_2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace_pro';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Configuration Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// Multer avec Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'marketplace_pro',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// ═══════════════════════════════════════════════════════════════════════════════
//                         📊 SCHÉMAS MONGODB
// ═══════════════════════════════════════════════════════════════════════════════

// Schéma Utilisateur
const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['acheteur', 'vendeur', 'admin'], default: 'acheteur' },
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    telephone: { type: String, default: '' },
    localisation: { type: String, default: '' },
    avatar: { type: String, default: '' },
    isBanned: { type: Boolean, default: false },
    banType: { type: String, enum: ['none', 'temporary', 'permanent'], default: 'none' },
    banReason: { type: String, default: '' },
    banExpiry: { type: Date, default: null },
    dateCreation: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

// Schéma Demande/Post
const demandeSchema = new mongoose.Schema({
    acheteurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    titre: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    images: [{ 
        url: String, 
        publicId: String 
    }],
    categorie: { type: String, required: true },
    localisation: { type: String, default: '' },
    status: { type: String, enum: ['active', 'closed', 'deleted'], default: 'active' },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleteReason: { type: String, default: '' },
    dateCreation: { type: Date, default: Date.now }
});

// Schéma Réponse
const reponseSchema = new mongoose.Schema({
    demandeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Demande', required: true },
    vendeurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    images: [{ 
        url: String, 
        publicId: String 
    }],
    dateCreation: { type: Date, default: Date.now }
});

// Schéma Message
const messageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
    demandeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Demande' },
    demandeTitre: { type: String },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    images: [{ 
        url: String, 
        publicId: String 
    }],
    isAdminMessage: { type: Boolean, default: false },
    dateCreation: { type: Date, default: Date.now }
});

// Schéma Notification
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['message', 'reponse', 'nouvelle_demande', 'admin', 'ban', 'unban'], required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    dateCreation: { type: Date, default: Date.now }
});

// Schéma Actions Admin
const adminActionSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['delete_post', 'ban_user', 'unban_user', 'send_message', 'update_social'], required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Demande' },
    details: { type: String },
    dateCreation: { type: Date, default: Date.now }
});

// Schéma Réseaux Sociaux
const socialLinksSchema = new mongoose.Schema({
    platform: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    dateModification: { type: Date, default: Date.now }
});

// Schéma Message Admin
const adminMessageSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Demande' },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['warning', 'info', 'ban_notice', 'post_deleted'], default: 'info' },
    read: { type: Boolean, default: false },
    dateCreation: { type: Date, default: Date.now }
});

// Modèles
const User = mongoose.model('User', userSchema);
const Demande = mongoose.model('Demande', demandeSchema);
const Reponse = mongoose.model('Reponse', reponseSchema);
const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const AdminAction = mongoose.model('AdminAction', adminActionSchema);
const SocialLinks = mongoose.model('SocialLinks', socialLinksSchema);
const AdminMessage = mongoose.model('AdminMessage', adminMessageSchema);

// ═══════════════════════════════════════════════════════════════════════════════
//                         🔐 MIDDLEWARE SÉCURITÉ
// ═══════════════════════════════════════════════════════════════════════════════

// Générer JWT Token
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Middleware d'authentification
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier bannissement
        if (user.isBanned) {
            if (user.banType === 'temporary' && user.banExpiry && new Date() > user.banExpiry) {
                user.isBanned = false;
                user.banType = 'none';
                user.banReason = '';
                user.banExpiry = null;
                await user.save();
            } else {
                return res.status(403).json({ 
                    error: 'Compte banni', 
                    banType: user.banType,
                    banReason: user.banReason,
                    banExpiry: user.banExpiry
                });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token invalide' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expiré' });
        }
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

// Middleware Admin
function adminMiddleware(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès admin requis' });
    }
    next();
}

// Middleware optionnel d'auth (pour routes publiques avec infos user optionnelles)
async function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (user) req.user = user;
        }
    } catch (error) {
        // Ignore errors, continue without user
    }
    next();
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🌐 ROUTES STATIQUES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         👤 ENDPOINTS UTILISATEURS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/register - Inscription
app.post('/api/register', async (req, res) => {
    try {
        const { role, nom, email, password, telephone, localisation } = req.body;

        if (!nom || !email || !password) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            role: role || 'acheteur',
            nom,
            email: email.toLowerCase(),
            password: hashedPassword,
            telephone: telephone || '',
            localisation: localisation || ''
        });

        await newUser.save();

        const token = generateToken(newUser);
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ user: userResponse, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

// POST /api/login - Connexion
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Vérifier bannissement
        if (user.isBanned) {
            if (user.banType === 'temporary' && user.banExpiry && new Date() > user.banExpiry) {
                user.isBanned = false;
                user.banType = 'none';
                user.banReason = '';
                user.banExpiry = null;
                await user.save();
            } else {
                return res.status(403).json({ 
                    error: 'Compte banni', 
                    banType: user.banType,
                    banReason: user.banReason,
                    banExpiry: user.banExpiry
                });
            }
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ user: userResponse, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

// GET /api/me - Profil utilisateur connecté
app.get('/api/me', authMiddleware, async (req, res) => {
    res.json(req.user);
});

// GET /api/users/:id - Récupérer un utilisateur
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/users/:id - Modifier profil
app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }

        const { nom, telephone, localisation, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { nom, telephone, localisation, avatar },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         📋 ENDPOINTS DEMANDES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/demandes - Créer une demande
app.post('/api/demandes', authMiddleware, async (req, res) => {
    try {
        const { titre, description, budget, images, categorie, localisation } = req.body;

        if (!titre || !description || !budget || !categorie) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }

        const newDemande = new Demande({
            acheteurId: req.user._id,
            titre,
            description,
            budget: parseFloat(budget),
            images: images || [],
            categorie,
            localisation: localisation || req.user.localisation
        });

        await newDemande.save();

        // Notifier tous les vendeurs
        const vendeurs = await User.find({ role: 'vendeur', isBanned: false });
        const notifications = vendeurs.map(vendeur => ({
            userId: vendeur._id,
            type: 'nouvelle_demande',
            data: {
                demandeId: newDemande._id,
                demandeTitre: titre,
                acheteurNom: req.user.nom,
                categorie,
                budget: newDemande.budget
            }
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json(newDemande);
    } catch (error) {
        console.error('Create demande error:', error);
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
});

// GET /api/demandes - Liste des demandes
app.get('/api/demandes', optionalAuthMiddleware, async (req, res) => {
    try {
        const { categorie, acheteurId, search, status } = req.query;
        let query = { status: status || 'active' };

        if (categorie) query.categorie = categorie;
        if (acheteurId) query.acheteurId = acheteurId;
        if (search) {
            query.$or = [
                { titre: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const demandes = await Demande.find(query)
            .populate('acheteurId', 'nom email localisation')
            .sort({ dateCreation: -1 });

        // Compter les réponses pour chaque demande
        const demandesWithCount = await Promise.all(demandes.map(async (d) => {
            const reponseCount = await Reponse.countDocuments({ demandeId: d._id });
            return {
                ...d.toObject(),
                acheteurNom: d.acheteurId?.nom || 'Inconnu',
                nombreReponses: reponseCount
            };
        }));

        res.json(demandesWithCount);
    } catch (error) {
        console.error('Get demandes error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/demandes/:id - Détail d'une demande
app.get('/api/demandes/:id', optionalAuthMiddleware, async (req, res) => {
    try {
        const demande = await Demande.findById(req.params.id)
            .populate('acheteurId', 'nom email telephone localisation');

        if (!demande) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        const reponses = await Reponse.find({ demandeId: demande._id })
            .populate('vendeurId', 'nom email')
            .sort({ dateCreation: -1 });

        const reponsesEnrichies = reponses.map(r => ({
            ...r.toObject(),
            vendeurNom: r.vendeurId?.nom || 'Inconnu'
        }));

        res.json({
            ...demande.toObject(),
            acheteurNom: demande.acheteurId?.nom || 'Inconnu',
            acheteurTelephone: demande.acheteurId?.telephone || '',
            reponses: reponsesEnrichies
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE /api/demandes/:id - Supprimer une demande
app.delete('/api/demandes/:id', authMiddleware, async (req, res) => {
    try {
        const demande = await Demande.findById(req.params.id);
        if (!demande) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        // Vérifier autorisation
        if (demande.acheteurId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorisé' });
        }

        // Supprimer images Cloudinary
        for (const img of demande.images) {
            if (img.publicId) {
                try {
                    await cloudinary.uploader.destroy(img.publicId);
                } catch (e) {
                    console.error('Error deleting image:', e);
                }
            }
        }

        // Marquer comme supprimé au lieu de supprimer
        demande.status = 'deleted';
        demande.deletedBy = req.user._id;
        await demande.save();

        res.json({ message: 'Demande supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         💬 ENDPOINTS RÉPONSES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/demandes/:id/reponses - Répondre à une demande
app.post('/api/demandes/:id/reponses', authMiddleware, async (req, res) => {
    try {
        const { message, images } = req.body;
        const demande = await Demande.findById(req.params.id);

        if (!demande) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        const newReponse = new Reponse({
            demandeId: demande._id,
            vendeurId: req.user._id,
            message,
            images: images || []
        });

        await newReponse.save();

        // Notifier l'acheteur
        await Notification.create({
            userId: demande.acheteurId,
            type: 'reponse',
            data: {
                demandeId: demande._id,
                demandeTitre: demande.titre,
                vendeurId: req.user._id,
                vendeurNom: req.user.nom,
                reponseId: newReponse._id
            }
        });

        res.status(201).json({
            ...newReponse.toObject(),
            vendeurNom: req.user.nom
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/reponses - Liste des réponses
app.get('/api/reponses', authMiddleware, async (req, res) => {
    try {
        const { vendeurId } = req.query;
        let query = {};

        if (vendeurId) query.vendeurId = vendeurId;

        const reponses = await Reponse.find(query)
            .populate('demandeId', 'titre budget')
            .populate('vendeurId', 'nom')
            .sort({ dateCreation: -1 });

        const reponsesEnrichies = reponses.map(r => ({
            ...r.toObject(),
            demandeTitre: r.demandeId?.titre || 'Inconnue',
            demandeBudget: r.demandeId?.budget || 0,
            vendeurNom: r.vendeurId?.nom || 'Inconnu'
        }));

        res.json(reponsesEnrichies);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         ✉️ ENDPOINTS MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/messages - Envoyer un message
app.post('/api/messages', authMiddleware, async (req, res) => {
    try {
        const { conversationId, demandeId, demandeTitre, receiverId, message, images } = req.body;

        if (!conversationId || !receiverId || !message) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'Destinataire non trouvé' });
        }

        const newMessage = new Message({
            conversationId,
            demandeId,
            demandeTitre,
            senderId: req.user._id,
            receiverId,
            message,
            images: images || []
        });

        await newMessage.save();

        // Notification
        await Notification.create({
            userId: receiverId,
            type: 'message',
            data: {
                conversationId,
                demandeId,
                demandeTitre,
                senderId: req.user._id,
                senderNom: req.user.nom,
                messagePreview: message.substring(0, 50)
            }
        });

        res.status(201).json({
            ...newMessage.toObject(),
            senderNom: req.user.nom,
            receiverNom: receiver.nom
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/messages/:conversationId
app.get('/api/messages/:conversationId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .populate('senderId', 'nom')
            .populate('receiverId', 'nom')
            .sort({ dateCreation: 1 });

        const messagesEnrichis = messages.map(m => ({
            ...m.toObject(),
            senderNom: m.senderId?.nom || 'Inconnu',
            receiverNom: m.receiverId?.nom || 'Inconnu'
        }));

        res.json(messagesEnrichis);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/conversations/:userId
app.get('/api/conversations/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Récupérer les messages
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).populate('senderId', 'nom role').populate('receiverId', 'nom role');

        // Grouper par conversation
        const conversationsMap = new Map();

        messages.forEach(msg => {
            if (!conversationsMap.has(msg.conversationId)) {
                conversationsMap.set(msg.conversationId, {
                    conversationId: msg.conversationId,
                    demandeId: msg.demandeId,
                    demandeTitre: msg.demandeTitre,
                    messages: []
                });
            }
            conversationsMap.get(msg.conversationId).messages.push(msg);
        });

        const conversations = [];
        conversationsMap.forEach(conv => {
            const lastMessage = conv.messages.sort((a, b) => 
                new Date(b.dateCreation) - new Date(a.dateCreation)
            )[0];

            const isUserSender = lastMessage.senderId._id.toString() === userId;
            const interlocuteur = isUserSender ? lastMessage.receiverId : lastMessage.senderId;

            conversations.push({
                conversationId: conv.conversationId,
                demandeId: conv.demandeId,
                demandeTitre: conv.demandeTitre,
                interlocuteurId: interlocuteur._id,
                interlocuteurNom: interlocuteur.nom,
                interlocuteurRole: interlocuteur.role,
                lastMessage: lastMessage.message,
                lastMessageDate: lastMessage.dateCreation
            });
        });

        conversations.sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         🔔 ENDPOINTS NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/notifications/:userId
app.get('/api/notifications/:userId', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId })
            .sort({ dateCreation: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/notifications/:userId/unread
app.get('/api/notifications/:userId/unread', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            userId: req.params.userId, 
            read: false 
        }).sort({ dateCreation: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/notifications/:userId/count
app.get('/api/notifications/:userId/count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            userId: req.params.userId, 
            read: false 
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/notifications/:userId/read-all
app.put('/api/notifications/:userId/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.params.userId },
            { read: true }
        );
        res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         🛡️ ENDPOINTS ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/stats - Statistiques générales
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [
            totalUsers,
            totalAcheteurs,
            totalVendeurs,
            totalDemandes,
            totalReponses,
            totalMessages,
            bannedUsers,
            demandesParCategorie
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'acheteur' }),
            User.countDocuments({ role: 'vendeur' }),
            Demande.countDocuments({ status: 'active' }),
            Reponse.countDocuments(),
            Message.countDocuments(),
            User.countDocuments({ isBanned: true }),
            Demande.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$categorie', count: { $sum: 1 } } }
            ])
        ]);

        const categoriesObj = {};
        demandesParCategorie.forEach(c => {
            categoriesObj[c._id] = c.count;
        });

        res.json({
            totalUsers,
            totalAcheteurs,
            totalVendeurs,
            totalDemandes,
            totalReponses,
            totalMessages,
            bannedUsers,
            demandesParCategorie: categoriesObj
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/admin/users - Liste tous les utilisateurs
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ dateCreation: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/admin/posts - Liste tous les posts
app.get('/api/admin/posts', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const demandes = await Demande.find(query)
            .populate('acheteurId', 'nom email')
            .sort({ dateCreation: -1 });

        res.json(demandes);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE /api/admin/posts/:id - Supprimer un post (admin)
app.delete('/api/admin/posts/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { reason, sendMessage, messageContent } = req.body;
        const demande = await Demande.findById(req.params.id);

        if (!demande) {
            return res.status(404).json({ error: 'Post non trouvé' });
        }

        // Supprimer images Cloudinary
        for (const img of demande.images) {
            if (img.publicId) {
                try {
                    await cloudinary.uploader.destroy(img.publicId);
                } catch (e) {
                    console.error('Error deleting image:', e);
                }
            }
        }

        // Marquer comme supprimé
        demande.status = 'deleted';
        demande.deletedBy = req.user._id;
        demande.deleteReason = reason || 'Non conforme aux règles de la communauté';
        await demande.save();

        // Log action admin
        await AdminAction.create({
            adminId: req.user._id,
            action: 'delete_post',
            targetPostId: demande._id,
            targetUserId: demande.acheteurId,
            details: reason
        });

        // Envoyer message à l'utilisateur si demandé
        if (sendMessage && messageContent) {
            await AdminMessage.create({
                adminId: req.user._id,
                userId: demande.acheteurId,
                postId: demande._id,
                subject: 'Votre annonce a été supprimée',
                message: messageContent,
                type: 'post_deleted'
            });

            // Notification
            await Notification.create({
                userId: demande.acheteurId,
                type: 'admin',
                data: {
                    subject: 'Votre annonce a été supprimée',
                    message: messageContent,
                    postTitre: demande.titre
                }
            });
        }

        res.json({ message: 'Post supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/admin/ban/:userId - Bannir un utilisateur
app.post('/api/admin/ban/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { banType, reason, duration } = req.body;
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ error: 'Impossible de bannir un admin' });
        }

        user.isBanned = true;
        user.banType = banType || 'permanent';
        user.banReason = reason || 'Violation des règles de la communauté';
        
        if (banType === 'temporary' && duration) {
            user.banExpiry = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        }

        await user.save();

        // Log action
        await AdminAction.create({
            adminId: req.user._id,
            action: 'ban_user',
            targetUserId: user._id,
            details: `${banType} - ${reason}`
        });

        // Notification
        await Notification.create({
            userId: user._id,
            type: 'ban',
            data: {
                banType,
                reason,
                expiry: user.banExpiry
            }
        });

        // Message admin
        await AdminMessage.create({
            adminId: req.user._id,
            userId: user._id,
            subject: 'Votre compte a été suspendu',
            message: `Votre compte a été ${banType === 'permanent' ? 'banni définitivement' : 'suspendu temporairement'}. Raison: ${reason}`,
            type: 'ban_notice'
        });

        res.json({ message: 'Utilisateur banni avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/admin/unban/:userId - Débannir
app.post('/api/admin/unban/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        user.isBanned = false;
        user.banType = 'none';
        user.banReason = '';
        user.banExpiry = null;
        await user.save();

        // Log
        await AdminAction.create({
            adminId: req.user._id,
            action: 'unban_user',
            targetUserId: user._id
        });

        // Notification
        await Notification.create({
            userId: user._id,
            type: 'unban',
            data: { message: 'Votre compte a été réactivé' }
        });

        res.json({ message: 'Utilisateur débanni avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/admin/message - Envoyer message admin
app.post('/api/admin/message', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId, subject, message, type } = req.body;

        const adminMessage = new AdminMessage({
            adminId: req.user._id,
            userId,
            subject,
            message,
            type: type || 'info'
        });

        await adminMessage.save();

        // Log
        await AdminAction.create({
            adminId: req.user._id,
            action: 'send_message',
            targetUserId: userId,
            details: subject
        });

        // Notification
        await Notification.create({
            userId,
            type: 'admin',
            data: { subject, message }
        });

        res.status(201).json(adminMessage);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/admin/messages/:userId - Messages admin pour un utilisateur
app.get('/api/admin-messages/:userId', authMiddleware, async (req, res) => {
    try {
        const messages = await AdminMessage.find({ userId: req.params.userId })
            .populate('adminId', 'nom')
            .sort({ dateCreation: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/admin-messages/:id/read
app.put('/api/admin-messages/:id/read', authMiddleware, async (req, res) => {
    try {
        const message = await AdminMessage.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/admin/actions - Historique actions admin
app.get('/api/admin/actions', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const actions = await AdminAction.find()
            .populate('adminId', 'nom')
            .populate('targetUserId', 'nom email')
            .sort({ dateCreation: -1 })
            .limit(100);
        res.json(actions);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         🌐 ENDPOINTS RÉSEAUX SOCIAUX
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/social-links - Liste des réseaux sociaux
app.get('/api/social-links', async (req, res) => {
    try {
        const links = await SocialLinks.find({ isActive: true }).sort({ order: 1 });
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/admin/social-links - Tous les réseaux (admin)
app.get('/api/admin/social-links', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const links = await SocialLinks.find().sort({ order: 1 });
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/admin/social-links - Ajouter réseau social
app.post('/api/admin/social-links', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { platform, url, icon, order } = req.body;

        const existing = await SocialLinks.findOne({ platform });
        if (existing) {
            return res.status(400).json({ error: 'Cette plateforme existe déjà' });
        }

        const link = new SocialLinks({ platform, url, icon, order });
        await link.save();

        // Log
        await AdminAction.create({
            adminId: req.user._id,
            action: 'update_social',
            details: `Ajout: ${platform}`
        });

        res.status(201).json(link);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/admin/social-links/:id - Modifier réseau social
app.put('/api/admin/social-links/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { url, icon, isActive, order } = req.body;
        const link = await SocialLinks.findByIdAndUpdate(
            req.params.id,
            { url, icon, isActive, order, dateModification: new Date() },
            { new: true }
        );

        if (!link) {
            return res.status(404).json({ error: 'Lien non trouvé' });
        }

        res.json(link);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE /api/admin/social-links/:id - Supprimer réseau social
app.delete('/api/admin/social-links/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await SocialLinks.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lien supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         📤 ENDPOINTS UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/upload - Upload image(s)
app.post('/api/upload', authMiddleware, upload.array('images', 10), async (req, res) => {
    try {
        const images = req.files.map(file => ({
            url: file.path,
            publicId: file.filename
        }));
        res.json({ images });
    } catch (error) {
        res.status(500).json({ error: 'Erreur upload' });
    }
});

// POST /api/upload/base64 - Upload image base64
app.post('/api/upload/base64', authMiddleware, async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'Image manquante' });
        }

        const result = await cloudinary.uploader.upload(image, {
            folder: 'marketplace_pro',
            transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Erreur upload' });
    }
});

// DELETE /api/upload/:publicId - Supprimer image
app.delete('/api/upload/:publicId', authMiddleware, async (req, res) => {
    try {
        await cloudinary.uploader.destroy(req.params.publicId);
        res.json({ message: 'Image supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         📊 ENDPOINT STATS PUBLIC
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/stats', async (req, res) => {
    try {
        const [totalUsers, totalDemandes, totalReponses] = await Promise.all([
            User.countDocuments(),
            Demande.countDocuments({ status: 'active' }),
            Reponse.countDocuments()
        ]);

        res.json({
            totalUsers,
            totalDemandes,
            totalReponses
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         🚀 DÉMARRAGE & CONNEXION MONGODB
// ═══════════════════════════════════════════════════════════════════════════════

async function initializeDatabase() {
    try {
        // Créer admin par défaut si n'existe pas
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            await User.create({
                role: 'admin',
                nom: 'Administrateur',
                email: 'admin@marketplace.pro',
                password: hashedPassword,
                telephone: '+228 79 90 72 62',
                localisation: 'Lomé, Togo'
            });
            console.log('✅ Compte admin créé: admin@marketplace.pro / admin123');
        }

        // Créer utilisateurs de test
        const testUserExists = await User.findOne({ email: 'marie@test.com' });
        if (!testUserExists) {
            const hashedPassword = await bcrypt.hash('password123', 12);
            
            await User.create({
                role: 'acheteur',
                nom: 'Marie Dupont',
                email: 'marie@test.com',
                password: hashedPassword,
                telephone: '+33 6 12 34 56 78',
                localisation: 'Paris, France'
            });

            await User.create({
                role: 'vendeur',
                nom: 'Jean Martin',
                email: 'jean@test.com',
                password: hashedPassword,
                telephone: '+33 6 98 76 54 32',
                localisation: 'Lyon, France'
            });

            await User.create({
                role: 'vendeur',
                nom: 'Sophie Bernard',
                email: 'sophie@test.com',
                password: hashedPassword,
                telephone: '+33 6 55 44 33 22',
                localisation: 'Marseille, France'
            });

            console.log('✅ Utilisateurs de test créés');
        }

        // Créer réseaux sociaux par défaut
        const socialExists = await SocialLinks.findOne();
        if (!socialExists) {
            await SocialLinks.insertMany([
                { platform: 'Facebook', url: 'https://facebook.com/marketplace', icon: 'fab fa-facebook-f', order: 1 },
                { platform: 'Instagram', url: 'https://instagram.com/marketplace', icon: 'fab fa-instagram', order: 2 },
                { platform: 'Twitter', url: 'https://twitter.com/marketplace', icon: 'fab fa-twitter', order: 3 },
                { platform: 'WhatsApp', url: 'https://wa.me/22879907262', icon: 'fab fa-whatsapp', order: 4 },
                { platform: 'TikTok', url: 'https://tiktok.com/@marketplace', icon: 'fab fa-tiktok', order: 5 }
            ]);
            console.log('✅ Réseaux sociaux par défaut créés');
        }

    } catch (error) {
        console.error('Erreur initialisation:', error);
    }
}

async function startServer() {
    try {
        // Connexion MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connecté à MongoDB');

        // Initialiser données
        await initializeDatabase();

        // Démarrer serveur
        app.listen(PORT, '0.0.0.0', () => {
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('   🚀 MarketPlace Pro - Serveur Production démarré');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log(`   📍 URL: http://localhost:${PORT}`);
            console.log('   📧 Comptes de test:');
            console.log('      - Admin: admin@marketplace.pro / admin123');
            console.log('      - Acheteur: marie@test.com / password123');
            console.log('      - Vendeur: jean@test.com / password123');
            console.log('═══════════════════════════════════════════════════════════════');
        });
    } catch (error) {
        console.error('❌ Erreur de démarrage:', error);
        
        // Fallback: démarrer sans MongoDB (mode mémoire)
        console.log('⚠️ Démarrage en mode dégradé (sans MongoDB)...');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Serveur démarré sur http://localhost:${PORT} (mode dégradé)`);
        });
    }
}

startServer();
