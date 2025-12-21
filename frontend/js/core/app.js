/**
 * Core Application - Initialization and Setup
 * Extracted from main.js for modular architecture
 */

// Main JavaScript file for Business Management System

// Global variables
let currentLanguage = 'ar';

// REVISED: Global scroll management system
// Simpler and more robust - avoids 'position: fixed' issues
const ScrollManager = {
    disableCount: 0,

    disableScroll: function (source = 'unknown') {
        if (this.disableCount === 0) {
            // Store original overflow styles
            this.originalHtmlOverflow = document.documentElement.style.overflow;
            this.originalBodyOverflow = document.body.style.overflow;

            // Disable scroll on both html and body
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }
        this.disableCount++;
        console.log(`Scroll disabled by: ${source}. Count: ${this.disableCount}`);
    },

    enableScroll: function (source = 'unknown') {
        // Only decrement if the count is greater than 0
        if (this.disableCount > 0) {
            this.disableCount--;
        }

        if (this.disableCount === 0) {
            // Restore original styles only when the last lock is released
            document.documentElement.style.overflow = this.originalHtmlOverflow || '';
            document.body.style.overflow = this.originalBodyOverflow || '';
            console.log(`Scroll enabled by: ${source}. Count is zero.`);
        } else {
            console.log(`Scroll not yet enabled by: ${source}. Count: ${this.disableCount}`);
        }
    },

    // This can be used as a failsafe if needed, but the new system is much less likely to require it
    forceEnableScroll: function () {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        this.disableCount = 0;
        console.log('Force scroll enabled.');
    }
};

// Global function to safely close modals and restore scrolling
function closeModalAndRestoreScroll(modal, source = 'closeModalAndRestoreScroll') {
    if (!modal) return;

    try {
        // Hide modal immediately for better UX
        if (modal.style) {
            modal.style.display = 'none';
        }
        if (modal.classList) {
            modal.classList.remove('active');
        }

        // Restore scroll immediately
        ScrollManager.enableScroll(source);

        // Remove modal from DOM after a brief delay
        requestAnimationFrame(() => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error closing modal:', error);
        // Fallback: force remove
        if (modal && modal.parentNode) {
            modal.remove();
        }
        ScrollManager.forceEnableScroll();
    }
}

// Global function to safely open modals and disable scrolling
function openModalAndDisableScroll(modal, source = 'openModalAndDisableScroll') {
    if (modal) {
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        ScrollManager.disableScroll(source);

        // Add click handler to close modal
        modal.addEventListener('click', function (e) {
            if (e.target === modal || e.target.classList.contains('expanded-close') || e.target.classList.contains('modal-close')) {
                closeModalAndRestoreScroll(modal, 'modal-click');
            }
        });
    }
}

// No emergency recovery needed with the new robust ScrollManager

// Sidebar functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    // Only toggle on mobile, on desktop sidebar is always visible
    if (window.innerWidth < 769) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

// Navigate and close sidebar
function navigateAndCloseSidebar(sectionId) {
    // Close sidebar first
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    // Then navigate to section
    showSection(sectionId);

    // Prevent default link behavior
    return false;
}

// Initialize sidebar behavior based on screen size
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 769) {
        // Desktop: sidebar always visible
        sidebar.classList.add('open');
    } else {
        // Mobile: sidebar hidden by default
        sidebar.classList.remove('open');
    }
}

// Handle window resize to adjust sidebar behavior
window.addEventListener('resize', function () {
    initializeSidebar();
});

// System Settings Functions
async function loadSystemSettings() {
    console.log('Loading system settings...');
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('System settings loaded:', data);

            // Update the price tolerance input field
            const priceToleranceInput = document.getElementById('priceTolerance');
            if (priceToleranceInput && data.price_tolerance !== undefined) {
                // Handle both object format {value: '2.0'} and direct value format
                let toleranceValue;
                if (typeof data.price_tolerance === 'object' && data.price_tolerance.value) {
                    toleranceValue = parseFloat(data.price_tolerance.value);
                } else {
                    toleranceValue = parseFloat(data.price_tolerance);
                }
                priceToleranceInput.value = toleranceValue;
                console.log('Price tolerance set to:', toleranceValue);
            }
        } else {
            console.error('Failed to load system settings:', response.status);
        }
    } catch (error) {
        console.error('Error loading system settings:', error);
    }
}

async function saveSystemSettings() {
    console.log('Saving system settings...');

    const priceToleranceInput = document.getElementById('priceTolerance');
    if (!priceToleranceInput) {
        alert(currentLanguage === 'ar' ? 'خطأ: لم يتم العثور على حقل نطاق التسعير' : 'Error: Price tolerance field not found');
        return;
    }

    const priceTolerance = parseFloat(priceToleranceInput.value);

    if (isNaN(priceTolerance) || priceTolerance < 0) {
        alert(currentLanguage === 'ar' ? 'الرجاء إدخال قيمة صحيحة لنطاق التسعير' : 'Please enter a valid price tolerance value');
        return;
    }

    console.log('Saving price tolerance:', priceTolerance);

    try {
        const response = await fetch(`${API_BASE_URL}/settings/price-tolerance`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                price_tolerance: priceTolerance
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('System settings saved successfully:', result);
            alert(currentLanguage === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
        } else {
            const errorData = await response.json();
            console.error('Failed to save system settings:', errorData);
            alert(currentLanguage === 'ar' ? 'خطأ في حفظ الإعدادات' : 'Error saving settings: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving system settings:', error);
        alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
    }
}

// Dynamic API URL - works for both localhost and deployed server
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5009/api`;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function () {
    console.log('Business Management System loaded');

    // Initialize the application
    initializeApp();

    // Set up search functionality
    setupSearch();

    // Set up client search and filter functionality
    setupClientSearch();

    // Set up report status filter functionality
    setupReportSearch();

    // Set up header hide on scroll
    setupScrollHideHeader();

    // Set up add product button
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        // Remove any existing event listeners
        addProductBtn.removeEventListener('click', ProductManager.openAddModal);

        // Add new event listener
        addProductBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add product button clicked - calling openAddModal');

            // Remove any disabled or grayed out styles
            addProductBtn.classList.remove('disabled');
            addProductBtn.style.opacity = '1';

            try {
                ProductManager.openAddModal();
                console.log('openAddModal called successfully');
            } catch (error) {
                console.error('Error calling openAddModal:', error);
                // Fallback
                const modal = document.getElementById('addProductModal');
                if (modal) {
                    console.log('Modal found, showing it');
                    modal.style.display = 'flex';
                } else {
                    console.error('Modal not found in DOM');
                }
            }
        });

        // Note: Button visibility will be controlled by updateUIPermissions()
        // Don't force show here - let the permission system handle it
    }
});

// Initialize the application
function initializeApp() {
    // Check authentication
    checkAuthentication();

    // Initialize sidebar for desktop
    initializeSidebar();

    // Setup navigation
    setupNavigation();

    // Setup language toggle
    setupLanguageToggle();

    // Setup event listeners
    setupEventListeners();

    // Setup user greeting and logout
    setupUserInterface();

    // Load dashboard data
    loadDashboardData();

    // Note: Settings will be loaded when user navigates to settings section

    // Ensure settings menu visibility after everything is loaded
    setTimeout(() => {
        setupUserInterface();
    }, 100);
}

// Setup navigation functionality with clean URL support
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');

    // Hide all sections initially
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Get current section from URL pathname (clean URL routing)
    const pathname = window.location.pathname;
    const validSections = ['dashboard', 'clients', 'products', 'reports', 'team', 'users', 'settings'];

    // Extract section from pathname (e.g., /clients -> clients)
    const currentPath = pathname.replace('/', '').replace('.html', '') || 'dashboard';
    const initialSection = validSections.includes(currentPath) ? currentPath : 'dashboard';

    // Show initial section based on URL
    showSection(initialSection, false);  // false = don't update URL (it's already correct)

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId, true);  // true = update URL
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function () {
        const newPath = window.location.pathname.replace('/', '') || 'dashboard';
        if (validSections.includes(newPath)) {
            showSection(newPath, false);  // false = don't update URL again
        }
    });
}

// Show specific section
function showSection(sectionId, updateUrl = true) {
    const sections = document.querySelectorAll('main section');

    // Hide all sections
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';

        // Update URL if requested (for navigation, not for initial load or back/forward)
        if (updateUrl) {
            window.history.pushState({ section: sectionId }, '', `/${sectionId}`);
        }

        // Load data based on section
        switch (sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'clients':
                // Only load if not already loaded (prevents overwriting filtered results)
                if (!ClientManager.currentClients || ClientManager.currentClients.length === 0) {
                    const savedClientStatus = localStorage.getItem('clientStatusFilter') || 'active';
                    ClientManager.loadClients(savedClientStatus);
                }
                break;
            case 'products':
                ProductManager.loadProducts();
                break;
            case 'reports':
                // Get saved status filter or default to 'active'
                const savedReportStatus = localStorage.getItem('reportStatusFilter') || 'active';
                ReportManager.loadReports(savedReportStatus);
                break;
            case 'team':
                // Load team management for supervisors
                TeamManager.loadSalesmen();
                TeamManager.loadClientNamesOnly();
                TeamManager.setupSearchFilter();
                break;
            case 'users':
                // Load user management for admin
                UserManager.loadUsers();
                break;
            case 'settings':
                // Only show settings for super admin
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        const user = JSON.parse(userInfo);
                        if (isSuperAdmin(user)) {
                            // Ensure settings menu is visible
                            setupUserInterface();
                            // Load settings immediately and with delay to ensure field is populated
                            loadSystemSettings();
                            setTimeout(() => {
                                loadSystemSettings();
                            }, 200);
                        } else {
                            alert(currentLanguage === 'ar' ? 'ليس لديك صلاحية للوصول إلى إعدادات النظام' : 'You do not have permission to access system settings');
                            showSection('dashboard');
                        }
                    } catch (error) {
                        console.error('Error parsing userInfo:', error);
                    }
                } else {
                    alert(currentLanguage === 'ar' ? 'ليس لديك صلاحية للوصول إلى إعدادات النظام' : 'You do not have permission to access system settings');
                    showSection('dashboard');
                }
                break;
        }
    }
}

// Setup language toggle functionality
function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    const langToggleMobile = document.getElementById('langToggleMobile');
    const langToggleDesktop = document.getElementById('langToggleDesktop');
    const html = document.documentElement;

    // Setup main sidebar toggle (if exists)
    if (langToggle) {
        langToggle.addEventListener('click', function () {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }

    // Setup mobile header toggle
    if (langToggleMobile) {
        langToggleMobile.addEventListener('click', function () {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }

    // Setup desktop header toggle
    if (langToggleDesktop) {
        langToggleDesktop.addEventListener('click', function () {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }
}

// Switch to English
function switchToEnglish() {
    currentLanguage = 'en';
    const html = document.documentElement;
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');

    // Update all translatable elements
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(element => {
        element.textContent = element.getAttribute('data-en');
    });

    // Update language toggle buttons
    const langToggle = document.getElementById('langToggle');
    const langToggleMobile = document.getElementById('langToggleMobile');
    const langToggleDesktop = document.getElementById('langToggleDesktop');

    if (langToggle) langToggle.textContent = 'ع';
    if (langToggleMobile) langToggleMobile.textContent = 'ع';
    if (langToggleDesktop) langToggleDesktop.textContent = 'ع';

    // Update user greeting
    updateUserGreeting();
}

// Switch to Arabic
function switchToArabic() {
    currentLanguage = 'ar';
    const html = document.documentElement;
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');

    // Update all translatable elements
    const elements = document.querySelectorAll('[data-ar]');
    elements.forEach(element => {
        element.textContent = element.getAttribute('data-ar');
    });

    // Update language toggle buttons
    const langToggle = document.getElementById('langToggle');
    const langToggleMobile = document.getElementById('langToggleMobile');
    const langToggleDesktop = document.getElementById('langToggleDesktop');

    if (langToggle) langToggle.textContent = 'EN';
    if (langToggleMobile) langToggleMobile.textContent = 'EN';
    if (langToggleDesktop) langToggleDesktop.textContent = 'EN';

    // Update user greeting
    updateUserGreeting();
}

// Update user greeting based on current language
function updateUserGreeting() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting) {
            userGreeting.textContent = `${currentLanguage === 'ar' ? 'مرحباً' : 'Hello'}, ${user.username}`;
        }
    }
}

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Use the same fast paginated endpoints as page counters
        const [clientsResponse, productsResponse, reportsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/clients/list?page=1&per_page=1`, {
                headers: getAuthHeaders()
            }),
            fetch(`${API_BASE_URL}/products/list?page=1&per_page=1`, {
                headers: getAuthHeaders()
            }),
            fetch(`${API_BASE_URL}/visit-reports/list?page=1&per_page=1`, {
                headers: getAuthHeaders()
            })
        ]);

        if (clientsResponse.ok && productsResponse.ok && reportsResponse.ok) {
            const [clientsData, productsData, reportsData] = await Promise.all([
                clientsResponse.json(),
                productsResponse.json(),
                reportsResponse.json()
            ]);

            // Update dashboard counters using total from pagination (same as page counters)
            document.getElementById('totalClients').textContent = clientsData.total || 0;
            document.getElementById('totalProducts').textContent = productsData.total || 0;
            document.getElementById('monthlyReports').textContent = reportsData.total || 0;
        } else {
            console.error('Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    console.log('Checking authentication, token exists:', !!token);
    if (!token) {
        console.log('No token found, redirecting to login');
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Setup user interface
function setupUserInterface() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            const userGreeting = document.getElementById('userGreeting');
            if (userGreeting) {
                userGreeting.textContent = `${currentLanguage === 'ar' ? 'مرحباً' : 'Hello'}, ${user.username}`;
            }

            // Show Team Management for supervisors and admins
            const teamMenuItem = document.getElementById('teamManagementMenuItem');
            if (teamMenuItem) {
                const isSupervisor = user.role === 'sales_supervisor' || user.role === 'super_admin';
                if (isSupervisor) {
                    teamMenuItem.style.display = 'list-item';
                    console.log('Team management menu shown for supervisor');
                } else {
                    teamMenuItem.style.display = 'none';
                    console.log('Team management menu hidden for non-supervisor');
                }
            }

            // Show User Management for admins only
            const userMenuItem = document.getElementById('userManagementMenuItem');
            if (userMenuItem) {
                const isAdmin = isSuperAdmin(user);
                if (isAdmin) {
                    userMenuItem.style.display = 'list-item';
                    console.log('User management menu shown for admin');
                } else {
                    userMenuItem.style.display = 'none';
                    console.log('User management menu hidden for non-admin');
                }
            }

            // Hide System Settings for non-super-admin users
            const settingsMenuItem = document.getElementById('systemSettingsMenuItem');
            if (settingsMenuItem) {
                const isAdmin = isSuperAdmin(user);
                console.log('User role check:', user.role, 'Is admin:', isAdmin);
                if (isAdmin) {
                    settingsMenuItem.style.display = 'list-item';
                    console.log('System settings menu shown for admin');
                } else {
                    settingsMenuItem.style.display = 'none';
                    console.log('System settings menu hidden for non-admin');
                }
            } else {
                console.log('System settings menu item not found in DOM');
            }
        } catch (error) {
            console.error('Error parsing userInfo:', error);
        }
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Role helper to recognize admin variants
function isSuperAdmin(user) {
    if (!user || !user.role) {
        return false;
    }
    const role = String(user.role).toLowerCase().replace(/\s+/g, '_');
    return role === 'super_admin' || role === 'admin' || role === 'superadmin';
}

// Logout function
function logout() {
    // Remove authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');

    // Show confirmation message
    const message = currentLanguage === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully';
    alert(message);

    // Redirect to login
    window.location.href = '/login';
}

// Setup general event listeners
function setupEventListeners() {
    // Add client button
    document.getElementById('addClientBtn')?.addEventListener('click', () => {
        ClientManager.showAddClientForm();
    });

    // Add product button
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        ProductManager.showAddProductForm();
    });

    // Add report button
    document.getElementById('addReportBtn')?.addEventListener('click', () => {
        ReportManager.showAddReportForm();
    });
}



// Make globally available
window.currentLanguage = currentLanguage;
window.API_BASE_URL = API_BASE_URL;
window.ScrollManager = ScrollManager;
window.closeModalAndRestoreScroll = closeModalAndRestoreScroll;
window.openModalAndDisableScroll = openModalAndDisableScroll;
window.toggleSidebar = toggleSidebar;
window.navigateAndCloseSidebar = navigateAndCloseSidebar;
window.initializeSidebar = initializeSidebar;
window.loadSystemSettings = loadSystemSettings;
window.saveSystemSettings = saveSystemSettings;
window.initializeApp = initializeApp;
window.setupNavigation = setupNavigation;
window.showSection = showSection;
window.setupLanguageToggle = setupLanguageToggle;
window.switchToEnglish = switchToEnglish;
window.switchToArabic = switchToArabic;
window.updateUserGreeting = updateUserGreeting;
window.getAuthHeaders = getAuthHeaders;
window.loadDashboardData = loadDashboardData;
window.checkAuthentication = checkAuthentication;
window.setupUserInterface = setupUserInterface;
window.isSuperAdmin = isSuperAdmin;
window.logout = logout;
window.setupEventListeners = setupEventListeners;
