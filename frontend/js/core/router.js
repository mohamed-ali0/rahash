/**
 * Navigation Router
 * Handles section navigation and routing
 */

// Setup navigation functionality with clean URL support
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');

    // Hide all sections initially
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Get current section from URL pathname
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

// Make globally available
window.setupNavigation = setupNavigation;
window.showSection = showSection;
