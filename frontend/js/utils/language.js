/**
 * Language Manager
 * Handles language switching between Arabic and English
 */

// Global language variable
window.currentLanguage = 'ar';

// Setup language toggle functionality
function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    const langToggleMobile = document.getElementById('langToggleMobile');
    const langToggleDesktop = document.getElementById('langToggleDesktop');

    // Setup main sidebar toggle (if exists)
    if (langToggle) {
        langToggle.addEventListener('click', function () {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }

    // Setup mobile header toggle
    if (langToggleMobile) {
        langToggleMobile.addEventListener('click', function () {
            if (currentLanguage === 'ar') {
                switchToEnglish();
            } else {
                switchToArabic();
            }
        });
    }

    // Setup desktop header toggle
    if (langToggleDesktop) {
        langToggleDesktop.addEventListener('click', function () {
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

// Make globally available
window.setupLanguageToggle = setupLanguageToggle;
window.switchToEnglish = switchToEnglish;
window.switchToArabic = switchToArabic;
window.updateUserGreeting = updateUserGreeting;
