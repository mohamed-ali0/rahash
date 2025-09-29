// Landing Page JavaScript

// Global variables
let currentLanguage = 'ar';

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page loaded');
    setupLanguageToggle();
    setupScrollEffects();
    checkAuthStatus();
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
}

// Setup scroll effects and animations
function setupScrollEffects() {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .hero-content, .cta-content');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove shadow based on scroll position
        if (scrollTop > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
}

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
        // Update navigation for logged in user
        updateNavForLoggedInUser(JSON.parse(userInfo));
    }
}

// Update navigation for logged in users
function updateNavForLoggedInUser(userInfo) {
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <button id="langToggle" class="btn-lang">EN</button>
            <span class="user-greeting">
                ${currentLanguage === 'ar' ? 'مرحباً' : 'Hello'}, ${userInfo.username}
            </span>
            <a href="/dashboard" class="btn btn-primary">
                ${currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </a>
            <button onclick="logout()" class="btn btn-outline">
                ${currentLanguage === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
        `;
        
        // Re-setup language toggle
        setupLanguageToggle();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    
    // Show confirmation message
    const message = currentLanguage === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully';
    
    // Create temporary message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove message and refresh page
    setTimeout(() => {
        messageDiv.remove();
        location.reload();
    }, 2000);
}

// Parallax effect for hero section
function setupParallax() {
    const heroSection = document.querySelector('.hero');
    const heroPlaceholder = document.querySelector('.hero-placeholder');
    
    if (heroSection && heroPlaceholder) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            
            heroPlaceholder.style.transform = `translateY(${parallax}px)`;
        });
    }
}

// Initialize parallax on load
document.addEventListener('DOMContentLoaded', function() {
    setupParallax();
});

// Feature cards hover effect
function setupFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle animation or effect
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Call feature cards setup
document.addEventListener('DOMContentLoaded', function() {
    setupFeatureCards();
});

// Typing effect for hero title (optional enhancement)
function typewriterEffect() {
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            heroTitle.textContent += text.charAt(i);
            i++;
            
            if (i >= text.length) {
                clearInterval(typeInterval);
            }
        }, 100);
    }
}

// Counter animation for statistics (if we add them later)
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const speed = 200;
        const increment = target / speed;
        let count = 0;
        
        const updateCount = () => {
            if (count < target) {
                count += increment;
                counter.textContent = Math.floor(count);
                requestAnimationFrame(updateCount);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCount();
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animation to page
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
