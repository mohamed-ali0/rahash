/**
 * Authentication Module
 * Handles user authentication state and token management
 */

const Auth = {
    // Check if user is logged in
    isLoggedIn() {
        return Config.isAuthenticated();
    },

    // Get current user info
    getCurrentUser() {
        return Config.getUser();
    },

    // Login - store token and user
    login(token, user) {
        localStorage.setItem(Config.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(Config.STORAGE_KEYS.USER, JSON.stringify(user));
    },

    // Logout - clear storage and redirect
    logout() {
        localStorage.removeItem(Config.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(Config.STORAGE_KEYS.USER);
        window.location.href = '/login';
    },

    // Check authentication and redirect if not logged in
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    },

    // Check role permissions
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const userRole = user.role?.toLowerCase();
        const required = requiredRole.toLowerCase();

        // Super admin has all permissions
        if (userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'admin') {
            return true;
        }

        return userRole === required;
    },

    // Check if can edit (admin or supervisor)
    canEdit() {
        return Config.isSuperAdmin() || Config.isSupervisor();
    },

    // Check if can delete (admin only)
    canDelete() {
        return Config.isSuperAdmin();
    },

    // Update UI based on permissions
    updateUIPermissions() {
        const user = this.getCurrentUser();
        if (!user) return;

        const isSuperAdmin = Config.isSuperAdmin();
        const isSupervisor = Config.isSupervisor();

        // Show/hide elements based on permissions using CSS classes
        document.querySelectorAll('[data-require-admin]').forEach(el => {
            el.classList.toggle(Config.CSS_CLASSES.HIDDEN, !isSuperAdmin);
        });

        document.querySelectorAll('[data-require-supervisor]').forEach(el => {
            el.classList.toggle(Config.CSS_CLASSES.HIDDEN, !isSupervisor && !isSuperAdmin);
        });

        document.querySelectorAll('[data-require-edit]').forEach(el => {
            el.classList.toggle(Config.CSS_CLASSES.HIDDEN, !this.canEdit());
        });
    }
};

// Make Auth globally available
window.Auth = Auth;
