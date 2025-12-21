/**
 * Configuration Module
 * Central configuration for the Business Management System
 */

const Config = {
    // API Configuration
    API_BASE_URL: `${window.location.protocol}//${window.location.hostname}:5009/api`,

    // App Settings
    DEFAULT_LANGUAGE: 'ar',
    DEFAULT_PAGE_SIZE: 20,
    REPORT_PAGE_SIZE: 15,

    // Storage Keys - MUST match auth.js storage keys!
    STORAGE_KEYS: {
        TOKEN: 'authToken',       // auth.js uses 'authToken'
        USER: 'userInfo',         // auth.js uses 'userInfo'
        LANGUAGE: 'language',
        THEME: 'theme'
    },

    // CSS Classes (avoid inline styles)
    CSS_CLASSES: {
        HIDDEN: 'hidden',
        ACTIVE: 'active',
        LOADING: 'loading',
        ERROR: 'error',
        SUCCESS: 'success',
        DISABLED: 'disabled',
        EXPANDED: 'expanded',
        COLLAPSED: 'collapsed'
    },

    // User Roles
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        SALES_SUPERVISOR: 'sales_supervisor',
        SALESMAN: 'salesman'
    },

    // Get auth token
    getToken() {
        return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    },

    // Get current user
    getUser() {
        const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    },

    // Get auth headers
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Check if user is super admin
    isSuperAdmin() {
        const user = this.getUser();
        if (!user) return false;
        const role = user.role?.toLowerCase();
        return role === 'super_admin' || role === 'superadmin' || role === 'admin';
    },

    // Check if user is supervisor
    isSupervisor() {
        const user = this.getUser();
        if (!user) return false;
        const role = user.role?.toLowerCase();
        return role === 'sales_supervisor' || role === 'supervisor';
    }
};

// Make Config globally available
window.Config = Config;
