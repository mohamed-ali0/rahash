// Main JavaScript file for Business Management System

// Global variables
let currentLanguage = 'ar';

// Global function to safely close modals and restore scrolling
function closeModalAndRestoreScroll(modal) {
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
    }
}

// Global function to safely open modals and disable scrolling
function openModalAndDisableScroll(modal) {
    if (modal) {
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add click handler to close modal
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('expanded-close') || e.target.classList.contains('modal-close')) {
                closeModalAndRestoreScroll(modal);
            }
        });
    }
}

// Emergency function to restore scrolling if page gets frozen
function emergencyRestoreScroll() {
    document.body.style.overflow = '';
    document.body.style.overflowY = '';
    // Remove any stuck modals
    const modals = document.querySelectorAll('.expanded-modal, .fullscreen-image-modal, .modal-overlay');
    modals.forEach(modal => modal.remove());
}

// Add emergency scroll restore on page load
document.addEventListener('DOMContentLoaded', function() {
    // Restore scroll on page load in case it was frozen
    emergencyRestoreScroll();
});

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
// Dynamic API URL - works for both localhost and deployed server
const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;

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
                if (userInfo && userInfo.role === 'SUPER_ADMIN') {
                    SettingsManager.loadSettings();
                } else {
                    alert(currentLanguage === 'ar' ? 'ليس لديك صلاحية للوصول إلى إعدادات النظام' : 'You do not have permission to access system settings');
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
        // Load clients count (only active clients)
        const clientsResponse = await fetch(`${API_BASE_URL}/clients`, {
            headers: getAuthHeaders()
        });
        if (clientsResponse.ok) {
            const clients = await clientsResponse.json();
            const activeClients = clients.filter(client => client.is_active !== false);
            document.getElementById('totalClients').textContent = activeClients.length || 0;
        }
        
        // Load products count
        const productsResponse = await fetch(`${API_BASE_URL}/products`, {
            headers: getAuthHeaders()
        });
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            document.getElementById('totalProducts').textContent = products.length || 0;
        }
        
        // Load reports count (this month - only active reports)
        const reportsResponse = await fetch(`${API_BASE_URL}/visit-reports`, {
            headers: getAuthHeaders()
        });
        if (reportsResponse.ok) {
            const reports = await reportsResponse.json();
            
            // Filter for active reports only
            const activeReports = reports.filter(report => report.is_active !== false);
            
            // Filter active reports for current month
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            const monthlyReports = activeReports.filter(report => {
                const reportDate = new Date(report.visit_date);
                return reportDate.getMonth() === currentMonth && 
                       reportDate.getFullYear() === currentYear;
            });
            
            document.getElementById('monthlyReports').textContent = monthlyReports.length || 0;
        } else {
            document.getElementById('monthlyReports').textContent = '0';
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    if (!token) {
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
        const user = JSON.parse(userInfo);
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting) {
            userGreeting.textContent = `${currentLanguage === 'ar' ? 'مرحباً' : 'Hello'}, ${user.username}`;
        }

        // Hide System Settings for non-super-admin users
        const settingsMenuItem = document.querySelector('a[href="#settings"]');
        if (settingsMenuItem) {
            if (isSuperAdmin(user)) {
                settingsMenuItem.style.display = 'block';
            } else {
                settingsMenuItem.style.display = 'none';
            }
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
    if (!user || !user.role) return false;
    const role = String(user.role).toUpperCase().replace(/\s+/g, '_');
    return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SUPERADMIN';
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
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
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
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة العميل' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
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
            location: formData.get('location') || null
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
            // Determine API parameter based on status filter
            let apiUrl = `${API_BASE_URL}/clients`;
            if (statusFilter === 'all' || statusFilter === 'inactive') {
                apiUrl += '?show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                let clients = await response.json();
                
                // Client-side filtering based on status
                if (statusFilter === 'active') {
                    clients = clients.filter(client => client.is_active !== false);
                } else if (statusFilter === 'inactive') {
                    clients = clients.filter(client => client.is_active === false);
                }
                // 'all' shows everything as loaded
                
                // Store clients for filtering
                this.currentClients = clients;
                this.currentStatusFilter = statusFilter;
                
                // Extract unique regions and populate filter
                this.populateRegionFilter(clients);
                
                // Extract unique salesmen and populate filter
                this.populateSalesmanFilter(clients);
                
                this.displayClients(clients);
                
                // Update status indicator
                this.updateStatusIndicator('clients', statusFilter, clients.length);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    },
    
    populateRegionFilter: function(clients) {
        const regionFilter = document.getElementById('regionFilter');
        if (!regionFilter) return;
        
        // Extract unique regions
        const regions = [...new Set(clients.map(client => client.region).filter(region => region && region.trim() !== ''))];
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
    
    populateSalesmanFilter: function(clients) {
        const salesmanFilter = document.getElementById('salesmanFilter');
        if (!salesmanFilter) {
            console.error('Salesman filter element not found');
            return;
        }
        
        // Extract unique salesmen
        const salesmen = [...new Set(clients.map(client => client.salesman_name).filter(salesman => salesman && salesman.trim() !== ''))];
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
    
    displayClients: function(clients) {
        const clientsList = document.getElementById('clientsList');
        if (clients.length === 0) {
            clientsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد عملاء' : 'No Clients'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة عميل جديد' : 'Start by adding a new client'}</p>
                </div>
            `;
        } else {
            // Display clients cards with edit/delete buttons
            clientsList.innerHTML = clients.map(client => {
                const isInactive = client.is_active === false;
                const cardClass = `client-card ${isInactive ? 'inactive' : ''}`;
                
                return `
                    <div class="${cardClass}" ${!isInactive ? `onclick="ClientManager.viewClientDetails(${client.id})"` : ''}>
                        <div class="card-header">
                            <div class="client-avatar">
                                ${client.thumbnail ? 
                                    `<img src="data:image/jpeg;base64,${client.thumbnail}" alt="${client.name}">` : 
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
    
    filterClients: function(searchTerm = '', selectedRegion = '', selectedSalesman = '') {
        let filteredClients = this.currentClients;
        
        // Filter by search term
        if (searchTerm.trim()) {
            filteredClients = filteredClients.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.region && client.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (client.salesman_name && client.salesman_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Filter by region
        if (selectedRegion.trim()) {
            filteredClients = filteredClients.filter(client => client.region === selectedRegion);
        }
        
        // Filter by salesman
        if (selectedSalesman.trim()) {
            filteredClients = filteredClients.filter(client => client.salesman_name === selectedSalesman);
        }
        
        this.displayClients(filteredClients);
        
        // Update count in status indicator
        const statusFilter = document.getElementById('clientStatusFilter');
        const currentStatus = statusFilter ? statusFilter.value : 'active';
        this.updateStatusIndicator('clients', currentStatus, filteredClients.length);
        
        // Update client count display
        this.updateClientCount(filteredClients.length);
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
    
    viewClientDetails: function(clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;
        
        // Create detailed expanded view modal
        const modal = document.createElement('div');
        modal.className = 'expanded-modal';
        modal.innerHTML = `
            <div class="expanded-content">
                <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                
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
                    
                    ${client.additional_images && client.additional_images.length > 0 ? `
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'الصور الإضافية' : 'Additional Images'}</h3>
                        <div class="image-gallery">
                            <div class="gallery-grid">
                                ${client.additional_images.map((img, index) => `
                                    <div class="gallery-item" onclick="ClientManager.viewClientImages(${client.id}, ${index})">
                                        <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                        <div class="gallery-overlay">
                                            <span class="gallery-filename">${img.filename || currentLanguage === 'ar' ? 'صورة العميل' : 'Client Image'}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="expanded-actions">
                    <button class="btn btn-primary" onclick="ClientManager.editClient(${client.id}); this.closest('.expanded-modal').remove();">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        ${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.expanded-modal').remove()">
                        ${currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        `;
        
        openModalAndDisableScroll(modal);
    },
    
    viewClientImage: function(imageData, clientName) {
        if (!imageData) return;
        
        // Create fullscreen image viewer
        const modal = document.createElement('div');
        modal.className = 'fullscreen-image-modal';
        modal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="this.closest('.fullscreen-image-modal').remove(); document.body.style.overflow = 'auto';">&times;</button>
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
                document.body.style.overflow = 'auto';
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
            document.body.style.overflow = 'auto';
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
    
    editClient: function(clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;
        
        // Create comprehensive edit modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <form id="editClientForm" onsubmit="ClientManager.saveClient(event, ${clientId})">
                    
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
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صورة العميل الرئيسية' : 'Client Thumbnail'}</label>
                            <input type="file" name="thumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - صورة جديدة تمثل العميل' : 'Optional - new main image representing the client'}</small>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية جديدة' : 'New Additional Images'}</label>
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
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
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
            location: formData.get('location') || null
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
            const response = await fetch(`${API_BASE_URL}/products`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const products = await response.json();
                
                // Store products for search functionality
                this.currentProducts = products;
                
                // Show add product button if user can edit (super admin)
                this.updateUIPermissions(products);
                
                this.displayProducts(products);
            }
        } catch (error) {
            console.error('Error loading products:', error);
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
                canEdit = userInfo.role === 'SUPER_ADMIN';
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
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const settingsMenuItem = document.querySelector('a[href="#settings"]');
        if (settingsMenuItem && userInfo) {
            if (userInfo.role === 'SUPER_ADMIN') {
                settingsMenuItem.style.display = 'block';
            } else {
                settingsMenuItem.style.display = 'none';
            }
        }
    },
    
    displayProducts: function(products) {
        // Store products data for editing
        this.currentProducts = products;
        
        const productsList = document.getElementById('productsList');
        if (products.length === 0) {
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
    },
    
    editProduct: function(productId) {
        // Find the product data
        const products = this.currentProducts || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            alert(currentLanguage === 'ar' ? 'المنتج غير موجود' : 'Product not found');
            return;
        }
        
        // Create edit form
        const editForm = `
            <div class="modal-overlay" id="editProductModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</h3>
                        <button class="modal-close" onclick="ProductManager.closeEditModal()">×</button>
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
                            <input type="file" id="editProductThumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'الصورة التي تظهر في بطاقة المنتج' : 'Image that appears on product card'}</small>
                        </div>
                        
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية للمنتج' : 'Additional Product Images'}</label>
                            <input type="file" id="editAdditionalImages" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكنك اختيار عدة صور للمعرض' : 'You can select multiple images for gallery'}</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="ProductManager.closeEditModal()">
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
    },
    
    closeEditModal: function() {
        const modal = document.getElementById('editProductModal');
        if (modal) {
            modal.remove();
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
    
    viewExpanded: function(productId) {
        // Find the product data
        const products = this.currentProducts || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            alert(currentLanguage === 'ar' ? 'المنتج غير موجود' : 'Product not found');
            return;
        }
        
        // Create expanded modal if it doesn't exist
        let expandedModal = document.getElementById('expandedModal');
        if (!expandedModal) {
            expandedModal = document.createElement('div');
            expandedModal.id = 'expandedModal';
            expandedModal.className = 'expanded-modal';
            document.body.appendChild(expandedModal);
        }
        
        // Get thumbnail image
        const thumbnailImage = product.thumbnail 
            ? `<img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">`
            : product.name.charAt(0).toUpperCase();
        
        // Build gallery images
        let galleryHtml = '';
        if (product.images && product.images.length > 0) {
            galleryHtml = `
                <div class="image-gallery">
                    <h4 class="gallery-title">${currentLanguage === 'ar' ? 'معرض الصور' : 'Image Gallery'}</h4>
                    <div class="gallery-grid">
                        ${product.images.map((img, index) => `
                            <div class="gallery-item" onclick="ProductManager.viewProductImages(${product.id}, ${index + 1})">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}">
                                <div class="gallery-overlay">
                                    <span>🔍</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Set modal content
        expandedModal.innerHTML = `
            <div class="expanded-content">
                <button class="expanded-close" onclick="ProductManager.closeExpanded()">&times;</button>
                
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
        
        // Show modal
        expandedModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Close modal when clicking outside
        expandedModal.addEventListener('click', function(e) {
            if (e.target === expandedModal) {
                ProductManager.closeExpanded();
            }
        });
    },
    
    closeExpanded: function() {
        const expandedModal = document.getElementById('expandedModal');
        if (expandedModal) {
            expandedModal.classList.remove('active');
            document.body.style.overflow = '';
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
        document.body.style.overflow = 'hidden';
        
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
            document.body.style.overflow = '';
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
                    <button class="modal-close" onclick="ProductManager.closeAddModal()">&times;</button>
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
                        <button type="button" class="btn btn-secondary" onclick="ProductManager.closeAddModal()">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة المنتج' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    closeAddModal: function() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
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
    }
};

// Settings Management Functions
const SettingsManager = {
    currentSettings: {},
    
    loadSettings: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const settings = await response.json();
                this.currentSettings = settings;
                this.displaySettings(settings);
            } else {
                console.error('Failed to load settings');
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
        const priceToleranceInput = document.getElementById('priceTolerance');
        if (priceToleranceInput) {
            priceToleranceInput.value = settings.price_tolerance || 1.00;
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
        return this.currentSettings.price_tolerance || 1.00;
    }
};

// Report Management Functions
const ReportManager = {
    currentReports: [],
    
    showAddReportForm: function() {
        // Create comprehensive add visit report modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة تقرير زيارة جديد' : 'Add New Visit Report'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
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
                                                ${currentLanguage === 'ar' ? 'قارب على الانتهاء' : 'Nearly Expired'}
                                            </label>
                                        </div>
                                        <div class="form-group expiry-group" style="display: none;">
                                            <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                                            <input type="date" name="products[0][expiry_date]">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="ReportManager.addProduct()">
                            ${currentLanguage === 'ar' ? '+ إضافة منتج' : '+ Add Product'}
                        </button>
                    </div>

                    <!-- Notes Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'ملاحظات الزيارة' : 'Visit Notes'}</h4>
                        <div id="notesContainer">
                            <div class="form-group note-group">
                                <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'} 1</label>
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
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة التقرير' : 'Add Report'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Load clients and products for the dropdowns
        this.loadClientsForDropdown();
        this.loadProductsForDropdown();
    },
    
    loadReports: async function(statusFilter = 'active') {
        try {
            // Determine API parameter based on status filter
            let apiUrl = `${API_BASE_URL}/visit-reports`;
            if (statusFilter === 'all' || statusFilter === 'inactive') {
                apiUrl += '?show_all=true';
            }
            
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                let reports = await response.json();
                
                // Client-side filtering based on status
                if (statusFilter === 'active') {
                    reports = reports.filter(report => report.is_active !== false);
                } else if (statusFilter === 'inactive') {
                    reports = reports.filter(report => report.is_active === false);
                }
                // 'all' shows everything as loaded
                
                this.currentReports = reports;
                this.currentStatusFilter = statusFilter;
                this.displayReports(reports);
                
                // Update status indicator
                this.updateStatusIndicator('reports', statusFilter, reports.length);
            } else {
                console.error('Failed to load reports');
                const reportsList = document.getElementById('reportsList');
                reportsList.innerHTML = '<p class="no-data">Failed to load visit reports</p>';
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            const reportsList = document.getElementById('reportsList');
            reportsList.innerHTML = '<p class="no-data">Error loading visit reports</p>';
        }
    },
    
    displayReports: function(reports) {
        const reportsList = document.getElementById('reportsList');
        if (reports.length === 0) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد تقارير' : 'No Reports'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة تقرير زيارة جديد' : 'Start by adding a new visit report'}</p>
                </div>
            `;
        } else {
            // Display reports cards
            reportsList.innerHTML = reports.map(report => {
                const visitDate = ReportManager.formatReportDate(report.visit_date);
                
                const isInactive = report.is_active === false;
                const cardClass = `report-card ${isInactive ? 'inactive' : ''}`;
                const cardStyle = isInactive ? 'cursor: default; opacity: 0.6;' : 'cursor: pointer;';
                
                return `
                    <div class="${cardClass}" ${!isInactive ? `onclick="ReportManager.viewReport(${report.id})"` : ''} style="${cardStyle}">
                        <div class="report-info">
                            <h3 class="client-name">${report.client_name || (currentLanguage === 'ar' ? 'عميل غير معروف' : 'Unknown Client')}</h3>
                            <div class="visit-date">${visitDate}</div>
                            ${isInactive ? `<div class="inactive-badge">${currentLanguage === 'ar' ? 'معطل' : 'Inactive'}</div>` : ''}
                        </div>
                        <div class="report-actions" onclick="event.stopPropagation()">
                            ${!isInactive ? `
                                <button class="btn-icon-stylish view-btn" onclick="ReportManager.viewReport(${report.id})" title="${currentLanguage === 'ar' ? 'عرض التقرير' : 'View Report'}">
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                </button>
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
                `;
            }).join('');
        }
    },

    // Format date as: Day - Gregorian - Islamic (Umm al-Qura)
    formatReportDate: function(dateStr) {
        try {
            const parts = String(dateStr).split('/').map(p => parseInt(p, 10));
            const d = (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2]))
                ? new Date(parts[0], parts[1] - 1, parts[2])
                : new Date(dateStr);
            const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(d);
            const greg = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
            const isl = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
            return `${dayName} - ${greg} - ${isl}`;
        } catch (e) {
            return dateStr;
        }
    },
    
    loadClientsForDropdown: async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/clients`, {
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
            const response = await fetch(`${API_BASE_URL}/products`, {
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
                            ${currentLanguage === 'ar' ? 'قارب على الانتهاء' : 'Nearly Expired'}
                        </label>
                    </div>
                    <div class="form-group expiry-group" style="display: none;">
                        <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                        <input type="date" name="products[${productCount}][expiry_date]">
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
            
            hiddenInput.name = `products[${index}][product_id]`;
            priceInput.name = `products[${index}][displayed_price]`;
            checkboxInput.name = `products[${index}][nearly_expired]`;
            dateInput.name = `products[${index}][expiry_date]`;
        });
    },
    
    toggleExpiryDate: function(checkbox) {
        const productGroup = checkbox.closest('.product-group');
        const expiryGroup = productGroup.querySelector('.expiry-group');
        const expiryInput = productGroup.querySelector('input[type="date"]');
        
        if (checkbox.checked) {
            expiryGroup.style.display = 'block';
            expiryInput.required = true;
        } else {
            expiryGroup.style.display = 'none';
            expiryInput.required = false;
            expiryInput.value = '';
        }
    },
    
    addNote: function() {
        const notesContainer = document.getElementById('notesContainer');
        const noteCount = notesContainer.querySelectorAll('.note-group').length + 1;
        
        const noteGroup = document.createElement('div');
        noteGroup.className = 'form-group note-group';
        noteGroup.innerHTML = `
            <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'} ${noteCount}</label>
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
            label.textContent = `${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'} ${index + 1}`;
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
                            data: base64
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
        
        // Handle products
        const productGroups = form.querySelectorAll('.product-group');
        const products = [];
        productGroups.forEach(group => {
            const productIdInput = group.querySelector('.selected-product-id');
            const priceInput = group.querySelector('input[name*="displayed_price"]');
            const nearlyExpiredCheckbox = group.querySelector('input[name*="nearly_expired"]');
            const expiryDateInput = group.querySelector('input[name*="expiry_date"]');
            
            if (productIdInput.value) {
                const product = {
                    product_id: parseInt(productIdInput.value),
                    displayed_price: priceInput.value ? parseFloat(priceInput.value) : null,
                    nearly_expired: nearlyExpiredCheckbox.checked,
                    expiry_date: nearlyExpiredCheckbox.checked && expiryDateInput.value ? expiryDateInput.value : null
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
    
    viewReport: function(reportId) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report) return;
        
        // Create detailed view modal
        const modal = document.createElement('div');
        modal.className = 'expanded-modal';
        modal.innerHTML = `
            <div class="expanded-content">
                <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                
                <div class="expanded-header">
                    <div class="expanded-title">
                        <h2>${report.client_name}</h2>
                        <p class="visit-date">${ReportManager.formatReportDate(report.visit_date)}</p>
                    </div>
                </div>
                
                <div class="expanded-details">
                    ${report.products && report.products.length > 0 ? `
                        <div class="detail-section">
                            <h3>${currentLanguage === 'ar' ? 'منتجات الزيارة' : 'Visit Products'}</h3>
                            <div class="products-list">
                                ${report.products.map((product, index) => {
                                    // Check if displayed price matches our internal store price within tolerance
                                    const storePrice = product.taxed_price_store;
                                    const displayedPrice = product.displayed_price;
                                    const tolerance = SettingsManager.getPriceTolerance();
                                    const priceMatches = storePrice && displayedPrice && Math.abs(storePrice - displayedPrice) <= tolerance;
                                    const priceStyle = storePrice && displayedPrice && !priceMatches ? 'color: #e74c3c; font-weight: bold;' : '';
                                    
                                    return `
                                        <div class="product-item">
                                            <div class="product-header">
                                                <h4>${product.product_name || (currentLanguage === 'ar' ? 'منتج غير معروف' : 'Unknown Product')}</h4>
                                                ${product.nearly_expired ? `<span class="expired-badge">${currentLanguage === 'ar' ? 'قارب على الانتهاء' : 'Nearly Expired'}</span>` : ''}
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
                                        <div class="note-header">${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'} ${index + 1}</div>
                                        <div class="note-text">${note.note_text}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${report.images && report.images.length > 0 ? `
                        <div class="detail-section">
                            <h3>${currentLanguage === 'ar' ? 'صور الزيارة' : 'Visit Images'}</h3>
                            <div class="image-gallery">
                                <div class="gallery-grid">
                                    ${report.images.map((img, index) => `
                                        <div class="gallery-item" onclick="ReportManager.viewReportImages(${report.id}, ${index})">
                                            <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                            <div class="gallery-overlay">
                                                <span class="gallery-filename">${img.filename}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="expanded-actions">
                    ${report.can_edit ? `
                        <button class="btn btn-primary" onclick="ReportManager.editReport(${report.id}); this.closest('.expanded-modal').remove();">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            ${currentLanguage === 'ar' ? 'تعديل التقرير' : 'Edit Report'}
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="this.closest('.expanded-modal').remove()">
                        ${currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
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
    const statusFilter = document.getElementById('reportStatusFilter');
    
    if (statusFilter) {
        // Load saved filter preference
        const savedReportStatus = localStorage.getItem('reportStatusFilter') || 'active';
        statusFilter.value = savedReportStatus;
        
        statusFilter.addEventListener('change', function(e) {
            const selectedStatus = e.target.value;
            // Save filter preference
            localStorage.setItem('reportStatusFilter', selectedStatus);
            // Reload reports with new status filter
            ReportManager.loadReports(selectedStatus);
        });
    }
}

// Add search functionality to ProductManager
ProductManager.filterProducts = function(searchTerm) {
    if (!this.currentProducts) return;
    
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    let filteredProducts = this.currentProducts;
    
    if (searchTerm) {
        filteredProducts = this.currentProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Display filtered products
    if (filteredProducts.length === 0 && searchTerm) {
        productsList.innerHTML = `
            <div class="empty-state">
                <h3>${currentLanguage === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}</h3>
                <p>${currentLanguage === 'ar' ? 'لا توجد منتجات تطابق بحثك' : 'No products match your search'}</p>
            </div>
        `;
    } else {
        // Use the existing display logic from loadProducts
        this.displayFilteredProducts(filteredProducts);
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
