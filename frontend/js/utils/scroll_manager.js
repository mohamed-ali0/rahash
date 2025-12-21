/**
 * Scroll Manager
 * Global scroll management system - simpler and more robust
 */

const ScrollManager = {
    disableCount: 0,
    originalHtmlOverflow: '',
    originalBodyOverflow: '',

    disableScroll: function (source = 'unknown') {
        if (this.disableCount === 0) {
            // Store original overflow styles
            this.originalHtmlOverflow = document.documentElement.style.overflow;
            this.originalBodyOverflow = document.body.style.overflow;

            // Disable scroll on both html and body
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }
        this.disableCount++;
        console.log(`Scroll disabled by: ${source}. Count: ${this.disableCount}`);
    },

    enableScroll: function (source = 'unknown') {
        // Only decrement if the count is greater than 0
        if (this.disableCount > 0) {
            this.disableCount--;
        }

        if (this.disableCount === 0) {
            // Restore original styles only when the last lock is released
            document.documentElement.style.overflow = this.originalHtmlOverflow || '';
            document.body.style.overflow = this.originalBodyOverflow || '';
            console.log(`Scroll enabled by: ${source}. Count is zero.`);
        } else {
            console.log(`Scroll not yet enabled by: ${source}. Count: ${this.disableCount}`);
        }
    },

    // This can be used as a failsafe if needed
    forceEnableScroll: function () {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        this.disableCount = 0;
        console.log('Force scroll enabled.');
    }
};

// Global function to safely close modals and restore scrolling
function closeModalAndRestoreScroll(modal, source = 'closeModalAndRestoreScroll') {
    if (!modal) return;

    try {
        // Hide modal immediately for better UX
        if (modal.style) {
            modal.style.display = 'none';
        }
        if (modal.classList) {
            modal.classList.remove('active');
        }

        // Restore scroll immediately
        ScrollManager.enableScroll(source);

        // Remove modal from DOM after a brief delay
        requestAnimationFrame(() => {
            if (modal && modal.parentNode) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error closing modal:', error);
        // Fallback: force remove
        if (modal && modal.parentNode) {
            modal.remove();
        }
        ScrollManager.forceEnableScroll();
    }
}

// Global function to safely open modals and disable scrolling
function openModalAndDisableScroll(modal, source = 'openModalAndDisableScroll') {
    if (modal) {
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        ScrollManager.disableScroll(source);

        // Add click handler to close modal
        modal.addEventListener('click', function (e) {
            if (e.target === modal || e.target.classList.contains('expanded-close') || e.target.classList.contains('modal-close')) {
                closeModalAndRestoreScroll(modal, 'modal-click');
            }
        });
    }
}

// Make globally available
window.ScrollManager = ScrollManager;
window.closeModalAndRestoreScroll = closeModalAndRestoreScroll;
window.openModalAndDisableScroll = openModalAndDisableScroll;
