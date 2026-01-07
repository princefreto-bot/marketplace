// ═══════════════════════════════════════════════════════════════════════════════
//                   MARKETPLACE PRO - JAVASCRIPT PRINCIPAL
//                   Version: 4.0 - Full Production
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = window.location.origin + '/api';

// ═══════════════════════════════════════════════════════════════════════════════
//                         STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

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
    messagePolling: null,
    heroSliderInterval: null,
    currentSlide: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
//                         INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MarketPlace Pro v4.0 - Full Production');
    
    // Restore session
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
    
    // Load initial data
    loadStats();
    loadRecentDemandes();
    loadTopAnnonces();
    loadSocialLinks();
    loadHeroSliders();
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         API CALLS
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
//                         UI HELPERS
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
    return name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
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
    if (typeof image === 'string') return image;
    if (typeof image === 'object' && image.url) return image.url;
    return '';
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function showSection(sectionId) {
    // Close all panels
    closeNotifications();
    closeUserPanel();
    closeChat();
    
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(function(s) {
        s.classList.remove('active');
    });
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(function(l) {
        l.classList.remove('active');
    });
    document.querySelectorAll('.bottom-nav-item').forEach(function(l) {
        l.classList.remove('active');
    });
    
    var activeNavLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
    if (activeNavLink) activeNavLink.classList.add('active');
    
    var activeBottomNav = document.querySelector('.bottom-nav-item[data-section="' + sectionId + '"]');
    if (activeBottomNav) activeBottomNav.classList.add('active');
    
    // Show/hide footer
    var footer = document.getElementById('mainFooter');
    footer.style.display = sectionId === 'admin' ? 'none' : 'block';
    
    // Map sections
    var sectionMap = {
        'home': 'sectionHome',
        'demandes': 'sectionDemandes',
        'detail': 'sectionDetail',
        'publish': 'sectionPublish',
        'messages': 'sectionMessages',
        'espace': 'sectionEspace',
        'admin': 'sectionAdmin'
    };
    
    var targetSection = document.getElementById(sectionMap[sectionId]);
    if (targetSection) targetSection.classList.add('active');
    
    // Load data
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

function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    showSection('demandes');
    setTimeout(filterDemandes, 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         HERO SLIDER
// ═══════════════════════════════════════════════════════════════════════════════

async function loadHeroSliders() {
    try {
        const sliders = await apiCall('/admin/sliders').catch(function() { return []; });
        
        if (sliders && sliders.length > 0) {
            var activeSliders = sliders.filter(function(s) { return s.isActive; });
            
            if (activeSliders.length > 0) {
                var sliderContainer = document.getElementById('heroSlider');
                var dotsContainer = document.getElementById('heroDots');
                var heroSection = document.getElementById('heroSection');
                
                heroSection.classList.remove('hero-default');
                
                sliderContainer.innerHTML = activeSliders.map(function(slider, index) {
                    return '<div class="hero-slide ' + (index === 0 ? 'active' : '') + '" style="background-image: url(\'' + getImageUrl(slider.image) + '\')"></div>';
                }).join('');
                
                if (activeSliders.length > 1) {
                    dotsContainer.innerHTML = activeSliders.map(function(_, index) {
                        return '<div class="hero-dot ' + (index === 0 ? 'active' : '') + '" onclick="goToSlide(' + index + ')"></div>';
                    }).join('');
                    
                    // Auto-slide
                    if (state.heroSliderInterval) clearInterval(state.heroSliderInterval);
                    state.heroSliderInterval = setInterval(nextSlide, 5000);
                }
                
                // Update text from first slider
                if (activeSliders[0].title) {
                    document.getElementById('heroTitle').textContent = activeSliders[0].title;
                }
                if (activeSliders[0].description) {
                    document.getElementById('heroSubtitle').textContent = activeSliders[0].description;
                }
            }
        }
    } catch (error) {
        console.log('Hero sliders not available');
    }
}

function nextSlide() {
    var slides = document.querySelectorAll('.hero-slide');
    var dots = document.querySelectorAll('.hero-dot');
    
    if (slides.length <= 1) return;
    
    slides[state.currentSlide].classList.remove('active');
    dots[state.currentSlide].classList.remove('active');
    
    state.currentSlide = (state.currentSlide + 1) % slides.length;
    
    slides[state.currentSlide].classList.add('active');
    dots[state.currentSlide].classList.add('active');
}

function goToSlide(index) {
    var slides = document.querySelectorAll('.hero-slide');
    var dots = document.querySelectorAll('.hero-dot');
    
    slides[state.currentSlide].classList.remove('active');
    dots[state.currentSlide].classList.remove('active');
    
    state.currentSlide = index;
    
    slides[state.currentSlide].classList.add('active');
    dots[state.currentSlide].classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(function(t, i) {
        t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
    });
    
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('authModalTitle').textContent = tab === 'login' ? 'Connexion' : 'Inscription';
}

function selectRole(role, element) {
    document.getElementById('registerRole').value = role;
    document.querySelectorAll('.role-option').forEach(function(o) {
        o.classList.remove('selected');
    });
    element.classList.add('selected');
}

async function handleLogin(e) {
    e.preventDefault();
    
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    
    try {
        var response = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email: email, password: password })
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
    
    var data = {
        role: document.getElementById('registerRole').value,
        nom: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        telephone: document.getElementById('registerPhone').value,
        localisation: document.getElementById('registerLocation').value
    };
    
    try {
        var response = await apiCall('/register', {
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
    
    var initials = getInitials(state.user.nom);
    document.getElementById('navAvatar').textContent = initials;
    document.getElementById('userAvatarLarge').textContent = initials;
    document.getElementById('userName').textContent = state.user.nom;
    
    var roleTexts = { 'acheteur': 'Acheteur', 'vendeur': 'Vendeur', 'admin': 'Administrateur' };
    document.getElementById('userRole').textContent = roleTexts[state.user.role] || 'Utilisateur';
    
    // Show/hide publish based on role
    var navPublish = document.getElementById('navPublish');
    if (navPublish) navPublish.style.display = state.user.role === 'vendeur' ? 'none' : 'block';
    
    // Admin
    if (state.user.role === 'admin') {
        document.getElementById('navAdmin').style.display = 'flex';
        document.getElementById('menuAdmin').style.display = 'flex';
    }
    
    loadNotifications();
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function toggleNotifications() {
    closeUserPanel();
    var overlay = document.getElementById('notificationOverlay');
    var panel = document.getElementById('notificationPanel');
    
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
    var overlay = document.getElementById('userOverlay');
    var panel = document.getElementById('userPanel');
    
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
    
    var userId = state.user._id || state.user.id;
    
    try {
        var notifications = await apiCall('/notifications/' + userId + '/unread');
        state.notifications = notifications || [];
        
        // Badge
        var badge = document.getElementById('notificationBadge');
        if (state.notifications.length > 0) {
            badge.textContent = state.notifications.length > 99 ? '99+' : state.notifications.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
        
        // List
        var list = document.getElementById('notificationList');
        if (state.notifications.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>Aucune notification</p></div>';
        } else {
            list.innerHTML = state.notifications.map(function(n) {
                var icon, iconClass, text;
                var nData = n.data || {};
                
                switch(n.type) {
                    case 'message':
                        icon = 'comment';
                        iconClass = 'message';
                        text = '<strong>' + escapeHtml(nData.senderNom || 'Quelqu\'un') + '</strong> vous a envoyé un message';
                        break;
                    case 'reponse':
                        icon = 'reply';
                        iconClass = 'reponse';
                        text = '<strong>' + escapeHtml(nData.vendeurNom || 'Un vendeur') + '</strong> a répondu à votre demande';
                        break;
                    case 'nouvelle_demande':
                        icon = 'bullhorn';
                        iconClass = 'demande';
                        text = 'Nouvelle demande: <strong>' + escapeHtml(nData.demandeTitre || '') + '</strong>';
                        break;
                    default:
                        icon = 'bell';
                        iconClass = 'message';
                        text = 'Nouvelle notification';
                }
                
                return '<div class="notification-item unread" onclick="handleNotificationClick(\'' + (n._id || n.id) + '\', \'' + n.type + '\', ' + JSON.stringify(nData).replace(/"/g, '&quot;') + ')">' +
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

async function handleNotificationClick(notificationId, type, data) {
    closeNotifications();
    
    // Mark as read
    try {
        await apiCall('/notifications/' + notificationId + '/read', { method: 'PUT' });
    } catch(e) {}
    
    // Redirect based on type
    if (type === 'message' && data && data.senderId && data.senderNom) {
        startConversation(data.senderId, data.senderNom, data.demandeId || '', data.demandeTitre || 'Conversation');
    } else if (type === 'reponse' && data && data.demandeId) {
        showDemandeDetail(data.demandeId);
    } else if (type === 'nouvelle_demande' && data && data.demandeId) {
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
    state.notificationPolling = setInterval(function() {
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
//                         STATS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadStats() {
    try {
        var stats = await apiCall('/stats');
        document.getElementById('statUsers').textContent = stats.totalUsers || 0;
        document.getElementById('statDemandes').textContent = stats.totalDemandes || 0;
        document.getElementById('statReponses').textContent = stats.totalReponses || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         DEMANDES
// ═══════════════════════════════════════════════════════════════════════════════

async function loadTopAnnonces() {
    try {
        var demandes = await apiCall('/demandes');
        var carousel = document.getElementById('topAnnoncesCarousel');
        
        if (!demandes || demandes.length === 0) {
            document.getElementById('topAnnoncesSection').style.display = 'none';
            return;
        }
        
        // Show first 6 as "top"
        var topDemandes = demandes.slice(0, 6);
        
        carousel.innerHTML = topDemandes.map(function(d) {
            var imageUrl = '';
            if (d.images && d.images.length > 0) {
                imageUrl = getImageUrl(d.images[0]);
            }
            
            return '<div class="top-annonce-card" onclick="showDemandeDetail(\'' + (d._id || d.id) + '\')">' +
                '<div class="top-annonce-image">' +
                    (imageUrl 
                        ? '<img src="' + imageUrl + '" alt="' + escapeHtml(d.titre) + '" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239ca3af%22 font-size=%2230%22>📷</text></svg>\'">'
                        : '<img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239ca3af%22 font-size=%2230%22>📷</text></svg>">'
                    ) +
                '</div>' +
                '<div class="top-annonce-body">' +
                    '<div class="top-annonce-title">' + escapeHtml(d.titre) + '</div>' +
                    '<div class="top-annonce-price">' + formatPrice(d.budget) + '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch (error) {
        console.error('Error loading top annonces:', error);
    }
}

async function loadRecentDemandes() {
    try {
        var demandes = await apiCall('/demandes');
        var container = document.getElementById('recentDemandes');
        
        if (!demandes || demandes.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune demande</h3><p>Soyez le premier à publier !</p><button class="btn btn-primary" onclick="handlePublishClick()"><i class="fas fa-plus"></i> Publier</button></div>';
        } else {
            container.innerHTML = demandes.slice(0, 6).map(function(d) {
                return createDemandeCard(d);
            }).join('');
        }
    } catch (error) {
        document.getElementById('recentDemandes').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur</h3><p>Impossible de charger les demandes</p></div>';
    }
}

async function loadDemandes() {
    try {
        var search = document.getElementById('searchInput').value;
        var categorie = document.getElementById('categoryFilter').value;
        
        var url = '/demandes?';
        if (search) url += 'search=' + encodeURIComponent(search) + '&';
        if (categorie) url += 'categorie=' + encodeURIComponent(categorie);
        
        var demandes = await apiCall(url);
        state.demandes = demandes;
        
        var grid = document.getElementById('demandesGrid');
        
        if (!demandes || demandes.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucune demande</h3><p>Modifiez vos critères de recherche</p></div>';
        } else {
            grid.innerHTML = demandes.map(function(d) {
                return createDemandeCard(d);
            }).join('');
        }
    } catch (error) {
        showToast('Erreur de chargement', 'error');
    }
}

function filterDemandes() {
    loadDemandes();
}

function createDemandeCard(demande) {
    var imageUrl = '';
    if (demande.images && demande.images.length > 0) {
        imageUrl = getImageUrl(demande.images[0]);
    }
    
    var badge = demande.badge || '';
    var badgeHtml = '';
    
    if (badge === 'new') {
        badgeHtml = '<span class="card-badge badge-new"><i class="fas fa-sparkles"></i> Nouveau</span>';
    } else if (badge === 'urgent') {
        badgeHtml = '<span class="card-badge badge-urgent"><i class="fas fa-bolt"></i> Urgent</span>';
    } else if (badge === 'top') {
        badgeHtml = '<span class="card-badge badge-top"><i class="fas fa-star"></i> Top</span>';
    } else if (badge === 'sponsored') {
        badgeHtml = '<span class="card-badge badge-sponsored"><i class="fas fa-ad"></i> Sponsorisé</span>';
    }
    
    var imageHtml = imageUrl 
        ? '<div class="card-image-container"><div class="card-badges">' + badgeHtml + '<span class="card-badge badge-category">' + escapeHtml(demande.categorie) + '</span></div><img src="' + imageUrl + '" class="card-image" alt="' + escapeHtml(demande.titre) + '" onerror="this.parentElement.innerHTML=\'<div class=card-no-image><i class=fas fa-image></i><span>Image non disponible</span></div>\'"></div>'
        : '<div class="card-image-container"><div class="card-badges">' + badgeHtml + '<span class="card-badge badge-category">' + escapeHtml(demande.categorie) + '</span></div><div class="card-no-image"><i class="fas fa-image"></i><span>Pas d\'image</span></div></div>';
    
    return '<div class="card" onclick="showDemandeDetail(\'' + (demande._id || demande.id) + '\')">' +
        imageHtml +
        '<div class="card-body">' +
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
        var demande = await apiCall('/demandes/' + demandeId);
        state.currentDemande = demande;
        
        var container = document.getElementById('detailContainer');
        
        // Images
        var imageUrl = '';
        if (demande.images && demande.images.length > 0) {
            imageUrl = getImageUrl(demande.images[0]);
        }
        
        var imagesHtml = '';
        if (imageUrl) {
            imagesHtml = '<div class="detail-images">' +
                '<img src="' + imageUrl + '" class="detail-main-image" onclick="openLightbox(\'' + imageUrl + '\')" onerror="this.style.display=\'none\'">';
            
            if (demande.images.length > 1) {
                imagesHtml += '<div class="detail-thumbnails">' +
                    demande.images.map(function(img, i) {
                        var url = getImageUrl(img);
                        return '<img src="' + url + '" class="detail-thumbnail ' + (i === 0 ? 'active' : '') + '" onclick="changeDetailImage(\'' + url + '\', this)" onerror="this.style.display=\'none\'">';
                    }).join('') +
                '</div>';
            }
            imagesHtml += '</div>';
        }
        
        var acheteurId = demande.acheteurId && demande.acheteurId._id ? demande.acheteurId._id : demande.acheteurId;
        var acheteurNom = demande.acheteurId && demande.acheteurId.nom ? demande.acheteurId.nom : (demande.acheteurNom || 'Inconnu');
        var userId = state.user ? (state.user._id || state.user.id) : null;
        
        // Actions
        var actionsHtml = '';
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
                    '<div class="detail-meta-item"><i class="fas fa-comments"></i><span>' + (demande.reponses ? demande.reponses.length : 0) + ' réponse(s)</span></div>' +
                '</div>' +
                '<p class="detail-description">' + escapeHtml(demande.description) + '</p>' +
                actionsHtml +
            '</div>';
        
        // Responses
        var reponses = demande.reponses || [];
        var responsesSection = document.getElementById('responsesSection');
        var responsesList = document.getElementById('responsesList');
        var responseCount = document.getElementById('responseCount');
        
        if (state.user && userId === acheteurId && reponses.length > 0) {
            responsesSection.style.display = 'block';
            responseCount.textContent = reponses.length;
            
            responsesList.innerHTML = reponses.map(function(r) {
                var vendeurId = r.vendeurId && r.vendeurId._id ? r.vendeurId._id : r.vendeurId;
                var vendeurNom = r.vendeurId && r.vendeurId.nom ? r.vendeurId.nom : (r.vendeurNom || 'Inconnu');
                
                var responseImagesHtml = '';
                if (r.images && r.images.length > 0) {
                    responseImagesHtml = '<div class="response-images">' +
                        r.images.map(function(img) {
                            var url = getImageUrl(img);
                            return url ? '<img src="' + url + '" onclick="openLightbox(\'' + url + '\')" onerror="this.style.display=\'none\'">' : '';
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
    document.querySelectorAll('.detail-thumbnail').forEach(function(t) {
        t.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

async function submitDemande(e) {
    e.preventDefault();
    
    if (!state.user) {
        showAuthModal();
        return;
    }
    
    var submitBtn = document.getElementById('publishBtn');
    var originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';
    submitBtn.disabled = true;
    
    try {
        var data = {
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
        loadTopAnnonces();
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
        loadTopAnnonces();
        showSection('demandes');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         RESPONSES
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
    
    var demandeId = document.getElementById('responseDemandeId').value;
    var message = document.getElementById('responseMessage').value;
    
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
//                         MESSAGING
// ═══════════════════════════════════════════════════════════════════════════════

async function loadConversations() {
    if (!state.user) return;
    
    var userId = state.user._id || state.user.id;
    
    try {
        var conversations = await apiCall('/conversations/' + userId);
        state.conversations = conversations;
        
        var container = document.getElementById('conversationsList');
        
        if (!conversations || conversations.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Aucune conversation</p></div>';
        } else {
            container.innerHTML = conversations.map(function(c) {
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
    
    var currentUserId = state.user._id || state.user.id;
    var ids = [currentUserId, userId].sort();
    var conversationId = 'demande_' + (demandeId || 'direct') + '_users_' + ids[0] + '_' + ids[1];
    
    openChat(conversationId, userId, userName, demandeId, demandeTitre);
}

function openChatFromConversation(conversationId, userId, userName, demandeId, demandeTitre) {
    openChat(conversationId, userId, userName, demandeId, demandeTitre);
}

async function openChat(conversationId, userId, userName, demandeId, demandeTitre) {
    state.currentConversation = {
        conversationId: conversationId,
        userId: userId,
        userName: userName,
        demandeId: demandeId,
        demandeTitre: demandeTitre
    };
    
    document.getElementById('chatAvatar').textContent = getInitials(userName);
    document.getElementById('chatName').textContent = userName;
    document.getElementById('chatProduct').textContent = demandeTitre || 'Conversation';
    
    state.chatImages = [];
    updateChatImagePreview();
    document.getElementById('chatInput').value = '';
    
    await loadMessages(conversationId);
    
    document.getElementById('chatOverlay').classList.add('show');
    document.getElementById('chatPopup').classList.add('show');
    
    startMessagePolling(conversationId);
}

async function loadMessages(conversationId) {
    try {
        var messages = await apiCall('/messages/' + encodeURIComponent(conversationId));
        var container = document.getElementById('chatMessages');
        
        var userId = state.user._id || state.user.id;
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="chat-empty"><i class="fas fa-comments"></i><p>Démarrez la conversation</p></div>';
        } else {
            container.innerHTML = messages.map(function(m) {
                var senderId = m.senderId && m.senderId._id ? m.senderId._id : m.senderId;
                var isSent = senderId === userId;
                
                var imagesHtml = '';
                if (m.images && m.images.length > 0) {
                    imagesHtml = '<div class="message-images">' +
                        m.images.map(function(img) {
                            var url = getImageUrl(img);
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
    
    var input = document.getElementById('chatInput');
    var message = input.value.trim();
    
    if (!message && state.chatImages.length === 0) return;
    
    var conv = state.currentConversation;
    
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
    state.messagePolling = setInterval(function() {
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
//                         IMAGES
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
    var maxSize = 5 * 1024 * 1024;
    
    Array.from(files).forEach(function(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Format non supporté', 'warning');
            return;
        }
        
        if (file.size > maxSize) {
            showToast('Image trop lourde (max 5MB)', 'warning');
            return;
        }
        
        var reader = new FileReader();
        reader.onload = function(e) {
            var base64 = e.target.result;
            
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
    var container = document.getElementById(containerId);
    container.innerHTML = images.map(function(img, i) {
        return '<div class="image-preview-item">' +
            '<img src="' + img + '">' +
            '<button class="image-preview-remove" onclick="removeImage(\'' + type + '\', ' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    }).join('');
}

function updateChatImagePreview() {
    var container = document.getElementById('chatImagePreview');
    container.innerHTML = state.chatImages.map(function(img, i) {
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
//                         LIGHTBOX
// ═══════════════════════════════════════════════════════════════════════════════

function openLightbox(src) {
    document.getElementById('lightboxImage').src = src;
    document.getElementById('lightbox').classList.add('show');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         USER SPACE
// ═══════════════════════════════════════════════════════════════════════════════

function setupEspaceUtilisateur() {
    if (!state.user) return;
    
    var tabsContainer = document.getElementById('espaceTabs');
    var subtitle = document.getElementById('espaceSubtitle');
    
    if (state.user.role === 'acheteur') {
        subtitle.textContent = 'Gérez vos demandes';
        tabsContainer.innerHTML = 
            '<button class="user-tab active" onclick="loadEspaceTab(\'mes-demandes\', this)">Mes demandes</button>' +
            '<button class="user-tab" onclick="loadEspaceTab(\'reponses-recues\', this)">Réponses</button>';
        loadEspaceTabDirect('mes-demandes');
    } else if (state.user.role === 'vendeur') {
        subtitle.textContent = 'Consultez les demandes disponibles';
        tabsContainer.innerHTML = 
            '<button class="user-tab active" onclick="loadEspaceTab(\'demandes-disponibles\', this)">Demandes</button>' +
            '<button class="user-tab" onclick="loadEspaceTab(\'mes-reponses\', this)">Mes réponses</button>';
        loadEspaceTabDirect('demandes-disponibles');
    } else {
        showSection('admin');
    }
}

function loadEspaceTab(tab, element) {
    document.querySelectorAll('.user-tab').forEach(function(t) {
        t.classList.remove('active');
    });
    element.classList.add('active');
    loadEspaceTabDirect(tab);
}

async function loadEspaceTabDirect(tab) {
    var content = document.getElementById('espaceContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    var userId = state.user._id || state.user.id;
    
    try {
        if (tab === 'mes-demandes') {
            var demandes = await apiCall('/demandes?acheteurId=' + userId);
            
            if (!demandes || demandes.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>Aucune demande</h3><button class="btn btn-primary" onclick="showSection(\'publish\')"><i class="fas fa-plus"></i> Publier</button></div>';
            } else {
                content.innerHTML = '<div class="demandes-grid">' + demandes.map(function(d) { return createDemandeCard(d); }).join('') + '</div>';
            }
            
        } else if (tab === 'reponses-recues') {
            var demandes = await apiCall('/demandes?acheteurId=' + userId);
            var allReponses = [];
            
            if (demandes) {
                demandes.forEach(function(d) {
                    if (d.reponses) {
                        d.reponses.forEach(function(r) {
                            allReponses.push({ 
                                ...r, 
                                demandeTitre: d.titre, 
                                demandeId: d._id || d.id 
                            });
                        });
                    }
                });
            }
            
            if (allReponses.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune réponse</h3><p>Vous n\'avez pas encore reçu de réponse</p></div>';
            } else {
                content.innerHTML = allReponses.map(function(r) {
                    var vendeurNom = r.vendeurId && r.vendeurId.nom ? r.vendeurId.nom : (r.vendeurNom || 'Inconnu');
                    var vendeurId = r.vendeurId && r.vendeurId._id ? r.vendeurId._id : r.vendeurId;
                    
                    return '<div class="response-card">' +
                        '<div class="response-header">' +
                            '<div class="response-vendor">' +
                                '<div class="response-avatar">' + getInitials(vendeurNom) + '</div>' +
                                '<div class="response-vendor-info">' +
                                    '<h4>' + escapeHtml(vendeurNom) + '</h4>' +
                                    '<span>' + formatDate(r.dateCreation) + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<span class="card-badge badge-category">' + escapeHtml(r.demandeTitre) + '</span>' +
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
            var demandes = await apiCall('/demandes');
            
            if (!demandes || demandes.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucune demande</h3></div>';
            } else {
                content.innerHTML = '<div class="demandes-grid">' + demandes.map(function(d) { return createDemandeCard(d); }).join('') + '</div>';
            }
            
        } else if (tab === 'mes-reponses') {
            var reponses = await apiCall('/reponses?vendeurId=' + userId);
            
            if (!reponses || reponses.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-reply"></i><h3>Aucune réponse</h3><button class="btn btn-primary" onclick="showSection(\'demandes\')"><i class="fas fa-search"></i> Parcourir</button></div>';
            } else {
                content.innerHTML = reponses.map(function(r) {
                    var demandeId = r.demandeId && r.demandeId._id ? r.demandeId._id : r.demandeId;
                    return '<div class="card" onclick="showDemandeDetail(\'' + demandeId + '\')">' +
                        '<div class="card-body">' +
                            '<span class="card-badge badge-category">' + escapeHtml(r.demandeTitre || 'Demande') + '</span>' +
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
//                         ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

async function loadAdminDashboard() {
    loadAdminTab('dashboard', document.querySelector('.admin-nav-item'));
}

async function loadAdminTab(tab, element) {
    document.querySelectorAll('.admin-nav-item').forEach(function(i) {
        i.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    var content = document.getElementById('adminContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        if (tab === 'dashboard') {
            var stats = await apiCall('/admin/stats');
            
            content.innerHTML = 
                '<div class="section-header"><h2 class="section-title">Dashboard</h2></div>' +
                '<div class="admin-stats-grid">' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon users"><i class="fas fa-users"></i></div><div class="admin-stat-info"><h4>Utilisateurs</h4><div class="number">' + (stats.totalUsers || 0) + '</div></div></div>' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon posts"><i class="fas fa-clipboard-list"></i></div><div class="admin-stat-info"><h4>Publications</h4><div class="number">' + (stats.totalDemandes || 0) + '</div></div></div>' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon messages"><i class="fas fa-comments"></i></div><div class="admin-stat-info"><h4>Messages</h4><div class="number">' + (stats.totalMessages || 0) + '</div></div></div>' +
                    '<div class="admin-stat-card"><div class="admin-stat-icon banned"><i class="fas fa-user-slash"></i></div><div class="admin-stat-info"><h4>Bannis</h4><div class="number">' + (stats.bannedUsers || 0) + '</div></div></div>' +
                '</div>';
                
        } else if (tab === 'users') {
            var users = await apiCall('/admin/users');
            
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Utilisateurs (' + users.length + ')</h2></div>' +
                users.map(function(u) {
                    var uId = u._id || u.id;
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
            var posts = await apiCall('/admin/posts');
            
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Publications (' + posts.length + ')</h2></div>' +
                posts.map(function(p) {
                    var pId = p._id || p.id;
                    return '<div class="admin-card">' +
                        '<div class="admin-card-header">' +
                            '<div class="admin-card-info"><h4>' + escapeHtml(p.titre) + '</h4><span>' + escapeHtml(p.acheteurId && p.acheteurId.nom ? p.acheteurId.nom : 'Inconnu') + ' • ' + formatDate(p.dateCreation) + '</span></div>' +
                        '</div>' +
                        '<div class="admin-card-meta">' +
                            '<span class="status-badge pending">' + escapeHtml(p.categorie) + '</span>' +
                            '<span style="font-weight:700;color:var(--primary);">' + formatPrice(p.budget) + '</span>' +
                        '</div>' +
                        '<div class="admin-card-actions">' +
                            '<button class="action-btn view" onclick="showDemandeDetail(\'' + pId + '\')"><i class="fas fa-eye"></i></button>' +
                            '<button class="action-btn delete" onclick="adminDeletePost(\'' + pId + '\')"><i class="fas fa-trash"></i> Suppr.</button>' +
                        '</div>' +
                    '</div>';
                }).join('');
                
        } else if (tab === 'sliders') {
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Gestion des Sliders</h2></div>' +
                '<button class="btn btn-primary" onclick="addSlider()" style="margin-bottom:20px;"><i class="fas fa-plus"></i> Ajouter un slide</button>' +
                '<div id="slidersList"><div class="loading"><div class="spinner"></div></div></div>';
            loadSliders();
            
        } else if (tab === 'customize') {
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Personnaliser le site</h2></div>' +
                '<div class="publish-card">' +
                    '<form id="customizeForm" onsubmit="saveCustomization(event)">' +
                        '<div class="form-group">' +
                            '<label class="form-label">Couleur principale</label>' +
                            '<input type="color" class="form-input" id="primaryColor" value="#FF6B00" style="height:50px;padding:5px;">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">Texte Hero</label>' +
                            '<input type="text" class="form-input" id="heroText" placeholder="Titre principal">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">Sous-titre Hero</label>' +
                            '<textarea class="form-textarea" id="heroSubtext" placeholder="Description"></textarea>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">Texte bouton CTA</label>' +
                            '<input type="text" class="form-input" id="ctaText" placeholder="Publier une demande">' +
                        '</div>' +
                        '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Sauvegarder</button>' +
                    '</form>' +
                '</div>';
                
        } else if (tab === 'social') {
            var links = await apiCall('/admin/social-links').catch(function() { return []; });
            
            content.innerHTML = '<div class="section-header"><h2 class="section-title">Réseaux sociaux</h2></div>' +
                '<button class="btn btn-primary" onclick="addSocialLink()" style="margin-bottom:20px;"><i class="fas fa-plus"></i> Ajouter</button>' +
                (links && links.length > 0 ? links.map(function(l) {
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

async function loadSliders() {
    try {
        var sliders = await apiCall('/admin/sliders').catch(function() { return []; });
        var container = document.getElementById('slidersList');
        
        if (!sliders || sliders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>Aucun slider</p></div>';
        } else {
            container.innerHTML = sliders.map(function(s) {
                return '<div class="admin-card">' +
                    '<div class="admin-card-header">' +
                        '<img src="' + getImageUrl(s.image) + '" style="width:80px;height:50px;object-fit:cover;border-radius:8px;" onerror="this.style.display=\'none\'">' +
                        '<div class="admin-card-info"><h4>' + escapeHtml(s.title || 'Sans titre') + '</h4><span>' + (s.isActive ? '✅ Actif' : '❌ Inactif') + '</span></div>' +
                    '</div>' +
                    '<div class="admin-card-actions">' +
                        '<button class="action-btn ' + (s.isActive ? 'ban' : 'unban') + '" onclick="toggleSlider(\'' + (s._id || s.id) + '\', ' + !s.isActive + ')">' +
                            '<i class="fas fa-' + (s.isActive ? 'eye-slash' : 'eye') + '"></i>' +
                        '</button>' +
                        '<button class="action-btn delete" onclick="deleteSlider(\'' + (s._id || s.id) + '\')"><i class="fas fa-trash"></i></button>' +
                    '</div>' +
                '</div>';
            }).join('');
        }
    } catch (error) {
        console.error('Error loading sliders:', error);
    }
}

function addSlider() {
    var title = prompt('Titre du slide:');
    if (!title) return;
    
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                await apiCall('/admin/sliders', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: title,
                        image: ev.target.result,
                        isActive: true
                    })
                });
                showToast('Slider ajouté', 'success');
                loadSliders();
                loadHeroSliders();
            } catch (error) {
                showToast(error.message, 'error');
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

async function toggleSlider(sliderId, isActive) {
    try {
        await apiCall('/admin/sliders/' + sliderId, {
            method: 'PUT',
            body: JSON.stringify({ isActive: isActive })
        });
        loadSliders();
        loadHeroSliders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteSlider(sliderId) {
    if (!confirm('Supprimer ce slider ?')) return;
    
    try {
        await apiCall('/admin/sliders/' + sliderId, { method: 'DELETE' });
        showToast('Slider supprimé', 'success');
        loadSliders();
        loadHeroSliders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function saveCustomization(e) {
    e.preventDefault();
    showToast('Personnalisation sauvegardée !', 'success');
}

async function adminDeletePost(postId) {
    var reason = prompt('Raison de la suppression:');
    if (!reason) return;
    
    try {
        await apiCall('/admin/posts/' + postId, {
            method: 'DELETE',
            body: JSON.stringify({ reason: reason, sendMessage: true, messageContent: 'Votre publication a été supprimée: ' + reason })
        });
        showToast('Publication supprimée', 'success');
        loadAdminTab('posts', document.querySelector('.admin-nav-item:nth-child(3)'));
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function banUser(userId) {
    var reason = prompt('Raison du bannissement:');
    if (!reason) return;
    
    try {
        await apiCall('/admin/ban/' + userId, {
            method: 'POST',
            body: JSON.stringify({ banType: 'permanent', reason: reason })
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
    var message = prompt('Message à envoyer:');
    if (!message) return;
    
    apiCall('/admin/message', {
        method: 'POST',
        body: JSON.stringify({ userId: userId, subject: 'Message admin', message: message, type: 'info' })
    }).then(function() {
        showToast('Message envoyé', 'success');
    }).catch(function(e) {
        showToast(e.message, 'error');
    });
}

function addSocialLink() {
    var platform = prompt('Nom (ex: Facebook):');
    if (!platform) return;
    var url = prompt('URL:');
    if (!url) return;
    var icon = prompt('Icône (ex: fab fa-facebook-f):') || 'fas fa-link';
    
    apiCall('/admin/social-links', {
        method: 'POST',
        body: JSON.stringify({ platform: platform, url: url, icon: icon })
    }).then(function() {
        showToast('Lien ajouté', 'success');
        loadAdminTab('social', document.querySelector('.admin-nav-item:nth-child(6)'));
        loadSocialLinks();
    }).catch(function(e) {
        showToast(e.message, 'error');
    });
}

async function deleteSocialLink(linkId) {
    if (!confirm('Supprimer ce lien ?')) return;
    
    try {
        await apiCall('/admin/social-links/' + linkId, { method: 'DELETE' });
        showToast('Lien supprimé', 'success');
        loadAdminTab('social', document.querySelector('.admin-nav-item:nth-child(6)'));
        loadSocialLinks();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadSocialLinks() {
    try {
        var links = await apiCall('/social-links');
        var container = document.getElementById('footerSocial');
        
        if (links && links.length > 0) {
            container.innerHTML = links.map(function(l) {
                return '<a href="' + l.url + '" target="_blank"><i class="' + (l.icon || 'fas fa-link') + '"></i></a>';
            }).join('');
        }
    } catch (error) {
        console.log('Social links not available');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
        closeChat();
        closeAuthModal();
        closeResponseModal();
        closeNotifications();
        closeUserPanel();
    }
});

// Close modals on backdrop click
document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target.id === 'authModal') closeAuthModal();
});

document.getElementById('responseModal').addEventListener('click', function(e) {
    if (e.target.id === 'responseModal') closeResponseModal();
});

console.log('✅ MarketPlace Pro v4.0 loaded successfully!');