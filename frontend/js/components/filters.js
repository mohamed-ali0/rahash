// Filters Component
// Manages filter UI and state

const FiltersComponent = {
    activeFilters: {},

    /**
     * Initialize filters
     * @param {Object} options - Filter configuration
     * @param {HTMLElement} options.filterContainer - Container for filters
     * @param {Function} options.onFilterChange - Callback (filters) => void
     */
    initialize(options = {}) {
        const {
            filterContainer,
            onFilterChange
        } = options;

        if (!filterContainer) {
            console.error('FiltersComponent: filterContainer is required');
            return;
        }

        // Find all filter inputs
        const filterInputs = filterContainer.querySelectorAll('select, input[type="text"]');

        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFilters(filterContainer);
                if (onFilterChange) {
                    onFilterChange(this.activeFilters);
                }
            });
        });
    },

    /**
     * Update active filters from filter container
     * @param {HTMLElement} filterContainer - Container with filter inputs
     */
    updateFilters(filterContainer) {
        this.activeFilters = {};

        const selects = filterContainer.querySelectorAll('select');
        const inputs = filterContainer.querySelectorAll('input[type="text"]');

        selects.forEach(select => {
            if (select.value) {
                this.activeFilters[select.name || select.id] = select.value;
            }
        });

        inputs.forEach(input => {
            if (input.value.trim()) {
                this.activeFilters[input.name || input.id] = input.value.trim();
            }
        });
    },

    /**
     * Clear all filters
     * @param {HTMLElement} filterContainer - Container with filter inputs
     * @param {Function} onFilterChange - Callback after clearing
     */
    clearAll(filterContainer, onFilterChange) {
        if (!filterContainer) return;

        // Clear all select elements
        filterContainer.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });

        // Clear all text inputs
        filterContainer.querySelectorAll('input[type="text"]').forEach(input => {
            input.value = '';
        });

        this.activeFilters = {};

        if (onFilterChange) {
            onFilterChange(this.activeFilters);
        }
    },

    /**
     * Get current active filters
     * @returns {Object} Active filters
     */
    getFilters() {
        return { ...this.activeFilters };
    },

    /**
     * Set filters programmatically
     * @param {Object} filters - Filters to set
     * @param {HTMLElement} filterContainer - Container with filter inputs
     */
    setFilters(filters, filterContainer) {
        this.activeFilters = { ...filters };

        if (filterContainer) {
            Object.keys(filters).forEach(key => {
                const element = filterContainer.querySelector(`[name="${key}"], #${key}`);
                if (element) {
                    element.value = filters[key];
                }
            });
        }
    }
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiltersComponent;
}
