/**
 * Permissions Manager
 * Handles user interface permissions based on role
 */

// Setup user interface based on permissions
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

// Setup general event listeners for add buttons
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
window.setupUserInterface = setupUserInterface;
window.setupEventListeners = setupEventListeners;
