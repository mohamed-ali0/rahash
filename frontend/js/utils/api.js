/**
 * API Helpers
 * Common API utilities and authentication
 */

// Dynamic API URL - works for both localhost and deployed server
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5009/api`;

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    console.log('Checking authentication, token exists:', !!token);
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return false;
    }
    return true;
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

// Make globally available
window.API_BASE_URL = API_BASE_URL;
window.getAuthHeaders = getAuthHeaders;
window.checkAuthentication = checkAuthentication;
window.isSuperAdmin = isSuperAdmin;
window.logout = logout;
