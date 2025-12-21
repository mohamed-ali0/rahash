/**
 * // Team Management Functions
 * Extracted from main.js for modular architecture
 */

// =====================================================
// TEAM MANAGEMENT (Supervisors)
// =====================================================

const TeamManager = {

    currentSalesmen: [],
    allClients: [],
    allAssignedClients: [],
    selectedClientId: null,
    allRegions: [],
    batchMode: false,
    selectedClientIds: new Set(),

    loadSalesmen: async function () {
        try {
            const response = await fetch(`${API_BASE_URL}/supervisors/salesmen`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const salesmen = await response.json();
                this.currentSalesmen = salesmen;
                this.displaySalesmen(salesmen);
                this.populateSalesmanSelect(salesmen);
                this.updateSalesmenCount(salesmen.length);
                this.populateTeamSalesmanFilter(salesmen);
            } else {
                console.error('Failed to load salesmen');
            }
        } catch (error) {
            console.error('Error loading salesmen:', error);
        }
    },

    updateSalesmenCount: function (count) {
        const countBadge = document.getElementById('salesmenCount');
        if (countBadge) {
            countBadge.textContent = count;
        }
    },

    setupSearchFilter: function () {
        const searchInput = document.getElementById('salesmanSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                this.filterSalesmen(searchTerm);
            });
        }

        // Setup client search with autocomplete
        const clientSearchInput = document.getElementById('teamClientSearchInput');
        if (clientSearchInput) {
            let searchTimeout;
            clientSearchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const searchTerm = e.target.value.toLowerCase().trim();

                if (searchTerm.length < 2) {
                    document.getElementById('teamClientSearchResults').style.display = 'none';
                    return;
                }

                searchTimeout = setTimeout(() => {
                    this.searchClients(searchTerm);
                }, 300);
            });

            // Close results when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.client-search-container')) {
                    document.getElementById('teamClientSearchResults').style.display = 'none';
                }
            });
        }
    },

    filterSalesmen: function (searchTerm) {
        if (!searchTerm) {
            this.displaySalesmen(this.currentSalesmen);
            this.updateSalesmenCount(this.currentSalesmen.length);
            return;
        }

        const filtered = this.currentSalesmen.filter(salesman =>
            salesman.username.toLowerCase().includes(searchTerm) ||
            salesman.email.toLowerCase().includes(searchTerm)
        );

        this.displaySalesmen(filtered);
        this.updateSalesmenCount(filtered.length);
    },

    showAssignmentSection: function () {
        const section = document.getElementById('assignmentSection');
        section.style.display = 'block';
        // Don't use scrollIntoView - it can cause layout issues
        // Just show the section naturally
    },

    hideAssignmentSection: function () {
        document.getElementById('assignmentSection').style.display = 'none';
        this.selectedClientId = null;
        document.getElementById('teamClientSearchInput').value = '';
        document.getElementById('teamClientSearchResults').style.display = 'none';
    },

    displaySalesmen: function (salesmen) {
        const salesmenList = document.getElementById('salesmenList');

        if (salesmen.length === 0) {
            salesmenList.innerHTML = `
                <div class="empty-state">
                    <p>${currentLanguage === 'ar' ? 'لا يوجد مندوبين مسجلين' : 'No salesmen registered'}</p>
                </div>
            `;
            return;
        }

        salesmenList.innerHTML = salesmen.map(salesman => `
            <div class="salesman-card" onclick="TeamManager.viewSalesmanClients(${salesman.id})">
                <div class="salesman-header">
                    <div class="salesman-avatar">👤</div>
                    <div class="salesman-info">
                        <h3>${salesman.username}</h3>
                        <p>${salesman.email}</p>
                    </div>
                </div>
                <div class="salesman-stats">
                    <div class="stat-item">
                        <span class="stat-label">${currentLanguage === 'ar' ? 'العملاء' : 'Clients'}</span>
                        <span class="stat-value">${salesman.client_count}</span>
                    </div>
                </div>
                <button class="btn btn-secondary" onclick="event.stopPropagation(); TeamManager.viewSalesmanClients(${salesman.id})">
                    ${currentLanguage === 'ar' ? 'عرض العملاء' : 'View Clients'}
                </button>
            </div>
        `).join('');
    },

    populateSalesmanSelect: function (salesmen) {
        const select = document.getElementById('salesmanSelect');
        if (!select) return;

        select.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'اختر مندوب' : 'Select Salesman'}</option>`;
        salesmen.forEach(salesman => {
            const option = document.createElement('option');
            option.value = salesman.id;
            option.textContent = salesman.username;
            select.appendChild(option);
        });
    },

    viewSalesmanClients: async function (salesmanId) {
        try {
            const response = await fetch(`${API_BASE_URL}/supervisors/salesmen/${salesmanId}/clients`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const clients = await response.json();
                this.displaySalesmanClients(salesmanId, clients);
            } else {
                alert(currentLanguage === 'ar' ? 'فشل في تحميل العملاء' : 'Failed to load clients');
            }
        } catch (error) {
            console.error('Error loading salesman clients:', error);
        }
    },

    displaySalesmanClients: function (salesmanId, clients) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const salesman = this.currentSalesmen.find(s => s.id === salesmanId);
        const salesmanName = salesman ? salesman.username : 'Salesman';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'عملاء' : 'Clients of'} ${salesmanName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${clients.length === 0 ?
                `<p class="no-data">${currentLanguage === 'ar' ? 'لا يوجد عملاء مخصصين' : 'No clients assigned'}</p>` :
                `<div class="clients-list">
                            ${clients.map(client => `
                                <div class="client-item">
                                    <span class="client-name">${client.name}</span>
                                    <span class="client-region">${client.region || ''}</span>
                                    <button class="btn btn-sm btn-danger" onclick="TeamManager.unassignClient(${client.id})">
                                        ${currentLanguage === 'ar' ? 'إلغاء التعيين' : 'Unassign'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>`
            }
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    loadClientNamesOnly: async function () {
        try {
            const response = await fetch(`${API_BASE_URL}/clients/names`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                this.allClients = await response.json();
                console.log(`Loaded ${this.allClients.length} clients for assignment`);
            }
        } catch (error) {
            console.error('Error loading client names:', error);
        }
    },

    searchClients: function (searchTerm) {
        const filtered = this.allClients.filter(client =>
            client.name.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 results

        this.displaySearchResults(filtered);
    },

    displaySearchResults: function (clients) {
        const resultsDiv = document.getElementById('teamClientSearchResults');

        if (clients.length === 0) {
            resultsDiv.innerHTML = `<div class="search-result-item no-results">${currentLanguage === 'ar' ? 'لا توجد نتائج' : 'No results'}</div>`;
            resultsDiv.style.display = 'block';
            return;
        }

        resultsDiv.innerHTML = clients.map(client => `
            <div class="search-result-item" onclick="TeamManager.selectClient(${client.id}, '${client.name.replace(/'/g, "\\'")}')">
                <div class="result-name">${client.name}</div>
                <div class="result-region">${client.region || ''}</div>
            </div>
        `).join('');

        resultsDiv.style.display = 'block';
    },

    selectClient: function (clientId, clientName) {
        this.selectedClientId = clientId;
        document.getElementById('teamClientSearchInput').value = clientName;
        document.getElementById('teamClientSearchResults').style.display = 'none';
    },

    assignClient: async function () {
        const salesmanId = document.getElementById('salesmanSelect').value;
        const clientId = this.selectedClientId;

        if (!salesmanId || !clientId) {
            alert(currentLanguage === 'ar' ? 'الرجاء اختيار مندوب وعميل' : 'Please select a salesman and client');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/supervisors/assign-client`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    salesman_id: parseInt(salesmanId),
                    client_id: parseInt(clientId)
                })
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم تعيين العميل بنجاح' : 'Client assigned successfully');
                this.loadSalesmen();
                this.selectedClientId = null;
                document.getElementById('teamClientSearchInput').value = '';
            } else {
                const error = await response.json();
                alert(error.message || (currentLanguage === 'ar' ? 'فشل في تعيين العميل' : 'Failed to assign client'));
            }
        } catch (error) {
            console.error('Error assigning client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    unassignClient: async function (clientId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل تريد إلغاء تعيين هذا العميل؟' : 'Unassign this client?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/supervisors/unassign-client/${clientId}`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم إلغاء التعيين بنجاح' : 'Client unassigned successfully');
                // Close modal and reload
                document.querySelector('.modal-overlay')?.remove();
                this.loadSalesmen();
                // Reload filtered clients if visible
                if (document.getElementById('teamClientFilters').style.display === 'block') {
                    this.loadFilteredClients();
                }
            } else {
                const error = await response.json();
                alert(error.message || (currentLanguage === 'ar' ? 'فشل في إلغاء التعيين' : 'Failed to unassign client'));
            }
        } catch (error) {
            console.error('Error unassigning client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    // Toggle client filters section
    toggleClientFilters: function () {
        const filtersDiv = document.getElementById('teamClientFilters');
        if (filtersDiv.style.display === 'none' || !filtersDiv.style.display) {
            filtersDiv.style.display = 'block';
            this.loadFilteredClients();
        } else {
            filtersDiv.style.display = 'none';
        }
    },

    // Populate salesman filter for team client filtering
    populateTeamSalesmanFilter: function (salesmen) {
        const select = document.getElementById('teamSalesmanFilter');
        if (!select) return;

        select.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'جميع المندوبين' : 'All Salesmen'}</option>`;
        salesmen.forEach(salesman => {
            const option = document.createElement('option');
            option.value = salesman.id;
            option.textContent = salesman.username;
            select.appendChild(option);
        });
    },

    // Load all assigned clients for filtering
    loadFilteredClients: async function () {
        const salesmanId = document.getElementById('teamSalesmanFilter').value;
        const regionFilter = document.getElementById('teamRegionFilter').value;
        const searchTerm = document.getElementById('teamClientSearch').value.toLowerCase().trim();

        try {
            // If salesman is selected, load that salesman's clients
            if (salesmanId) {
                const response = await fetch(`${API_BASE_URL}/supervisors/salesmen/${salesmanId}/clients`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    let clients = await response.json();
                    this.allAssignedClients = clients;
                    this.extractRegions(clients);
                    this.applyClientFilters(clients, regionFilter, searchTerm);
                }
            } else {
                // Load all clients for all salesmen (show_all=true to get complete list)
                const response = await fetch(`${API_BASE_URL}/clients/list?show_all=true`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    let clients = data.clients || data;
                    // Filter only assigned clients
                    clients = clients.filter(c => c.assigned_user_id);
                    this.allAssignedClients = clients;
                    this.extractRegions(clients);
                    this.applyClientFilters(clients, regionFilter, searchTerm);
                }
            }
        } catch (error) {
            console.error('Error loading filtered clients:', error);
        }
    },

    // Extract unique regions from clients
    extractRegions: function (clients) {
        const regions = [...new Set(clients.map(c => c.region).filter(r => r))];
        this.allRegions = regions;
        this.populateTeamRegionFilter(regions);
    },

    // Populate region filter
    populateTeamRegionFilter: function (regions) {
        const select = document.getElementById('teamRegionFilter');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>`;
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            select.appendChild(option);
        });
        select.value = currentValue;
    },

    // Apply filters to clients
    applyClientFilters: function (clients, regionFilter, searchTerm) {
        let filtered = clients;

        if (regionFilter) {
            filtered = filtered.filter(c => c.region === regionFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm)
            );
        }

        this.displayFilteredClients(filtered);
    },

    // Display filtered clients
    displayFilteredClients: function (clients) {
        const container = document.getElementById('teamFilteredClients');

        if (clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${currentLanguage === 'ar' ? 'لا توجد عملاء' : 'No clients found'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = clients.map(client => {
            const salesman = this.currentSalesmen.find(s => s.id === client.assigned_user_id);
            const salesmanName = salesman ? salesman.username : (currentLanguage === 'ar' ? 'غير معين' : 'Unassigned');

            return `
                <div class="filtered-client-card">
                    <div class="client-card-header">
                        <h4>${client.name}</h4>
                        <span class="client-badge">${client.region || ''}</span>
                    </div>
                    <div class="client-card-body">
                        <div class="client-info-item">
                            <span class="info-label">${currentLanguage === 'ar' ? 'المندوب:' : 'Salesman:'}</span>
                            <span class="info-value">${salesmanName}</span>
                        </div>
                        <div class="client-info-item">
                            <span class="info-label">${currentLanguage === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                            <span class="info-value">${client.phone || '-'}</span>
                        </div>
                    </div>
                    <div class="client-card-actions">
                        <button class="btn btn-sm btn-secondary" onclick="ClientManager.viewClientDetails(${client.id})">
                            ${currentLanguage === 'ar' ? 'عرض' : 'View'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="TeamManager.quickUnassignClient(${client.id})">
                            ${currentLanguage === 'ar' ? 'إلغاء التعيين' : 'Unassign'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Quick unassign without opening modal
    quickUnassignClient: async function (clientId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل تريد إلغاء تعيين هذا العميل؟' : 'Unassign this client?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/supervisors/unassign-client/${clientId}`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم إلغاء التعيين بنجاح' : 'Client unassigned successfully');
                this.loadSalesmen();
                this.loadFilteredClients();
            } else {
                const error = await response.json();
                alert(error.message || (currentLanguage === 'ar' ? 'فشل في إلغاء التعيين' : 'Failed to unassign client'));
            }
        } catch (error) {
            console.error('Error unassigning client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    // Clear all filters
    clearFilters: function () {
        document.getElementById('teamSalesmanFilter').value = '';
        document.getElementById('teamRegionFilter').value = '';
        document.getElementById('teamClientSearch').value = '';
        this.loadFilteredClients();
    },

    // Toggle between single and batch assignment mode
    toggleBatchMode: function () {
        this.batchMode = !this.batchMode;
        const singleMode = document.getElementById('singleAssignmentMode');
        const batchMode = document.getElementById('batchAssignmentMode');
        const batchModeBtn = document.getElementById('batchModeBtn');

        if (this.batchMode) {
            singleMode.style.display = 'none';
            batchMode.style.display = 'block';
            batchModeBtn.classList.add('active');
            this.populateBatchSalesmanSelect();
            this.loadBatchClientsList();
        } else {
            singleMode.style.display = 'grid';
            batchMode.style.display = 'none';
            batchModeBtn.classList.remove('active');
            this.selectedClientIds.clear();
        }
    },

    // Populate salesman select for batch mode
    populateBatchSalesmanSelect: function () {
        const select = document.getElementById('batchSalesmanSelect');
        if (!select) return;

        select.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'اختر مندوب' : 'Select Salesman'}</option>`;
        this.currentSalesmen.forEach(salesman => {
            const option = document.createElement('option');
            option.value = salesman.id;
            option.textContent = salesman.username;
            select.appendChild(option);
        });
    },

    // Load clients list with checkboxes - OPTIMIZED (names only, super fast!)
    loadBatchClientsList: async function () {
        const container = document.getElementById('batchClientsList');
        const searchInput = document.getElementById('batchClientSearch');

        // Setup search (only once)
        if (!searchInput.dataset.initialized) {
            searchInput.addEventListener('input', (e) => {
                this.applyBatchFilters();
            });
            searchInput.dataset.initialized = 'true';
        }

        container.innerHTML = `<div class="loading-text">${currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>`;

        try {
            // Use optimized endpoint - only loads ID, name, region, salesman_name (no images, no person data)
            const response = await fetch(`${API_BASE_URL}/clients/names-with-salesman`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                this.allClients = await response.json();
                console.log(`⚡ Fast loaded ${this.allClients.length} clients for batch assignment`);
                this.extractBatchFilters(this.allClients);
                this.displayBatchClientsList(this.allClients);
            }
        } catch (error) {
            console.error('Error loading clients for batch:', error);
            container.innerHTML = `<div class="error-text">${currentLanguage === 'ar' ? 'خطأ في التحميل' : 'Loading error'}</div>`;
        }
    },

    // Extract regions and salesmen for filters
    extractBatchFilters: function (clients) {
        // Extract unique regions
        const regions = [...new Set(clients.map(c => c.region).filter(r => r))].sort();
        const regionFilter = document.getElementById('batchRegionFilter');
        if (regionFilter) {
            const currentValue = regionFilter.value;
            regionFilter.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>`;
            regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionFilter.appendChild(option);
            });
            regionFilter.value = currentValue;
        }

        // Extract unique salesman names
        const salesmen = [...new Set(clients.map(c => c.salesman_name).filter(s => s))].sort();
        const salesmanFilter = document.getElementById('batchSalesmanNameFilter');
        if (salesmanFilter) {
            const currentValue = salesmanFilter.value;
            salesmanFilter.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'جميع المندوبين' : 'All Salesmen'}</option>`;
            salesmen.forEach(salesman => {
                const option = document.createElement('option');
                option.value = salesman;
                option.textContent = salesman;
                salesmanFilter.appendChild(option);
            });
            salesmanFilter.value = currentValue;
        }
    },

    // Display clients with checkboxes
    displayBatchClientsList: function (clients) {
        const container = document.getElementById('batchClientsList');

        if (clients.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>${currentLanguage === 'ar' ? 'لا توجد عملاء' : 'No clients'}</p></div>`;
            return;
        }

        container.innerHTML = clients.map(client => `
            <div class="batch-client-item">
                <label class="checkbox-label">
                    <input 
                        type="checkbox" 
                        class="client-checkbox" 
                        data-client-id="${client.id}"
                        onchange="TeamManager.toggleClientSelection(${client.id})"
                        ${this.selectedClientIds.has(client.id) ? 'checked' : ''}
                    >
                    <span class="checkbox-custom"></span>
                    <div class="client-details">
                        <span class="client-name-batch">${client.name}</span>
                        <div class="client-meta-batch">
                            ${client.region ? `<span class="client-region-batch">${client.region}</span>` : ''}
                            ${client.salesman_name ? `<span class="client-salesman-batch">${currentLanguage === 'ar' ? 'المندوب:' : 'Salesman:'} ${client.salesman_name}</span>` : ''}
                        </div>
                    </div>
                </label>
            </div>
        `).join('');
    },

    // Apply all batch filters (search + region + salesman)
    applyBatchFilters: function () {
        const searchTerm = document.getElementById('batchClientSearch').value.toLowerCase().trim();
        const regionFilter = document.getElementById('batchRegionFilter').value;
        const salesmanFilter = document.getElementById('batchSalesmanNameFilter').value;

        let filtered = this.allClients;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.name.toLowerCase().includes(searchTerm) ||
                (client.region && client.region.toLowerCase().includes(searchTerm)) ||
                (client.salesman_name && client.salesman_name.toLowerCase().includes(searchTerm))
            );
        }

        // Apply region filter
        if (regionFilter) {
            filtered = filtered.filter(client => client.region === regionFilter);
        }

        // Apply salesman filter
        if (salesmanFilter) {
            filtered = filtered.filter(client => client.salesman_name === salesmanFilter);
        }

        this.displayBatchClientsList(filtered);
    },

    // Clear batch filters
    clearBatchFilters: function () {
        document.getElementById('batchClientSearch').value = '';
        document.getElementById('batchRegionFilter').value = '';
        document.getElementById('batchSalesmanNameFilter').value = '';
        this.applyBatchFilters();
    },

    // Toggle individual client selection
    toggleClientSelection: function (clientId) {
        if (this.selectedClientIds.has(clientId)) {
            this.selectedClientIds.delete(clientId);
        } else {
            this.selectedClientIds.add(clientId);
        }
        this.updateBatchAssignButton();
    },

    // Select all visible clients
    selectAllClients: function () {
        const checkboxes = document.querySelectorAll('.client-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const clientId = parseInt(checkbox.dataset.clientId);
            this.selectedClientIds.add(clientId);
        });
        this.updateBatchAssignButton();
    },

    // Deselect all clients
    deselectAllClients: function () {
        const checkboxes = document.querySelectorAll('.client-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.selectedClientIds.clear();
        this.updateBatchAssignButton();
    },

    // Update batch assign button text with count
    updateBatchAssignButton: function () {
        const btnText = document.getElementById('batchAssignBtnText');
        const count = this.selectedClientIds.size;

        if (currentLanguage === 'ar') {
            btnText.textContent = `تعيين المحددين (${count})`;
        } else {
            btnText.textContent = `Assign Selected (${count})`;
        }
    },

    // Batch assign selected clients to salesman
    batchAssignClients: async function () {
        const salesmanId = document.getElementById('batchSalesmanSelect').value;

        if (!salesmanId) {
            alert(currentLanguage === 'ar' ? 'الرجاء اختيار مندوب' : 'Please select a salesman');
            return;
        }

        if (this.selectedClientIds.size === 0) {
            alert(currentLanguage === 'ar' ? 'الرجاء اختيار عملاء' : 'Please select clients');
            return;
        }

        const clientIds = Array.from(this.selectedClientIds);
        const confirmMsg = currentLanguage === 'ar' ?
            `هل تريد تعيين ${clientIds.length} عميل؟` :
            `Assign ${clientIds.length} clients?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        try {
            let successCount = 0;
            let failCount = 0;

            // Show progress
            const btnText = document.getElementById('batchAssignBtnText');
            const originalText = btnText.textContent;

            for (let i = 0; i < clientIds.length; i++) {
                btnText.textContent = currentLanguage === 'ar' ?
                    `جاري التعيين... (${i + 1}/${clientIds.length})` :
                    `Assigning... (${i + 1}/${clientIds.length})`;

                const response = await fetch(`${API_BASE_URL}/supervisors/assign-client`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        salesman_id: parseInt(salesmanId),
                        client_id: clientIds[i]
                    })
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            btnText.textContent = originalText;

            // Show results
            const resultMsg = currentLanguage === 'ar' ?
                `تم تعيين ${successCount} عميل بنجاح${failCount > 0 ? `, فشل ${failCount}` : ''}` :
                `${successCount} clients assigned successfully${failCount > 0 ? `, ${failCount} failed` : ''}`;

            alert(resultMsg);

            // Reset and reload
            this.selectedClientIds.clear();
            this.deselectAllClients();
            this.loadSalesmen();

        } catch (error) {
            console.error('Error in batch assignment:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في التعيين' : 'Assignment error');
        }
    }
};


// Make globally available
window.TeamManager = TeamManager;
