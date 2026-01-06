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
    reponseImages: [],
    chatImages: [],
    notificationPolling: null,
    messagePolling: null,
    lastNotificationCount: 0,
    adminStats: null
};

// ═══════════════════════════════════════════════════════════════════════════════
//                         🚀 INITIALISATION
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MarketPlace Pro initialized');
    
    // Check if user is logged in
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
    loadSocialLinks();
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Setup navbar scroll effect
    setupNavbarScroll();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-notification') && !e.target.closest('.notification-panel')) {
            document.getElementById('notificationPanel').classList.remove('show');
        }
        if (!e.target.closest('.nav-user') && !e.target.closest('.user-dropdown')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
//                         📡 API CALLS
// ═══════════════════════════════════════════════════════════════════════════════

async function apiCall(endpoint, options) {
    options = options || {};
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (state.token) {
            headers['Authorization'] = 'Bearer ' + state.token;
        }
        
        const response = await fetch(API_URL + endpoint, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
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

function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = '<i class="fas fa-' + icon + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return 'Il y a ' + Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return 'Il y a ' + Math.floor(diff / 3600000) + ' h';
    if (diff < 604800000) return 'Il y a ' + Math.floor(diff / 86400000) + ' j';
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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

function setupNavbarScroll() {
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function toggleMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('mobileMenu');
    toggle.classList.toggle('active');
    menu.classList.toggle('show');
}

function closeDropdowns() {
    document.getElementById('notificationPanel').classList.remove('show');
    document.getElementById('userDropdown').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📍 NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.classList.contains('show')) {
        toggleMobileMenu();
    }
    
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(function(s) {
        s.classList.remove('active');
    });
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(function(l) {
        l.classList.remove('active');
    });
    var activeLink = document.querySelector('.nav-link[data-section="' + sectionId + '"]');
    if (activeLink) activeLink.classList.add('active');
    
    // Show/hide footer for admin section
    const footer = document.getElementById('mainFooter');
    if (sectionId === 'admin') {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'block';
    }
    
    // Show target section
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
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load section data
    if (sectionId === 'demandes') {
        loadDemandes();
    } else if (sectionId === 'messages' && state.user) {
        loadConversations();
    } else if (sectionId === 'espace' && state.user) {
        setupEspaceUtilisateur();
    } else if (sectionId === 'admin' && state.user && state.user.role === 'admin') {
        loadAdminDashboard();
    }
    
    // Close dropdowns
    closeDropdowns();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handlePublishClick() {
    if (!state.user) {
        showAuthModal();
        showToast('Connectez-vous pour publier une demande', 'warning');
        return;
    }
    
    if (state.user.role === 'vendeur') {
        showToast('Seuls les acheteurs peuvent publier des demandes', 'warning');
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
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(t) { t.classList.remove('active'); });
    tabs[tab === 'login' ? 0 : 1].classList.add('active');
    
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
    
    document.getElementById('navUser').style.display = 'none';
    document.getElementById('notificationBtn').style.display = 'none';
    document.getElementById('btnLogin').style.display = 'flex';
    document.getElementById('userDropdown').classList.remove('show');
    document.getElementById('navAdmin').style.display = 'none';
    document.getElementById('dropdownAdmin').style.display = 'none';
    
    showSection('home');
    showToast('Déconnexion réussie', 'success');
}

function updateUIForLoggedInUser() {
    if (!state.user) return;
    
    document.getElementById('navUser').style.display = 'flex';
    document.getElementById('notificationBtn').style.display = 'flex';
    document.getElementById('btnLogin').style.display = 'none';
    
    const initials = getInitials(state.user.nom);
    document.getElementById('navAvatar').textContent = initials;
    document.getElementById('dropdownAvatar').textContent = initials;
    document.getElementById('navUserName').textContent = state.user.nom;
    document.getElementById('dropdownName').textContent = state.user.nom;
    
    let roleText = 'Utilisateur';
    if (state.user.role === 'acheteur') roleText = 'Acheteur';
    else if (state.user.role === 'vendeur') roleText = 'Vendeur';
    else if (state.user.role === 'admin') roleText = 'Administrateur';
    
    document.getElementById('navUserRole').textContent = roleText;
    document.getElementById('dropdownRole').textContent = roleText;
    
    // Show/hide elements based on role
    if (state.user.role === 'vendeur') {
        document.getElementById('navPublish').style.display = 'none';
        if (document.getElementById('mobileNavPublish')) {
            document.getElementById('mobileNavPublish').style.display = 'none';
        }
    } else {
        document.getElementById('navPublish').style.display = 'block';
    }
    
    // Show admin link for admins
    if (state.user.role === 'admin') {
        document.getElementById('navAdmin').style.display = 'flex';
        document.getElementById('dropdownAdmin').style.display = 'flex';
    }
    
    loadNotifications();
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📊 STATS
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
//                         📋 DEMANDES
// ═══════════════════════════════════════════════════════════════════════════════

async function loadRecentDemandes() {
    try {
        var demandes = await apiCall('/demandes');
        var recentContainer = document.getElementById('recentDemandes');
        
        if (!demandes || demandes.length === 0) {
            recentContainer.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune demande</h3><p>Soyez le premier à publier une demande !</p><button class="btn btn-primary" onclick="handlePublishClick()"><i class="fas fa-plus"></i> Publier maintenant</button></div>';
        } else {
            recentContainer.innerHTML = demandes.slice(0, 6).map(function(d) { return createDemandeCard(d); }).join('');
        }
    } catch (error) {
        console.error('Error loading recent demandes:', error);
        document.getElementById('recentDemandes').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur de chargement</h3><p>Impossible de charger les demandes</p></div>';
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
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucune demande trouvée</h3><p>Modifiez vos critères de recherche ou revenez plus tard</p></div>';
        } else {
            grid.innerHTML = demandes.map(function(d) { return createDemandeCard(d); }).join('');
        }
    } catch (error) {
        console.error('Error loading demandes:', error);
        showToast('Erreur lors du chargement des demandes', 'error');
    }
}

function filterDemandes() {
    loadDemandes();
}

function createDemandeCard(demande) {
    var imageUrl = '';
    if (demande.images && demande.images.length > 0) {
        var firstImage = demande.images[0];
        // Gérer les différents formats d'image (objet avec url, string base64, ou string url)
        if (typeof firstImage === 'object' && firstImage.url) {
            imageUrl = firstImage.url;
        } else if (typeof firstImage === 'string') {
            imageUrl = firstImage;
        }
    }
    
    var imageHtml = imageUrl 
        ? '<div class="card-image-container"><img src="' + imageUrl + '" class="card-image" alt="' + escapeHtml(demande.titre) + '"><div class="card-overlay"><span class="btn btn-sm btn-primary">Voir détails</span></div></div>'
        : '<div class="no-image-placeholder"><i class="fas fa-image"></i><span>Pas d\'image</span></div>';
    
    var demandeId = demande._id || demande.id;
    
    return '<div class="card card-3d" onclick="showDemandeDetail(\'' + demandeId + '\')">' +
        imageHtml +
        '<div class="card-body">' +
            '<span class="card-badge">' + escapeHtml(demande.categorie) + '</span>' +
            '<h3 class="card-title">' + escapeHtml(demande.titre) + '</h3>' +
            '<p class="card-description">' + escapeHtml(demande.description) + '</p>' +
            '<div class="card-price">' + formatPrice(demande.budget) + '</div>' +
            '<div class="card-footer">' +
                '<span class="card-location">' +
                    '<i class="fas fa-map-marker-alt"></i> ' +
                    escapeHtml(demande.localisation || 'Non spécifié') +
                '</span>' +
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
        
        // Get image URL
        var imageUrl = '';
        if (demande.images && demande.images.length > 0) {
            imageUrl = demande.images[0].url || demande.images[0];
        }
        
        var imagesHtml = imageUrl
            ? '<div class="detail-images"><img src="' + imageUrl + '" class="detail-main-image" onclick="openLightbox(\'' + imageUrl + '\')" alt="' + escapeHtml(demande.titre) + '">' +
                (demande.images.length > 1 ? '<div class="detail-thumbnails">' +
                    demande.images.map(function(img, i) {
                        var url = img.url || img;
                        return '<img src="' + url + '" class="detail-thumbnail ' + (i === 0 ? 'active' : '') + '" onclick="changeMainImage(\'' + url + '\', this)" alt="Thumbnail">';
                    }).join('') +
                '</div>' : '') +
            '</div>'
            : '<div class="detail-images"><div class="detail-main-image no-image-placeholder"><i class="fas fa-image"></i><span>Pas d\'image disponible</span></div></div>';
        
        var acheteurId = demande.acheteurId?._id || demande.acheteurId;
        var acheteurNom = demande.acheteurId?.nom || demande.acheteurNom || 'Inconnu';
        var userId = state.user?._id || state.user?.id;
        
        var actionsHtml = '';
        if (state.user) {
            if (state.user.role === 'vendeur' && acheteurId !== userId) {
                actionsHtml = '<div class="detail-actions">' +
                    '<button class="btn btn-primary" onclick="openReponseModal(\'' + demandeId + '\')">' +
                        '<i class="fas fa-reply"></i> Répondre à cette demande' +
                    '</button>' +
                    '<button class="btn btn-outline" onclick="startConversation(\'' + acheteurId + '\', \'' + escapeHtml(acheteurNom) + '\', \'' + demandeId + '\', \'' + escapeHtml(demande.titre) + '\')">' +
                        '<i class="fas fa-comment"></i> Contacter l\'acheteur' +
                    '</button>' +
                '</div>';
            } else if (userId === acheteurId) {
                actionsHtml = '<div class="detail-actions">' +
                    '<button class="btn btn-danger" onclick="deleteDemande(\'' + demandeId + '\')">' +
                        '<i class="fas fa-trash"></i> Supprimer cette demande' +
                    '</button>' +
                '</div>';
            }
        } else {
            actionsHtml = '<div class="detail-actions">' +
                '<button class="btn btn-primary" onclick="showAuthModal()">' +
                    '<i class="fas fa-sign-in-alt"></i> Connectez-vous pour répondre' +
                '</button>' +
            '</div>';
        }
        
        var reponses = demande.reponses || [];
        
        container.innerHTML = imagesHtml +
            '<div class="detail-info glass-card">' +
                '<span class="detail-category">' + escapeHtml(demande.categorie) + '</span>' +
                '<h1 class="detail-title">' + escapeHtml(demande.titre) + '</h1>' +
                '<div class="detail-price">Budget: ' + formatPrice(demande.budget) + '</div>' +
                '<div class="detail-meta">' +
                    '<div class="detail-meta-item">' +
                        '<i class="fas fa-user"></i>' +
                        '<span>Publié par ' + escapeHtml(acheteurNom) + '</span>' +
                    '</div>' +
                    '<div class="detail-meta-item">' +
                        '<i class="fas fa-map-marker-alt"></i>' +
                        '<span>' + escapeHtml(demande.localisation || 'Non spécifié') + '</span>' +
                    '</div>' +
                    '<div class="detail-meta-item">' +
                        '<i class="fas fa-clock"></i>' +
                        '<span>' + formatDate(demande.dateCreation) + '</span>' +
                    '</div>' +
                    '<div class="detail-meta-item">' +
                        '<i class="fas fa-comments"></i>' +
                        '<span>' + reponses.length + ' réponse(s)</span>' +
                    '</div>' +
                '</div>' +
                '<p class="detail-description">' + escapeHtml(demande.description) + '</p>' +
                actionsHtml +
            '</div>';
        
        // Show responses if user is the owner
        var reponsesSection = document.getElementById('reponsesSection');
        var reponsesList = document.getElementById('reponsesList');
        var reponseCount = document.getElementById('reponseCount');
        
        if (state.user && userId === acheteurId && reponses.length > 0) {
            reponsesSection.style.display = 'block';
            reponseCount.textContent = reponses.length;
            
            reponsesList.innerHTML = reponses.map(function(r) {
                var vendeurId = r.vendeurId?._id || r.vendeurId;
                var vendeurNom = r.vendeurId?.nom || r.vendeurNom || 'Inconnu';
                
                var imagesHtml = '';
                if (r.images && r.images.length > 0) {
                    imagesHtml = '<div class="reponse-images">' +
                        r.images.map(function(img) {
                            var url = img.url || img;
                            return '<img src="' + url + '" onclick="openLightbox(\'' + url + '\')" alt="Image réponse">';
                        }).join('') +
                    '</div>';
                }
                
                return '<div class="reponse-card glass-card">' +
                    '<div class="reponse-header">' +
                        '<div class="reponse-vendor">' +
                            '<div class="reponse-avatar">' + getInitials(vendeurNom) + '</div>' +
                            '<div class="reponse-vendor-info">' +
                                '<h4>' + escapeHtml(vendeurNom) + '</h4>' +
                                '<span>' + formatDate(r.dateCreation) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<button class="btn btn-primary btn-sm" onclick="startConversation(\'' + vendeurId + '\', \'' + escapeHtml(vendeurNom) + '\', \'' + demandeId + '\', \'' + escapeHtml(demande.titre) + '\')">' +
                            '<i class="fas fa-comment"></i> Discuter' +
                        '</button>' +
                    '</div>' +
                    '<p class="reponse-message">' + escapeHtml(r.message) + '</p>' +
                    imagesHtml +
                '</div>';
            }).join('');
        } else {
            reponsesSection.style.display = 'none';
        }
        
        showSection('detail');
        
    } catch (error) {
        console.error('Error loading demande detail:', error);
        showToast('Erreur lors du chargement de la demande', 'error');
    }
}

function changeMainImage(src, thumbnail) {
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
    
    // Validation des champs
    var titre = document.getElementById('demandeTitle').value.trim();
    var categorie = document.getElementById('demandeCategory').value;
    var budgetStr = document.getElementById('demandeBudget').value;
    var description = document.getElementById('demandeDescription').value.trim();
    
    if (!titre) {
        showToast('Veuillez entrer un titre', 'warning');
        return;
    }
    if (!categorie) {
        showToast('Veuillez sélectionner une catégorie', 'warning');
        return;
    }
    if (!budgetStr || isNaN(parseFloat(budgetStr)) || parseFloat(budgetStr) <= 0) {
        showToast('Veuillez entrer un budget valide', 'warning');
        return;
    }
    if (!description) {
        showToast('Veuillez entrer une description', 'warning');
        return;
    }
    
    var data = {
        titre: titre,
        categorie: categorie,
        budget: parseFloat(budgetStr),
        description: description,
        localisation: document.getElementById('demandeLocation').value || state.user.localisation || '',
        images: state.demandeImages || []
    };
    
    // Afficher un indicateur de chargement
    var submitBtn = document.querySelector('#publishForm button[type="submit"]');
    var originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication en cours...';
    submitBtn.disabled = true;
    
    try {
        await apiCall('/demandes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Demande publiée avec succès !', 'success');
        
        document.getElementById('publishForm').reset();
        state.demandeImages = [];
        document.getElementById('demandeImagePreview').innerHTML = '';
        
        loadStats();
        loadRecentDemandes();
        showSection('demandes');
        
    } catch (error) {
        console.error('Erreur création demande:', error);
        showToast(error.message || 'Erreur lors de la publication', 'error');
    } finally {
        // Restaurer le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteDemande(demandeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;
    
    try {
        await apiCall('/demandes/' + demandeId, { method: 'DELETE' });
        showToast('Demande supprimée avec succès', 'success');
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

function openReponseModal(demandeId) {
    if (!state.user) {
        showAuthModal();
        return;
    }
    
    document.getElementById('reponseDemandeId').value = demandeId;
    state.reponseImages = [];
    document.getElementById('reponseImagePreview').innerHTML = '';
    document.getElementById('reponseMessage').value = '';
    document.getElementById('reponseModal').classList.add('show');
}

function closeReponseModal() {
    document.getElementById('reponseModal').classList.remove('show');
}

async function submitReponse(e) {
    e.preventDefault();
    
    var demandeId = document.getElementById('reponseDemandeId').value;
    var message = document.getElementById('reponseMessage').value;
    
    try {
        await apiCall('/demandes/' + demandeId + '/reponses', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                images: state.reponseImages
            })
        });
        
        showToast('Réponse envoyée avec succès !', 'success');
        closeReponseModal();
        
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
    
    var userId = state.user._id || state.user.id;
    
    try {
        var conversations = await apiCall('/conversations/' + userId);
        state.conversations = conversations;
        
        var container = document.getElementById('conversationsList');
        
        if (!conversations || conversations.length === 0) {
            container.innerHTML = '<div class="notification-empty"><i class="fas fa-comments"></i><p>Aucune conversation</p></div>';
        } else {
            container.innerHTML = conversations.map(function(c) {
                return '<div class="conversation-item" onclick="openChatFromConversation(\'' + c.conversationId + '\', \'' + c.interlocuteurId + '\', \'' + escapeHtml(c.interlocuteurNom) + '\', \'' + c.demandeId + '\', \'' + escapeHtml(c.demandeTitre) + '\')">' +
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
    var conversationId = 'demande_' + demandeId + '_users_' + ids[0] + '_' + ids[1];
    
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
    
    await loadMessages(conversationId);
    
    document.getElementById('chatPopup').classList.add('show');
    
    startMessagePolling(conversationId);
    
    state.chatImages = [];
}

async function loadMessages(conversationId) {
    try {
        var messages = await apiCall('/messages/' + encodeURIComponent(conversationId));
        var container = document.getElementById('chatMessages');
        
        var userId = state.user._id || state.user.id;
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">' +
                '<i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>' +
                '<p>Démarrez la conversation</p>' +
            '</div>';
        } else {
            container.innerHTML = messages.map(function(m) {
                var senderId = m.senderId?._id || m.senderId;
                var isSent = senderId === userId;
                
                var imagesHtml = '';
                if (m.images && m.images.length > 0) {
                    imagesHtml = '<div class="message-images">' +
                        m.images.map(function(img) {
                            var url = img.url || img;
                            return '<img src="' + url + '" onclick="openLightbox(\'' + url + '\')" alt="Image">';
                        }).join('') +
                    '</div>';
                }
                
                return '<div class="message ' + (isSent ? 'sent' : 'received') + '">' +
                    '<div class="message-text">' + escapeHtml(m.message) + '</div>' +
                    imagesHtml +
                    '<div class="message-time">' + formatTime(m.dateCreation) + '</div>' +
                '</div>';
            }).join('');
        }
        
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function closeChat() {
    document.getElementById('chatPopup').classList.remove('show');
    state.currentConversation = null;
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
        
        await loadMessages(conv.conversationId);
        
    } catch (error) {
        showToast('Erreur lors de l\'envoi du message', 'error');
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
//                         🔔 NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function toggleNotifications() {
    var panel = document.getElementById('notificationPanel');
    panel.classList.toggle('show');
    document.getElementById('userDropdown').classList.remove('show');
    
    if (panel.classList.contains('show')) {
        loadNotifications();
    }
}

async function loadNotifications() {
    if (!state.user) return;
    
    var userId = state.user._id || state.user.id;
    
    try {
        var notifications = await apiCall('/notifications/' + userId + '/unread');
        state.notifications = notifications || [];
        
        var badge = document.getElementById('notificationBadge');
        if (state.notifications.length > 0) {
            badge.textContent = state.notifications.length > 99 ? '99+' : state.notifications.length;
            badge.style.display = 'flex';
            
            if (state.notifications.length > state.lastNotificationCount && state.lastNotificationCount > 0) {
                var bellIcon = document.querySelector('.nav-notification i');
                if (bellIcon) {
                    bellIcon.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(function() {
                        bellIcon.style.animation = '';
                    }, 500);
                }
            }
            
            state.lastNotificationCount = state.notifications.length;
        } else {
            badge.style.display = 'none';
            state.lastNotificationCount = 0;
        }
        
        var list = document.getElementById('notificationList');
        if (state.notifications.length === 0) {
            list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>Aucune nouvelle notification</p></div>';
        } else {
            list.innerHTML = state.notifications.map(function(n) {
                var icon, iconClass, text;
                
                if (n.type === 'message') {
                    icon = 'comment';
                    iconClass = 'message';
                    text = '<strong>' + escapeHtml(n.data?.senderNom || 'Quelqu\'un') + '</strong> vous a envoyé un message';
                } else if (n.type === 'reponse') {
                    icon = 'reply';
                    iconClass = 'reponse';
                    text = '<strong>' + escapeHtml(n.data?.vendeurNom || 'Un vendeur') + '</strong> a répondu à votre demande';
                } else if (n.type === 'nouvelle_demande') {
                    icon = 'bullhorn';
                    iconClass = 'demande';
                    text = 'Nouvelle demande: <strong>' + escapeHtml(n.data?.demandeTitre || '') + '</strong>';
                } else if (n.type === 'admin') {
                    icon = 'shield-alt';
                    iconClass = 'admin';
                    text = '<strong>Message admin:</strong> ' + escapeHtml(n.data?.subject || '');
                } else {
                    icon = 'bell';
                    iconClass = 'message';
                    text = 'Nouvelle notification';
                }
                
                var nId = n._id || n.id;
                
                return '<div class="notification-item unread" onclick="handleNotificationClick(\'' + nId + '\', \'' + n.type + '\', ' + JSON.stringify(n.data || {}).replace(/'/g, "\\'") + ')">' +
                    '<div class="notification-icon ' + iconClass + '">' +
                        '<i class="fas fa-' + icon + '"></i>' +
                    '</div>' +
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
    try {
        await apiCall('/notifications/' + notificationId + '/read', { method: 'PUT' });
    } catch (e) {
        console.error('Error marking notification as read:', e);
    }
    
    document.getElementById('notificationPanel').classList.remove('show');
    
    if (type === 'message' && data.conversationId) {
        startConversation(data.senderId, data.senderNom, data.demandeId, data.demandeTitre);
    } else if (type === 'reponse' && data.demandeId) {
        showDemandeDetail(data.demandeId);
    } else if (type === 'nouvelle_demande' && data.demandeId) {
        showDemandeDetail(data.demandeId);
    }
    
    loadNotifications();
}

async function markAllAsRead() {
    if (!state.user) return;
    
    var userId = state.user._id || state.user.id;
    
    try {
        await apiCall('/notifications/' + userId + '/read-all', { method: 'PUT' });
        loadNotifications();
        showToast('Toutes les notifications ont été marquées comme lues', 'success');
    } catch (error) {
        showToast('Erreur', 'error');
    }
}

function startPolling() {
    stopPolling();
    state.notificationPolling = setInterval(function() {
        if (state.user) {
            loadNotifications();
        }
    }, 5000);
}

function stopPolling() {
    if (state.notificationPolling) {
        clearInterval(state.notificationPolling);
        state.notificationPolling = null;
    }
}

function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('show');
    document.getElementById('notificationPanel').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         👤 ESPACE UTILISATEUR
// ═══════════════════════════════════════════════════════════════════════════════

function setupEspaceUtilisateur() {
    if (!state.user) return;
    
    var tabsContainer = document.getElementById('espaceTabs');
    var subtitle = document.getElementById('espaceSubtitle');
    
    if (state.user.role === 'acheteur') {
        subtitle.textContent = 'Gérez vos demandes et consultez les réponses reçues';
        tabsContainer.innerHTML = '<button class="user-tab active" onclick="loadEspaceTab(\'mes-demandes\', this)">Mes demandes</button>' +
            '<button class="user-tab" onclick="loadEspaceTab(\'reponses-recues\', this)">Réponses reçues</button>';
        loadEspaceTabDirect('mes-demandes');
    } else if (state.user.role === 'vendeur') {
        subtitle.textContent = 'Consultez les demandes et gérez vos réponses';
        tabsContainer.innerHTML = '<button class="user-tab active" onclick="loadEspaceTab(\'demandes-disponibles\', this)">Demandes disponibles</button>' +
            '<button class="user-tab" onclick="loadEspaceTab(\'mes-reponses\', this)">Mes réponses</button>';
        loadEspaceTabDirect('demandes-disponibles');
    } else {
        subtitle.textContent = 'Tableau de bord administrateur';
        tabsContainer.innerHTML = '';
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
                content.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>Aucune demande</h3><p>Vous n\'avez pas encore publié de demande</p><button class="btn btn-primary" onclick="showSection(\'publish\')"><i class="fas fa-plus"></i> Publier une demande</button></div>';
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
                            allReponses.push(Object.assign({}, r, { demandeTitre: d.titre, demandeId: d._id || d.id }));
                        });
                    }
                });
            }
            
            if (allReponses.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucune réponse</h3><p>Vous n\'avez pas encore reçu de réponse à vos demandes</p></div>';
            } else {
                content.innerHTML = '<div style="display: flex; flex-direction: column; gap: 20px;">' +
                    allReponses.map(function(r) {
                        var vendeurNom = r.vendeurId?.nom || r.vendeurNom || 'Inconnu';
                        var vendeurId = r.vendeurId?._id || r.vendeurId;
                        
                        return '<div class="card glass-card" style="cursor: default;">' +
                            '<div class="card-body">' +
                                '<span class="card-badge">' + escapeHtml(r.demandeTitre) + '</span>' +
                                '<div class="reponse-header" style="margin-top: 12px;">' +
                                    '<div class="reponse-vendor">' +
                                        '<div class="reponse-avatar">' + getInitials(vendeurNom) + '</div>' +
                                        '<div class="reponse-vendor-info">' +
                                            '<h4>' + escapeHtml(vendeurNom) + '</h4>' +
                                            '<span>' + formatDate(r.dateCreation) + '</span>' +
                                        '</div>' +
                                    '</div>' +
                                    '<button class="btn btn-primary btn-sm" onclick="startConversation(\'' + vendeurId + '\', \'' + escapeHtml(vendeurNom) + '\', \'' + r.demandeId + '\', \'' + escapeHtml(r.demandeTitre) + '\')">' +
                                        '<i class="fas fa-comment"></i> Discuter' +
                                    '</button>' +
                                '</div>' +
                                '<p class="reponse-message" style="margin-top: 12px;">' + escapeHtml(r.message) + '</p>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>';
            }
            
        } else if (tab === 'demandes-disponibles') {
            var demandes = await apiCall('/demandes');
            if (!demandes || demandes.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>Aucune demande disponible</h3><p>Revenez plus tard pour voir les nouvelles demandes</p></div>';
            } else {
                content.innerHTML = '<div class="demandes-grid">' + demandes.map(function(d) { return createDemandeCard(d); }).join('') + '</div>';
            }
            
        } else if (tab === 'mes-reponses') {
            var reponses = await apiCall('/reponses?vendeurId=' + userId);
            
            if (!reponses || reponses.length === 0) {
                content.innerHTML = '<div class="empty-state"><i class="fas fa-reply"></i><h3>Aucune réponse</h3><p>Vous n\'avez pas encore répondu à des demandes</p><button class="btn btn-primary" onclick="showSection(\'demandes\')"><i class="fas fa-search"></i> Parcourir les demandes</button></div>';
            } else {
                content.innerHTML = '<div style="display: flex; flex-direction: column; gap: 20px;">' +
                    reponses.map(function(r) {
                        var demandeId = r.demandeId?._id || r.demandeId;
                        return '<div class="card glass-card" onclick="showDemandeDetail(\'' + demandeId + '\')">' +
                            '<div class="card-body">' +
                                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                                    '<span class="card-badge">' + escapeHtml(r.demandeTitre || 'Demande') + '</span>' +
                                    '<span class="card-price">' + formatPrice(r.demandeBudget || 0) + '</span>' +
                                '</div>' +
                                '<p class="card-description">' + escapeHtml(r.message) + '</p>' +
                                '<div class="card-footer">' +
                                    '<span>' + formatDate(r.dateCreation) + '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>';
            }
        }
    } catch (error) {
        console.error('Error loading espace tab:', error);
        content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur</h3><p>Impossible de charger les données</p></div>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         🛡️ ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

async function loadAdminDashboard() {
    loadAdminTab('dashboard', document.querySelector('.admin-nav-item'));
}

async function loadAdminTab(tab, element) {
    // Update active nav
    document.querySelectorAll('.admin-nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    var content = document.getElementById('adminContent');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        if (tab === 'dashboard') {
            var stats = await apiCall('/admin/stats');
            
            content.innerHTML = 
                '<div class="admin-header"><h1 class="admin-title">Tableau de bord</h1></div>' +
                '<div class="admin-stats-grid">' +
                    '<div class="admin-stat-card">' +
                        '<div class="admin-stat-icon users"><i class="fas fa-users"></i></div>' +
                        '<div class="admin-stat-info"><h4>Utilisateurs</h4><div class="number">' + (stats.totalUsers || 0) + '</div></div>' +
                    '</div>' +
                    '<div class="admin-stat-card">' +
                        '<div class="admin-stat-icon posts"><i class="fas fa-clipboard-list"></i></div>' +
                        '<div class="admin-stat-info"><h4>Publications</h4><div class="number">' + (stats.totalDemandes || 0) + '</div></div>' +
                    '</div>' +
                    '<div class="admin-stat-card">' +
                        '<div class="admin-stat-icon messages"><i class="fas fa-comments"></i></div>' +
                        '<div class="admin-stat-info"><h4>Messages</h4><div class="number">' + (stats.totalMessages || 0) + '</div></div>' +
                    '</div>' +
                    '<div class="admin-stat-card">' +
                        '<div class="admin-stat-icon banned"><i class="fas fa-user-slash"></i></div>' +
                        '<div class="admin-stat-info"><h4>Bannis</h4><div class="number">' + (stats.bannedUsers || 0) + '</div></div>' +
                    '</div>' +
                '</div>';
                
        } else if (tab === 'users') {
            var users = await apiCall('/admin/users');
            
            content.innerHTML = 
                '<div class="admin-header"><h1 class="admin-title">Gestion des utilisateurs</h1></div>' +
                '<div class="admin-table-container">' +
                    '<div class="admin-table-header">' +
                        '<h3 class="admin-table-title">Liste des utilisateurs (' + users.length + ')</h3>' +
                    '</div>' +
                    '<table class="admin-table">' +
                        '<thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Inscription</th><th>Actions</th></tr></thead>' +
                        '<tbody>' +
                            users.map(function(u) {
                                var uId = u._id || u.id;
                                return '<tr>' +
                                    '<td><div class="user-cell"><div class="user-cell-avatar">' + getInitials(u.nom) + '</div><div class="user-cell-info"><h4>' + escapeHtml(u.nom) + '</h4><span>' + escapeHtml(u.email) + '</span></div></div></td>' +
                                    '<td>' + escapeHtml(u.role) + '</td>' +
                                    '<td><span class="status-badge ' + (u.isBanned ? 'banned' : 'active') + '">' + (u.isBanned ? 'Banni' : 'Actif') + '</span></td>' +
                                    '<td>' + formatDate(u.dateCreation) + '</td>' +
                                    '<td><div class="action-buttons">' +
                                        '<button class="action-btn message" onclick="openAdminMessageModal(\'' + uId + '\', \'' + escapeHtml(u.nom) + '\')" title="Envoyer message"><i class="fas fa-envelope"></i></button>' +
                                        (u.isBanned 
                                            ? '<button class="action-btn unban" onclick="unbanUser(\'' + uId + '\')" title="Débannir"><i class="fas fa-user-check"></i></button>'
                                            : '<button class="action-btn ban" onclick="openBanModal(\'' + uId + '\', \'' + escapeHtml(u.nom) + '\')" title="Bannir"><i class="fas fa-user-slash"></i></button>'
                                        ) +
                                    '</div></td>' +
                                '</tr>';
                            }).join('') +
                        '</tbody>' +
                    '</table>' +
                '</div>';
                
        } else if (tab === 'posts') {
            var posts = await apiCall('/admin/posts');
            
            content.innerHTML = 
                '<div class="admin-header"><h1 class="admin-title">Gestion des publications</h1></div>' +
                '<div class="admin-table-container">' +
                    '<div class="admin-table-header">' +
                        '<h3 class="admin-table-title">Toutes les publications (' + posts.length + ')</h3>' +
                    '</div>' +
                    '<table class="admin-table">' +
                        '<thead><tr><th>Publication</th><th>Auteur</th><th>Catégorie</th><th>Budget</th><th>Date</th><th>Actions</th></tr></thead>' +
                        '<tbody>' +
                            posts.map(function(p) {
                                var pId = p._id || p.id;
                                var authorName = p.acheteurId?.nom || 'Inconnu';
                                var authorId = p.acheteurId?._id || p.acheteurId;
                                return '<tr>' +
                                    '<td><h4 style="font-weight: 600;">' + escapeHtml(p.titre) + '</h4></td>' +
                                    '<td>' + escapeHtml(authorName) + '</td>' +
                                    '<td><span class="card-badge">' + escapeHtml(p.categorie) + '</span></td>' +
                                    '<td>' + formatPrice(p.budget) + '</td>' +
                                    '<td>' + formatDate(p.dateCreation) + '</td>' +
                                    '<td><div class="action-buttons">' +
                                        '<button class="action-btn view" onclick="showDemandeDetail(\'' + pId + '\')" title="Voir"><i class="fas fa-eye"></i></button>' +
                                        '<button class="action-btn delete" onclick="adminDeletePost(\'' + pId + '\', \'' + authorId + '\')" title="Supprimer"><i class="fas fa-trash"></i></button>' +
                                    '</div></td>' +
                                '</tr>';
                            }).join('') +
                        '</tbody>' +
                    '</table>' +
                '</div>';
                
        } else if (tab === 'social') {
            var links = await apiCall('/admin/social-links');
            
            content.innerHTML = 
                '<div class="admin-header"><h1 class="admin-title">Réseaux sociaux</h1></div>' +
                '<div class="admin-table-container">' +
                    '<div class="admin-table-header">' +
                        '<h3 class="admin-table-title">Liens configurés</h3>' +
                        '<button class="btn btn-primary btn-sm" onclick="openSocialModal()"><i class="fas fa-plus"></i> Ajouter</button>' +
                    '</div>' +
                    '<table class="admin-table">' +
                        '<thead><tr><th>Plateforme</th><th>URL</th><th>Statut</th><th>Actions</th></tr></thead>' +
                        '<tbody>' +
                            (links && links.length > 0 ? links.map(function(l) {
                                var lId = l._id || l.id;
                                return '<tr>' +
                                    '<td><i class="' + (l.icon || 'fas fa-link') + '"></i> ' + escapeHtml(l.platform) + '</td>' +
                                    '<td><a href="' + l.url + '" target="_blank">' + escapeHtml(l.url) + '</a></td>' +
                                    '<td><span class="status-badge ' + (l.isActive ? 'active' : 'pending') + '">' + (l.isActive ? 'Actif' : 'Inactif') + '</span></td>' +
                                    '<td><div class="action-buttons">' +
                                        '<button class="action-btn delete" onclick="deleteSocialLink(\'' + lId + '\')" title="Supprimer"><i class="fas fa-trash"></i></button>' +
                                    '</div></td>' +
                                '</tr>';
                            }).join('') : '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Aucun lien configuré</td></tr>') +
                        '</tbody>' +
                    '</table>' +
                '</div>';
                
        } else if (tab === 'actions') {
            var actions = await apiCall('/admin/actions');
            
            content.innerHTML = 
                '<div class="admin-header"><h1 class="admin-title">Historique des actions</h1></div>' +
                '<div class="admin-table-container">' +
                    '<table class="admin-table">' +
                        '<thead><tr><th>Action</th><th>Admin</th><th>Cible</th><th>Détails</th><th>Date</th></tr></thead>' +
                        '<tbody>' +
                            (actions && actions.length > 0 ? actions.map(function(a) {
                                var adminName = a.adminId?.nom || 'Admin';
                                var targetName = a.targetUserId?.nom || '-';
                                return '<tr>' +
                                    '<td><span class="status-badge pending">' + escapeHtml(a.action) + '</span></td>' +
                                    '<td>' + escapeHtml(adminName) + '</td>' +
                                    '<td>' + escapeHtml(targetName) + '</td>' +
                                    '<td>' + escapeHtml(a.details || '-') + '</td>' +
                                    '<td>' + formatDate(a.dateCreation) + '</td>' +
                                '</tr>';
                            }).join('') : '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Aucune action enregistrée</td></tr>') +
                        '</tbody>' +
                    '</table>' +
                '</div>';
        }
    } catch (error) {
        console.error('Error loading admin tab:', error);
        content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erreur</h3><p>' + error.message + '</p></div>';
    }
}

async function adminDeletePost(postId, authorId) {
    var reason = prompt('Raison de la suppression (sera envoyée à l\'utilisateur):');
    if (!reason) return;
    
    try {
        await apiCall('/admin/posts/' + postId, {
            method: 'DELETE',
            body: JSON.stringify({
                reason: reason,
                sendMessage: true,
                messageContent: 'Votre publication a été supprimée pour la raison suivante: ' + reason
            })
        });
        
        showToast('Publication supprimée', 'success');
        loadAdminTab('posts', document.querySelector('.admin-nav-item:nth-child(3)'));
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openBanModal(userId, userName) {
    var reason = prompt('Raison du bannissement pour ' + userName + ':');
    if (!reason) return;
    
    var duration = prompt('Durée en jours (laisser vide pour permanent):');
    var banType = duration ? 'temporary' : 'permanent';
    
    banUser(userId, banType, reason, parseInt(duration) || null);
}

async function banUser(userId, banType, reason, duration) {
    try {
        await apiCall('/admin/ban/' + userId, {
            method: 'POST',
            body: JSON.stringify({ banType: banType, reason: reason, duration: duration })
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

function openAdminMessageModal(userId, userName) {
    var subject = prompt('Sujet du message pour ' + userName + ':');
    if (!subject) return;
    
    var message = prompt('Message:');
    if (!message) return;
    
    sendAdminMessage(userId, subject, message);
}

async function sendAdminMessage(userId, subject, message) {
    try {
        await apiCall('/admin/message', {
            method: 'POST',
            body: JSON.stringify({ userId: userId, subject: subject, message: message, type: 'info' })
        });
        
        showToast('Message envoyé', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function openSocialModal() {
    var platform = prompt('Nom de la plateforme (ex: Facebook, Instagram, TikTok):');
    if (!platform) return;
    
    var url = prompt('URL du lien:');
    if (!url) return;
    
    var icon = prompt('Icône Font Awesome (ex: fab fa-facebook-f):') || 'fas fa-link';
    
    addSocialLink(platform, url, icon);
}

async function addSocialLink(platform, url, icon) {
    try {
        await apiCall('/admin/social-links', {
            method: 'POST',
            body: JSON.stringify({ platform: platform, url: url, icon: icon })
        });
        
        showToast('Lien ajouté', 'success');
        loadAdminTab('social', document.querySelector('.admin-nav-item:nth-child(4)'));
        loadSocialLinks();
    } catch (error) {
        showToast(error.message, 'error');
    }
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
        var links = await apiCall('/social-links');
        var container = document.getElementById('footerSocial');
        
        if (links && links.length > 0) {
            container.innerHTML = links.map(function(l) {
                return '<a href="' + l.url + '" target="_blank" title="' + escapeHtml(l.platform) + '"><i class="' + (l.icon || 'fas fa-link') + '"></i></a>';
            }).join('');
        }
    } catch (error) {
        console.error('Error loading social links:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                         📷 GESTION IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

function setupDragAndDrop() {
    var zones = document.querySelectorAll('.image-upload-zone');
    
    zones.forEach(function(zone) {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', function() {
            zone.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            var files = e.dataTransfer.files;
            var input = zone.nextElementSibling;
            
            if (input && input.type === 'file') {
                if (input.id === 'demandeImageInput') {
                    processImages(files, 'demande');
                } else if (input.id === 'reponseImageInput') {
                    processImages(files, 'reponse');
                } else if (input.id === 'chatImageInput') {
                    processImages(files, 'chat');
                }
            }
        });
    });
}

function handleDemandeImages(e) {
    processImages(e.target.files, 'demande');
}

function handleReponseImages(e) {
    processImages(e.target.files, 'reponse');
}

function handleChatImages(e) {
    processImages(e.target.files, 'chat');
}

function processImages(files, type) {
    var maxSize = 5 * 1024 * 1024;
    
    Array.from(files).forEach(function(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Seules les images sont acceptées', 'warning');
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
            } else if (type === 'reponse') {
                state.reponseImages.push(base64);
                updateImagePreview('reponseImagePreview', state.reponseImages, 'reponse');
            } else if (type === 'chat') {
                state.chatImages.push(base64);
                showToast('Image ajoutée', 'success');
            }
        };
        reader.readAsDataURL(file);
    });
}

function updateImagePreview(containerId, images, type) {
    var container = document.getElementById(containerId);
    container.innerHTML = images.map(function(img, i) {
        return '<div class="image-preview-item">' +
            '<img src="' + img + '" alt="Preview">' +
            '<button class="image-preview-remove" onclick="removeImage(\'' + type + '\', ' + i + ')">' +
                '<i class="fas fa-times"></i>' +
            '</button>' +
        '</div>';
    }).join('');
}

function removeImage(type, index) {
    if (type === 'demande') {
        state.demandeImages.splice(index, 1);
        updateImagePreview('demandeImagePreview', state.demandeImages, 'demande');
    } else if (type === 'reponse') {
        state.reponseImages.splice(index, 1);
        updateImagePreview('reponseImagePreview', state.reponseImages, 'reponse');
    }
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

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
        closeChat();
        closeAuthModal();
        closeReponseModal();
    }
});

// ═══════════════════════════════════════════════════════════════════════════════

console.log('✅ MarketPlace Pro App loaded successfully!');