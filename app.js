// ═══════════════════════════════════════════════════════════════════════════════
//                         🔧 CONFIGURATION & ÉTAT
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = window.location.origin + '/api';

const state = {
    user: null,
    token: null,
    demandes: [],
    currentDemande: null,
    conversations: [],
    currentConversation: null,
    notifications: [],
    demandeImages: [],
    responseImages: [],
    chatImages: [],
    notificationPolling: null,
    messagePolling: null
};

// ═══════════════════════════════════════════════════════════════════════════════
//                         🚀 INITIALISATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MarketPlace Pro v3.0 - Mobile Optimized');
    
    // Restaurer session
    const savedToken = localStorage.getItem('marketplace_token');
    const savedUser = localStorage.getItem('marketplace_user');
    
    if (savedToken && savedUser) {
        try {
            state.token = savedToken;
            state.user = JSON.parse(savedUser);
            updateUIForLoggedInUser();
            startPolling();
        } catch (e) {
            localStorage.removeItem('marketplace_token');
            localStorage.removeItem('marketplace_user');
        }
    }
    
    // Charger données initiales
    loadStats();
    loadRecentDemandes();
    loadSocialLinks();
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         📡 API CALLS
// ═══════════════════════════════════════════════════════════════════════════════

async function apiCall(endpoint, options = {}) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        
        if (state.token) {
            headers['Authorization'] = 'Bearer ' + state.token;
        }
        
        const response = await fetch(API_URL + endpoint, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
            }
            throw new Error(data.error || 'Une erreur est survenue');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🎨 UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = '<i class="fas fa-' + icons[type] + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' j';
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getImageUrl(image) {
    if (!image) return '';
    if (typeof image === 'string') {
        return image;
    }
    if (typeof image === 'object' && image.url) {
        return image.url;
    }
    return '';
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📍 NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function showSection(sectionId) {
    // Fermer tous les panels
    closeNotifications();
    closeUserPanel();
    closeChat();
    
    // Cacher toutes les sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    
    // Mettre à jour nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
    
    const activeNavLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
    if (activeNavLink) activeNavLink.classList.add('active');
    
    const activeBottomNav = document.querySelector('.bottom-nav-item[data-section="' + sectionId + '"]');
    if (activeBottomNav) activeBottomNav.classList.add('active');
    
    // Afficher/cacher footer
    const footer = document.getElementById('mainFooter');
    footer.style.display = sectionId === 'admin' ? 'none' : 'block';
    
    // Map sections
    const sectionMap = {
        'home': 'sectionHome',
        'demandes': 'sectionDemandes',
        'detail': 'sectionDetail',
        'publish': 'sectionPublish',
        'messages': 'sectionMessages',
        'espace': 'sectionEspace',
        'admin': 'sectionAdmin'
    };
    
    const targetSection = document.getElementById(sectionMap[sectionId]);
    if (targetSection) targetSection.classList.add('active');
    
    // Charger données
    if (sectionId === 'demandes') loadDemandes();
    else if (sectionId === 'messages' && state.user) loadConversations();
    else if (sectionId === 'espace' && state.user) setupEspaceUtilisateur();
    else if (sectionId === 'admin' && state.user && state.user.role === 'admin') loadAdminDashboard();
    
    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handlePublishClick() {
    if (!state.user) {
        showAuthModal();
        showToast('Connectez-vous pour publier', 'warning');
        return;
    }
    
    if (state.user.role === 'vendeur') {
        showToast('Seuls les acheteurs peuvent publier', 'warning');
        return;
    }
    
    showSection('publish');
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🔐 AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
    });
    
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('authModalTitle').textContent = tab === 'login' ? 'Connexion' : 'Inscription';
}

function selectRole(role, element) {
    document.getElementById('registerRole').value = role;
    document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
    element.classList.add('selected');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        state.token = response.token;
        state.user = response.user;
        localStorage.setItem('marketplace_token', response.token);
        localStorage.setItem('marketplace_user', JSON.stringify(response.user));
        
        closeAuthModal();
        updateUIForLoggedInUser();
        startPolling();
        
        showToast('Bienvenue ' + response.user.nom + ' !', 'success');
        document.getElementById('loginForm').reset();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const data = {
        role: document.getElementById('registerRole').value,
        nom: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        telephone: document.getElementById('registerPhone').value,
        localisation: document.getElementById('registerLocation').value
    };
    
    try {
        const response = await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        state.token = response.token;
        state.user = response.user;
        localStorage.setItem('marketplace_token', response.token);
        localStorage.setItem('marketplace_user', JSON.stringify(response.user));
        
        closeAuthModal();
        updateUIForLoggedInUser();
        startPolling();
        
        showToast('Compte créé avec succès !', 'success');
        document.getElementById('registerForm').reset();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    state.user = null;
    state.token = null;
    localStorage.removeItem('marketplace_token');
    localStorage.removeItem('marketplace_user');
    stopPolling();
    
    document.getElementById('navAvatar').style.display = 'none';
    document.getElementById('notificationBtn').style.display = 'none';
    document.getElementById('btnLogin').style.display = 'flex';
    document.getElementById('navAdmin').style.display = 'none';
    document.getElementById('menuAdmin').style.display = 'none';
    
    closeUserPanel();
    showSection('home');
    showToast('Déconnexion réussie', 'success');
}

function updateUIForLoggedInUser() {
    if (!state.user) return;
    
    document.getElementById('navAvatar').style.display = 'flex';
    document.getElementById('notificationBtn').style.display = 'flex';
    document.getElementById('btnLogin').style.display = 'none';
    
    const initials = getInitials(state.user.nom);
    document.getElementById('navAvatar').textContent = initials;
    document.getElementById('userAvatarLarge').textContent = initials;
    document.getElementById('userName').textContent = state.user.nom;
    
    const roleTexts = { 'acheteur': 'Acheteur', 'vendeur': 'Vendeur', 'admin': 'Administrateur' };
    document.getElementById('userRole').textContent = roleTexts[state.user.role] || 'Utilisateur';
    
    // Afficher/cacher publier selon rôle
    const navPublish = document.getElementById('navPublish');
    if (navPublish) navPublish.style.display = state.user.role === 'vendeur' ? 'none' : 'block';
    
    // Admin
    if (state.user.role === 'admin') {
        document.getElementById('navAdmin').style.display = 'flex';
        document.getElementById('menuAdmin').style.display = 'flex';
    }
    
    loadNotifications();
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🔔 NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function toggleNotifications() {
    closeUserPanel();
    const overlay = document.getElementById('notificationOverlay');
    const panel = document.getElementById('notificationPanel');
    
    if (panel.classList.contains('show')) {
        closeNotifications();
    } else {
        overlay.classList.add('show');
        panel.classList.add('show');
        loadNotifications();
    }
}

function closeNotifications() {
    document.getElementById('notificationOverlay').classList.remove('show');
    document.getElementById('notificationPanel').classList.remove('show');
}

function toggleUserPanel() {
    closeNotifications();
    const overlay = document.getElementById('userOverlay');
    const panel = document.getElementById('userPanel');
    
    if (panel.classList.contains('show')) {
        closeUserPanel();
    } else {
        overlay.classList.add('show');
        panel.classList.add('show');
    }
}

function closeUserPanel() {
    document.getElementById('userOverlay').classList.remove('show');
    document.getElementById('userPanel').classList.remove('show');
}

async function loadNotifications() {
    if (!state.user) return;
    
    const userId = state.user._id || state.user.id;
    
    try {
        const notifications = await apiCall('/notifications/' + userId + '/unread');
        state.notifications = notifications || [];
        
        // Badge
        const badge = document.getElementById('notificationBadge');
        if (state.notifications.length > 0) {
            badge.textContent = state.notifications.length > 99 ? '99+' : state.notifications.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
        
        // Liste
        const list = document.getElementById('notificationList');
        if (state.notifications.length === 0) {
            list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>Aucune notification</p></div>';
        } else {
            list.innerHTML = state.notifications.map(n => {
                let icon, iconClass, text;
                
                switch(n.type) {
                    case 'message':
                        icon = 'comment';
                        iconClass = 'message';
                        text = '<strong>' + escapeHtml(n.data?.senderNom || 'Quelqu\'un') + '</strong> vous a envoyé un message';
                        break;
                    case 'reponse':
                        icon = 'reply';
                        iconClass = 'reponse';
                        text = '<strong>' + escapeHtml(n.data?.vendeurNom || 'Un vendeur') + '</strong> a répondu à votre demande';
                        break;
                    case 'nouvelle_demande':
                        icon = 'bullhorn';
                        iconClass = 'demande';
                        text = 'Nouvelle demande: <strong>' + escapeHtml(n.data?.demandeTitre || '') + '</strong>';
                        break;
                    default:
                        icon = 'bell';
                        iconClass = 'message';
                        text = 'Nouvelle notification';
                }
                
                return '<div class="notification-item unread" onclick="handleNotificationClick(\'' + (n._id || n.id) + '\', \'' + n.type + '\', \'' + encodeURIComponent(JSON.stringify(n.data || {})) + '\')">' +
                    '<div class="notification-icon ' + iconClass + '"><i class="fas fa-' + icon + '"></i></div>' +
                    '<div class="notification-content">' +
                        '<div class="notification-text">' + text + '</div>' +
                        '<div class="notification-time">' + formatDate(n.dateCreation) + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function handleNotificationClick(notificationId, type, encodedData) {
    closeNotifications();
    
    let data = {};
    try {
        data = JSON.parse(decodeURIComponent(encodedData));
    } catch(e) {}
    
    // Marquer comme lu
    try {
        await apiCall('/notifications/' + notificationId + '/read', { method: 'PUT' });
    } catch(e) {}
    
    // Redirection
    if (type === 'message' && data.senderId && data.senderNom) {
        startConversation(data.senderId, data.senderNom, data.demandeId || '', data.demandeTitre || 'Conversation');
    } else if (type === 'reponse' && data.demandeId) {
        showDemandeDetail(data.demandeId);
    } else if (type === 'nouvelle_demande' && data.demandeId) {
        showDemandeDetail(data.demandeId);
    } else {
        showSection('home');
    }
    
    setTimeout(loadNotifications, 500);
}

async function markAllAsRead() {
    if (!state.user) return;
    
    try {
        await apiCall('/notifications/' + (state.user._id || state.user.id) + '/read-all', { method: 'PUT' });
        loadNotifications();
        showToast('Notifications marquées comme lues', 'success');
    } catch (error) {
        showToast('Erreur', 'error');
    }
}

function startPolling() {
    stopPolling();
    state.notificationPolling = setInterval(() => {
        if (state.user) loadNotifications();
    }, 5000);
}

function stopPolling() {
    if (state.notificationPolling) {
        clearInterval(state.notificationPolling);
        state.notificationPolling = null;
    }
    if (state.messagePolling) {
        clearInterval(state.messagePolling);
        state.messagePolling = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📊 STATS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadStats() {
    try {
        const stats = await apiCall('/stats');
        document.getElementById('statUsers').textContent = stats.totalUsers || 0;
        document.getElementById('statDemandes').textContent = stats.totalDemandes || 0;
        document.getElementById('statReponses').textContent = stats.totalReponses || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📋 DEMANDES
// ═══════════════════════════════════════════════════════════════════════════════

async function loadRecentDemandes() {
    try {
        const demandes = await apiCall('/demandes');
        const container = document.getElementById('recentDemandes');
        
        if (!demandes || demandes.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune demande</h3><p>Soyez le premier à publier !</p><button class="btn btn-primary" onclick="handlePublishClick()"><i class="fas fa-plus"></i> Publier</button></div>';
        } else {
            container.innerHTML = demandes.slice(0, 6).map(d => createDemandeCard(d)).join('');
        }
    } catch (error) {
        document.getElementById('recentDemandes').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur</h3><p>Impossible de charger les demandes</p></div>';
    }
}

async function loadDemandes() {
    try {
        const search = document.getElementById('searchInput').value;
        const categorie = document.getElementById('categoryFilter').value;
        
        let url = '/demandes?';
        if (search) url += 'search=' + encodeURIComponent(search) + '&';
        if (categorie) url += 'categorie=' + encodeURIComponent(categorie);
        
        const demandes = await apiCall(url);
        state.demandes = demandes;
        
        const grid = document.getElementById('demandesGrid');
        
        if (!demandes || demandes.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucune demande</h3><p>Modifiez vos critères de recherche</p></div>';
        } else {
            grid.innerHTML = demandes.map(d => createDemandeCard(d)).join('');
        }
    } catch (error) {
        showToast('Erreur de chargement', 'error');
    }
}

function filterDemandes() {
    loadDemandes();
}

function createDemandeCard(demande) {
    let imageUrl = '';
    if (demande.images && demande.images.length > 0) {
        imageUrl = getImageUrl(demande.images[0]);
    }
    
    const imageHtml = imageUrl 
        ? '<div class="card-image-container"><img src="' + imageUrl + '" class="card-image" alt="' + escapeHtml(demande.titre) + '" onerror="this.parentElement.innerHTML=\'<div class=card-no-image><i class=fas fa-image></i><span>Image non disponible</span></div>\'"></div>'
        : '<div class="card-image-container"><div class="card-no-image"><i class="fas fa-image"></i><span>Pas d\'image</span></div></div>';
    
    return '<div class="card" onclick="showDemandeDetail(\'' + (demande._id || demande.id) + '\')">' +
        imageHtml +
        '<div class="card-body">' +
            '<span class="card-badge">' + escapeHtml(demande.categorie) + '</span>' +
            '<h3 class="card-title">' + escapeHtml(demande.titre) + '</h3>' +
            '<p class="card-description">' + escapeHtml(demande.description) + '</p>' +
            '<div class="card-price">' + formatPrice(demande.budget) + '</div>' +
            '<div class="card-footer">' +
                '<span class="card-location"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(demande.localisation || 'Non spécifié') + '</span>' +
                '<span>' + formatDate(demande.dateCreation) + '</span>' +
            '</div>' +
        '</div>' +
    '</div>';
}

async function showDemandeDetail(demandeId) {
    try {
        const demande = await apiCall('/demandes/' + demandeId);
        state.currentDemande = demande;
        
        const container = document.getElementById('detailContainer');
        
        // Images
        let imageUrl = '';
        if (demande.images && demande.images.length > 0) {
            imageUrl = getImageUrl(demande.images[0]);
        }
        
        let imagesHtml = '';
        if (imageUrl) {
            imagesHtml = '<div class="detail-images">' +
                '<img src="' + imageUrl + '" class="detail-main-image" onclick="openLightbox(\'' + imageUrl + '\')" onerror="this.style.display=\'none\'">';
            
            if (demande.images.length > 1) {
                imagesHtml += '<div class="detail-thumbnails">' +
                    demande.images.map((img, i) => {
                        const url = getImageUrl(img);
                        return '<img src="' + url + '" class="detail-thumbnail ' + (i === 0 ? 'active' : '') + '" onclick="changeDetailImage(\'' + url + '\', this)" onerror="this.style.display=\'none\'">';
                    }).join('') +
                '</div>';
            }
            imagesHtml += '</div>';
        }
        
        const acheteurId = demande.acheteurId?._id || demande.acheteurId;
        const acheteurNom = demande.acheteurId?.nom || demande.acheteurNom || 'Inconnu';
        const userId = state.user?._id || state.user?.id;
        
        // Actions
        let actionsHtml = '';
        if (state.user) {
            if (state.user.role === 'vendeur' && acheteurId !== userId) {
                actionsHtml = '<div class="detail-actions">' +
                    '<button class="btn btn-primary" onclick="openResponseModal(\'' + demandeId + '\')"><i class="fas fa-reply"></i> Répondre</button>' +
                    '<button class="btn btn-outline" onclick="startConversation(\'' + acheteurId + '\', \'' + escapeHtml(acheteurNom) + '\', \'' + demandeId + '\', \'' + escapeHtml(demande.titre) + '\')"><i class="fas fa-comment"></i> Contacter</button>' +
                '</div>';
            } else if (userId === acheteurId) {
                actionsHtml = '<div class="detail-actions">' +
                    '<button class="btn btn-danger" onclick="deleteDemande(\'' + demandeId + '\')"><i class="fas fa-trash"></i> Supprimer</button>' +
                '</div>';
            }
        } else {
            actionsHtml = '<div class="detail-actions">' +
                '<button class="btn btn-primary" onclick="showAuthModal()"><i class="fas fa-sign-in-alt"></i> Connectez-vous pour répondre</button>' +
            '</div>';
        }
        
        container.innerHTML = imagesHtml +
            '<div class="detail-info">' +
                '<span class="detail-badge">' + escapeHtml(demande.categorie) + '</span>' +
                '<h1 class="detail-title">' + escapeHtml(demande.titre) + '</h1>' +
                '<div class="detail-price">Budget: ' + formatPrice(demande.budget) + '</div>' +
                '<div class="detail-meta">' +
                    '<div class="detail-meta-item"><i class="fas fa-user"></i><span>' + escapeHtml(acheteurNom) + '</span></div>' +
                    '<div class="detail-meta-item"><i class="fas fa-map-marker-alt"></i><span>' + escapeHtml(demande.localisation || 'Non spécifié') + '</span></div>' +
                    '<div class="detail-meta-item"><i class="fas fa-clock"></i><span>' + formatDate(demande.dateCreation) + '</span></div>' +
                    '<div class="detail-meta-item"><i class="fas fa-comments"></i><span>' + (demande.reponses?.length || 0) + ' réponse(s)</span></div>' +
                '</div>' +
                '<p class="detail-description">' + escapeHtml(demande.description) + '</p>' +
                actionsHtml +
            '</div>';
        
        // Réponses
        const reponses = demande.reponses || [];
        const responsesSection = document.getElementById('responsesSection');
        const responsesList = document.getElementById('responsesList');
        const responseCount = document.getElementById('responseCount');
        
        if (state.user && userId === acheteurId && reponses.length > 0) {
            responsesSection.style.display = 'block';
            responseCount.textContent = reponses.length;
            
            responsesList.innerHTML = reponses.map(r => {
                const vendeurId = r.vendeurId?._id || r.vendeurId;
                const vendeurNom = r.vendeurId?.nom || r.vendeurNom || 'Inconnu';
                
                let responseImagesHtml = '';
                if (r.images && r.images.length > 0) {
                    responseImagesHtml = '<div class="response-images">' +
                        r.images.map(img => {
                            const url = getImageUrl(img);
                            return '<img src="' + url + '" onclick="openLightbox(\'' + url + '\')" onerror="this.style.display=\'none\'">';
                        }).join('') +
                    '</div>';
                }
                
                return '<div class="response-card">' +
                    '<div class="response-header">' +
                        '<div class="response-vendor">' +
                            '<div class="response-avatar">' + getInitials(vendeurNom) + '</div>' +
                            '<div class="response-vendor-info">' +
                                '<h4>' + escapeHtml(vendeurNom) + '</h4>' +
                                '<span>' + formatDate(r.dateCreation) + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<p class="response-message">' + escapeHtml(r.message) + '</p>' +
                    responseImagesHtml +
                    '<div class="response-actions">' +
                        '<button class="btn btn-primary btn-sm" onclick="startConversation(\'' + vendeurId + '\', \'' + escapeHtml(vendeurNom) + '\', \'' + demandeId + '\', \'' + escapeHtml(demande.titre) + '\')">' +
                            '<i class="fas fa-comment"></i> Discuter avec ' + escapeHtml(vendeurNom.split(' ')[0]) +
                        '</button>' +
                    '</div>' +
                '</div>';
            }).join('');
        } else {
            responsesSection.style.display = 'none';
        }
        
        showSection('detail');
        
    } catch (error) {
        showToast('Erreur de chargement', 'error');
    }
}

function changeDetailImage(src, thumbnail) {
    document.querySelector('.detail-main-image').src = src;
    document.querySelectorAll('.detail-thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

async function submitDemande(e) {
    e.preventDefault();
    
    if (!state.user) {
        showAuthModal();
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';
    submitBtn.disabled = true;
    
    try {
        const data = {
            titre: document.getElementById('demandeTitle').value.trim(),
            categorie: document.getElementById('demandeCategory').value,
            budget: parseFloat(document.getElementById('demandeBudget').value),
            description: document.getElementById('demandeDescription').value.trim(),
            localisation: document.getElementById('demandeLocation').value || state.user.localisation || '',
            images: state.demandeImages
        };
        
        await apiCall('/demandes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Demande publiée !', 'success');
        
        document.getElementById('publishForm').reset();
        state.demandeImages = [];
        document.getElementById('demandeImagePreview').innerHTML = '';
        
        loadStats();
        loadRecentDemandes();
        showSection('demandes');
        
    } catch (error) {
        showToast(error.message || 'Erreur de publication', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteDemande(demandeId) {
    if (!confirm('Supprimer cette demande ?')) return;
    
    try {
        await apiCall('/demandes/' + demandeId, { method: 'DELETE' });
        showToast('Demande supprimée', 'success');
        loadStats();
        loadRecentDemandes();
        showSection('demandes');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         💬 RÉPONSES
// ═══════════════════════════════════════════════════════════════════════════════

function openResponseModal(demandeId) {
    if (!state.user) {
        showAuthModal();
        return;
    }
    
    document.getElementById('responseDemandeId').value = demandeId;
    state.responseImages = [];
    document.getElementById('responseImagePreview').innerHTML = '';
    document.getElementById('responseMessage').value = '';
    document.getElementById('responseModal').classList.add('show');
}

function closeResponseModal() {
    document.getElementById('responseModal').classList.remove('show');
}

async function submitResponse(e) {
    e.preventDefault();
    
    const demandeId = document.getElementById('responseDemandeId').value;
    const message = document.getElementById('responseMessage').value;
    
    try {
        await apiCall('/demandes/' + demandeId + '/reponses', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                images: state.responseImages
            })
        });
        
        showToast('Réponse envoyée !', 'success');
        closeResponseModal();
        showDemandeDetail(demandeId);
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         ✉️ MESSAGERIE
// ═══════════════════════════════════════════════════════════════════════════════

async function loadConversations() {
    if (!state.user) return;
    
    const userId = state.user._id || state.user.id;
    
    try {
        const conversations = await apiCall('/conversations/' + userId);
        state.conversations = conversations;
        
        const container = document.getElementById('conversationsList');
        
        if (!conversations || conversations.length === 0) {
            container.innerHTML = '<div class="notification-empty"><i class="fas fa-comments"></i><p>Aucune conversation</p></div>';
        } else {
            container.innerHTML = conversations.map(c => {
                return '<div class="conversation-item" onclick="openChatFromConversation(\'' + c.conversationId + '\', \'' + c.interlocuteurId + '\', \'' + escapeHtml(c.interlocuteurNom) + '\', \'' + (c.demandeId || '') + '\', \'' + escapeHtml(c.demandeTitre || 'Conversation') + '\')">' +
                    '<div class="conversation-top">' +
                        '<span class="conversation-product">' + escapeHtml(c.demandeTitre || 'Conversation') + '</span>' +
                        '<span class="conversation-time">' + formatDate(c.lastMessageDate) + '</span>' +
                    '</div>' +
                    '<div class="conversation-user">' +
                        escapeHtml(c.interlocuteurNom) +
                        '<span class="conversation-role">' + (c.interlocuteurRole === 'acheteur' ? 'Acheteur' : 'Vendeur') + '</span>' +
                    '</div>' +
                    '<div class="conversation-preview">' + escapeHtml(c.lastMessage) + '</div>' +
                '</div>';
            }).join('');
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function startConversation(userId, userName, demandeId, demandeTitre) {
    if (!state.user) {
        showAuthModal();
        return;
    }
    
    const currentUserId = state.user._id || state.user.id;
    const ids = [currentUserId, userId].sort();
    const conversationId = 'demande_' + demandeId + '_users_' + ids[0] + '_' + ids[1];
    
    openChat(conversationId, userId, userName, demandeId, demandeTitre);
}

function openChatFromConversation(conversationId, userId, userName, demandeId, demandeTitre) {
    openChat(conversationId, userId, userName, demandeId, demandeTitre);
}

async function openChat(conversationId, userId, userName, demandeId, demandeTitre) {
    state.currentConversation = {
        conversationId,
        userId,
        userName,
        demandeId,
        demandeTitre
    };
    
    document.getElementById('chatAvatar').textContent = getInitials(userName);
    document.getElementById('chatName').textContent = userName;
    document.getElementById('chatProduct').textContent = demandeTitre || 'Conversation';
    
    state.chatImages = [];
    updateChatImagePreview();
    
    await loadMessages(conversationId);
    
    document.getElementById('chatOverlay').classList.add('show');
    document.getElementById('chatPopup').classList.add('show');
    
    startMessagePolling(conversationId);
}

async function loadMessages(conversationId) {
    try {
        const messages = await apiCall('/messages/' + encodeURIComponent(conversationId));
        const container = document.getElementById('chatMessages');
        
        const userId = state.user._id || state.user.id;
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="chat-empty"><i class="fas fa-comments"></i><p>Démarrez la conversation</p></div>';
        } else {
            container.innerHTML = messages.map(m => {
                const senderId = m.senderId?._id || m.senderId;
                const isSent = senderId === userId;
                
                let imagesHtml = '';
                if (m.images && m.images.length > 0) {
                    imagesHtml = '<div class="message-images">' +
                        m.images.map(img => {
                            const url = getImageUrl(img);
                            return url ? '<img src="' + url + '" onclick="openLightbox(\'' + url + '\')" onerror="this.style.display=\'none\'">' : '';
                        }).join('') +
                    '</div>';
                }
                
                return '<div class="message ' + (isSent ? 'sent' : 'received') + '">' +
                    '<div class="message-text">' + escapeHtml(m.message) + '</div>' +
                    imagesHtml +
                    '<div class="message-time">' + formatTime(m.dateCreation) + '</div>' +
                '</div>';
            }).join('');
            
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function closeChat() {
    document.getElementById('chatOverlay').classList.remove('show');
    document.getElementById('chatPopup').classList.remove('show');
    state.currentConversation = null;
    state.chatImages = [];
    updateChatImagePreview();
    stopMessagePolling();
}

async function sendMessage() {
    if (!state.currentConversation) return;
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message && state.chatImages.length === 0) return;
    
    const conv = state.currentConversation;
    
    try {
        await apiCall('/messages', {
            method: 'POST',
            body: JSON.stringify({
                conversationId: conv.conversationId,
                demandeId: conv.demandeId,
                demandeTitre: conv.demandeTitre,
                receiverId: conv.userId,
                message: message || '📷 Image',
                images: state.chatImages
            })
        });
        
        input.value = '';
        state.chatImages = [];
        updateChatImagePreview();
        
        await loadMessages(conv.conversationId);
        
        if (state.chatImages.length > 0) {
            showToast('Message envoyé avec image !', 'success');
        }
        
    } catch (error) {
        showToast('Erreur d\'envoi', 'error');
    }
}

function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function startMessagePolling(conversationId) {
    stopMessagePolling();
    state.messagePolling = setInterval(() => {
        if (state.currentConversation && state.currentConversation.conversationId === conversationId) {
            loadMessages(conversationId);
        }
    }, 3000);
}

function stopMessagePolling() {
    if (state.messagePolling) {
        clearInterval(state.messagePolling);
        state.messagePolling = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📷 IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

function handleDemandeImages(e) {
    processImages(e.target.files, 'demande');
}

function handleResponseImages(e) {
    processImages(e.target.files, 'response');
}

function handleChatImages(e) {
    processImages(e.target.files, 'chat');
}

function processImages(files, type) {
    const maxSize = 5 * 1024 * 1024;
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showToast('Format non supporté', 'warning');
            return;
        }
        
        if (file.size > maxSize) {
            showToast('Image trop lourde (max 5MB)', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = e => {
            const base64 = e.target.result;
            
            if (type === 'demande') {
                state.demandeImages.push(base64);
                updateImagePreview('demandeImagePreview', state.demandeImages, 'demande');
            } else if (type === 'response') {
                state.responseImages.push(base64);
                updateImagePreview('responseImagePreview', state.responseImages, 'response');
            } else if (type === 'chat') {
                state.chatImages.push(base64);
                updateChatImagePreview();
            }
        };
        reader.readAsDataURL(file);
    });
}

function updateImagePreview(containerId, images, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = images.map((img, i) => {
        return '<div class="image-preview-item">' +
            '<img src="' + img + '">' +
            '<button class="image-preview-remove" onclick="removeImage(\'' + type + '\', ' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    }).join('');
}

function updateChatImagePreview() {
    const container = document.getElementById('chatImagePreview');
    container.innerHTML = state.chatImages.map((img, i) => {
        return '<div class="chat-image-preview-item">' +
            '<img src="' + img + '">' +
            '<button class="remove-btn" onclick="removeChatImage(' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    }).join('');
}

function removeImage(type, index) {
    if (type === 'demande') {
        state.demandeImages.splice(index, 1);
        updateImagePreview('demandeImagePreview', state.demandeImages, 'demande');
    } else if (type === 'response') {
        state.responseImages.splice(index, 1);
        updateImagePreview('responseImagePreview', state.responseImages, 'response');
    }
}

function removeChatImage(index) {
    state.chatImages.splice(index, 1);
    updateChatImagePreview();
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🖼️ LIGHTBOX
// ═══════════════════════════════════════════════════════════════════════════════

function openLightbox(src) {
    document.getElementById('lightboxImage').src = src;
    document.getElementById('lightbox').classList.add('show');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         👤 ESPACE UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════════

function setupEspaceUtilisateur() {
    if (!state.user) return;
    
    const tabsContainer = document.getElementById('espaceTabs');
    const subtitle = document.getElementById('espaceSubtitle');
    
    if (state.user.role === 'acheteur') {
        subtitle.textContent = 'Gérez vos demandes';
        tabsContainer.innerHTML = 
            '<button class="user-tab active" onclick="loadEspaceTab(\'mes-demandes\', this)">Mes demandes</button>' +
            '<button class="user-tab" onclick="loadEspaceTab(\'reponses-recues\', this)">Réponses reçues</button>';
        loadEspaceTabDirect('mes-demandes');
    } else if (state.user.role === 'vendeur') {
        subtitle.textContent = 'Consultez les demandes disponibles';
        tabsContainer.innerHTML = 
            '<button class="user-tab active" onclick="loadEspaceTab(\'demandes-disponibles\', this)">Demandes dispo</button>' +
            '<button class="user-tab" onclick="loadEspaceTab(\'mes-reponses\', this)">Mes réponses</button>';
        loadEspaceTabDirect('demandes-disponibles');
    } else {
        showSection('admin');
    }
}

function loadEspaceTab(tab, element) {
    document.querySelectorAll('.user-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    loadEspaceTabDirect(tab);
}

async function loadEspaceTabDirect(tab) {
    const content = document.getElementById('espaceContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const userId = state.user._id || state.user.id;
    
    try {
        if (tab === 'mes-demandes') {
            const demandes = await apiCall('/demandes?acheteurId=' + userId);
            
            if (!demandes || demandes.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>Aucune demande</h3><button class="btn btn-primary" onclick="showSection(\'publish\')"><i class="fas fa-plus"></i> Publier</button></div>';
            } else {
                content.innerHTML = '<div class="demandes-grid">' + demandes.map(d => createDemandeCard(d)).join('') + '</div>';
            }
            
        } else if (tab === 'reponses-recues') {
            const demandes = await apiCall('/demandes?acheteurId=' + userId);
            let allReponses = [];
            
            if (demandes) {
                demandes.forEach(d => {
                    if (d.reponses) {
                        d.reponses.forEach(r => {
                            allReponses.push({ ...r, demandeTitre: d.titre, demandeId: d._id || d.id });
                        });
                    }
                });
            }
            
            if (allReponses.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune réponse</h3><p>Vous n\'avez pas encore reçu de réponse</p></div>';
            } else {
                content.innerHTML = allReponses.map(r => {
                    const vendeurNom = r.vendeurId?.nom || r.vendeurNom || 'Inconnu';
                    const vendeurId = r.vendeurId?._id || r.vendeurId;
                    
                    return '<div class="response-card">' +
                        '<div class="response-header">' +
                            '<div class="response-vendor">' +
                                '<div class="response-avatar">' + getInitials(vendeurNom) + '</div>' +
                                '<div class="response-vendor-info">' +
                                    '<h4>' + escapeHtml(vendeurNom) + '</h4>' +
                                    '<span>' + formatDate(r.dateCreation) + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<span class="card-badge">' + escapeHtml(r.demandeTitre) + '</span>' +
                        '</div>' +
                        '<p class="response-message">' + escapeHtml(r.message) + '</p>' +
                        '<div class="response-actions">' +
                            '<button class="btn btn-primary btn-sm" onclick="startConversation(\'' + vendeurId + '\', \'' + escapeHtml(vendeurNom) + '\', \'' + r.demandeId + '\', \'' + escapeHtml(r.demandeTitre) + '\')">' +
                                '<i class="fas fa-comment"></i> Discuter' +
                            '</button>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }
            
        } else if (tab === 'demandes-disponibles') {
            const demandes = await apiCall('/demandes');
            
            if (!demandes || demandes.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucune demande</h3></div>';
            } else {
                content.innerHTML = '<div class="demandes-grid">' + demandes.map(d => createDemandeCard(d)).join('') + '</div>';
            }
            
        } else if (tab === 'mes-reponses') {
            const reponses = await apiCall('/reponses?vendeurId=' + userId);
            
            if (!reponses || reponses.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-reply"></i><h3>Aucune réponse</h3><button class="btn btn-primary" onclick="showSection(\'demandes\')"><i class="fas fa-search"></i> Parcourir</button></div>';
            } else {
                content.innerHTML = reponses.map(r => {
                    const demandeId = r.demandeId?._id || r.demandeId;
                    return '<div class="card" onclick="showDemandeDetail(\'' + demandeId + '\')">' +
                        '<div class="card-body">' +
                            '<span class="card-badge">' + escapeHtml(r.demandeTitre || 'Demande') + '</span>' +
                            '<p class="card-description">' + escapeHtml(r.message) + '</p>' +
                            '<div class="card-footer"><span>' + formatDate(r.dateCreation) + '</span></div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }
        }
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur</h3></div>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🛡️ ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

async function loadAdminDashboard() {
    loadAdminTab('dashboard', document.querySelector('.admin-nav-item'));
}

async function loadAdminTab(tab, element) {
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
    
    const content = document.getElementById('adminContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        if (tab === 'dashboard') {
            const stats = await apiCall('/admin/stats');
            
            content.innerHTML = 
                '<div class="section-header"><h2 class="section-title">Dashboard</h2></div>' +
                '<div class="admin-stats-grid">' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon users"><i class="fas fa-users"></i></div><div class="admin-stat-info"><h4>Utilisateurs</h4><div class="number">' + (stats.totalUsers || 0) + '</div></div></div>' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon posts"><i class="fas fa-clipboard-list"></i></div><div class="admin-stat-info"><h4>Publications</h4><div class="number">' + (stats.totalDemandes || 0) + '</div></div></div>' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon messages"><i class="fas fa-comments"></i></div><div class="admin-stat-info"><h4>Messages</h4><div class="number">' + (stats.totalMessages || 0) + '</div></div></div>' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon banned"><i class="fas fa-user-slash"></i></div><div class="admin-stat-info"><h4>Bannis</h4><div class="number">' + (stats.bannedUsers || 0) + '</div></div></div>' +
                '</div>';
                
        } else if (tab === 'users') {
            const users = await apiCall('/admin/users');
            
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Utilisateurs (' + users.length + ')</h2></div>' +
                users.map(u => {
                    const uId = u._id || u.id;
                    return '<div class="admin-card">' +
                        '<div class="admin-card-header">' +
                            '<div class="admin-card-avatar">' + getInitials(u.nom) + '</div>' +
                            '<div class="admin-card-info"><h4>' + escapeHtml(u.nom) + '</h4><span>' + escapeHtml(u.email) + '</span></div>' +
                        '</div>' +
                        '<div class="admin-card-meta">' +
                            '<span class="status-badge ' + (u.isBanned ? 'banned' : 'active') + '">' + (u.isBanned ? 'Banni' : 'Actif') + '</span>' +
                            '<span class="status-badge pending">' + u.role + '</span>' +
                        '</div>' +
                        '<div class="admin-card-actions">' +
                            '<button class="action-btn message" onclick="sendAdminMessage(\'' + uId + '\')"><i class="fas fa-envelope"></i></button>' +
                            (u.isBanned 
                                ? '<button class="action-btn unban" onclick="unbanUser(\'' + uId + '\')"><i class="fas fa-user-check"></i> Débannir</button>'
                                : '<button class="action-btn ban" onclick="banUser(\'' + uId + '\')"><i class="fas fa-user-slash"></i> Bannir</button>'
                            ) +
                        '</div>' +
                    '</div>';
                }).join('');
                
        } else if (tab === 'posts') {
            const posts = await apiCall('/admin/posts');
            
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Publications (' + posts.length + ')</h2></div>' +
                posts.map(p => {
                    const pId = p._id || p.id;
                    const authorId = p.acheteurId?._id || p.acheteurId;
                    return '<div class="admin-card">' +
                        '<div class="admin-card-header">' +
                            '<div class="admin-card-info"><h4>' + escapeHtml(p.titre) + '</h4><span>' + escapeHtml(p.acheteurId?.nom || 'Inconnu') + ' • ' + formatDate(p.dateCreation) + '</span></div>' +
                        '</div>' +
                        '<div class="admin-card-meta">' +
                            '<span class="status-badge pending">' + escapeHtml(p.categorie) + '</span>' +
                            '<span style="font-weight:700;color:var(--primary);">' + formatPrice(p.budget) + '</span>' +
                        '</div>' +
                        '<div class="admin-card-actions">' +
                            '<button class="action-btn view" onclick="showDemandeDetail(\'' + pId + '\')"><i class="fas fa-eye"></i> Voir</button>' +
                            '<button class="action-btn delete" onclick="adminDeletePost(\'' + pId + '\', \'' + authorId + '\')"><i class="fas fa-trash"></i> Suppr.</button>' +
                        '</div>' +
                    '</div>';
                }).join('');
                
        } else if (tab === 'social') {
            const links = await apiCall('/admin/social-links');
            
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Réseaux sociaux</h2></div>' +
                '<button class="btn btn-primary" onclick="addSocialLink()" style="margin-bottom:20px;"><i class="fas fa-plus"></i> Ajouter</button>' +
                (links && links.length > 0 ? links.map(l => {
                    return '<div class="admin-card">' +
                        '<div class="admin-card-header">' +
                            '<div class="admin-card-avatar"><i class="' + (l.icon || 'fas fa-link') + '"></i></div>' +
                            '<div class="admin-card-info"><h4>' + escapeHtml(l.platform) + '</h4><span>' + escapeHtml(l.url) + '</span></div>' +
                        '</div>' +
                        '<div class="admin-card-actions">' +
                            '<button class="action-btn delete" onclick="deleteSocialLink(\'' + (l._id || l.id) + '\')"><i class="fas fa-trash"></i></button>' +
                        '</div>' +
                    '</div>';
                }).join('') : '<div class="empty-state"><i class="fas fa-share-alt"></i><p>Aucun lien</p></div>');
        }
    } catch (error) {
        content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur</h3><p>' + error.message + '</p></div>';
    }
}

async function adminDeletePost(postId, authorId) {
    const reason = prompt('Raison de la suppression:');
    if (!reason) return;
    
    try {
        await apiCall('/admin/posts/' + postId, {
            method: 'DELETE',
            body: JSON.stringify({ reason, sendMessage: true, messageContent: 'Votre publication a été supprimée: ' + reason })
        });
        showToast('Publication supprimée', 'success');
        loadAdminTab('posts', document.querySelector('.admin-nav-item:nth-child(3)'));
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function banUser(userId) {
    const reason = prompt('Raison du bannissement:');
    if (!reason) return;
    
    try {
        await apiCall('/admin/ban/' + userId, {
            method: 'POST',
            body: JSON.stringify({ banType: 'permanent', reason })
        });
        showToast('Utilisateur banni', 'success');
        loadAdminTab('users', document.querySelector('.admin-nav-item:nth-child(2)'));
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function unbanUser(userId) {
    if (!confirm('Débannir cet utilisateur ?')) return;
    
    try {
        await apiCall('/admin/unban/' + userId, { method: 'POST' });
        showToast('Utilisateur débanni', 'success');
        loadAdminTab('users', document.querySelector('.admin-nav-item:nth-child(2)'));
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function sendAdminMessage(userId) {
    const message = prompt('Message à envoyer:');
    if (!message) return;
    
    apiCall('/admin/message', {
        method: 'POST',
        body: JSON.stringify({ userId, subject: 'Message admin', message, type: 'info' })
    }).then(() => showToast('Message envoyé', 'success'))
      .catch(e => showToast(e.message, 'error'));
}

function addSocialLink() {
    const platform = prompt('Nom (ex: Facebook):');
    if (!platform) return;
    const url = prompt('URL:');
    if (!url) return;
    const icon = prompt('Icône (ex: fab fa-facebook-f):') || 'fas fa-link';
    
    apiCall('/admin/social-links', {
        method: 'POST',
        body: JSON.stringify({ platform, url, icon })
    }).then(() => {
        showToast('Lien ajouté', 'success');
        loadAdminTab('social', document.querySelector('.admin-nav-item:nth-child(4)'));
        loadSocialLinks();
    }).catch(e => showToast(e.message, 'error'));
}

async function deleteSocialLink(linkId) {
    if (!confirm('Supprimer ce lien ?')) return;
    
    try {
        await apiCall('/admin/social-links/' + linkId, { method: 'DELETE' });
        showToast('Lien supprimé', 'success');
        loadAdminTab('social', document.querySelector('.admin-nav-item:nth-child(4)'));
        loadSocialLinks();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadSocialLinks() {
    try {
        const links = await apiCall('/social-links');
        const container = document.getElementById('footerSocial');
        
        if (links && links.length > 0) {
            container.innerHTML = links.map(l => {
                return '<a href="' + l.url + '" target="_blank"><i class="' + (l.icon || 'fas fa-link') + '"></i></a>';
            }).join('');
        }
    } catch (error) {
        console.error('Error loading social links:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🎯 EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeLightbox();
        closeChat();
        closeAuthModal();
        closeResponseModal();
        closeNotifications();
        closeUserPanel();
    }
});

// Fermer modals en cliquant dehors
document.getElementById('authModal').addEventListener('click', e => {
    if (e.target.id === 'authModal') closeAuthModal();
});

document.getElementById('responseModal').addEventListener('click', e => {
    if (e.target.id === 'responseModal') closeResponseModal();
});

console.log('✅ MarketPlace Pro v3.0 loaded successfully!');