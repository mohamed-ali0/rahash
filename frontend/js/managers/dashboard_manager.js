/**
 * Dashboard Manager Module
 * Handles dashboard statistics and display
 */

const DashboardManager = {
    // Load dashboard data
    async load() {
        try {
            // Load stats from multiple endpoints since no dedicated stats route
            const [clientsRes, productsRes, reportsRes] = await Promise.all([
                fetch(`${Config.API_BASE_URL}/clients/list?page=1&per_page=1`, {
                    headers: Config.getAuthHeaders()
                }),
                fetch(`${Config.API_BASE_URL}/products/list?page=1&per_page=1`, {
                    headers: Config.getAuthHeaders()
                }),
                fetch(`${Config.API_BASE_URL}/visit-reports/list?page=1&per_page=1`, {
                    headers: Config.getAuthHeaders()
                })
            ]);

            let totalClients = 0, totalProducts = 0, monthlyReports = 0;

            if (clientsRes.ok) {
                const data = await clientsRes.json();
                totalClients = data.total || 0;
            }

            if (productsRes.ok) {
                const data = await productsRes.json();
                totalProducts = data.total || 0;
            }

            if (reportsRes.ok) {
                const data = await reportsRes.json();
                monthlyReports = data.total || 0;
            }

            this.updateStats({ total_clients: totalClients, total_products: totalProducts, monthly_reports: monthlyReports });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },

    // Update stats display
    updateStats(stats) {
        const clientsCount = document.getElementById('totalClients');
        const productsCount = document.getElementById('totalProducts');
        const reportsCount = document.getElementById('monthlyReports');

        if (clientsCount) {
            clientsCount.textContent = stats.total_clients || 0;
        }
        if (productsCount) {
            productsCount.textContent = stats.total_products || 0;
        }
        if (reportsCount) {
            reportsCount.textContent = stats.monthly_reports || 0;
        }
    }
};

window.DashboardManager = DashboardManager;
