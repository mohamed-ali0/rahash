// Main JavaScript file for Business Management System

// Global variables
let currentLanguage = 'ar';

// REVISED: Global scroll management system
// Simpler and more robust - avoids 'position: fixed' issues
const ScrollManager = {
    disableCount: 0,

    disableScroll: function(source = 'unknown') {
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

    enableScroll: function(source = 'unknown') {
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
    forceEnableScroll: function() {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        this.disableCount = 0;
        console.log('Force scroll enabled.');
    }
};

// Global function to safely close modals and restore scrolling
function closeModalAndRestoreScroll(modal, source = 'closeModalAndRestoreScroll') {
    if (modal) {
        modal.remove();
        ScrollManager.enableScroll(source);
    }
}

// Global function to safely open modals and disable scrolling
function openModalAndDisableScroll(modal, source = 'openModalAndDisableScroll') {
    if (modal) {
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        ScrollManager.disableScroll(source);
        
        // Add click handler to close modal
        modal.addEventListener('click', function(e) {
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
window.addEventListener('resize', function() {
    initializeSidebar();
});

// System Settings Functions
async function loadSystemSettings() {
    console.log('Loading system settings...');
    try {
        const response = await fetch(`${API_BASE_URL}/system-settings`, {
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
                priceToleranceInput.value = data.price_tolerance;
                console.log('Price tolerance set to:', data.price_tolerance);
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
        const response = await fetch(`${API_BASE_URL}/system-settings`, {
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
document.addEventListener('DOMContentLoaded', function() {
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
        addProductBtn.addEventListener('click', function(e) {
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

// Setup navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');
    
    // Hide all sections except the first one
    sections.forEach((section, index) => {
        if (index > 0) {
            section.style.display = 'none';
        }
    });
    
    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
}

// Show specific section
function showSection(sectionId) {
    const sections = document.querySelectorAll('main section');
    
    // Hide all sections
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Load data based on section
        switch(sectionId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'clients':
                // Get saved status filter or default to 'active'
                const savedClientStatus = localStorage.getItem('clientStatusFilter') || 'active';
                ClientManager.loadClients(savedClientStatus);
                break;
            case 'products':
                ProductManager.loadProducts();
                break;
            case 'reports':
                // Get saved status filter or default to 'active'
                const savedReportStatus = localStorage.getItem('reportStatusFilter') || 'active';
                ReportManager.loadReports(savedReportStatus);
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
        langToggle.addEventListener('click', function() {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }
    
    // Setup mobile header toggle
    if (langToggleMobile) {
        langToggleMobile.addEventListener('click', function() {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }
    
    // Setup desktop header toggle
    if (langToggleDesktop) {
        langToggleDesktop.addEventListener('click', function() {
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

// Client Management Functions
const ClientManager = {
    currentClients: [],
    allRegions: [],
    
    showAddClientForm: function() {
        // Create comprehensive add client modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form id="addClientForm" onsubmit="ClientManager.saveNewClient(event)">
                    
                    <!-- Basic Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم العميل' : 'Client Name'} *</label>
                                <input type="text" name="name" required>
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'المنطقة' : 'Region'}</label>
                                <input type="text" name="region">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم البائع' : 'Salesman Name'}</label>
                                <input type="text" name="salesman_name">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'الموقع' : 'Location'}</label>
                                <input type="text" name="location" placeholder="${currentLanguage === 'ar' ? 'مثال: الرياض، السعودية' : 'e.g., Riyadh, Saudi Arabia'}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'العنوان' : 'Address'}</label>
                                <input type="text" name="address" placeholder="${currentLanguage === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صورة العميل الرئيسية' : 'Client Thumbnail'}</label>
                            <input type="file" name="thumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - صورة تمثل العميل' : 'Optional - main image representing the client'}</small>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية للعميل' : 'Additional Client Images'}</label>
                            <input type="file" name="additional_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - يمكن اختيار عدة صور' : 'Optional - you can select multiple images'}</small>
                        </div>
                    </div>

                    <!-- Owner Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المالك' : 'Owner Name'}</label>
                                <input type="text" name="owner_name">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المالك' : 'Owner Phone'}</label>
                                <input type="tel" name="owner_phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المالك' : 'Owner Email'}</label>
                            <input type="email" name="owner_email">
                        </div>
                    </div>

                    <!-- Purchasing Manager Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات مدير المشتريات' : 'Purchasing Manager Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم مدير المشتريات' : 'Manager Name'}</label>
                                <input type="text" name="manager_name">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف مدير المشتريات' : 'Manager Phone'}</label>
                                <input type="tel" name="manager_phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل مدير المشتريات' : 'Manager Email'}</label>
                            <input type="email" name="manager_email">
                        </div>
                    </div>

                    <!-- Accountant Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المحاسب' : 'Accountant Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المحاسب' : 'Accountant Name'}</label>
                                <input type="text" name="accountant_name">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المحاسب' : 'Accountant Phone'}</label>
                                <input type="tel" name="accountant_phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المحاسب' : 'Accountant Email'}</label>
                            <input type="email" name="accountant_email">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة العميل' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'addClientForm');
        
        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addClientForm-close-btn');
            });
        }
        
        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addClientForm-cancel-btn');
            });
        }
    },
    
    saveNewClient: async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Collect basic client data
        const clientData = {
            name: formData.get('name'),
            region: formData.get('region') || null,
            salesman_name: formData.get('salesman_name') || null,
            location: formData.get('location') || null,
            address: formData.get('address') || null
        };
        
        // Collect owner information
        const ownerData = {};
        const ownerName = formData.get('owner_name');
        const ownerPhone = formData.get('owner_phone');
        const ownerEmail = formData.get('owner_email');
        if (ownerName || ownerPhone || ownerEmail) {
            ownerData.name = ownerName || null;
            ownerData.phone = ownerPhone || null;
            ownerData.email = ownerEmail || null;
            clientData.owner = ownerData;
        }
        
        // Set phone for backward compatibility and proper display
        // Use owner phone as the main phone
        clientData.phone = ownerPhone || null;
        
        // Collect purchasing manager information
        const managerData = {};
        const managerName = formData.get('manager_name');
        const managerPhone = formData.get('manager_phone');
        const managerEmail = formData.get('manager_email');
        if (managerName || managerPhone || managerEmail) {
            managerData.name = managerName || null;
            managerData.phone = managerPhone || null;
            managerData.email = managerEmail || null;
            clientData.purchasing_manager = managerData;
        }
        
        // Collect accountant information
        const accountantData = {};
        const accountantName = formData.get('accountant_name');
        const accountantPhone = formData.get('accountant_phone');
        const accountantEmail = formData.get('accountant_email');
        if (accountantName || accountantPhone || accountantEmail) {
            accountantData.name = accountantName || null;
            accountantData.phone = accountantPhone || null;
            accountantData.email = accountantEmail || null;
            clientData.accountant = accountantData;
        }
        
        // Handle thumbnail upload
        const thumbnailFile = formData.get('thumbnail');
        if (thumbnailFile && thumbnailFile.size > 0) {
            try {
                const base64 = await this.convertToBase64(thumbnailFile);
                clientData.thumbnail = base64;
                console.log('Added thumbnail to client data');
            } catch (error) {
                console.error('Error converting thumbnail:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في تحميل الصورة الرئيسية' : 'Error uploading thumbnail');
                return;
            }
        }
        
        // Handle additional images
        const additionalFiles = formData.getAll('additional_images');
        if (additionalFiles && additionalFiles.length > 0 && additionalFiles[0].size > 0) {
            const additionalImages = [];
            for (let file of additionalFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        additionalImages.push({
                            filename: file.name,
                            data: base64
                        });
                    } catch (error) {
                        console.error('Error converting additional image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (additionalImages.length > 0) {
                clientData.additional_images = additionalImages;
                console.log(`Added ${additionalImages.length} additional images to client data`);
            }
        }
        
        console.log('Creating new client with data:', clientData);
        console.log('Phone fields from form:', {
            'owner_phone': formData.get('owner_phone'),
            'final_phone': clientData.phone
        });
        
        try {
            const response = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                alert(currentLanguage === 'ar' ? 'تم إضافة العميل بنجاح' : 'Client added successfully');
                form.closest('.modal-overlay').remove();
                this.loadClients(); // Refresh the clients list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(currentLanguage === 'ar' ? 'خطأ في إضافة العميل' : 'Error adding client: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error adding client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        }
    },
    
    loadClients: async function(statusFilter = 'active') {
        try {
            // Show loading state immediately
            const clientsList = document.getElementById('clientsList');
            const loadingText = currentLanguage === 'ar' ? 'جاري تحميل العملاء...' : 'Loading clients...';
            clientsList.innerHTML = `
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${loadingText}</p>
                </div>
            `;
            
            // Use lightweight list endpoint WITHOUT images
            let apiUrl = `${API_BASE_URL}/clients/list`;
            if (statusFilter === 'all' || statusFilter === 'inactive') {
                apiUrl += '?show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                let clients = data.clients || data; // Handle both old and new format
                
                // Client-side filtering based on status
                if (statusFilter === 'active') {
                    clients = clients.filter(client => client.is_active !== false);
                } else if (statusFilter === 'inactive') {
                    clients = clients.filter(client => client.is_active === false);
                }
                
                // Store clients for filtering
                this.currentClients = clients;
                this.currentStatusFilter = statusFilter;
                
                // Load filter data separately (all regions and salesmen)
                this.loadFilterData();
                
                this.displayClients(clients);
                
                // Load thumbnails for clients that have them
                this.loadClientThumbnails(clients);
                
                // Store pagination info for infinite scroll
                this.currentPage = data.page || 1;
                this.hasMoreClients = data.has_more || false;
                this.totalClients = data.total || clients.length;
                
                // Add load more button if there are more clients
                this.addLoadMoreButton('clients');
                
                // Update status indicator
                this.updateStatusIndicator('clients', statusFilter, this.totalClients);
            } else {
                console.error('Failed to load clients');
                clientsList.innerHTML = '<p class="no-data">Failed to load clients</p>';
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            const clientsList = document.getElementById('clientsList');
            clientsList.innerHTML = '<p class="no-data">Error loading clients</p>';
        }
    },
    
    loadClientThumbnails: async function(clients) {
        /**Load thumbnails for clients that have them - called after displaying cards*/
        const clientsWithThumbnails = clients.filter(client => client.has_thumbnail);
        
        for (const client of clientsWithThumbnails) {
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${client.id}/thumbnail`, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const avatarElement = document.querySelector(`[data-client-id="${client.id}"]`);
                    if (avatarElement && data.thumbnail) {
                        avatarElement.innerHTML = `<img src="data:image/jpeg;base64,${data.thumbnail}" alt="${client.name}">`;
                    }
                }
            } catch (error) {
                console.error(`Error loading thumbnail for client ${client.id}:`, error);
                // Keep the loading indicator or show placeholder
            }
        }
    },
    
    loadClientImages: async function(clientId) {
        /**Load images for a specific client on demand*/
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/images`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const imagesSection = document.querySelector(`#client-expanded-${clientId} .additional-images-section`);
                
                if (imagesSection && data.images) {
                    // Replace loading spinner with actual images
                    const galleryDiv = imagesSection.querySelector('.image-gallery');
                    if (galleryDiv) {
                        galleryDiv.innerHTML = data.images.map((img, index) => `
                            <div class="gallery-item" onclick="ClientManager.viewImageFullscreen('${img.data}', '${img.filename}')">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                <div class="gallery-overlay">
                                    <span class="gallery-filename">${img.filename}</span>
                                </div>
                            </div>
                        `).join('');
                        
                        // Update the client object with loaded images
                        const client = this.currentClients.find(c => c.id === clientId);
                        if (client) {
                            client.additional_images = data.images;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading client images:', error);
            const imagesSection = document.querySelector(`#client-expanded-${clientId} .additional-images-section`);
            if (imagesSection) {
                const galleryDiv = imagesSection.querySelector('.image-gallery');
                if (galleryDiv) {
                    galleryDiv.innerHTML = `<p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images'}</p>`;
                }
            }
        }
    },
    
    addLoadMoreButton: function(type) {
        /**Add load more button at the bottom of the list*/
        const listElement = document.getElementById(`${type}List`);
        if (!listElement) return;
        
        // Remove existing load more button
        const existingButton = listElement.querySelector('.load-more-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Add load more button if there are more items (ClientManager only checks hasMoreClients)
        if (this.hasMoreClients) {
            const button = document.createElement('div');
            button.className = 'load-more-button';
            button.innerHTML = `
                <button class="btn btn-secondary load-more-btn" onclick="ClientManager.loadMoreClients()">
                    <div class="loading-spinner" style="display: none;">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <span class="button-text">${currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More'}</span>
                </button>
            `;
            listElement.appendChild(button);
            
            // Setup Intersection Observer to auto-load when button comes into view
            this.setupLoadMoreObserver(button, type);
        }
    },
    
    setupLoadMoreObserver: function(button, type) {
        /**Setup Intersection Observer to auto-click load more when it comes into view (OPTIONAL - button always works manually)*/
        try {
            // Disconnect existing observer if any
            if (this.loadMoreObserver) {
                this.loadMoreObserver.disconnect();
            }
            
            // Create new observer (this is a convenience feature - button works without it)
            this.loadMoreObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Button is visible, auto-click it (but user can still click manually)
                        console.log(`Load more button visible for ${type}, auto-loading...`);
                        const btn = entry.target.querySelector('.load-more-btn');
                        if (btn && !btn.disabled) {
                            // Add small delay to ensure proper rendering
                            setTimeout(() => {
                                if (btn && !btn.disabled) {
                                    btn.click();
                                }
                            }, 100);
                        }
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '100px', // Trigger 100px before button is visible (reduced from 200px for reliability)
                threshold: 0.1
            });
            
            // Start observing
            this.loadMoreObserver.observe(button);
            console.log(`✅ Auto-load observer started for ${type} (button also works manually)`);
        } catch (error) {
            // If observer fails, button still works manually
            console.log(`⚠️ Auto-load observer failed for ${type} (button will work manually only):`, error);
        }
    },
    
    loadMoreClients: async function() {
        /**Load next page of clients for infinite scroll*/
        if (!this.hasMoreClients) return;
        
        const button = document.querySelector('.load-more-btn');
        const spinner = button.querySelector('.loading-spinner');
        const buttonText = button.querySelector('.button-text');
        
        // Show loading state
        button.disabled = true;
        spinner.style.display = 'block';
        buttonText.textContent = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';
        
        try {
            const nextPage = this.currentPage + 1;
            let apiUrl = `${API_BASE_URL}/clients/list?page=${nextPage}`;
            if (this.currentStatusFilter === 'all' || this.currentStatusFilter === 'inactive') {
                apiUrl += '&show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const newClients = data.clients || data;
                
                // Append new clients to existing list
                this.currentClients = [...this.currentClients, ...newClients];
                
                // Update pagination info
                this.currentPage = data.page;
                this.hasMoreClients = data.has_more;
                
                // Display new clients
                this.displayClients(newClients, true); // true = append mode
                
                // Load thumbnails for new clients
                this.loadClientThumbnails(newClients);
                
                // Update load more button
                this.addLoadMoreButton('clients');
            }
        } catch (error) {
            console.error('Error loading more clients:', error);
        } finally {
            // Hide loading state
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More';
        }
    },
    
    
    loadFilterData: async function() {
        /**Load all unique regions and salesmen for filter dropdowns*/
        console.log('Loading filter data...');
        try {
            const response = await fetch(`${API_BASE_URL}/clients/filter-data`, {
                headers: getAuthHeaders()
            });
            
            console.log('Filter data response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Filter data received:', data);
                this.populateRegionFilter(data.regions);
                this.populateSalesmanFilter(data.salesmen);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to load filter data:', response.status, errorData);
            }
        } catch (error) {
            console.error('Error loading filter data:', error);
        }
    },
    
    populateRegionFilter: function(regions) {
        const regionFilter = document.getElementById('regionFilter');
        if (!regionFilter) return;
        
        // Use the regions array directly (already unique from backend)
        this.allRegions = regions;
        
        // Clear existing options except the first one (All Regions)
        regionFilter.innerHTML = `
            <option value="" data-ar="جميع المناطق" data-en="All Regions">${currentLanguage === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>
        `;
        
        // Add region options
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionFilter.appendChild(option);
        });
    },
    
    populateSalesmanFilter: function(salesmen) {
        const salesmanFilter = document.getElementById('salesmanFilter');
        if (!salesmanFilter) {
            console.error('Salesman filter element not found');
            return;
        }
        
        // Use the salesmen array directly (already unique from backend)
        this.allSalesmen = salesmen;
        
        // Clear existing options completely
        salesmanFilter.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = currentLanguage === 'ar' ? 'جميع المندوبين' : 'All Salesmen';
        salesmanFilter.appendChild(defaultOption);
        
        // Add salesman options
        salesmen.forEach(salesman => {
            const option = document.createElement('option');
            option.value = salesman;
            option.textContent = salesman;
            salesmanFilter.appendChild(option);
        });
        
        console.log('Salesman filter populated with:', salesmen);
    },
    
    displayClients: function(clients, append = false) {
        const clientsList = document.getElementById('clientsList');
        if (clients.length === 0 && !append) {
            clientsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد عملاء' : 'No Clients'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة عميل جديد' : 'Start by adding a new client'}</p>
                </div>
            `;
        } else {
            // Display clients cards with edit/delete buttons
            const cardsHTML = clients.map(client => {
                const isInactive = client.is_active === false;
                const cardClass = `client-card ${isInactive ? 'inactive' : ''}`;
                
                return `
                    <div class="${cardClass}" ${!isInactive ? `onclick="ClientManager.viewClientDetails(${client.id})"` : ''}>
                        <div class="card-header">
                            <div class="client-avatar" data-client-id="${client.id}">
                                ${client.has_thumbnail ? 
                                    `<div class="thumbnail-loading">⏳</div>` : 
                                    `<div class="avatar-placeholder">${client.name ? client.name.charAt(0).toUpperCase() : '👤'}</div>`
                                }
                            </div>
                            <div class="client-info">
                                <h3>${client.name}</h3>
                                <div class="region">${client.region || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</div>
                                ${client.salesman_name ? 
                                    `<div class="salesman">${currentLanguage === 'ar' ? 'البائع:' : 'Salesman:'} ${client.salesman_name}</div>` : 
                                    ''
                                }
                                ${isInactive ? `<div class="inactive-badge">${currentLanguage === 'ar' ? 'معطل' : 'Inactive'}</div>` : ''}
                            </div>
                        </div>
                        <div class="client-actions" onclick="event.stopPropagation()">
                            ${!isInactive ? `
                                <button class="phone-btn" onclick="ClientManager.copyPhone('${client.phone || ''}')">
                                    📞 ${client.phone || (currentLanguage === 'ar' ? 'لا يوجد هاتف' : 'No phone')}
                                </button>
                                <button class="location-btn ${client.location ? 'location-set' : 'location-undefined'}" onclick="ClientManager.openLocation('${client.location || ''}')" title="${client.location ? (currentLanguage === 'ar' ? 'فتح الموقع' : 'Open Location') : (currentLanguage === 'ar' ? 'لا يوجد موقع' : 'No Location')}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    ${client.location ? '' : '!'}
                                </button>
                                <div class="symbol-buttons">
                                    <button class="btn-icon-stylish btn-edit-stylish" onclick="ClientManager.editClient(${client.id})" title="${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                        </svg>
                                    </button>
                                    <button class="btn-icon-stylish btn-delete-stylish" onclick="ClientManager.deleteClient(${client.id})" title="${currentLanguage === 'ar' ? 'إلغاء تفعيل' : 'Deactivate'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                </div>
                            ` : `
                                <div style="flex: 1;"></div>
                                <div class="symbol-buttons">
                                    <button class="btn-icon-stylish reactivate-btn" onclick="ClientManager.reactivateClient(${client.id})" title="${currentLanguage === 'ar' ? 'إعادة تفعيل' : 'Reactivate'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
            
            if (append) {
                // Append new cards to existing list
                clientsList.insertAdjacentHTML('beforeend', cardsHTML);
            } else {
                // Replace all content
                clientsList.innerHTML = cardsHTML;
            }
        }
        
        // Update client count display
        this.updateClientCount(clients.length);
    },
    
    updateClientCount: function(count) {
        const clientCountElement = document.getElementById('clientCount');
        if (clientCountElement) {
            const span = clientCountElement.querySelector('span');
            if (span) {
                if (currentLanguage === 'ar') {
                    span.textContent = `${count} ${count === 1 ? 'عميل' : 'عميل'}`;
                } else {
                    span.textContent = `${count} ${count === 1 ? 'client' : 'clients'}`;
                }
            }
        }
    },
    
    filterClients: async function(searchTerm = '', selectedRegion = '', selectedSalesman = '') {
        // If search term or filters are cleared, reload the full list with infinite scroll
        if (!searchTerm.trim() && !selectedRegion.trim() && !selectedSalesman.trim()) {
            const statusFilter = document.getElementById('clientStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            this.loadClients(currentStatus); // Reloads page 1 and re-enables infinite scroll
            return;
        }

        // If search term is provided, use backend search for ALL clients
        if (searchTerm.trim()) {
            await this.searchClients(searchTerm, selectedRegion, selectedSalesman);
        } else {
            // Only filters (no search) - use backend to get ALL filtered clients
            await this.loadFilteredClients(selectedRegion, selectedSalesman);
        }
    },
    
    loadFilteredClients: async function(selectedRegion = '', selectedSalesman = '') {
        /**Load filtered clients from backend (searches ALL data, not just displayed)*/
        try {
            const statusFilter = document.getElementById('clientStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            
            let apiUrl = `${API_BASE_URL}/clients/list?page=1&per_page=100`;
            if (currentStatus === 'all' || currentStatus === 'inactive') {
                apiUrl += '&show_all=true';
            }
            if (selectedRegion) {
                apiUrl += `&region=${encodeURIComponent(selectedRegion)}`;
            }
            if (selectedSalesman) {
                apiUrl += `&salesman=${encodeURIComponent(selectedSalesman)}`;
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const filteredClients = data.clients || [];
                
                // ✅ IMPORTANT: Store filtered clients so view/edit/delete functions can access them
                this.currentClients = filteredClients;
                
                // Display results
                this.displayClients(filteredClients, false);
                
                // Load thumbnails
                this.loadClientThumbnails(filteredClients);
                
                // --- FIX: Disable infinite scroll for filtered results ---
                const loadMoreBtn = document.querySelector('#clientsList .load-more-button');
                if (loadMoreBtn) {
                    loadMoreBtn.remove();
                }
                this.hasMoreClients = false; // Prevent observer from firing
                // ---------------------------------------------------------
                
                // Update count
                this.updateStatusIndicator('clients', currentStatus, data.total);
                this.updateClientCount(filteredClients.length);
            } else {
                console.error('Failed to load filtered clients');
            }
        } catch (error) {
            console.error('Error loading filtered clients:', error);
        }
    },
    
    searchClients: async function(searchTerm, selectedRegion = '', selectedSalesman = '') {
        /**Search ALL clients using backend API*/
        try {
            const statusFilter = document.getElementById('clientStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            
            let apiUrl = `${API_BASE_URL}/clients/search?q=${encodeURIComponent(searchTerm)}&page=1&per_page=100`;
            if (currentStatus === 'all' || currentStatus === 'inactive') {
                apiUrl += '&show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                let searchResults = data.clients || [];
                
                // Apply region and salesman filters locally
                if (selectedRegion.trim()) {
                    searchResults = searchResults.filter(client => client.region === selectedRegion);
                }
                if (selectedSalesman.trim()) {
                    searchResults = searchResults.filter(client => client.salesman_name === selectedSalesman);
                }
                
                // ✅ IMPORTANT: Store search results so view/edit/delete functions can access them
                this.currentClients = searchResults;
                
                // Display results
                this.displayClients(searchResults, false);
                
                // Load thumbnails for search results
                this.loadClientThumbnails(searchResults);
                
                // --- FIX: Disable infinite scroll for search results ---
                const loadMoreBtn = document.querySelector('#clientsList .load-more-button');
                if (loadMoreBtn) {
                    loadMoreBtn.remove();
                }
                this.hasMoreClients = false; // Prevent observer from firing
                // -------------------------------------------------------
                
                // Update count
                this.updateStatusIndicator('clients', currentStatus, data.total);
                this.updateClientCount(searchResults.length);
            } else {
                console.error('Failed to search clients');
            }
        } catch (error) {
            console.error('Error searching clients:', error);
        }
    },
    
    updateStatusIndicator: function(type, statusFilter, count) {
        // Update the page title or add status indicator
        const sectionTitle = type === 'clients' ? 
            document.querySelector('#clients h2') : 
            document.querySelector('#reports h2');
        
        if (sectionTitle) {
            const baseText = type === 'clients' ? 
                (currentLanguage === 'ar' ? 'إدارة العملاء' : 'Client Management') :
                (currentLanguage === 'ar' ? 'تقارير الزيارات' : 'Visit Reports');
            
            let statusText = '';
            if (statusFilter === 'active') {
                statusText = currentLanguage === 'ar' ? ` (نشط: ${count})` : ` (Active: ${count})`;
            } else if (statusFilter === 'inactive') {
                statusText = currentLanguage === 'ar' ? ` (معطل: ${count})` : ` (Inactive: ${count})`;
            } else {
                statusText = currentLanguage === 'ar' ? ` (الكل: ${count})` : ` (All: ${count})`;
            }
            
            sectionTitle.textContent = baseText + statusText;
        }
    },
    
    viewClientDetails: async function(clientId) {
        // Show loading modal first
        const modal = document.createElement('div');
        modal.className = 'expanded-modal';
        modal.innerHTML = `
            <div class="expanded-content">
                <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${currentLanguage === 'ar' ? 'جاري تحميل بيانات العميل...' : 'Loading client data...'}</p>
                </div>
            </div>
        `;
        
        // Show modal and disable scroll
        document.body.appendChild(modal);
        modal.classList.add('active');
        ScrollManager.disableScroll();
        
        // Fetch FULL client details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                modal.innerHTML = `
                    <div class="expanded-content">
                        <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                        <p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل بيانات العميل' : 'Failed to load client data'}</p>
                    </div>
                `;
                return;
            }
            
            const client = await response.json();
            console.log('Client loaded for viewing:', client);
        
        // Update modal with actual content (thumbnail is now available!)
        modal.innerHTML = `
            <div class="expanded-content">
                <button class="js-modal-close">&times;</button>
                
                <div class="expanded-header">
                    <div class="expanded-image">
                        ${client.thumbnail ? 
                            `<img src="data:image/jpeg;base64,${client.thumbnail}" alt="${client.name}" onclick="ClientManager.viewClientImage('${client.thumbnail}', '${client.name}')">` : 
                            `<div class="avatar-placeholder-large">${client.name ? client.name.charAt(0).toUpperCase() : '👤'}</div>`
                        }
                    </div>
                    <div class="expanded-title">
                        <h2>${client.name}</h2>
                        <p class="client-region">${client.region || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</p>
                    </div>
                </div>
                
                <div class="expanded-details">
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h3>
                        <div class="detail-grid">
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</div>
                                <div class="detail-value">
                                    ${client.phone ? 
                                        `<span class="phone-display">${client.phone}</span>
                                         <button class="copy-btn" onclick="ClientManager.copyPhone('${client.phone}')" title="${currentLanguage === 'ar' ? 'نسخ الرقم' : 'Copy Number'}">📋</button>` 
                                        : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                                    }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'الموقع:' : 'Location:'}</div>
                                <div class="detail-value">
                                    ${client.location ? 
                                        `<span class="location-display">${client.location}</span>
                                         <button class="map-btn location-set" onclick="ClientManager.openLocation('${client.location}')" title="${currentLanguage === 'ar' ? 'فتح الموقع' : 'Open Location'}">
                                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                 <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                 <circle cx="12" cy="10" r="3"/>
                                             </svg>
                                         </button>` 
                                        : `<span class="location-undefined-text">${currentLanguage === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                                           <button class="map-btn location-undefined" onclick="ClientManager.openLocation('')" title="${currentLanguage === 'ar' ? 'لا يوجد موقع' : 'No Location'}" disabled>
                                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                   <circle cx="12" cy="10" r="3"/>
                                               </svg>
                                               !
                                           </button>`
                                    }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'العنوان:' : 'Address:'}</div>
                                <div class="detail-value">
                                    ${client.address ? 
                                        `<span class="address-display">${client.address}</span>` 
                                        : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'الأشخاص المسؤولون' : 'Responsible Persons'}</h3>
                        <div class="detail-grid">
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'المالك:' : 'Owner:'}</div>
                                <div class="detail-value">
                                    ${client.owner ? 
                                        `<div class="person-info">
                                            <span class="person-name">${client.owner.name}</span>
                                            ${client.owner.phone ? `<span class="person-phone">📞 ${client.owner.phone}</span>` : ''}
                                            ${client.owner.email ? `<span class="person-email">✉️ ${client.owner.email}</span>` : ''}
                                         </div>` 
                                        : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                                    }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'مدير المشتريات:' : 'Purchasing Manager:'}</div>
                                <div class="detail-value">
                                    ${client.purchasing_manager ? 
                                        `<div class="person-info">
                                            <span class="person-name">${client.purchasing_manager.name}</span>
                                            ${client.purchasing_manager.phone ? `<span class="person-phone">📞 ${client.purchasing_manager.phone}</span>` : ''}
                                            ${client.purchasing_manager.email ? `<span class="person-email">✉️ ${client.purchasing_manager.email}</span>` : ''}
                                         </div>` 
                                        : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                                    }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'المحاسب:' : 'Accountant:'}</div>
                                <div class="detail-value">
                                    ${client.accountant ? 
                                        `<div class="person-info">
                                            <span class="person-name">${client.accountant.name}</span>
                                            ${client.accountant.phone ? `<span class="person-phone">📞 ${client.accountant.phone}</span>` : ''}
                                            ${client.accountant.email ? `<span class="person-email">✉️ ${client.accountant.email}</span>` : ''}
                                         </div>` 
                                        : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'معلومات إضافية' : 'Additional Information'}</h3>
                        <div class="detail-grid">
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'اسم البائع:' : 'Salesman Name:'}</div>
                                <div class="detail-value">${client.salesman_name || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'تاريخ الإضافة:' : 'Date Added:'}</div>
                                <div class="detail-value">${new Date(client.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US')}</div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'المستخدم المسؤول:' : 'Assigned User:'}</div>
                                <div class="detail-value">${client.assigned_user || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${(client.images && Array.isArray(client.images) && client.images.length > 0) ? `
                    <div class="detail-section additional-images-section">
                        <h3>${currentLanguage === 'ar' ? 'الصور الإضافية' : 'Additional Images'} (${client.images.length})</h3>
                        <div class="image-gallery">
                            ${client.images.map(img => `
                                <div class="gallery-item" onclick="ClientManager.viewClientImage('${img.data}', '${img.filename}')">
                                    <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename || client.name}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="expanded-actions">
                    <button class="btn btn-primary js-edit-and-close">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        ${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}
                    </button>
                    <button class="btn btn-secondary js-modal-cancel">
                        ${currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        `;
        
        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewClientDetails-close-btn');
            });
        }
        
        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewClientDetails-cancel-btn');
            });
        }
        
        const editButton = modal.querySelector('.js-edit-and-close');
        if (editButton) {
            editButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewClientDetails-edit-btn');
                ClientManager.editClient(client.id);
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModalAndRestoreScroll(modal, 'viewClientDetails-overlay-click');
            }
        });
        
        } catch (error) {
            console.error('Error loading client for expanded view:', error);
            modal.innerHTML = `
                <div class="expanded-content">
                    <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                    <p class="error-text">${currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات العميل' : 'Error loading client data'}</p>
                </div>
            `;
        }
    },
    
    viewClientImage: function(imageData, clientName) {
        if (!imageData) return;
        
        // Create fullscreen image viewer
        const modal = document.createElement('div');
        modal.className = 'fullscreen-image-modal';
        modal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="this.closest('.fullscreen-image-modal').remove(); ScrollManager.enableScroll();">&times;</button>
                <img src="data:image/jpeg;base64,${imageData}" alt="${clientName}">
                <div class="image-title">${clientName}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                ScrollManager.enableScroll();
            }
        });
    },
    
    viewClientImages: function(clientId, startIndex = 0) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client || !client.additional_images || client.additional_images.length === 0) return;
        
        // Prepare all images (thumbnail + additional)
        const allImages = [];
        
        // Add thumbnail as first image if it exists
        if (client.thumbnail) {
            allImages.push({
                data: client.thumbnail,
                filename: `${client.name} - Thumbnail`,
                title: currentLanguage === 'ar' ? 'الصورة الرئيسية' : 'Main Image'
            });
        }
        
        // Add additional images
        client.additional_images.forEach((img, index) => {
            allImages.push({
                data: img.data,
                filename: img.filename || `${client.name} - Image ${index + 1}`,
                title: img.filename || currentLanguage === 'ar' ? 'صورة إضافية' : 'Additional Image'
            });
        });
        
        // Adjust start index if thumbnail was added
        const actualStartIndex = client.thumbnail ? startIndex + 1 : startIndex;
        
        // Open fullscreen viewer with navigation
        this.viewImageFullscreen(
            `data:image/jpeg;base64,${allImages[actualStartIndex].data}`,
            allImages[actualStartIndex].title,
            allImages,
            actualStartIndex
        );
    },
    
    viewImageFullscreen: function(imageSrc, altText, imagesList = null, currentIndex = 0) {
        // Create fullscreen image viewer with navigation
        const modal = document.createElement('div');
        modal.className = 'fullscreen-image-modal';
        modal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="ClientManager.closeFullscreenImage()">&times;</button>
                
                ${imagesList && imagesList.length > 1 ? `
                    <button class="nav-btn prev-btn" onclick="ClientManager.showPreviousImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                        </svg>
                    </button>
                    <button class="nav-btn next-btn" onclick="ClientManager.showNextImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                    </button>
                ` : ''}
                
                <img src="${imageSrc}" alt="${altText}">
                <div class="image-info">
                    <div class="image-title">${altText}</div>
                    ${imagesList && imagesList.length > 1 ? `
                        <div class="image-counter">${currentIndex + 1} ${currentLanguage === 'ar' ? 'من' : 'of'} ${imagesList.length}</div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Store current state
        this.currentImagesList = imagesList;
        this.currentImageIndex = currentIndex;
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                ClientManager.closeFullscreenImage();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    },
    
    closeFullscreenImage: function() {
        const modal = document.querySelector('.fullscreen-image-modal');
        if (modal) {
            modal.remove();
            ScrollManager.enableScroll();
        }
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyNavigation.bind(this));
        // Clear state
        this.currentImagesList = null;
        this.currentImageIndex = 0;
    },
    
    showPreviousImage: function() {
        if (!this.currentImagesList || this.currentImagesList.length <= 1) return;
        
        this.currentImageIndex = this.currentImageIndex > 0 ? 
            this.currentImageIndex - 1 : 
            this.currentImagesList.length - 1;
        
        this.updateFullscreenImage();
    },
    
    showNextImage: function() {
        if (!this.currentImagesList || this.currentImagesList.length <= 1) return;
        
        this.currentImageIndex = this.currentImageIndex < this.currentImagesList.length - 1 ? 
            this.currentImageIndex + 1 : 
            0;
        
        this.updateFullscreenImage();
    },
    
    updateFullscreenImage: function() {
        if (!this.currentImagesList || !this.currentImagesList[this.currentImageIndex]) return;
        
        const modal = document.querySelector('.fullscreen-image-modal');
        if (!modal) return;
        
        const img = modal.querySelector('img');
        const title = modal.querySelector('.image-title');
        const counter = modal.querySelector('.image-counter');
        
        const currentImg = this.currentImagesList[this.currentImageIndex];
        
        if (img) {
            img.src = `data:image/jpeg;base64,${currentImg.data}`;
            img.alt = currentImg.title;
        }
        
        if (title) {
            title.textContent = currentImg.title;
        }
        
        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} ${currentLanguage === 'ar' ? 'من' : 'of'} ${this.currentImagesList.length}`;
        }
    },
    
    handleKeyNavigation: function(event) {
        switch(event.key) {
            case 'Escape':
                this.closeFullscreenImage();
                break;
            case 'ArrowLeft':
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                this.showNextImage();
                break;
        }
    },
    
    editClient: async function(clientId) {
        // Fetch FULL client details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                alert(currentLanguage === 'ar' ? 'فشل تحميل بيانات العميل' : 'Failed to load client data');
                return;
            }
            
            const client = await response.json();
            console.log('Client loaded for editing with images:', client.images);
        
        // Create comprehensive edit modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form id="editClientForm" onsubmit="ClientManager.saveClient(event, ${client.id}); return false;">
                    
                    <!-- Basic Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم العميل' : 'Client Name'} *</label>
                                <input type="text" name="name" value="${client.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'المنطقة' : 'Region'}</label>
                                <input type="text" name="region" value="${client.region || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم البائع' : 'Salesman Name'}</label>
                                <input type="text" name="salesman_name" value="${client.salesman_name || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'الموقع' : 'Location'}</label>
                                <input type="text" name="location" value="${client.location || ''}" placeholder="${currentLanguage === 'ar' ? 'مثال: الرياض، السعودية' : 'e.g., Riyadh, Saudi Arabia'}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'العنوان' : 'Address'}</label>
                                <input type="text" name="address" value="${client.address || ''}" placeholder="${currentLanguage === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صورة العميل الرئيسية' : 'Client Thumbnail'}</label>
                            ${client.thumbnail ? `
                                <div class="current-image-container">
                                    <div class="current-image">
                                        <img src="data:image/jpeg;base64,${client.thumbnail}" alt="${client.name}">
                                        <button type="button" class="btn-delete-image" onclick="ClientManager.deleteThumbnail(${client.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <small class="form-help">${currentLanguage === 'ar' ? 'الصورة الحالية - اضغط على X لحذفها' : 'Current image - click X to delete'}</small>
                                </div>
                            ` : ''}
                            <input type="file" name="thumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - صورة جديدة تمثل العميل' : 'Optional - new main image representing the client'}</small>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية جديدة' : 'New Additional Images'}</label>
                            ${(client.images && Array.isArray(client.images) && client.images.length > 0) ? `
                                <div class="current-images-container">
                                    <h5>${currentLanguage === 'ar' ? 'الصور الحالية:' : 'Current Images:'}</h5>
                                    <div class="images-grid">
                                        ${client.images.map(img => `
                                            <div class="current-image">
                                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}">
                                                <button type="button" class="btn-delete-image" onclick="ClientManager.deleteAdditionalImage(${client.id}, ${img.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <input type="file" name="additional_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - إضافة صور جديدة للعميل' : 'Optional - add new images to the client'}</small>
                        </div>
                    </div>

                    <!-- Owner Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المالك' : 'Owner Name'}</label>
                                <input type="text" name="owner_name" value="${client.owner?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المالك' : 'Owner Phone'}</label>
                                <input type="tel" name="owner_phone" value="${client.owner?.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المالك' : 'Owner Email'}</label>
                            <input type="email" name="owner_email" value="${client.owner?.email || ''}">
                        </div>
                    </div>

                    <!-- Purchasing Manager Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات مدير المشتريات' : 'Purchasing Manager Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم مدير المشتريات' : 'Manager Name'}</label>
                                <input type="text" name="manager_name" value="${client.purchasing_manager?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف مدير المشتريات' : 'Manager Phone'}</label>
                                <input type="tel" name="manager_phone" value="${client.purchasing_manager?.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل مدير المشتريات' : 'Manager Email'}</label>
                            <input type="email" name="manager_email" value="${client.purchasing_manager?.email || ''}">
                        </div>
                    </div>

                    <!-- Accountant Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المحاسب' : 'Accountant Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المحاسب' : 'Accountant Name'}</label>
                                <input type="text" name="accountant_name" value="${client.accountant?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المحاسب' : 'Accountant Phone'}</label>
                                <input type="tel" name="accountant_phone" value="${client.accountant?.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المحاسب' : 'Accountant Email'}</label>
                            <input type="email" name="accountant_email" value="${client.accountant?.email || ''}">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'editClientForm');
        
        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'editClientForm-close-btn');
            });
        }
        
        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'editClientForm-cancel-btn');
            });
        }
        
        } catch (error) {
            console.error('Error loading client for edit:', error);
            alert(currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات العميل' : 'Error loading client data');
        }
    },
    
    saveClient: async function(event, clientId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Collect basic client data
        const clientData = {
            name: formData.get('name'),
            region: formData.get('region') || null,
            salesman_name: formData.get('salesman_name') || null,
            location: formData.get('location') || null,
            address: formData.get('address') || null
        };
        
        // Collect owner information
        const ownerData = {};
        const ownerName = formData.get('owner_name');
        const ownerPhone = formData.get('owner_phone');
        const ownerEmail = formData.get('owner_email');
        if (ownerName || ownerPhone || ownerEmail) {
            ownerData.name = ownerName || null;
            ownerData.phone = ownerPhone || null;
            ownerData.email = ownerEmail || null;
            clientData.owner = ownerData;
        }
        
        // Set phone for backward compatibility and proper display
        // Use owner phone as the main phone
        clientData.phone = ownerPhone || null;
        
        // Collect purchasing manager information
        const managerData = {};
        const managerName = formData.get('manager_name');
        const managerPhone = formData.get('manager_phone');
        const managerEmail = formData.get('manager_email');
        if (managerName || managerPhone || managerEmail) {
            managerData.name = managerName || null;
            managerData.phone = managerPhone || null;
            managerData.email = managerEmail || null;
            clientData.purchasing_manager = managerData;
        }
        
        // Collect accountant information
        const accountantData = {};
        const accountantName = formData.get('accountant_name');
        const accountantPhone = formData.get('accountant_phone');
        const accountantEmail = formData.get('accountant_email');
        if (accountantName || accountantPhone || accountantEmail) {
            accountantData.name = accountantName || null;
            accountantData.phone = accountantPhone || null;
            accountantData.email = accountantEmail || null;
            clientData.accountant = accountantData;
        }
        
        console.log('Saving client data:', clientData);
        console.log('Phone fields from form:', {
            'owner_phone': formData.get('owner_phone'),
            'final_phone': clientData.phone
        });
        
        // Handle thumbnail upload
        const thumbnailFile = formData.get('thumbnail');
        if (thumbnailFile && thumbnailFile.size > 0) {
            try {
                const base64 = await this.convertToBase64(thumbnailFile);
                clientData.thumbnail = base64;
                console.log('Added thumbnail to client data');
            } catch (error) {
                console.error('Error converting thumbnail:', error);
            }
        }
        
        // Handle additional images
        const additionalFiles = formData.getAll('additional_images');
        if (additionalFiles && additionalFiles.length > 0 && additionalFiles[0].size > 0) {
            const additionalImages = [];
            for (let file of additionalFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        additionalImages.push({
                            filename: file.name,
                            data: base64
                        });
                    } catch (error) {
                        console.error('Error converting additional image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (additionalImages.length > 0) {
                clientData.additional_images = additionalImages;
                console.log(`Added ${additionalImages.length} additional images to client data`);
            }
        }
        
        try {
            console.log('Sending PUT request to:', `${API_BASE_URL}/clients/${clientId}`);
            
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                alert(currentLanguage === 'ar' ? 'تم تحديث العميل بنجاح' : 'Client updated successfully');
                form.closest('.modal-overlay').remove();
                this.loadClients(); // Refresh the clients list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(currentLanguage === 'ar' ? 'خطأ في التحديث' : 'Error updating client: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error updating client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },
    
    deleteClient: async function(clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;
        
        const confirmMessage = currentLanguage === 'ar' ? 
            `هل أنت متأكد من إلغاء تفعيل العميل "${client.name}"؟ يمكن إعادة تفعيله لاحقاً.` : 
            `Are you sure you want to deactivate client "${client.name}"? It can be reactivated later.`;
        
        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const successMessage = currentLanguage === 'ar' ? 
                        'تم إلغاء تفعيل العميل بنجاح' : 
                        'Client deactivated successfully';
                    
                    alert(successMessage);
                    this.loadClients(); // Refresh the clients list
                loadDashboardData(); // Refresh dashboard counts
                    
                } else {
                    const errorData = await response.json();
                    
                    // Handle specific token errors
                    if (response.status === 401 && (errorData.message.includes('Token') || errorData.message.includes('expired') || errorData.message.includes('invalid'))) {
                        alert(currentLanguage === 'ar' ? 'انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مرة أخرى' : 'Session expired, please login again');
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userInfo');
                        window.location.href = '/login';
                        return;
                    }
                    
                    const errorMessage = currentLanguage === 'ar' ? 
                        'خطأ في حذف العميل: ' + (errorData.message || 'حدث خطأ غير معروف') : 
                        'Error deleting client: ' + (errorData.message || 'Unknown error occurred');
                    
                    alert(errorMessage);
                }
                
            } catch (error) {
                console.error('Error deleting client:', error);
                const errorMessage = currentLanguage === 'ar' ? 
                    'فشل في حذف العميل. تحقق من اتصال الإنترنت.' : 
                    'Failed to delete client. Please check your internet connection.';
                
                alert(errorMessage);
            }
        }
    },

    reactivateClient: async function(clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;
        
        const confirmMessage = currentLanguage === 'ar' ? 
            `هل أنت متأكد من إعادة تفعيل العميل "${client.name}"؟` : 
            `Are you sure you want to reactivate client "${client.name}"?`;
        
        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${clientId}/reactivate`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert(currentLanguage === 'ar' ? 'تم إعادة تفعيل العميل بنجاح' : 'Client reactivated successfully');
                    this.loadClients(); // Refresh the clients list
                loadDashboardData(); // Refresh dashboard counts
                } else {
                    const errorData = await response.json();
                    alert(currentLanguage === 'ar' ? 'خطأ في إعادة تفعيل العميل' : 'Error reactivating client: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error reactivating client:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
            }
        }
    },
    
    copyPhone: function(phone) {
        console.log('copyPhone called with:', phone);
        
        if (phone && phone.trim()) {
            // Copy to clipboard first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(phone).then(() => {
                    console.log('Phone copied to clipboard');
                    // Show success message
                    alert(currentLanguage === 'ar' ? `تم نسخ الرقم: ${phone}` : `Phone copied: ${phone}`);
                }).catch((error) => {
                    console.log('Clipboard API failed:', error);
                    this.fallbackCopyPhone(phone);
                });
            } else {
                this.fallbackCopyPhone(phone);
            }
            
            // Open dialer
            const normalized = phone.replace(/[^\d+]/g, '');
            const telUrl = `tel:${normalized}`;
            console.log('Opening dialer with URL:', telUrl);
            
            // Try to open dialer
            try {
                window.location.href = telUrl;
            } catch (error) {
                console.log('Failed to open dialer:', error);
                // Fallback: just copy the number
                this.fallbackCopyPhone(phone);
            }
        } else {
            console.log('No phone number provided');
            alert(currentLanguage === 'ar' ? 'لا يوجد رقم هاتف' : 'No phone number available');
        }
    },
    
    fallbackCopyPhone: function(phone) {
        const textArea = document.createElement('textarea');
        textArea.value = phone;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('Phone copied via fallback');
                alert(currentLanguage === 'ar' ? `تم نسخ الرقم: ${phone}` : `Phone copied: ${phone}`);
            } else {
                console.log('Fallback copy failed');
                alert(currentLanguage === 'ar' ? `الرقم: ${phone}` : `Phone: ${phone}`);
            }
        } catch (error) {
            console.log('Fallback copy error:', error);
            alert(currentLanguage === 'ar' ? `الرقم: ${phone}` : `Phone: ${phone}`);
        }
        
        document.body.removeChild(textArea);
    },
    
    openLocation: function(location) {
        if (location && location.trim()) {
            // Open the URL directly
            window.open(location, '_blank');
        } else {
            alert(currentLanguage === 'ar' ? 'لا يوجد موقع محدد' : 'No location specified');
        }
    },
    
    convertToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    },
    
    // Image deletion functions
    deleteThumbnail: async function(clientId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف الصورة الرئيسية؟' : 'Are you sure you want to delete the thumbnail?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/thumbnail`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة الرئيسية بنجاح' : 'Thumbnail deleted successfully');
                // Refresh the client data and close the modal
                this.loadClients();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting thumbnail:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
        }
    },
    
    deleteAdditionalImage: async function(clientId, imageId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/images/${imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully');
                // Refresh the client data and close the modal
                this.loadClients();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
        }
    }
};

// Product Management Functions  
const ProductManager = {
    showAddProductForm: function() {
        // Redirect to the real add modal function
        this.openAddModal();
    },
    
    loadProducts: async function() {
        try {
            // Show loading state immediately
            const productsList = document.getElementById('productsList');
            const loadingText = currentLanguage === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...';
            productsList.innerHTML = `
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${loadingText}</p>
                </div>
            `;
            
            // Use lightweight list endpoint WITHOUT images
            console.log('Loading products from:', `${API_BASE_URL}/products/list`);
            console.log('Auth headers:', getAuthHeaders());
            const response = await fetch(`${API_BASE_URL}/products/list`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                const products = data.products || data; // Handle both old and new format
                
                // Store products for search functionality
                this.currentProducts = products;
                
                // Show add product button if user can edit (super admin)
                this.updateUIPermissions(products);
                
                this.displayProducts(products);
                
                // Load thumbnails for products that have them
                this.loadProductThumbnails(products);
                
                // Store pagination info for infinite scroll
                this.currentProductPage = data.page || 1;
                this.hasMoreProducts = data.has_more || false;
                this.totalProducts = data.total || products.length;
                
                console.log(`ProductManager: hasMoreProducts = ${this.hasMoreProducts}, total = ${this.totalProducts}`);
                
                // Add load more button if there are more products
                this.addLoadMoreButton('products');
                
                // Note: Infinite scroll now uses Intersection Observer in addLoadMoreButton
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to load products:', response.status, errorData);
                productsList.innerHTML = `<p class="no-data">Error loading products: ${errorData.message || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Error loading products:', error);
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '<p class="no-data">Error loading products</p>';
        }
    },
    
    loadProductThumbnails: async function(products) {
        /**Load thumbnails for products that have them - called after displaying cards*/
        const productsWithThumbnails = products.filter(product => product.has_thumbnail);
        
        for (const product of productsWithThumbnails) {
            try {
                const response = await fetch(`${API_BASE_URL}/products/${product.id}/thumbnail`, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const imageElement = document.querySelector(`[data-product-id="${product.id}"]`);
                    if (imageElement && data.thumbnail) {
                        imageElement.innerHTML = `<img src="data:image/jpeg;base64,${data.thumbnail}" alt="${product.name}">`;
                    }
                }
            } catch (error) {
                console.error(`Error loading thumbnail for product ${product.id}:`, error);
                // Keep the loading indicator or show fallback
            }
        }
    },
    
    loadProductImages: async function(productId) {
        /**Load images for a specific product on demand*/
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const imagesSection = document.querySelector(`#product-expanded-${productId} .additional-images-section`);
                
                if (imagesSection && data.images) {
                    // Replace loading spinner with actual images
                    const galleryDiv = imagesSection.querySelector('.image-gallery');
                    if (galleryDiv) {
                        galleryDiv.innerHTML = data.images.map((img, index) => `
                            <div class="gallery-item" onclick="ProductManager.viewImageFullscreen('${img.data}', '${img.filename}')">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                <div class="gallery-overlay">
                                    <span class="gallery-filename">${img.filename}</span>
                                </div>
                            </div>
                        `).join('');
                        
                        // Update the product object with loaded images
                        const product = this.currentProducts.find(p => p.id === productId);
                        if (product) {
                            product.images = data.images;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading product images:', error);
            const imagesSection = document.querySelector(`#product-expanded-${productId} .additional-images-section`);
            if (imagesSection) {
                const galleryDiv = imagesSection.querySelector('.image-gallery');
                if (galleryDiv) {
                    galleryDiv.innerHTML = `<p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images'}</p>`;
                }
            }
        }
    },
    
    loadMoreProducts: async function() {
        /**Load next page of products for infinite scroll*/
        if (!this.hasMoreProducts) return;
        
        const button = document.querySelector('.load-more-btn');
        const spinner = button.querySelector('.loading-spinner');
        const buttonText = button.querySelector('.button-text');
        
        // Show loading state
        button.disabled = true;
        spinner.style.display = 'block';
        buttonText.textContent = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';
        
        try {
            const nextPage = this.currentProductPage + 1;
            const response = await fetch(`${API_BASE_URL}/products/list?page=${nextPage}`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const newProducts = data.products || data;
                
                // Append new products to existing list
                this.currentProducts = [...this.currentProducts, ...newProducts];
                
                // Update pagination info
                this.currentProductPage = data.page;
                this.hasMoreProducts = data.has_more;
                
                // Display new products
                this.displayProducts(newProducts, true); // true = append mode
                
                // Load thumbnails for new products
                this.loadProductThumbnails(newProducts);
                
                // Update load more button
                this.addLoadMoreButton('products');
            }
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            // Hide loading state
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More';
        }
    },
    
    updateUIPermissions: function(products) {
        const addProductBtn = document.getElementById('addProductBtn');
        
        if (addProductBtn) {
            // Check if user has edit permissions (SUPER_ADMIN only)
            let canEdit = false;
            
            if (products && products.length > 0) {
                // Use can_edit flag from the products API response
                canEdit = products[0].can_edit;
            } else {
                // If no products, check user role from stored data
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                canEdit = userInfo.role === 'super_admin';
            }
            
            console.log('User can edit products:', canEdit);
            
            if (canEdit) {
                // Show button for SUPER_ADMIN
                addProductBtn.style.display = 'inline-flex';
                addProductBtn.disabled = false;
                addProductBtn.classList.remove('disabled');
                addProductBtn.style.opacity = '1';
                addProductBtn.style.cursor = 'pointer';
                addProductBtn.style.visibility = 'visible';
                console.log('Add product button shown for SUPER_ADMIN');
            } else {
                // Hide button for non-SUPER_ADMIN users
                addProductBtn.style.display = 'none';
                console.log('Add product button hidden - user is not SUPER_ADMIN');
            }
        } else {
            console.log('Add product button not found in DOM');
        }
        
        // Show/hide settings menu item based on role
        setupUserInterface();
    },
    
    displayProducts: function(products, append = false) {
        // Store products data for editing (only if not append mode)
        if (!append) {
            this.currentProducts = products;
        }
        
        const productsList = document.getElementById('productsList');
        if (products.length === 0 && !append) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد منتجات' : 'No Products'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة منتج جديد' : 'Start by adding a new product'}</p>
                </div>
            `;
        } else {
            // Display products cards
            productsList.innerHTML = products.map(product => `
                <div class="product-card" onclick="ProductManager.viewExpanded(${product.id})">
                    <div class="product-image" data-product-id="${product.id}">
                        ${product.has_thumbnail ? 
                            `<div class="thumbnail-loading">⏳</div>` : 
                            `<img src="/logo.png" alt="${product.name}" class="logo-fallback">`
                        }
                    </div>
                    <h3>${product.name}</h3>
                    <div class="prices-grid">
                        <div class="price-item">
                            <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</div>
                            <div class="price-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                        </div>
                        <div class="price-item">
                            <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</div>
                            <div class="price-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                        </div>
                        <div class="price-item">
                            <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</div>
                            <div class="price-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                        </div>
                        <div class="price-item">
                            <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</div>
                            <div class="price-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                        </div>
                    </div>
                    ${product.can_edit ? `
                        <div class="product-actions" onclick="event.stopPropagation()">
                            <button class="btn-icon-stylish btn-edit-stylish" onclick="ProductManager.editProduct(${product.id})" title="${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="btn-icon-stylish btn-delete-stylish" onclick="ProductManager.deleteProduct(${product.id})" title="${currentLanguage === 'ar' ? 'حذف المنتج' : 'Delete Product'}">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
            if (append) {
                // Append new cards to existing list
                productsList.insertAdjacentHTML('beforeend', products.map(product => `
                    <div class="product-card" onclick="ProductManager.viewExpanded(${product.id})">
                        <div class="product-image" data-product-id="${product.id}">
                            ${product.has_thumbnail ? 
                                `<div class="thumbnail-loading">⏳</div>` : 
                                `<img src="/logo.png" alt="${product.name}" class="logo-fallback">`
                            }
                        </div>
                        <h3>${product.name}</h3>
                        <div class="prices-grid">
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</div>
                                <div class="price-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</div>
                                <div class="price-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</div>
                                <div class="price-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</div>
                                <div class="price-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                        </div>
                        ${product.can_edit ? `
                            <div class="product-actions" onclick="event.stopPropagation()">
                                <button class="btn-icon-stylish btn-edit-stylish" onclick="ProductManager.editProduct(${product.id})" title="${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                </button>
                                <button class="btn-icon-stylish btn-delete-stylish" onclick="ProductManager.deleteProduct(${product.id})" title="${currentLanguage === 'ar' ? 'حذف المنتج' : 'Delete Product'}">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join(''));
            } else {
                // Replace all content
                productsList.innerHTML = products.map(product => `
                    <div class="product-card" onclick="ProductManager.viewExpanded(${product.id})">
                        <div class="product-image" data-product-id="${product.id}">
                            ${product.has_thumbnail ? 
                                `<div class="thumbnail-loading">⏳</div>` : 
                                `<img src="/logo.png" alt="${product.name}" class="logo-fallback">`
                            }
                        </div>
                        <h3>${product.name}</h3>
                        <div class="prices-grid">
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</div>
                                <div class="price-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</div>
                                <div class="price-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</div>
                                <div class="price-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                            <div class="price-item">
                                <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</div>
                                <div class="price-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                            </div>
                        </div>
                        ${product.can_edit ? `
                            <div class="product-actions" onclick="event.stopPropagation()">
                                <button class="btn-icon-stylish btn-edit-stylish" onclick="ProductManager.editProduct(${product.id})" title="${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                    </svg>
                                </button>
                                <button class="btn-icon-stylish btn-delete-stylish" onclick="ProductManager.deleteProduct(${product.id})" title="${currentLanguage === 'ar' ? 'حذف المنتج' : 'Delete Product'}">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            }
        }
    },
    
    editProduct: async function(productId) {
        // Fetch FULL product details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                alert(currentLanguage === 'ar' ? 'فشل تحميل بيانات المنتج' : 'Failed to load product data');
                return;
            }
            
            const product = await response.json();
            console.log('Product loaded for editing with images:', product.images);
        
        // Create edit form
        const editForm = `
            <div class="modal-overlay" id="editProductModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</h3>
                        <button class="js-modal-close">×</button>
                    </div>
                    <form class="edit-product-form" onsubmit="ProductManager.saveProduct(event, ${productId})">
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'اسم المنتج' : 'Product Name'}</label>
                            <input type="text" id="editProductName" value="${product.name || ''}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</label>
                                <input type="number" step="0.01" id="editTaxedPriceStore" value="${product.taxed_price_store || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</label>
                                <input type="number" step="0.01" id="editUntaxedPriceStore" value="${product.untaxed_price_store || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</label>
                                <input type="number" step="0.01" id="editTaxedPriceClient" value="${product.taxed_price_client || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</label>
                                <input type="number" step="0.01" id="editUntaxedPriceClient" value="${product.untaxed_price_client || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'الصورة الرئيسية (المصغرة)' : 'Main Thumbnail Image'}</label>
                            ${product.thumbnail ? `
                                <div class="current-image-container">
                                    <div class="current-image">
                                        <img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">
                                        <button type="button" class="btn-delete-image" onclick="ProductManager.deleteThumbnail(${product.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <small class="form-help">${currentLanguage === 'ar' ? 'الصورة الحالية - اضغط على X لحذفها' : 'Current image - click X to delete'}</small>
                                </div>
                            ` : ''}
                            <input type="file" id="editProductThumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'الصورة التي تظهر في بطاقة المنتج' : 'Image that appears on product card'}</small>
                        </div>
                        
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية للمنتج' : 'Additional Product Images'}</label>
                            ${(product.images && Array.isArray(product.images) && product.images.length > 0) ? `
                                <div class="current-images-container">
                                    <h5>${currentLanguage === 'ar' ? 'الصور الحالية:' : 'Current Images:'}</h5>
                                    <div class="images-grid">
                                        ${product.images.map(img => `
                                            <div class="current-image">
                                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}">
                                                <button type="button" class="btn-delete-image" onclick="ProductManager.deleteAdditionalImage(${product.id}, ${img.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <input type="file" id="editAdditionalImages" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكنك اختيار عدة صور للمعرض' : 'You can select multiple images for gallery'}</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary js-modal-cancel">
                                ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${currentLanguage === 'ar' ? 'حفظ' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', editForm);
        
        // Get the modal and setup handlers
        const modal = document.getElementById('editProductModal');
        if (modal) {
            // Open modal and disable scroll
            openModalAndDisableScroll(modal, 'editProductForm');
            
            // Setup proper close handlers
            const closeButton = modal.querySelector('.js-modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'editProductForm-close-btn');
                });
            }
            
            const cancelButton = modal.querySelector('.js-modal-cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'editProductForm-cancel-btn');
                });
            }
        }
        
        } catch (error) {
            console.error('Error loading product for edit:', error);
            alert(currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات المنتج' : 'Error loading product data');
        }
    },
    
    closeEditModal: function() {
        const modal = document.getElementById('editProductModal');
        if (modal) {
            closeModalAndRestoreScroll(modal, 'closeEditModal-function');
        }
    },
    
    saveProduct: async function(event, productId) {
        event.preventDefault();
        
        // Helper function to handle null/empty values
        const getValue = (elementId) => {
            const value = document.getElementById(elementId).value;
            return value === '' ? null : parseFloat(value);
        };
        
        const getStringValue = (elementId) => {
            const value = document.getElementById(elementId).value;
            return value === '' ? null : value;
        };
        
        const productData = {
            name: getStringValue('editProductName'),
            taxed_price_store: getValue('editTaxedPriceStore'),
            untaxed_price_store: getValue('editUntaxedPriceStore'),
            taxed_price_client: getValue('editTaxedPriceClient'),
            untaxed_price_client: getValue('editUntaxedPriceClient')
        };
        
        // Check if product name is provided (required field)
        if (!productData.name || productData.name.trim() === '') {
            alert(currentLanguage === 'ar' ? 'يجب إدخال اسم المنتج' : 'Product name is required');
            return;
        }
        
        try {
            let uploadData = productData;
            
            // Handle thumbnail upload if provided
            const thumbnailInput = document.getElementById('editProductThumbnail');
            if (thumbnailInput && thumbnailInput.files && thumbnailInput.files[0]) {
                const thumbnailFile = thumbnailInput.files[0];
                const base64Thumbnail = await this.fileToBase64(thumbnailFile);
                uploadData.thumbnail = base64Thumbnail;
            }
            
            // Handle additional images if provided
            const additionalImagesInput = document.getElementById('editAdditionalImages');
            if (additionalImagesInput && additionalImagesInput.files && additionalImagesInput.files.length > 0) {
                const additionalImages = [];
                
                for (let i = 0; i < additionalImagesInput.files.length; i++) {
                    const file = additionalImagesInput.files[i];
                    const base64Image = await this.fileToBase64(file);
                    additionalImages.push({
                        filename: file.name,
                        data: base64Image
                    });
                }
                
                uploadData.additional_images = additionalImages;
            }
            
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(uploadData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully');
                this.closeEditModal();
                this.loadProducts(); // Refresh the products list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                alert(result.message || (currentLanguage === 'ar' ? 'فشل في تحديث المنتج' : 'Failed to update product'));
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },
    
    // Helper function to convert file to base64
    fileToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data:image/jpeg;base64, part
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    },
    
    viewExpanded: async function(productId) {
        // Show loading modal first
        let expandedModal = document.getElementById('expandedModal');
        if (!expandedModal) {
            expandedModal = document.createElement('div');
            expandedModal.id = 'expandedModal';
            expandedModal.className = 'expanded-modal';
            document.body.appendChild(expandedModal);
        }
        
        // Show loading state
        expandedModal.innerHTML = `
            <div class="expanded-content">
                <button class="js-modal-close">&times;</button>
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${currentLanguage === 'ar' ? 'جاري تحميل بيانات المنتج...' : 'Loading product data...'}</p>
                </div>
            </div>
        `;
        expandedModal.classList.add('active');
        ScrollManager.disableScroll();
        
        // Fetch FULL product details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                expandedModal.innerHTML = `
                    <div class="expanded-content">
                        <button class="js-modal-close">&times;</button>
                        <p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل بيانات المنتج' : 'Failed to load product data'}</p>
                    </div>
                `;
                
                // Setup close handler for error state
                const closeBtn = expandedModal.querySelector('.js-modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        closeModalAndRestoreScroll(expandedModal, 'viewExpanded-error-close');
                    });
                }
                return;
            }
            
            const product = await response.json();
            console.log('Product loaded for viewing:', product);
        
        // Get thumbnail image (now we have it loaded!)
        const thumbnailImage = product.thumbnail 
            ? `<img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">`
            : product.name.charAt(0).toUpperCase();
        
        // Build gallery images (now loaded immediately!)
        let galleryHtml = '';
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            galleryHtml = `
                <div class="image-gallery additional-images-section">
                    <h4 class="gallery-title">${currentLanguage === 'ar' ? 'معرض الصور' : 'Image Gallery'} (${product.images.length})</h4>
                    <div class="gallery-grid">
                        ${product.images.map((img, index) => `
                            <div class="gallery-item" onclick="ProductManager.viewProductImages(${product.id}, ${index + 1})">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename || product.name}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Set modal content
        expandedModal.innerHTML = `
            <div class="expanded-content">
                <button class="js-modal-close">&times;</button>
                
                <div class="expanded-header">
                    <div class="expanded-image-large" onclick="ProductManager.viewProductImages(${product.id}, 0)">
                        ${thumbnailImage}
                        <div class="image-overlay">
                            <span>🔍</span>
                        </div>
                    </div>
                    <h2 class="expanded-title">${product.name}</h2>
                </div>
                
                <div class="expanded-details">
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر العميل (مع الضريبة)' : 'Client Price (With Tax)'}</div>
                        <div class="detail-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون ضريبة)' : 'Client Price (No Tax)'}</div>
                        <div class="detail-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر المحل (مع الضريبة)' : 'Store Price (With Tax)'}</div>
                        <div class="detail-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون ضريبة)' : 'Store Price (No Tax)'}</div>
                        <div class="detail-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                </div>
                
                ${galleryHtml}
            </div>
        `;
        
        // Setup proper close handlers
        const closeButton = expandedModal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(expandedModal, 'viewExpanded-close-btn');
            });
        }
        
        // Close modal when clicking outside
        expandedModal.addEventListener('click', function(e) {
            if (e.target === expandedModal) {
                closeModalAndRestoreScroll(expandedModal, 'viewExpanded-overlay-click');
            }
        });
        
        } catch (error) {
            console.error('Error loading product for expanded view:', error);
            expandedModal.innerHTML = `
                <div class="expanded-content">
                    <button class="js-modal-close">&times;</button>
                    <p class="error-text">${currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات المنتج' : 'Error loading product data'}</p>
                </div>
            `;
            
            // Setup close handler for error state
            const closeBtn = expandedModal.querySelector('.js-modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    closeModalAndRestoreScroll(expandedModal, 'viewExpanded-error-close');
                });
            }
        }
    },
    
    closeExpanded: function() {
        const expandedModal = document.getElementById('expandedModal');
        if (expandedModal) {
            expandedModal.classList.remove('active');
            closeModalAndRestoreScroll(expandedModal, 'closeExpanded-function');
        }
    },
    
    viewImageFullscreen: function(imageSrc, altText, imagesList = null, currentIndex = 0) {
        // Create fullscreen image modal
        let fullscreenModal = document.getElementById('fullscreenImageModal');
        if (!fullscreenModal) {
            fullscreenModal = document.createElement('div');
            fullscreenModal.id = 'fullscreenImageModal';
            fullscreenModal.className = 'fullscreen-image-modal';
            document.body.appendChild(fullscreenModal);
        }
        
        // Store images list for navigation
        this.currentImagesList = imagesList || [{ src: imageSrc, alt: altText }];
        this.currentImageIndex = currentIndex;
        
        const hasMultipleImages = this.currentImagesList.length > 1;
        
        fullscreenModal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="ProductManager.closeFullscreenImage()">&times;</button>
                ${hasMultipleImages ? `
                    <button class="nav-btn prev-btn" onclick="ProductManager.showPreviousImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="nav-btn next-btn" onclick="ProductManager.showNextImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                ` : ''}
                <img src="${imageSrc}" alt="${altText}">
                <div class="image-info">
                    <div class="image-title">${altText}</div>
                    ${hasMultipleImages ? `<div class="image-counter">${currentIndex + 1} / ${this.currentImagesList.length}</div>` : ''}
                </div>
            </div>
        `;
        
        fullscreenModal.classList.add('active');
        ScrollManager.disableScroll();
        
        // Close on overlay click
        fullscreenModal.addEventListener('click', function(e) {
            if (e.target === fullscreenModal) {
                ProductManager.closeFullscreenImage();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    },
    
    showPreviousImage: function() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else {
            this.currentImageIndex = this.currentImagesList.length - 1;
        }
        this.updateFullscreenImage();
    },
    
    showNextImage: function() {
        if (this.currentImageIndex < this.currentImagesList.length - 1) {
            this.currentImageIndex++;
        } else {
            this.currentImageIndex = 0;
        }
        this.updateFullscreenImage();
    },
    
    updateFullscreenImage: function() {
        const currentImage = this.currentImagesList[this.currentImageIndex];
        const modal = document.getElementById('fullscreenImageModal');
        const img = modal.querySelector('img');
        const title = modal.querySelector('.image-title');
        const counter = modal.querySelector('.image-counter');
        
        img.src = currentImage.src;
        img.alt = currentImage.alt;
        title.textContent = currentImage.alt;
        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.currentImagesList.length}`;
        }
    },
    
    handleKeyNavigation: function(e) {
        if (!document.getElementById('fullscreenImageModal').classList.contains('active')) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                this.showNextImage();
                break;
            case 'Escape':
                this.closeFullscreenImage();
                break;
        }
    },
    
    closeFullscreenImage: function() {
        const fullscreenModal = document.getElementById('fullscreenImageModal');
        if (fullscreenModal) {
            fullscreenModal.classList.remove('active');
            ScrollManager.enableScroll();
        }
        
        // Clean up keyboard event listener
        document.removeEventListener('keydown', this.handleKeyNavigation.bind(this));
    },
    
    viewProductImages: function(productId, startIndex = 0) {
        // Find the product data
        const products = this.currentProducts || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            console.error('Product not found for fullscreen viewing');
            return;
        }
        
        // Build images list starting with thumbnail
        const imagesList = [];
        
        // Add thumbnail as first image
        if (product.thumbnail) {
            imagesList.push({
                src: `data:image/jpeg;base64,${product.thumbnail}`,
                alt: `${product.name} - ${currentLanguage === 'ar' ? 'الصورة الرئيسية' : 'Main Image'}`
            });
        } else {
            imagesList.push({
                src: '/logo.png',
                alt: `${product.name} - ${currentLanguage === 'ar' ? 'الصورة الافتراضية' : 'Default Logo'}`
            });
        }
        
        // Add additional images
        if (product.images && product.images.length > 0) {
            product.images.forEach(img => {
                imagesList.push({
                    src: `data:image/jpeg;base64,${img.data}`,
                    alt: img.filename || `${product.name} - ${currentLanguage === 'ar' ? 'صورة إضافية' : 'Additional Image'}`
                });
            });
        }
        
        // Open fullscreen viewer
        if (imagesList.length > 0) {
            const currentImage = imagesList[startIndex];
            this.viewImageFullscreen(currentImage.src, currentImage.alt, imagesList, startIndex);
        }
    },
    
    openAddModal: function() {
        const modal = document.getElementById('addProductModal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form class="edit-product-form" onsubmit="ProductManager.saveNewProduct(event)">
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'اسم المنتج' : 'Product Name'}</label>
                        <input type="text" id="newProductName" required placeholder="${currentLanguage === 'ar' ? 'أدخل اسم المنتج' : 'Enter product name'}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر العميل (مع)' : 'Client Price (With Tax)'}</label>
                            <input type="number" step="0.01" id="newTaxedPriceStore" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</label>
                            <input type="number" step="0.01" id="newUntaxedPriceStore" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر المحل (مع)' : 'Store Price (With Tax)'}</label>
                            <input type="number" step="0.01" id="newTaxedPriceClient" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</label>
                            <input type="number" step="0.01" id="newUntaxedPriceClient" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'الصورة الرئيسية (المصغرة)' : 'Main Thumbnail Image'}</label>
                        <input type="file" id="newProductThumbnail" accept="image/*">
                        <small class="form-help">${currentLanguage === 'ar' ? 'الصورة التي تظهر في بطاقة المنتج' : 'Image that appears on product card'}</small>
                    </div>
                    
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'صور إضافية للمنتج' : 'Additional Product Images'}</label>
                        <input type="file" id="newAdditionalImages" accept="image/*" multiple>
                        <small class="form-help">${currentLanguage === 'ar' ? 'يمكنك اختيار عدة صور للمعرض' : 'You can select multiple images for gallery'}</small>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة المنتج' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'addProductForm');
        
        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addProductForm-close-btn');
            });
        }
        
        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addProductForm-cancel-btn');
            });
        }
    },
    
    closeAddModal: function() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            closeModalAndRestoreScroll(modal, 'closeAddModal-function');
        }
    },
    
    saveNewProduct: async function(event) {
        event.preventDefault();
        
        const productData = {
            name: document.getElementById('newProductName').value,
            taxed_price_store: parseFloat(document.getElementById('newTaxedPriceStore').value) || null,
            untaxed_price_store: parseFloat(document.getElementById('newUntaxedPriceStore').value) || null,
            taxed_price_client: parseFloat(document.getElementById('newTaxedPriceClient').value) || null,
            untaxed_price_client: parseFloat(document.getElementById('newUntaxedPriceClient').value) || null
        };
        
        if (!productData.name || productData.name.trim() === '') {
            alert(currentLanguage === 'ar' ? 'يجب إدخال اسم المنتج' : 'Product name is required');
            return;
        }
        
        try {
            let uploadData = productData;
            
            // Handle thumbnail upload if provided
            const thumbnailInput = document.getElementById('newProductThumbnail');
            if (thumbnailInput && thumbnailInput.files && thumbnailInput.files[0]) {
                const thumbnailFile = thumbnailInput.files[0];
                const base64Thumbnail = await this.fileToBase64(thumbnailFile);
                uploadData.thumbnail = base64Thumbnail;
            }
            
            // Handle additional images if provided
            const additionalImagesInput = document.getElementById('newAdditionalImages');
            if (additionalImagesInput && additionalImagesInput.files && additionalImagesInput.files.length > 0) {
                const additionalImages = [];
                
                for (let i = 0; i < additionalImagesInput.files.length; i++) {
                    const file = additionalImagesInput.files[i];
                    const base64Image = await this.fileToBase64(file);
                    additionalImages.push({
                        filename: file.name,
                        data: base64Image
                    });
                }
                
                uploadData.additional_images = additionalImages;
            }
            
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(uploadData)
            });
            
            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully');
                this.closeAddModal();
                this.loadProducts(); // Refresh the products list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                alert(currentLanguage === 'ar' ? 'خطأ في إضافة المنتج' : 'Error adding product: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },
    
    deleteProduct: async function(productId) {
        const confirmMessage = currentLanguage === 'ar' ? 
            'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.' : 
            'Are you sure you want to delete this product? This action cannot be undone.';
        
        if (confirm(confirmMessage)) {
            try {
                console.log(`Attempting to delete product ${productId}`);
                
                const token = localStorage.getItem('authToken');
                console.log('Token exists:', !!token);
                console.log('Token length:', token ? token.length : 0);
                
                if (!token) {
                    alert(currentLanguage === 'ar' ? 'يجب تسجيل الدخول مرة أخرى' : 'Please login again');
                    window.location.href = '/login';
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const successMessage = currentLanguage === 'ar' ? 
                        'تم حذف المنتج بنجاح' : 
                        'Product deleted successfully';
                    
                    alert(successMessage);
                    console.log(`Product ${productId} deleted successfully`);
                    
                    // Reload the products list to reflect the deletion
                    this.loadProducts();
                    loadDashboardData(); // Refresh dashboard counts
                    
                } else {
                    const errorData = await response.json();
                    
                    // Handle specific token errors
                    if (response.status === 401 && (errorData.message.includes('Token') || errorData.message.includes('expired') || errorData.message.includes('invalid'))) {
                        console.log('Token error detected, redirecting to login');
                        alert(currentLanguage === 'ar' ? 'انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مرة أخرى' : 'Session expired, please login again');
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userInfo');
                        window.location.href = '/login';
                        return;
                    }
                    
                    const errorMessage = currentLanguage === 'ar' ? 
                        'خطأ في حذف المنتج: ' + (errorData.message || 'حدث خطأ غير معروف') : 
                        'Error deleting product: ' + (errorData.message || 'Unknown error occurred');
                    
                    alert(errorMessage);
                    console.error('Delete product error:', errorData);
                }
                
            } catch (error) {
                console.error('Error deleting product:', error);
                const errorMessage = currentLanguage === 'ar' ? 
                    'فشل في حذف المنتج. تحقق من اتصال الإنترنت.' : 
                    'Failed to delete product. Please check your internet connection.';
                
                alert(errorMessage);
            }
        }
    },
    
    // Image deletion functions
    deleteThumbnail: async function(productId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف الصورة الرئيسية؟' : 'Are you sure you want to delete the thumbnail?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/thumbnail`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة الرئيسية بنجاح' : 'Thumbnail deleted successfully');
                // Refresh the product data and close the modal
                this.loadProducts();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting thumbnail:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
        }
    },
    
    deleteAdditionalImage: async function(productId, imageId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/images/${imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully');
                // Refresh the product data and close the modal
                this.loadProducts();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
        }
    },
    
    addLoadMoreButton: function(type) {
        /**Add load more button at the bottom of the list*/
        const listElement = document.getElementById(`${type}List`);
        if (!listElement) return;
        
        // Remove existing load more button
        const existingButton = listElement.querySelector('.load-more-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Add load more button if there are more items (ProductManager only checks hasMoreProducts)
        if (this.hasMoreProducts) {
            const button = document.createElement('div');
            button.className = 'load-more-button';
            button.innerHTML = `
                <button class="btn btn-secondary load-more-btn" onclick="ProductManager.loadMoreProducts()">
                    <div class="loading-spinner" style="display: none;">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <span class="button-text">${currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More'}</span>
                </button>
            `;
            listElement.appendChild(button);
            
            // Setup Intersection Observer to auto-load when button comes into view
            this.setupLoadMoreObserver(button, type);
        }
    },
    
    setupLoadMoreObserver: function(button, type) {
        /**Setup Intersection Observer to auto-click load more when it comes into view (OPTIONAL - button always works manually)*/
        try {
            // Disconnect existing observer if any
            if (this.loadMoreObserver) {
                this.loadMoreObserver.disconnect();
            }
            
            // Create new observer (this is a convenience feature - button works without it)
            this.loadMoreObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Button is visible, auto-click it (but user can still click manually)
                        console.log(`Load more button visible for ${type}, auto-loading...`);
                        const btn = entry.target.querySelector('.load-more-btn');
                        if (btn && !btn.disabled) {
                            // Add small delay to ensure proper rendering
                            setTimeout(() => {
                                if (btn && !btn.disabled) {
                                    btn.click();
                                }
                            }, 100);
                        }
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '100px', // Trigger 100px before button is visible (reduced from 200px for reliability)
                threshold: 0.1
            });
            
            // Start observing
            this.loadMoreObserver.observe(button);
            console.log(`✅ Auto-load observer started for ${type} (button also works manually)`);
        } catch (error) {
            // If observer fails, button still works manually
            console.log(`⚠️ Auto-load observer failed for ${type} (button will work manually only):`, error);
        }
    }
};

// Settings Management Functions
const SettingsManager = {
    currentSettings: {},
    
    loadSettings: async function() {
        try {
            console.log('Loading settings...');
            const response = await fetch(`${API_BASE_URL}/settings`, {
                headers: getAuthHeaders()
            });
            console.log('Settings response status:', response.status);
            if (response.ok) {
                const settings = await response.json();
                console.log('Settings loaded from server:', settings);
                this.currentSettings = settings;
                this.displaySettings(settings);
            } else {
                console.error('Failed to load settings, status:', response.status);
                this.loadDefaultSettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.loadDefaultSettings();
        }
    },
    
    loadDefaultSettings: function() {
        const defaultSettings = {
            price_tolerance: 1.00
        };
        this.currentSettings = defaultSettings;
        this.displaySettings(defaultSettings);
    },
    
    displaySettings: function(settings) {
        console.log('Displaying settings:', settings);
        const priceToleranceInput = document.getElementById('priceTolerance');
        console.log('Price tolerance input found:', !!priceToleranceInput);
        if (priceToleranceInput) {
            // Handle both old format (direct value) and new format (object with value property)
            let toleranceValue = 1.00;
            if (settings.price_tolerance) {
                console.log('Price tolerance setting found:', settings.price_tolerance);
                if (typeof settings.price_tolerance === 'object' && settings.price_tolerance.value) {
                    toleranceValue = parseFloat(settings.price_tolerance.value);
                    console.log('Using object format, value:', toleranceValue);
                } else if (typeof settings.price_tolerance === 'string' || typeof settings.price_tolerance === 'number') {
                    toleranceValue = parseFloat(settings.price_tolerance);
                    console.log('Using direct format, value:', toleranceValue);
                }
            } else {
                console.log('No price_tolerance setting found, using default');
            }
            priceToleranceInput.value = toleranceValue;
            console.log('Set price tolerance input value to:', toleranceValue);
        } else {
            console.error('Price tolerance input not found!');
        }
    },
    
    savePriceTolerance: async function() {
        const priceToleranceInput = document.getElementById('priceTolerance');
        const tolerance = parseFloat(priceToleranceInput.value);
        
        if (isNaN(tolerance) || tolerance < 0) {
            alert(currentLanguage === 'ar' ? 'يرجى إدخال قيمة صحيحة لتسامح السعر' : 'Please enter a valid price tolerance value');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/settings/price-tolerance`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ price_tolerance: tolerance })
            });
            
            if (response.ok) {
                this.currentSettings.price_tolerance = tolerance;
                alert(currentLanguage === 'ar' ? 'تم حفظ إعدادات التسعير بنجاح' : 'Pricing settings saved successfully');
            } else {
                const errorData = await response.json();
                alert(currentLanguage === 'ar' ? 'خطأ في حفظ الإعدادات' : 'Error saving settings: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving price tolerance:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        }
    },
    
    getPriceTolerance: function() {
        if (this.currentSettings.price_tolerance) {
            if (typeof this.currentSettings.price_tolerance === 'object' && this.currentSettings.price_tolerance.value) {
                return parseFloat(this.currentSettings.price_tolerance.value);
            } else if (typeof this.currentSettings.price_tolerance === 'string' || typeof this.currentSettings.price_tolerance === 'number') {
                return parseFloat(this.currentSettings.price_tolerance);
            }
        }
        return 1.00;
    }
};

// Report Management Functions
const ReportManager = {
    currentReports: [],
    
    showAddReportForm: function() {
        // Create comprehensive add visit report modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Load predefined notes
        this.loadPredefinedNotes();
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة تقرير زيارة جديد' : 'Add New Visit Report'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form id="addReportForm" onsubmit="ReportManager.saveNewReport(event)">
                    
                    <!-- Basic Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات الزيارة الأساسية' : 'Basic Visit Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'العميل' : 'Client'} *</label>
                                <div class="searchable-select" id="clientSelectContainer">
                                    <input type="text" 
                                           class="searchable-input" 
                                           id="clientSearchInput"
                                           placeholder="${currentLanguage === 'ar' ? 'ابحث عن العميل...' : 'Search for client...'}"
                                           autocomplete="off"
                                           required>
                                    <div class="searchable-dropdown" id="clientDropdown">
                                        <div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر العميل' : 'Select Client'}</div>
                                    </div>
                                    <input type="hidden" name="client_id" id="selectedClientId">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'تاريخ الزيارة' : 'Visit Date'} *</label>
                                <input type="date" name="visit_date" required>
                            </div>
                        </div>
                        
                        <!-- Client Last Report Summary -->
                        <div id="clientSummaryContainer" class="client-summary-container" style="display: none;">
                            <div class="client-summary-header">
                                <h5>${currentLanguage === 'ar' ? 'ملخص آخر تقرير للعميل' : 'Client Last Report Summary'}</h5>
                            </div>
                            <div id="clientSummaryContent" class="client-summary-content">
                                <!-- Summary content will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Visit Images Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'صور الزيارة' : 'Visit Images'}</h4>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور من الزيارة' : 'Photos from Visit'}</label>
                            <input type="file" name="visit_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكن اختيار عدة صور من الزيارة' : 'You can select multiple photos from the visit'}</small>
                        </div>
                    </div>

                    <!-- Suggested Products Images Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'صور المنتجات المقترحة' : 'Suggested Products Images'}</h4>
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" name="has_suggested_products" id="hasSuggestedProductsCheckbox" onchange="ReportManager.toggleSuggestedProductsImages(this)">
                                ${currentLanguage === 'ar' ? 'إضافة صور للمنتجات المقترحة' : 'Add suggested products images'}
                            </label>
                        </div>
                        <div class="form-group suggested-products-section" id="suggestedProductsSection" style="display: none;">
                            <label>${currentLanguage === 'ar' ? 'صور المنتجات المقترحة' : 'Suggested Products Images'}</label>
                            <input type="file" name="suggested_products_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكن اختيار عدة صور للمنتجات المقترحة' : 'You can select multiple images for suggested products'}</small>
                        </div>
                    </div>

                    <!-- Products Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'منتجات الزيارة' : 'Visit Products'}</h4>
                        <div id="productsContainer">
                            <div class="form-group product-group">
                                <div class="product-header">
                                    <label>${currentLanguage === 'ar' ? 'منتج' : 'Product'} 1</label>
                                    <button type="button" class="remove-product-btn" onclick="ReportManager.removeProduct(this)" style="display: none;">
                                        ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
                                    </button>
                                </div>
                                <div class="product-fields">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</label>
                                            <div class="searchable-select product-select-container">
                                                <input type="text" 
                                                       class="searchable-input product-search-input" 
                                                       placeholder="${currentLanguage === 'ar' ? 'ابحث عن المنتج...' : 'Search for product...'}"
                                                       autocomplete="off">
                                                <div class="searchable-dropdown product-dropdown">
                                                    <div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</div>
                                                </div>
                                                <input type="hidden" name="products[0][product_id]" class="selected-product-id">
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label>${currentLanguage === 'ar' ? 'السعر المعروض' : 'Displayed Price'}</label>
                                            <input type="number" name="products[0][displayed_price]" step="0.01" min="0" placeholder="0.00">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group checkbox-group">
                                            <label>
                                                <input type="checkbox" name="products[0][nearly_expired]" onchange="ReportManager.toggleExpiryDate(this)">
                                                ${currentLanguage === 'ar' ? 'منتهي أو قارب على الانتهاء' : 'Expired or Nearly Expired'}
                                            </label>
                                        </div>
                                        <div class="form-group expiry-group" style="display: none;">
                                            <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                                            <input type="date" name="products[0][expiry_date]">
                                        </div>
                                        <div class="form-group expiry-group" style="display: none;">
                                            <label>${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Units Count'}</label>
                                            <input type="number" name="products[0][units_count]" min="1" placeholder="${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Number of units'}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="ReportManager.addProduct()">
                            ${currentLanguage === 'ar' ? '+ إضافة منتج' : '+ Add Product'}
                        </button>
                    </div>

                    <!-- Predefined Notes Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'الملاحظات المحددة مسبقاً' : 'Predefined Notes'}</h4>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'اختر سؤال محدد مسبقاً' : 'Select Predefined Question'}</label>
                            <select id="predefinedQuestionSelect" onchange="ReportManager.handlePredefinedQuestionChange()">
                                <option value="">${currentLanguage === 'ar' ? '-- اختر سؤال --' : '-- Select Question --'}</option>
                            </select>
                        </div>
                        <div id="predefinedAnswersContainer">
                            <!-- Predefined answers will be added here -->
                        </div>
                    </div>

                    <!-- Notes Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'ملاحظات الزيارة' : 'Visit Notes'}</h4>
                        <div id="notesContainer">
                            <div class="form-group note-group">
                                <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</label>
                                <textarea name="notes[]" rows="3" placeholder="${currentLanguage === 'ar' ? 'اكتب ملاحظة عن الزيارة...' : 'Write a note about the visit...'}"></textarea>
                                <button type="button" class="remove-note-btn" onclick="ReportManager.removeNote(this)" style="display: none;">
                                    ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
                                </button>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="ReportManager.addNote()">
                            ${currentLanguage === 'ar' ? '+ إضافة ملاحظة' : '+ Add Note'}
                        </button>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة التقرير' : 'Add Report'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'addReportForm');
        
        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addReportForm-close-btn');
            });
        }
        
        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addReportForm-cancel-btn');
            });
        }
        
        // Load clients and products for the dropdowns
        this.loadClientsForDropdown();
        this.loadProductsForDropdown();
    },
    
    loadReports: async function(statusFilter = 'active') {
        try {
            // Show loading state immediately (Arabic/English)
            const reportsList = document.getElementById('reportsList');
            const loadingText = currentLanguage === 'ar' ? 'جاري تحميل التقارير...' : 'Loading reports...';
            reportsList.innerHTML = `
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${loadingText}</p>
                </div>
            `;
            
            // Use lightweight list endpoint for FAST loading (metadata only, no images)
            let apiUrl = `${API_BASE_URL}/visit-reports/list`;
            if (statusFilter === 'all' || statusFilter === 'inactive') {
                apiUrl += '?show_all=true';
            }
            
            console.log('Loading reports from:', apiUrl);
            console.log('Auth headers:', getAuthHeaders());
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                let reports = data.reports || data; // Handle both old and new format
                
                // Client-side filtering based on status
                if (statusFilter === 'active') {
                    reports = reports.filter(report => report.is_active !== false);
                } else if (statusFilter === 'inactive') {
                    reports = reports.filter(report => report.is_active === false);
                }
                // 'all' shows everything as loaded
                
                this.currentReports = reports;
                this.currentStatusFilter = statusFilter;
                
                // Display cards immediately (without images)
                this.displayReportsLazy(reports);
                
                // Store pagination info for infinite scroll
                this.currentReportPage = data.page || 1;
                this.hasMoreReports = data.has_more || false;
                this.totalReports = data.total || reports.length;
                
                console.log(`ReportManager: hasMoreReports = ${this.hasMoreReports}, total = ${this.totalReports}`);
                
                // Add load more button if there are more reports
                this.addLoadMoreButton('reports');
                
                // Note: Infinite scroll now uses Intersection Observer in addLoadMoreButton
                
                // Update status indicator
                this.updateStatusIndicator('reports', statusFilter, this.totalReports);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to load reports:', response.status, errorData);
                reportsList.innerHTML = `<p class="no-data">Error loading reports: ${errorData.message || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            const reportsList = document.getElementById('reportsList');
            reportsList.innerHTML = '<p class="no-data">Error loading visit reports</p>';
        }
    },
    
    filterReports: async function(searchTerm = '') {
        // If search term is provided, use backend search for ALL reports
        if (searchTerm && searchTerm.trim()) {
            await this.searchReports(searchTerm.trim());
        } else {
            // No search term - reload normal reports
            const statusFilter = document.getElementById('reportStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            await this.loadReports(currentStatus);
        }
    },
    
    searchReports: async function(searchTerm) {
        /**Search ALL reports by client name using backend API*/
        try {
            const statusFilter = document.getElementById('reportStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            
            let apiUrl = `${API_BASE_URL}/visit-reports/search?q=${encodeURIComponent(searchTerm)}&page=1&per_page=100`;
            if (currentStatus === 'all' || currentStatus === 'inactive') {
                apiUrl += '&show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const searchResults = data.reports || [];
                
                const reportsList = document.getElementById('reportsList');
                if (!reportsList) return;
                
                // Display results
                if (searchResults.length === 0) {
                    reportsList.innerHTML = `
                        <div class="empty-state">
                            <h3>${currentLanguage === 'ar' ? 'لم يتم العثور على تقارير' : 'No reports found'}</h3>
                            <p>${currentLanguage === 'ar' ? 'لا توجد تقارير تطابق بحثك' : 'No reports match your search'}</p>
                        </div>
                    `;
                } else {
                    // Store and display search results
                    this.currentReports = searchResults;
                    this.totalReports = data.total;
                    this.displayReports(searchResults, false);
                }
                
                // --- FIX: Disable infinite scroll for search results ---
                const loadMoreBtn = document.querySelector('#reportsList .load-more-button');
                if (loadMoreBtn) {
                    loadMoreBtn.remove();
                }
                this.hasMoreReports = false; // Prevent observer from firing
                // -------------------------------------------------------
                
                // Update count
                this.updateStatusIndicator('reports', currentStatus, data.total);
            } else {
                console.error('Failed to search reports');
            }
        } catch (error) {
            console.error('Error searching reports:', error);
        }
    },
    
    displayReportsLazy: function(reports, append = false) {
        // Display report cards immediately WITHOUT images (FAST rendering)
        const reportsList = document.getElementById('reportsList');
        if (reports.length === 0 && !append) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد تقارير' : 'No Reports'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة تقرير زيارة جديد' : 'Start by adding a new visit report'}</p>
                </div>
            `;
        } else {
            // Use old displayReports function for consistent card design
            this.displayReports(reports, append);
        }
    },
    
    displayReports: function(reports, append = false) {
        const reportsList = document.getElementById('reportsList');
        if (reports.length === 0 && !append) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد تقارير' : 'No Reports'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة تقرير زيارة جديد' : 'Start by adding a new visit report'}</p>
                </div>
            `;
        } else {
            // Display reports cards
            const cardsHTML = reports.map(report => {
                const visitDate = ReportManager.formatReportDate(report.visit_date);
                
                const isInactive = report.is_active === false;
                const cardClass = `report-card ${isInactive ? 'inactive' : ''}`;
                const cardStyle = isInactive ? 'cursor: default; opacity: 0.6;' : 'cursor: pointer;';
                
                return `
                    <div class="${cardClass}" ${!isInactive ? `onclick="ReportManager.viewReport(${report.id})"` : ''} style="${cardStyle}">
                        <div class="report-info">
                            <h3 class="client-name">${report.client_name || (currentLanguage === 'ar' ? 'عميل غير معروف' : 'Unknown Client')}</h3>
                            <div class="visit-date">${visitDate.line1}</div>
                            <div class="visit-date-islamic">${visitDate.line2}</div>
                            ${isInactive ? `<div class="inactive-badge">${currentLanguage === 'ar' ? 'معطل' : 'Inactive'}</div>` : ''}
                            <div class="report-actions" onclick="event.stopPropagation()">
                                ${!isInactive ? `
                                    <button class="btn-icon-stylish print-btn" onclick="ReportManager.printReport(${report.id})" title="${currentLanguage === 'ar' ? 'طباعة' : 'Print'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                                        </svg>
                                    </button>
                                    <button class="btn-icon-stylish delete-btn" onclick="ReportManager.deleteReport(${report.id})" title="${currentLanguage === 'ar' ? 'إلغاء تفعيل' : 'Deactivate'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                ` : `
                                    <button class="btn-icon-stylish reactivate-btn" onclick="ReportManager.reactivateReport(${report.id})" title="${currentLanguage === 'ar' ? 'إعادة تفعيل' : 'Reactivate'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (append) {
                // Append new cards to existing list
                reportsList.insertAdjacentHTML('beforeend', cardsHTML);
            } else {
                // Replace all content
                reportsList.innerHTML = cardsHTML;
            }
        }
    },

    // Format date as: Day - Gregorian (line 1) and Islamic (line 2)
    formatReportDate: function(dateStr) {
        try {
            const parts = String(dateStr).split('/').map(p => parseInt(p, 10));
            const d = (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2]))
                ? new Date(parts[0], parts[1] - 1, parts[2])
                : new Date(dateStr);
            const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(d);
            const greg = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
            const isl = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
            return {
                line1: `${dayName} - ${greg}`,
                line2: isl,
                full: `${dayName} - ${greg} - ${isl}` // For expanded view
            };
        } catch (e) {
            return { line1: dateStr, line2: '', full: dateStr };
        }
    },
    
    loadMoreReports: async function() {
        /**Load next page of reports for infinite scroll*/
        if (!this.hasMoreReports) return;
        
        const button = document.querySelector('.load-more-btn');
        const spinner = button.querySelector('.loading-spinner');
        const buttonText = button.querySelector('.button-text');
        
        // Show loading state
        button.disabled = true;
        spinner.style.display = 'block';
        buttonText.textContent = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';
        
        try {
            const nextPage = this.currentReportPage + 1;
            let apiUrl = `${API_BASE_URL}/visit-reports/list?page=${nextPage}`;
            if (this.currentStatusFilter === 'all' || this.currentStatusFilter === 'inactive') {
                apiUrl += '&show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const newReports = data.reports || data;
                
                // Append new reports to existing list
                this.currentReports = [...this.currentReports, ...newReports];
                
                // Update pagination info
                this.currentReportPage = data.page;
                this.hasMoreReports = data.has_more;
                
                // Display new reports
                this.displayReportsLazy(newReports, true); // true = append mode
                
                // Update load more button
                this.addLoadMoreButton('reports');
            }
        } catch (error) {
            console.error('Error loading more reports:', error);
        } finally {
            // Hide loading state
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More';
        }
    },
    
    loadClientsForDropdown: async function() {
        try {
            // Use ultra-lightweight names-only endpoint for maximum speed
            const response = await fetch(`${API_BASE_URL}/clients/names`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const clients = await response.json();
                this.clientsData = clients; // Store for search functionality
                
                const dropdown = document.getElementById('clientDropdown');
                dropdown.innerHTML = `<div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر العميل' : 'Select Client'}</div>`;
                clients.forEach(client => {
                    dropdown.innerHTML += `<div class="dropdown-item" data-value="${client.id}">${client.name}</div>`;
                });
                
                this.initializeClientSearch();
            }
        } catch (error) {
            console.error('Error loading clients for dropdown:', error);
        }
    },
    
    loadProductsForDropdown: async function() {
        try {
            // Use ultra-lightweight names-only endpoint for maximum speed
            const response = await fetch(`${API_BASE_URL}/products/names`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const products = await response.json();
                this.productsData = products; // Store for search functionality
                
                const dropdowns = document.querySelectorAll('.product-dropdown');
                dropdowns.forEach(dropdown => {
                    dropdown.innerHTML = `<div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</div>`;
                    products.forEach(product => {
                        dropdown.innerHTML += `<div class="dropdown-item" data-value="${product.id}">${product.name}</div>`;
                    });
                });
                
                this.initializeProductSearch();
            }
        } catch (error) {
            console.error('Error loading products for dropdown:', error);
        }
    },
    
    initializeClientSearch: function() {
        const searchInput = document.getElementById('clientSearchInput');
        const dropdown = document.getElementById('clientDropdown');
        const hiddenInput = document.getElementById('selectedClientId');
        
        if (!searchInput || !dropdown || !hiddenInput) return;
        
        // Handle input focus - show dropdown
        searchInput.addEventListener('focus', () => {
            dropdown.style.display = 'block';
            this.filterClientOptions('');
        });
        
        // Handle search input
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterClientOptions(searchTerm);
            hiddenInput.value = ''; // Clear selection when typing
        });
        
        // Handle item selection
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const value = e.target.getAttribute('data-value');
                const text = e.target.textContent;
                
                searchInput.value = text;
                hiddenInput.value = value;
                dropdown.style.display = 'none';
                
                // Load client summary if a client is selected
                if (value) {
                    console.log('Client selected, loading summary for ID:', value);
                    this.loadClientLastReportSummary(value);
                } else {
                    console.log('No client selected, hiding summary');
                    this.hideClientSummary();
                }
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },
    
    initializeProductSearch: function() {
        const containers = document.querySelectorAll('.product-select-container');
        
        containers.forEach(container => {
            const searchInput = container.querySelector('.product-search-input');
            const dropdown = container.querySelector('.product-dropdown');
            const hiddenInput = container.querySelector('.selected-product-id');
            
            if (!searchInput || !dropdown || !hiddenInput) return;
            
            // Handle input focus - show dropdown
            searchInput.addEventListener('focus', () => {
                dropdown.style.display = 'block';
                this.filterProductOptions(dropdown, '');
            });
            
            // Handle search input
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterProductOptions(dropdown, searchTerm);
                hiddenInput.value = ''; // Clear selection when typing
            });
            
            // Handle item selection
            dropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('dropdown-item')) {
                    const value = e.target.getAttribute('data-value');
                    const text = e.target.textContent;
                    
                    searchInput.value = text;
                    hiddenInput.value = value;
                    dropdown.style.display = 'none';
                    
                    // Refresh all product dropdowns to exclude the newly selected product
                    this.refreshAllProductDropdowns();
                }
            });
            
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        });
    },
    
    filterClientOptions: function(searchTerm) {
        const dropdown = document.getElementById('clientDropdown');
        if (!this.clientsData || !dropdown) return;
        
        dropdown.innerHTML = '';
        
        // Always show "Select Client" option
        const defaultOption = document.createElement('div');
        defaultOption.className = 'dropdown-item';
        defaultOption.setAttribute('data-value', '');
        defaultOption.textContent = currentLanguage === 'ar' ? 'اختر العميل' : 'Select Client';
        dropdown.appendChild(defaultOption);
        
        // Filter and display matching clients
        const filteredClients = this.clientsData.filter(client =>
            client.name.toLowerCase().includes(searchTerm) ||
            (client.region && client.region.toLowerCase().includes(searchTerm))
        );
        
        filteredClients.forEach(client => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.setAttribute('data-value', client.id);
            option.textContent = `${client.name}${client.region ? ` (${client.region})` : ''}`;
            dropdown.appendChild(option);
        });
        
        // Show "No results" if no matches
        if (filteredClients.length === 0 && searchTerm) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item disabled';
            noResults.textContent = currentLanguage === 'ar' ? 'لا توجد نتائج' : 'No results found';
            dropdown.appendChild(noResults);
        }
    },
    
    filterProductOptions: function(dropdown, searchTerm) {
        if (!this.productsData || !dropdown) return;
        
        dropdown.innerHTML = '';
        
        // Always show "Select Product" option
        const defaultOption = document.createElement('div');
        defaultOption.className = 'dropdown-item';
        defaultOption.setAttribute('data-value', '');
        defaultOption.textContent = currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product';
        dropdown.appendChild(defaultOption);
        
        // Get already selected product IDs
        const selectedProductIds = this.getSelectedProductIds();
        
        // Filter and display matching products (excluding already selected ones)
        const filteredProducts = this.productsData.filter(product =>
            product.name.toLowerCase().includes(searchTerm) && 
            !selectedProductIds.includes(product.id)
        );
        
        filteredProducts.forEach(product => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.setAttribute('data-value', product.id);
            option.textContent = product.name;
            dropdown.appendChild(option);
        });
        
        // Show "No results" if no matches
        if (filteredProducts.length === 0 && searchTerm) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item disabled';
            noResults.textContent = currentLanguage === 'ar' ? 'لا توجد نتائج' : 'No results found';
            dropdown.appendChild(noResults);
        }
    },
    
    getSelectedProductIds: function() {
        const selectedIds = [];
        const productGroups = document.querySelectorAll('.product-group');
        
        productGroups.forEach(group => {
            const hiddenInput = group.querySelector('.selected-product-id');
            if (hiddenInput && hiddenInput.value) {
                selectedIds.push(parseInt(hiddenInput.value));
            }
        });
        
        return selectedIds;
    },
    
    addProduct: function() {
        const productsContainer = document.getElementById('productsContainer');
        const productCount = productsContainer.querySelectorAll('.product-group').length;
        
        const productGroup = document.createElement('div');
        productGroup.className = 'form-group product-group';
        productGroup.innerHTML = `
            <div class="product-header">
                <label>${currentLanguage === 'ar' ? 'منتج' : 'Product'} ${productCount + 1}</label>
                <button type="button" class="remove-product-btn" onclick="ReportManager.removeProduct(this)">
                    ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
                </button>
            </div>
            <div class="product-fields">
                <div class="form-row">
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</label>
                        <div class="searchable-select product-select-container">
                            <input type="text" 
                                   class="searchable-input product-search-input" 
                                   placeholder="${currentLanguage === 'ar' ? 'ابحث عن المنتج...' : 'Search for product...'}"
                                   autocomplete="off">
                            <div class="searchable-dropdown product-dropdown">
                                <div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</div>
                            </div>
                            <input type="hidden" name="products[${productCount}][product_id]" class="selected-product-id">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'السعر المعروض' : 'Displayed Price'}</label>
                        <input type="number" name="products[${productCount}][displayed_price]" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="products[${productCount}][nearly_expired]" onchange="ReportManager.toggleExpiryDate(this)">
                            ${currentLanguage === 'ar' ? 'منتهي أو قارب على الانتهاء' : 'Expired or Nearly Expired'}
                        </label>
                    </div>
                    <div class="form-group expiry-group" style="display: none;">
                        <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                        <input type="date" name="products[${productCount}][expiry_date]">
                    </div>
                    <div class="form-group expiry-group" style="display: none;">
                        <label>${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Units Count'}</label>
                        <input type="number" name="products[${productCount}][units_count]" min="1" placeholder="${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Number of units'}">
                    </div>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productGroup);
        this.updateRemoveProductButtons();
        
        // Initialize search for the new product select
        this.initializeProductSearch();
    },
    
    removeProduct: function(button) {
        const productGroup = button.closest('.product-group');
        productGroup.remove();
        this.updateRemoveProductButtons();
        this.renumberProducts();
        
        // Refresh all product dropdowns to show the removed product again
        this.refreshAllProductDropdowns();
    },
    
    refreshAllProductDropdowns: function() {
        const containers = document.querySelectorAll('.product-select-container');
        containers.forEach(container => {
            const dropdown = container.querySelector('.product-dropdown');
            const searchInput = container.querySelector('.product-search-input');
            if (dropdown && searchInput) {
                this.filterProductOptions(dropdown, searchInput.value.toLowerCase());
            }
        });
    },
    
    updateRemoveProductButtons: function() {
        const productGroups = document.querySelectorAll('.product-group');
        productGroups.forEach((group, index) => {
            const removeBtn = group.querySelector('.remove-product-btn');
            if (productGroups.length > 1) {
                removeBtn.style.display = 'inline-block';
            } else {
                removeBtn.style.display = 'none';
            }
        });
    },
    
    renumberProducts: function() {
        const productGroups = document.querySelectorAll('.product-group');
        productGroups.forEach((group, index) => {
            const label = group.querySelector('.product-header label');
            label.textContent = `${currentLanguage === 'ar' ? 'منتج' : 'Product'} ${index + 1}`;
            
            // Update input names to maintain proper indexing
            const hiddenInput = group.querySelector('.selected-product-id');
            const priceInput = group.querySelector('input[type="number"]');
            const checkboxInput = group.querySelector('input[type="checkbox"]');
            const dateInput = group.querySelector('input[type="date"]');
            const unitsInput = group.querySelector('input[name*="units_count"]');
            
            hiddenInput.name = `products[${index}][product_id]`;
            priceInput.name = `products[${index}][displayed_price]`;
            checkboxInput.name = `products[${index}][nearly_expired]`;
            dateInput.name = `products[${index}][expiry_date]`;
            if (unitsInput) unitsInput.name = `products[${index}][units_count]`;
        });
    },
    
    toggleExpiryDate: function(checkbox) {
        const productGroup = checkbox.closest('.product-group');
        const expiryGroups = productGroup.querySelectorAll('.expiry-group');
        const expiryInput = productGroup.querySelector('input[type="date"]');
        const unitsInput = productGroup.querySelector('input[name*="units_count"]');
        
        if (checkbox.checked) {
            expiryGroups.forEach(group => {
                group.style.display = 'block';
                const input = group.querySelector('input');
                if (input) input.required = true;
            });
        } else {
            expiryGroups.forEach(group => {
                group.style.display = 'none';
                const input = group.querySelector('input');
                if (input) {
                    input.required = false;
                    input.value = '';
                }
            });
        }
    },

    toggleSuggestedProductsImages: function(checkbox) {
        const suggestedProductsSection = document.getElementById('suggestedProductsSection');
        const fileInput = suggestedProductsSection.querySelector('input[type="file"]');
        
        if (checkbox.checked) {
            suggestedProductsSection.style.display = 'block';
            fileInput.required = true;
        } else {
            suggestedProductsSection.style.display = 'none';
            fileInput.required = false;
            fileInput.value = '';
        }
    },
    
    addNote: function() {
        const notesContainer = document.getElementById('notesContainer');
        
        const noteGroup = document.createElement('div');
        noteGroup.className = 'form-group note-group';
        noteGroup.innerHTML = `
            <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</label>
            <textarea name="notes[]" rows="3" placeholder="${currentLanguage === 'ar' ? 'اكتب ملاحظة عن الزيارة...' : 'Write a note about the visit...'}"></textarea>
            <button type="button" class="remove-note-btn" onclick="ReportManager.removeNote(this)">
                ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
            </button>
        `;
        
        notesContainer.appendChild(noteGroup);
        this.updateRemoveButtons();
    },
    
    removeNote: function(button) {
        const noteGroup = button.closest('.note-group');
        noteGroup.remove();
        this.updateRemoveButtons();
        this.renumberNotes();
        
        // Refresh predefined questions dropdown if it exists
        if (document.getElementById('predefinedQuestionSelect')) {
            this.populatePredefinedQuestions();
        }
    },
    
    updateRemoveButtons: function() {
        const noteGroups = document.querySelectorAll('.note-group');
        noteGroups.forEach((group, index) => {
            const removeBtn = group.querySelector('.remove-note-btn');
            if (noteGroups.length > 1) {
                removeBtn.style.display = 'inline-block';
            } else {
                removeBtn.style.display = 'none';
            }
        });
    },
    
    renumberNotes: function() {
        const noteGroups = document.querySelectorAll('.note-group');
        noteGroups.forEach((group, index) => {
            const label = group.querySelector('label');
            label.textContent = `${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}`;
        });
    },
    
    convertToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    },
    
    saveNewReport: async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Collect basic report data
        const reportData = {
            client_id: parseInt(formData.get('client_id')),
            visit_date: formData.get('visit_date')
        };
        
        // Handle visit images
        const imageFiles = formData.getAll('visit_images');
        if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
            const images = [];
            for (let file of imageFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        images.push({
                            filename: file.name,
                            data: base64,
                            is_suggested_products: false
                        });
                    } catch (error) {
                        console.error('Error converting visit image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (images.length > 0) {
                reportData.images = images;
            }
        }

        // Handle suggested products images
        const suggestedProductsFiles = formData.getAll('suggested_products_images');
        if (suggestedProductsFiles && suggestedProductsFiles.length > 0 && suggestedProductsFiles[0].size > 0) {
            const suggestedImages = [];
            for (let file of suggestedProductsFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        suggestedImages.push({
                            filename: file.name,
                            data: base64,
                            is_suggested_products: true
                        });
                    } catch (error) {
                        console.error('Error converting suggested products image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (suggestedImages.length > 0) {
                // Add suggested products images to the main images array
                if (!reportData.images) {
                    reportData.images = [];
                }
                reportData.images = reportData.images.concat(suggestedImages);
            }
        }
        
        // Handle products
        const productGroups = form.querySelectorAll('.product-group');
        const products = [];
        productGroups.forEach(group => {
            const productIdInput = group.querySelector('.selected-product-id');
            const priceInput = group.querySelector('input[name*="displayed_price"]');
            const nearlyExpiredCheckbox = group.querySelector('input[name*="nearly_expired"]');
            const expiryDateInput = group.querySelector('input[name*="expiry_date"]');
            const unitsCountInput = group.querySelector('input[name*="units_count"]');
            
            if (productIdInput.value) {
                const product = {
                    product_id: parseInt(productIdInput.value),
                    displayed_price: priceInput.value ? parseFloat(priceInput.value) : null,
                    nearly_expired: nearlyExpiredCheckbox.checked,
                    expiry_date: nearlyExpiredCheckbox.checked && expiryDateInput.value ? expiryDateInput.value : null,
                    units_count: nearlyExpiredCheckbox.checked && unitsCountInput.value ? parseInt(unitsCountInput.value) : null
                };
                products.push(product);
            }
        });
        if (products.length > 0) {
            reportData.products = products;
        }
        
        // Handle notes
        const noteTexts = Array.from(form.querySelectorAll('textarea[name="notes[]"]'))
                               .map(textarea => textarea.value.trim())
                               .filter(text => text.length > 0);
        if (noteTexts.length > 0) {
            reportData.notes = noteTexts;
        }
        
        console.log('Creating new visit report with data:', reportData);
        
        try {
            const response = await fetch(`${API_BASE_URL}/visit-reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                alert(currentLanguage === 'ar' ? 'تم إضافة التقرير بنجاح' : 'Visit report added successfully');
                form.closest('.modal-overlay').remove();
                this.loadReports(); // Refresh the reports list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(currentLanguage === 'ar' ? 'خطأ في إضافة التقرير' : 'Error adding report: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error adding report:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        }
    },
    
        viewReport: async function(reportId) {
            const report = this.currentReports.find(r => r.id === reportId);
            if (!report) return;
            
            const visitDate = ReportManager.formatReportDate(report.visit_date);
            
            // Create detailed view modal
            const modal = document.createElement('div');
            modal.className = 'expanded-modal';
            modal.innerHTML = `
                <div class="expanded-content">
                    <button class="js-modal-close">&times;</button>
                    
                    <div class="expanded-header">
                        <div class="expanded-title">
                            <h2>${report.client_name}</h2>
                            <p class="visit-date">${visitDate.full}</p>
                        </div>
                    </div>
                
                <div class="expanded-details">
                    ${report.products && report.products.length > 0 ? `
                        <div class="detail-section">
                            <h3>${currentLanguage === 'ar' ? 'منتجات الزيارة' : 'Visit Products'}</h3>
                            <div class="products-list">
                                ${report.products.map((product, index) => {
                                    // Check if displayed price matches our internal store price within tolerance
                                    // Tolerance only applies when displayed price is LESS than our price
                                    // If displayed price is HIGHER than our price, it's always a mismatch (no tolerance)
                                    const storePrice = product.taxed_price_store;
                                    const displayedPrice = product.displayed_price;
                                    const tolerance = SettingsManager.getPriceTolerance();
                                    
                                    let priceMatches = true;
                                    if (storePrice && displayedPrice) {
                                        if (displayedPrice > storePrice) {
                                            // Displayed price is higher than ours - ALWAYS a mismatch
                                            priceMatches = false;
                                        } else {
                                            // Displayed price is lower - allow tolerance
                                            priceMatches = (storePrice - displayedPrice) <= tolerance;
                                        }
                                    }
                                    const priceStyle = storePrice && displayedPrice && !priceMatches ? 'color: #e74c3c; font-weight: bold;' : '';
                                    
                                    return `
                                        <div class="product-item">
                                            <div class="product-header">
                                                <h4>${product.product_name || (currentLanguage === 'ar' ? 'منتج غير معروف' : 'Unknown Product')}</h4>
                                                ${product.nearly_expired ? `<span class="expired-badge">${currentLanguage === 'ar' ? 'منتهي أو قارب على الانتهاء' : 'Expired or Nearly Expired'}</span>` : ''}
                                            </div>
                                            <div class="product-details">
                                                ${product.displayed_price ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'السعر المعروض:' : 'Displayed Price:'}</label>
                                                        <span style="${priceStyle}">${product.displayed_price} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</span>
                                                    </div>
                                                ` : ''}
                                                ${product.taxed_price_store ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'سعرنا الداخلي (شامل الضريبة):' : 'Our Internal Price (Taxed):'}</label>
                                                        <span style="${priceStyle}">${product.taxed_price_store} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</span>
                                                    </div>
                                                ` : ''}
                                                ${storePrice && displayedPrice && !priceMatches ? `
                                                    <div class="price-mismatch-alert">
                                                        <span>${currentLanguage === 'ar' ? '⚠️ السعر المعروض لا يطابق سعرنا الداخلي' : '⚠️ Displayed price does not match our internal price'}</span>
                                                    </div>
                                                ` : ''}
                                                ${product.expiry_date ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء (ميلادي/هجري):' : 'Expiry (Greg/Islamic):'}</label>
                                                        <span>${ReportManager.formatReportDate(product.expiry_date)}</span>
                                                    </div>
                                                ` : ''}
                                                ${product.units_count ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'عدد الوحدات:' : 'Units Count:'}</label>
                                                        <span>${product.units_count}</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${report.notes && report.notes.length > 0 ? `
                        <div class="detail-section">
                            <h3>${currentLanguage === 'ar' ? 'ملاحظات الزيارة' : 'Visit Notes'}</h3>
                            <div class="notes-list">
                                ${report.notes.map((note, index) => `
                                    <div class="note-item">
                                        <div class="note-header">${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</div>
                                        <div class="note-text">${note.note_text}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${report.image_count > 0 ? `
                        <div class="detail-section" id="images-section-${report.id}">
                            <h3>${currentLanguage === 'ar' ? 'صور الزيارة' : 'Visit Images'} (${report.image_count})</h3>
                            <div class="image-gallery">
                                <div class="modern-spinner">
                                    <div class="spinner-ring"></div>
                                    <div class="spinner-ring"></div>
                                    <div class="spinner-ring"></div>
                                </div>
                                <p class="loading-text">${currentLanguage === 'ar' ? 'جاري تحميل الصور...' : 'Loading images...'}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="expanded-actions">
                    <button class="btn btn-secondary js-modal-cancel">
                        ${currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        `;
        
        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'viewReportForm');
        
        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewReport-close-btn');
            });
        }
        
        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewReport-cancel-btn');
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModalAndRestoreScroll(modal, 'viewReport-overlay-click');
            }
        });
        
        // Lazy load images after modal is displayed
        if (report.image_count > 0) {
            this.loadReportImages(reportId);
        }
    },
    
    loadReportImages: async function(reportId) {
        try {
            const response = await fetch(`${API_BASE_URL}/visit-reports/${reportId}/images`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const imagesSection = document.getElementById(`images-section-${reportId}`);
                
                if (imagesSection && data.images) {
                    // Replace loading spinner with actual images
                    const galleryDiv = imagesSection.querySelector('.image-gallery');
                    galleryDiv.innerHTML = `
                        <div class="gallery-grid">
                            ${data.images.map((img, index) => `
                                <div class="gallery-item" onclick="ReportManager.viewReportImages(${reportId}, ${index})">
                                    <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                    <div class="gallery-overlay">
                                        <span class="gallery-filename">${img.filename}</span>
                                        ${img.is_suggested_products ? `<span class="suggested-products-badge">${currentLanguage === 'ar' ? 'منتجات مقترحة' : 'Suggested Products'}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    
                    // Store images in the report object for viewing
                    const report = this.currentReports.find(r => r.id === reportId);
                    if (report) {
                        report.images = data.images;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading report images:', error);
            const imagesSection = document.getElementById(`images-section-${reportId}`);
            if (imagesSection) {
                const galleryDiv = imagesSection.querySelector('.image-gallery');
                galleryDiv.innerHTML = `<p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images'}</p>`;
            }
        }
    },
    
    viewReportImages: function(reportId, startIndex = 0) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report || !report.images || report.images.length === 0) return;
        
        // Use the ClientManager's image viewer (reuse functionality)
        const allImages = report.images.map(img => ({
            data: img.data,
            filename: img.filename,
            title: img.filename || currentLanguage === 'ar' ? 'صورة الزيارة' : 'Visit Image'
        }));
        
        ClientManager.viewImageFullscreen(
            `data:image/jpeg;base64,${allImages[startIndex].data}`,
            allImages[startIndex].title,
            allImages,
            startIndex
        );
    },
    
    printReport: function(reportId) {
        // Open HTML report in new window with token in URL
        const token = localStorage.getItem('authToken');
        const reportUrl = `${window.location.protocol}//${window.location.host}/api/visit-reports/${reportId}/html?token=${token}`;
        
        // Open in new window
        const reportWindow = window.open(reportUrl, '_blank');
        
        if (!reportWindow) {
            alert(currentLanguage === 'ar' ? 
                'يرجى السماح بالنوافذ المنبثقة لعرض التقرير' : 
                'Please allow pop-ups to view the report');
        }
    },
    
    deleteReport: async function(reportId) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report) return;
        
        const confirmMessage = currentLanguage === 'ar' ? 
            `هل أنت متأكد من إلغاء تفعيل تقرير زيارة "${report.client_name}"؟ يمكن إعادة تفعيله لاحقاً.` : 
            `Are you sure you want to deactivate the visit report for "${report.client_name}"? It can be reactivated later.`;
        
        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/visit-reports/${reportId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert(currentLanguage === 'ar' ? 'تم إلغاء تفعيل التقرير بنجاح' : 'Report deactivated successfully');
                    this.loadReports(); // Refresh the reports list
                loadDashboardData(); // Refresh dashboard counts
                } else {
                    const errorData = await response.json();
                    alert(currentLanguage === 'ar' ? 'خطأ في إلغاء تفعيل التقرير' : 'Error deactivating report: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error deactivating report:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
            }
        }
    },
    
    reactivateReport: async function(reportId) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report) return;
        
        const confirmMessage = currentLanguage === 'ar' ? 
            `هل أنت متأكد من إعادة تفعيل تقرير زيارة "${report.client_name}"؟` : 
            `Are you sure you want to reactivate the visit report for "${report.client_name}"?`;
        
        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/visit-reports/${reportId}/reactivate`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    alert(currentLanguage === 'ar' ? 'تم إعادة تفعيل التقرير بنجاح' : 'Report reactivated successfully');
                    this.loadReports(); // Refresh the reports list
                loadDashboardData(); // Refresh dashboard counts
                } else {
                    const errorData = await response.json();
                    alert(currentLanguage === 'ar' ? 'خطأ في إعادة تفعيل التقرير' : 'Error reactivating report: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error reactivating report:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
            }
        }
    },
    
    updateStatusIndicator: function(type, statusFilter, count) {
        // Update the page title or add status indicator
        const sectionTitle = type === 'clients' ? 
            document.querySelector('#clients h2') : 
            document.querySelector('#reports h2');
        
        if (sectionTitle) {
            const baseText = type === 'clients' ? 
                (currentLanguage === 'ar' ? 'إدارة العملاء' : 'Client Management') :
                (currentLanguage === 'ar' ? 'تقارير الزيارات' : 'Visit Reports');
            
            let statusText = '';
            if (statusFilter === 'active') {
                statusText = currentLanguage === 'ar' ? ` (نشط: ${count})` : ` (Active: ${count})`;
            } else if (statusFilter === 'inactive') {
                statusText = currentLanguage === 'ar' ? ` (معطل: ${count})` : ` (Inactive: ${count})`;
            } else {
                statusText = currentLanguage === 'ar' ? ` (الكل: ${count})` : ` (All: ${count})`;
            }
            
            sectionTitle.textContent = baseText + statusText;
        }
    },
    
    // Predefined Notes Functions
    predefinedNotes: [],
    
    loadPredefinedNotes: async function() {
        try {
            // Add cache-busting parameter
            const timestamp = new Date().getTime();
            const response = await fetch(`${API_BASE_URL}/predefined-notes?t=${timestamp}`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.predefinedNotes = data.questions || [];
                this.populatePredefinedQuestions();
            } else {
                console.error('Failed to load predefined notes');
            }
        } catch (error) {
            console.error('Error loading predefined notes:', error);
        }
    },
    
    populatePredefinedQuestions: function() {
        const select = document.getElementById('predefinedQuestionSelect');
        if (!select) return;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">' + (currentLanguage === 'ar' ? '-- اختر سؤال --' : '-- Select Question --') + '</option>';
        
        // Add predefined questions
        this.predefinedNotes.forEach(question => {
            const option = document.createElement('option');
            option.value = question.id;
            option.textContent = question.question;
            
            // Disable if already added
            if (this.isPredefinedNoteAlreadyAdded(question.question)) {
                option.disabled = true;
                option.textContent += ' (تم إضافتها)';
            }
            
            select.appendChild(option);
        });
    },
    
    handlePredefinedQuestionChange: function() {
        const select = document.getElementById('predefinedQuestionSelect');
        const container = document.getElementById('predefinedAnswersContainer');
        
        if (!select || !container) return;
        
        const selectedId = select.value;
        if (!selectedId) {
            container.innerHTML = '';
            return;
        }
        
        const question = this.predefinedNotes.find(q => q.id == selectedId);
        if (!question) return;
        
        let answerHtml = '';
        
        if (question.type === 'mcq') {
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    <div class="mcq-options">
                        ${question.options.map(option => `
                            <label class="mcq-option">
                                <input type="radio" name="predefined_answer_${question.id}" value="${option}">
                                <div class="option-content">
                                    <span>${option}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        } else if (question.type === 'date') {
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    <input type="date" id="predefined_date_${question.id}" class="form-control">
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        } else if (question.type === 'structured') {
            let fieldsHtml = '';
            question.fields.forEach(field => {
                fieldsHtml += `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <input type="text" id="predefined_${field.name}_${question.id}" class="form-control" placeholder="${field.label}">
                    </div>
                `;
            });
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    ${fieldsHtml}
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        } else {
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    <textarea id="predefined_text_${question.id}" rows="3" placeholder="${currentLanguage === 'ar' ? 'اكتب إجابتك...' : 'Write your answer...'}"></textarea>
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        }
        
        container.innerHTML = answerHtml;
    },
    
    addPredefinedAnswer: function(questionId) {
        const question = this.predefinedNotes.find(q => q.id == questionId);
        if (!question) return;
        
        let answer = '';
        
        if (question.type === 'mcq') {
            const selectedOption = document.querySelector(`input[name="predefined_answer_${questionId}"]:checked`);
            if (!selectedOption) {
                alert(currentLanguage === 'ar' ? 'يرجى اختيار إجابة' : 'Please select an answer');
                return;
            }
            answer = selectedOption.value;
        } else if (question.type === 'date') {
            const dateInput = document.getElementById(`predefined_date_${questionId}`);
            if (!dateInput || !dateInput.value) {
                alert(currentLanguage === 'ar' ? 'يرجى اختيار تاريخ' : 'Please select a date');
                return;
            }
            // Convert date to Gregorian calendar with day name
            const selectedDate = new Date(dateInput.value);
            const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const dayName = dayNames[selectedDate.getDay()];
            const day = selectedDate.getDate();
            const month = monthNames[selectedDate.getMonth()];
            const year = selectedDate.getFullYear();
            answer = `${dayName} - ${day} ${month} ${year}`;
        } else if (question.type === 'structured') {
            // Collect all field values
            let fieldAnswers = [];
            question.fields.forEach(field => {
                const fieldInput = document.getElementById(`predefined_${field.name}_${questionId}`);
                if (fieldInput && fieldInput.value.trim()) {
                    fieldAnswers.push(`${field.label}: ${fieldInput.value.trim()}`);
                }
            });
            
            if (fieldAnswers.length === 0) {
                alert(currentLanguage === 'ar' ? 'يرجى ملء حقل واحد على الأقل' : 'Please fill at least one field');
                return;
            }
            
            answer = fieldAnswers.join(' | ');
        } else {
            const textArea = document.getElementById(`predefined_text_${questionId}`);
            if (!textArea || !textArea.value.trim()) {
                alert(currentLanguage === 'ar' ? 'يرجى كتابة إجابة' : 'Please write an answer');
                return;
            }
            answer = textArea.value.trim();
        }
        
        // Check if this predefined note already exists
        if (this.isPredefinedNoteAlreadyAdded(question.question)) {
            alert(currentLanguage === 'ar' ? 'هذه الملاحظة المحددة مسبقاً تم إضافتها بالفعل' : 'This predefined note has already been added');
            return;
        }
        
        // Add to notes container
        this.addPredefinedNoteToNotes(question.question, answer);
        
        // Clear the predefined answer form
        document.getElementById('predefinedAnswersContainer').innerHTML = '';
        document.getElementById('predefinedQuestionSelect').value = '';
        
        // Refresh the predefined questions dropdown to disable the added question
        this.populatePredefinedQuestions();
    },
    
    loadClientLastReportSummary: async function(clientId) {
        console.log('loadClientLastReportSummary called with clientId:', clientId);
        try {
            const response = await fetch(`/api/clients/${clientId}/last-report-summary`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('API response status:', response.status);
            console.log('API response headers:', response.headers);
            
            if (response.ok) {
                const summary = await response.json();
                console.log('Summary data received:', summary);
                this.displayClientSummary(summary);
            } else {
                const errorText = await response.text();
                console.log('API response not ok, status:', response.status);
                console.log('Error response:', errorText);
                this.hideClientSummary();
            }
        } catch (error) {
            console.error('Error loading client summary:', error);
            this.hideClientSummary();
        }
    },
    
    displayClientSummary: function(summary) {
        console.log('displayClientSummary called with:', summary);
        const container = document.getElementById('clientSummaryContainer');
        const content = document.getElementById('clientSummaryContent');
        
        console.log('Container found:', !!container);
        console.log('Content found:', !!content);
        
        if (!container || !content) {
            console.log('Missing container or content elements');
            return;
        }
        
        let summaryHtml = '';
        
        // Check if there are any issues to display
        const hasIssues = summary.priceIssues || summary.expirationIssues || summary.complaints || summary.suggestedProducts;
        
        console.log('Summary has issues:', hasIssues);
        console.log('Summary values:', summary);
        
        if (hasIssues) {
            summaryHtml = '<div class="summary-issues">';
            
            if (summary.priceIssues) {
                summaryHtml += `
                    <div class="summary-item price-issue">
                        <span class="summary-icon">⚠️</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'مشاكل في الأسعار' : 'Price Issues'}</span>
                    </div>
                `;
            }
            
            if (summary.expirationIssues) {
                summaryHtml += `
                    <div class="summary-item expiration-issue">
                        <span class="summary-icon">⏰</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'مشاكل في انتهاء الصلاحية' : 'Expiration Issues'}</span>
                    </div>
                `;
            }
            
            if (summary.complaints) {
                summaryHtml += `
                    <div class="summary-item complaint-issue">
                        <span class="summary-icon">😞</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'شكاوى (منتجات أو مندوب)' : 'Complaints (Products or Salesman)'}</span>
                    </div>
                `;
            }
            
            if (summary.suggestedProducts) {
                summaryHtml += `
                    <div class="summary-item suggested-products">
                        <span class="summary-icon">💡</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'منتجات مقترحة' : 'Suggested Products'}</span>
                    </div>
                `;
            }
            
            summaryHtml += '</div>';
            
            // Add display button if there's a last report
            if (summary.lastReportId) {
                summaryHtml += `
                    <div class="summary-actions">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="ReportManager.displayLastReport(${summary.lastReportId}, event); return false;">
                            <span class="summary-icon">👁️</span>
                            ${currentLanguage === 'ar' ? 'عرض آخر تقرير' : 'Display Last Report'}
                        </button>
                    </div>
                `;
            }
        } else {
            // Check if this is a client with no previous reports vs a client with no issues
            if (summary.hasPreviousReports === false) {
                summaryHtml = `
                    <div class="summary-no-history">
                        <span class="summary-icon">ℹ️</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'لا توجد تقارير سابقة لهذا العميل' : 'No previous reports for this client'}</span>
                    </div>
                `;
            } else {
                summaryHtml = `
                    <div class="summary-no-issues">
                        <span class="summary-icon">✅</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'لا توجد مشاكل في آخر تقرير' : 'No issues in last report'}</span>
                    </div>
                `;
            }
        }
        
        content.innerHTML = summaryHtml;
        container.style.display = 'block';
        console.log('Summary displayed, container visible:', container.style.display);
    },
    
    hideClientSummary: function() {
        const container = document.getElementById('clientSummaryContainer');
        if (container) {
            container.style.display = 'none';
        }
    },
    
    displayLastReport: function(reportId, event) {
        // Prevent any form submission or default behavior
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Open the report display page in a new tab
        const displayUrl = `/api/visit-reports/${reportId}/html?token=${localStorage.getItem('authToken')}`;
        window.open(displayUrl, '_blank');
        
        return false; // Extra safety to prevent form submission
    },
    
    isPredefinedNoteAlreadyAdded: function(question) {
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return false;
        
        const existingNotes = notesContainer.querySelectorAll('.predefined-note textarea');
        for (let note of existingNotes) {
            const noteText = note.value;
            // Check if the question part matches (before the colon)
            const questionPart = noteText.split(':')[0].replace('* ', '').trim();
            if (questionPart === question) {
                return true;
            }
        }
        return false;
    },
    
    addPredefinedNoteToNotes: function(question, answer) {
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return;
        
        // Create new note group with single asterisk
        const noteGroup = document.createElement('div');
        noteGroup.className = 'form-group note-group predefined-note';
        noteGroup.innerHTML = `
            <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</label>
            <textarea name="notes[]" rows="3" readonly>* ${question}: <span style="color: #B88A2A; font-weight: bold;">${answer}</span></textarea>
            <button type="button" class="remove-note-btn" onclick="ReportManager.removeNote(this)">
                ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
            </button>
        `;
        
        notesContainer.appendChild(noteGroup);
        
        // Show remove button if there are multiple notes
        const allNotes = notesContainer.querySelectorAll('.note-group');
        if (allNotes.length > 1) {
            allNotes.forEach(note => {
                const removeBtn = note.querySelector('.remove-note-btn');
                if (removeBtn) removeBtn.style.display = 'inline-block';
            });
        }
    },
    
    addLoadMoreButton: function(type) {
        /**Add load more button at the bottom of the list*/
        const listElement = document.getElementById(`${type}List`);
        if (!listElement) return;
        
        // Remove existing load more button
        const existingButton = listElement.querySelector('.load-more-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Add load more button if there are more items (ReportManager only checks hasMoreReports)
        if (this.hasMoreReports) {
            const button = document.createElement('div');
            button.className = 'load-more-button';
            button.innerHTML = `
                <button class="btn btn-secondary load-more-btn" onclick="ReportManager.loadMoreReports()">
                    <div class="loading-spinner" style="display: none;">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <span class="button-text">${currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More'}</span>
                </button>
            `;
            listElement.appendChild(button);
            
            // Setup Intersection Observer to auto-load when button comes into view
            this.setupLoadMoreObserver(button, type);
        }
    },
    
    setupLoadMoreObserver: function(button, type) {
        /**Setup Intersection Observer to auto-click load more when it comes into view (OPTIONAL - button always works manually)*/
        try {
            // Disconnect existing observer if any
            if (this.loadMoreObserver) {
                this.loadMoreObserver.disconnect();
            }
            
            // Create new observer (this is a convenience feature - button works without it)
            this.loadMoreObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Button is visible, auto-click it (but user can still click manually)
                        console.log(`Load more button visible for ${type}, auto-loading...`);
                        const btn = entry.target.querySelector('.load-more-btn');
                        if (btn && !btn.disabled) {
                            // Add small delay to ensure proper rendering
                            setTimeout(() => {
                                if (btn && !btn.disabled) {
                                    btn.click();
                                }
                            }, 100);
                        }
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '100px', // Trigger 100px before button is visible (reduced from 200px for reliability)
                threshold: 0.1
            });
            
            // Start observing
            this.loadMoreObserver.observe(button);
            console.log(`✅ Auto-load observer started for ${type} (button also works manually)`);
        } catch (error) {
            // If observer fails, button still works manually
            console.log(`⚠️ Auto-load observer failed for ${type} (button will work manually only):`, error);
        }
    }
};

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            ProductManager.filterProducts(searchTerm);
        });
    }
}

// Set up search and filter functionality for clients
function setupClientSearch() {
    const clientSearchInput = document.getElementById('clientSearch');
    const regionFilter = document.getElementById('regionFilter');
    const salesmanFilter = document.getElementById('salesmanFilter');
    const statusFilter = document.getElementById('clientStatusFilter');
    
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value;
            const selectedRegion = regionFilter ? regionFilter.value : '';
            const selectedSalesman = salesmanFilter ? salesmanFilter.value : '';
            ClientManager.filterClients(searchTerm, selectedRegion, selectedSalesman);
        });
    }
    
    if (regionFilter) {
        regionFilter.addEventListener('change', function(e) {
            const selectedRegion = e.target.value;
            const searchTerm = clientSearchInput ? clientSearchInput.value : '';
            const selectedSalesman = salesmanFilter ? salesmanFilter.value : '';
            ClientManager.filterClients(searchTerm, selectedRegion, selectedSalesman);
        });
    }
    
    if (salesmanFilter) {
        salesmanFilter.addEventListener('change', function(e) {
            const selectedSalesman = e.target.value;
            const searchTerm = clientSearchInput ? clientSearchInput.value : '';
            const selectedRegion = regionFilter ? regionFilter.value : '';
            ClientManager.filterClients(searchTerm, selectedRegion, selectedSalesman);
        });
    }
    
    if (statusFilter) {
        // Load saved filter preference
        const savedClientStatus = localStorage.getItem('clientStatusFilter') || 'active';
        statusFilter.value = savedClientStatus;
        
        statusFilter.addEventListener('change', function(e) {
            const selectedStatus = e.target.value;
            // Save filter preference
            localStorage.setItem('clientStatusFilter', selectedStatus);
            // Clear search, region, and salesman filters when changing status
            if (clientSearchInput) clientSearchInput.value = '';
            if (regionFilter) regionFilter.value = '';
            if (salesmanFilter) salesmanFilter.value = '';
            // Reload clients with new status filter
            ClientManager.loadClients(selectedStatus);
        });
    }
}

// Set up status filter functionality for reports
function setupReportSearch() {
    const reportSearchInput = document.getElementById('reportSearch');
    const statusFilter = document.getElementById('reportStatusFilter');
    
    if (reportSearchInput) {
        reportSearchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value;
            ReportManager.filterReports(searchTerm);
        });
    }
    
    if (statusFilter) {
        // Load saved filter preference
        const savedReportStatus = localStorage.getItem('reportStatusFilter') || 'active';
        statusFilter.value = savedReportStatus;
        
        statusFilter.addEventListener('change', function(e) {
            const selectedStatus = e.target.value;
            // Save filter preference
            localStorage.setItem('reportStatusFilter', selectedStatus);
            // Clear search when changing status
            if (reportSearchInput) {
                reportSearchInput.value = '';
            }
            // Reload reports with new status filter
            ReportManager.loadReports(selectedStatus);
        });
    }
}

// Add search functionality to ProductManager
ProductManager.filterProducts = async function(searchTerm) {
    // If search is cleared, reload the full list with infinite scroll
    if (!searchTerm || !searchTerm.trim()) {
        await this.loadProducts(); // Reloads page 1 and re-enables infinite scroll
        return;
    }
    
    // If search term is provided, use backend search for ALL products
    await this.searchProducts(searchTerm.trim());
};

ProductManager.searchProducts = async function(searchTerm) {
    /**Search ALL products using backend API*/
    try {
        const apiUrl = `${API_BASE_URL}/products/search?q=${encodeURIComponent(searchTerm)}&page=1&per_page=100`;
        
        const response = await fetch(apiUrl, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const searchResults = data.products || [];
            
            const productsList = document.getElementById('productsList');
            if (!productsList) return;
            
            // Display results
            if (searchResults.length === 0) {
                productsList.innerHTML = `
                    <div class="empty-state">
                        <h3>${currentLanguage === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}</h3>
                        <p>${currentLanguage === 'ar' ? 'لا توجد منتجات تطابق بحثك' : 'No products match your search'}</p>
                    </div>
                `;
            } else {
                this.displayProducts(searchResults, false);
                
                // Load thumbnails for search results
                this.loadProductThumbnails(searchResults);
            }
            
            // --- FIX: Disable infinite scroll for search results ---
            const loadMoreBtn = document.querySelector('#productsList .load-more-button');
            if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            this.hasMoreProducts = false; // Prevent observer from firing
            // -------------------------------------------------------
            
            // Update count
            this.updateStatusIndicator('products', 'all', data.total);
        } else {
            console.error('Failed to search products');
        }
    } catch (error) {
        console.error('Error searching products:', error);
    }
};

// Header hide on scroll functionality
function setupScrollHideHeader() {
    let lastScrollTop = 0;
    let scrollThreshold = 5; // Minimum scroll distance to trigger hide/show
    
    const desktopHeader = document.querySelector('.desktop-header');
    const mobileHeader = document.querySelector('.mobile-header');
    const mainContent = document.querySelector('.main-content');
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Only act if scroll distance is significant enough
        if (Math.abs(scrollTop - lastScrollTop) < scrollThreshold) {
            return;
        }
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide headers
            if (desktopHeader) desktopHeader.classList.add('hidden');
            if (mobileHeader) mobileHeader.classList.add('hidden');
            
            // Reduce top padding when header is hidden
            if (mainContent) {
                if (window.innerWidth > 768) {
                    mainContent.style.paddingTop = '2rem';
                } else {
                    mainContent.style.paddingTop = '2rem';
                }
            }
        } else if (scrollTop < lastScrollTop) {
            // Scrolling up - show headers
            if (desktopHeader) desktopHeader.classList.remove('hidden');
            if (mobileHeader) mobileHeader.classList.remove('hidden');
            
            // Restore top padding when header is shown
            if (mainContent) {
                if (window.innerWidth > 768) {
                    mainContent.style.paddingTop = '90px';
                } else {
                    mainContent.style.paddingTop = '80px';
                }
            }
        }
        
        lastScrollTop = scrollTop;
    });
}

// Add displayFilteredProducts method to handle search results
ProductManager.displayFilteredProducts = function(products) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>${currentLanguage === 'ar' ? 'لا توجد منتجات' : 'No Products'}</h3>
                <p>${currentLanguage === 'ar' ? 'لم يتم إضافة أي منتجات بعد' : 'No products have been added yet'}</p>
            </div>
        `;
    } else {
        // Use the same display logic from loadProducts
        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="ProductManager.viewExpanded(${product.id})">
                <div class="product-image">
                    ${product.thumbnail ? 
                        `<img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">` : 
                        `<img src="/logo.png" alt="${product.name}" class="logo-fallback">`
                    }
                </div>
                <h3>${product.name}</h3>
                <div class="prices-grid">
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</div>
                        <div class="price-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</div>
                        <div class="price-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</div>
                        <div class="price-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</div>
                        <div class="price-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                </div>
                ${product.can_edit ? `
                    <div class="product-actions" onclick="event.stopPropagation()">
                        <button class="btn-icon-stylish btn-edit-stylish" onclick="ProductManager.editProduct(${product.id})" title="${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="btn-icon-stylish btn-delete-stylish" onclick="ProductManager.deleteProduct(${product.id})" title="${currentLanguage === 'ar' ? 'حذف المنتج' : 'Delete Product'}">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
};
