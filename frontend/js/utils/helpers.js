// Helper utility functions

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale code ('ar' or 'en')
 * @returns {string} Formatted date string
 */
function formatDate(date, locale = 'ar') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US');
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'SAR') {
    return `${parseFloat(amount).toFixed(2)} ${currency === 'SAR' ? 'ريال' : currency}`;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'info')
 */
function showToast(message, type = 'info') {
    // Simple console log for now - can be enhanced with a toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message); // Fallback to alert
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (first 2 characters)
 */
function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export { formatDate, formatCurrency, debounce, showToast, getInitials };
