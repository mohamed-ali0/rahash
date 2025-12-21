/**
 * Sidebar Manager
 * Handles sidebar toggle and navigation
 */

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

// Make globally available
window.toggleSidebar = toggleSidebar;
window.navigateAndCloseSidebar = navigateAndCloseSidebar;
window.initializeSidebar = initializeSidebar;
