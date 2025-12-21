/**
 * Application Entry Point
 * Initializes all modules and sets up the application
 */

// Global language setting
window.currentLanguage = localStorage.getItem('language') || 'ar';

// Application initialization
const App = {
    // Initialize the application
    init() {
        console.log('Business Management System - Initializing...');

        // Check if we're on dashboard - auth is handled by existing logic
        // Don't do hard redirect here, let existing code handle it
        if (!Config.isAuthenticated()) {
            console.log('Not authenticated, login required');
            return; // Let existing auth.js handle the redirect
        }

        // Initialize all modules
        this.initModules();

        // Setup global event listeners
        this.setupEventListeners();

        // Update UI based on permissions
        Auth.updateUIPermissions();

        // Load initial data
        this.loadInitialData();

        console.log('Business Management System - Ready!');
    },

    // Initialize all modules
    initModules() {
        // Initialize router
        Router.init();

        // Initialize managers
        if (typeof ClientManager !== 'undefined') ClientManager.init();
        if (typeof ProductManager !== 'undefined') ProductManager.init();
        if (typeof ReportManager !== 'undefined') ReportManager.init();
        if (typeof TeamManager !== 'undefined') TeamManager.init();
        if (typeof UserManager !== 'undefined') UserManager.init();

        // Initialize components
        if (typeof Toast !== 'undefined') Toast.init();
    },

    // Setup global event listeners
    setupEventListeners() {
        // Language toggle
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // User greeting
        this.updateUserGreeting();
    },

    // Load initial data
    loadInitialData() {
        // Load dashboard on start
        if (typeof DashboardManager !== 'undefined') {
            DashboardManager.load();
        }
    },

    // Toggle language
    toggleLanguage() {
        window.currentLanguage = window.currentLanguage === 'ar' ? 'en' : 'ar';
        localStorage.setItem('language', window.currentLanguage);

        // Update document direction
        document.documentElement.dir = window.currentLanguage === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = window.currentLanguage;

        // Update greeting
        this.updateUserGreeting();

        // Show notification
        const msg = window.currentLanguage === 'ar' ? 'تم تغيير اللغة' : 'Language changed';
        if (typeof Toast !== 'undefined') {
            Toast.info(msg);
        }

        // Reload current section
        const currentSection = Router.getCurrentSection();
        Router.showSection(currentSection);
    },

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle(Config.CSS_CLASSES.ACTIVE);
        }
    },

    // Update user greeting
    updateUserGreeting() {
        const user = Auth.getCurrentUser();
        const greeting = document.getElementById('userGreeting');

        if (greeting && user) {
            const lang = window.currentLanguage;
            const greetText = lang === 'ar' ? 'مرحباً' : 'Welcome';
            greeting.textContent = `${greetText}, ${user.username}`;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally available
window.App = App;

// ============================================
// GLOBAL FUNCTIONS for HTML onclick compatibility
// These wrap the modular functions for backward compatibility
// ============================================

// Toggle sidebar - used by HTML onclick
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// Navigate and close sidebar - used by HTML onclick
function navigateAndCloseSidebar(sectionId) {
    // Close sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) {
        sidebar.classList.remove('active');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }

    // Navigate to section
    showSection(sectionId);
}

// Show section - used for navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('#mainContent > section').forEach(section => {
        section.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update navigation active state
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });

    // Load section data
    loadSectionData(sectionId);
}

// Load section data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            if (typeof DashboardManager !== 'undefined') DashboardManager.load();
            break;
        case 'clients':
            if (typeof ClientManager !== 'undefined' && (!ClientManager.currentClients || ClientManager.currentClients.length === 0)) {
                ClientManager.loadClients();
            }
            break;
        case 'products':
            if (typeof ProductManager !== 'undefined') ProductManager.loadProducts();
            break;
        case 'reports':
            if (typeof ReportManager !== 'undefined') ReportManager.loadReports();
            break;
        case 'team':
            if (typeof TeamManager !== 'undefined') TeamManager.loadTeam();
            break;
        case 'users':
            if (typeof UserManager !== 'undefined') UserManager.loadUsers();
            break;
        case 'settings':
            if (typeof SettingsManager !== 'undefined') SettingsManager.load();
            break;
    }
}

// Logout - used by HTML onclick
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
}

// Get auth headers - used by various functions
function getAuthHeaders() {
    return Config.getAuthHeaders();
}

// Setup user interface based on role
function setupUserInterface() {
    const user = Config.getUser();
    if (!user) return;

    const isSuperAdmin = Config.isSuperAdmin();
    const isSupervisor = Config.isSupervisor();

    // Show/hide menu items based on role
    const teamMenuItem = document.getElementById('teamManagementMenuItem');
    const userMenuItem = document.getElementById('userManagementMenuItem');
    const settingsMenuItem = document.getElementById('systemSettingsMenuItem');

    if (teamMenuItem) {
        teamMenuItem.style.display = (isSuperAdmin || isSupervisor) ? 'block' : 'none';
    }
    if (userMenuItem) {
        userMenuItem.style.display = isSuperAdmin ? 'block' : 'none';
    }
    if (settingsMenuItem) {
        settingsMenuItem.style.display = isSuperAdmin ? 'block' : 'none';
    }

    // Update user greeting
    const greeting = document.getElementById('userGreeting');
    if (greeting) {
        const lang = window.currentLanguage || 'ar';
        const greetText = lang === 'ar' ? 'مرحباً' : 'Welcome';
        greeting.textContent = `${greetText}, ${user.username}`;
    }
}

// Make global functions available
window.toggleSidebar = toggleSidebar;
window.navigateAndCloseSidebar = navigateAndCloseSidebar;
window.showSection = showSection;
window.logout = logout;
window.getAuthHeaders = getAuthHeaders;
window.setupUserInterface = setupUserInterface;

// Initialize user interface when app loads
document.addEventListener('DOMContentLoaded', () => {
    if (Config.isAuthenticated()) {
        setupUserInterface();
        showSection('dashboard');
    }
});
