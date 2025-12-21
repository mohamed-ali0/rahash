/**
 * Navigation Router
 * Handles section navigation and routing
 */

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
        link.addEventListener('click', function (e) {
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
