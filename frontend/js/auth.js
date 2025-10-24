// Authentication JavaScript

// Global variables
let currentLanguage = 'ar';
// Dynamic API URL - works for both localhost and deployed server
const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth page loaded');
    setupLanguageToggle();
    setupFormHandlers();
});

// Setup language toggle functionality
function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    
    if (langToggle) {
        langToggle.addEventListener('click', function() {
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
    
    // Update language toggle button
    document.getElementById('langToggle').textContent = 'ع';
    
    // Update select options
    updateSelectOptions();
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
    
    // Update language toggle button
    document.getElementById('langToggle').textContent = 'EN';
    
    // Update select options
    updateSelectOptions();
}

// Update select options based on language
function updateSelectOptions() {
    const selectElements = document.querySelectorAll('select option[data-ar]');
    selectElements.forEach(option => {
        const text = currentLanguage === 'ar' ? option.getAttribute('data-ar') : option.getAttribute('data-en');
        option.textContent = text;
    });
}

// Setup form handlers
function setupFormHandlers() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        setupPasswordValidation();
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    showLoading(true);
    clearMessages();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Store authentication token
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userInfo', JSON.stringify(result.user));
            
            showMessage(currentLanguage === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
            
        } else {
            showMessage(result.message || (currentLanguage === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login failed'), 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const signupData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    // Validate password confirmation
    const confirmPassword = formData.get('confirmPassword');
    if (signupData.password !== confirmPassword) {
        showMessage(currentLanguage === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match', 'error');
        return;
    }
    
    showLoading(true);
    clearMessages();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(currentLanguage === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            
        } else {
            showMessage(result.message || (currentLanguage === 'ar' ? 'خطأ في إنشاء الحساب' : 'Account creation failed'), 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

// Setup password validation
function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity(
                    currentLanguage === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match'
                );
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
        
        passwordInput.addEventListener('input', function() {
            if (confirmPasswordInput.value) {
                if (passwordInput.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.setCustomValidity(
                        currentLanguage === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match'
                    );
                } else {
                    confirmPasswordInput.setCustomValidity('');
                }
            }
        });
    }
}

// Show loading overlay
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }
}

// Show messages (success/error)
function showMessage(message, type = 'info') {
    clearMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    const form = document.querySelector('.auth-form');
    if (form) {
        form.insertBefore(messageDiv, form.firstChild);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Clear all messages
function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message, .info-message');
    messages.forEach(message => message.remove());
}

// Form validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Redirect to dashboard if already logged in
        window.location.href = '/dashboard';
    }
}

// Call on page load for auth pages
if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
    checkAuthStatus();
}
