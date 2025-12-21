// Search Component
// Handles search functionality with debouncing and live results

const SearchComponent = {
    /**
     * Initialize a search input with live search functionality
     * @param {Object} options - Search configuration
     * @param {HTMLElement} options.inputElement - Search input element
     * @param {Function} options.onSearch - Callback function (searchTerm) => void
     * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 300)
     * @param {number} options.minLength - Minimum character length to trigger search (default: 2)
     */
    initialize(options = {}) {
        const {
            inputElement,
            onSearch,
            debounceMs = 300,
            minLength = 2
        } = options;

        if (!inputElement || !onSearch) {
            console.error('SearchComponent: inputElement and onSearch are required');
            return;
        }

        let debounceTimer = null;

        inputElement.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();

            // Clear previous timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            // Don't search if below minimum length
            if (searchTerm.length > 0 && searchTerm.length < minLength) {
                return;
            }

            // Debounce the search
            debounceTimer = setTimeout(() => {
                onSearch(searchTerm);
            }, debounceMs);
        });

        // Also trigger search on Enter key
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                const searchTerm = e.target.value.trim();
                if (searchTerm.length === 0 || searchTerm.length >= minLength) {
                    onSearch(searchTerm);
                }
            }
        });
    },

    /**
     * Clear a search input and trigger search
     * @param {HTMLElement} inputElement - Search input to clear
     * @param {Function} onSearch - Search callback
     */
    clear(inputElement, onSearch) {
        if (inputElement) {
            inputElement.value = '';
            if (onSearch) {
                onSearch('');
            }
        }
    },

    /**
     * Highlight search term in text
     * @param {string} text - Text to highlight in
     * @param {string} searchTerm - Term to highlight
     * @returns {string} HTML with highlighted term
     */
    highlightTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchComponent;
}
