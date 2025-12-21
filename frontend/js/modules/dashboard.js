// Dashboard Module
// Handles dashboard data loading and display

const Dashboard = {
    /**
     * Load and display dashboard statistics
     */
    async loadDashboardData() {
        try {
            const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5009/api`;
            const token = localStorage.getItem('authToken');

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Use paginated endpoints for fast counts
            const [clientsResponse, productsResponse, reportsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/clients/list?page=1&per_page=1`, { headers }),
                fetch(`${API_BASE_URL}/products/list?page=1&per_page=1`, { headers }),
                fetch(`${API_BASE_URL}/visit-reports/list?page=1&per_page=1`, { headers })
            ]);

            if (clientsResponse.ok && productsResponse.ok && reportsResponse.ok) {
                const [clientsData, productsData, reportsData] = await Promise.all([
                    clientsResponse.json(),
                    productsResponse.json(),
                    reportsResponse.json()
                ]);

                // Update dashboard counters
                const totalClientsEl = document.getElementById('totalClients');
                const totalProductsEl = document.getElementById('totalProducts');
                const monthlyReportsEl = document.getElementById('monthlyReports');

                if (totalClientsEl) totalClientsEl.textContent = clientsData.total || 0;
                if (totalProductsEl) totalProductsEl.textContent = productsData.total || 0;
                if (monthlyReportsEl) monthlyReportsEl.textContent = reportsData.total || 0;
            } else {
                console.error('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    },

    /**
     * Initialize dashboard
     */
    initialize() {
        this.loadDashboardData();
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}
