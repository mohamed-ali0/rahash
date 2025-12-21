/**
 * // Report Management Functions
 * Extracted from main.js for modular architecture
 */


// Report Management Functions
const ReportManager = {
    currentReports: [],

    showAddReportForm: function () {
        // Create comprehensive add visit report modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        // Load predefined notes
        this.loadPredefinedNotes();
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة تقرير زيارة جديد' : 'Add New Visit Report'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form id="addReportForm" onsubmit="ReportManager.saveNewReport(event)">
                    
                    <!-- Basic Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات الزيارة الأساسية' : 'Basic Visit Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'العميل' : 'Client'} *</label>
                                <div class="searchable-select" id="clientSelectContainer">
                                    <input type="text" 
                                           class="searchable-input" 
                                           id="clientSearchInput"
                                           placeholder="${currentLanguage === 'ar' ? 'ابحث عن العميل...' : 'Search for client...'}"
                                           autocomplete="off"
                                           required>
                                    <div class="searchable-dropdown" id="clientDropdown">
                                        <div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر العميل' : 'Select Client'}</div>
                                    </div>
                                    <input type="hidden" name="client_id" id="selectedClientId">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'تاريخ الزيارة' : 'Visit Date'} *</label>
                                <input type="date" name="visit_date" required>
                            </div>
                        </div>
                        
                        <!-- Client Last Report Summary -->
                        <div id="clientSummaryContainer" class="client-summary-container" style="display: none;">
                            <div class="client-summary-header">
                                <h5>${currentLanguage === 'ar' ? 'ملخص آخر تقرير للعميل' : 'Client Last Report Summary'}</h5>
                            </div>
                            <div id="clientSummaryContent" class="client-summary-content">
                                <!-- Summary content will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Visit Images Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'صور الزيارة' : 'Visit Images'}</h4>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور من الزيارة' : 'Photos from Visit'}</label>
                            <input type="file" name="visit_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكن اختيار عدة صور من الزيارة' : 'You can select multiple photos from the visit'}</small>
                        </div>
                    </div>

                    <!-- Suggested Products Images Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'صور المنتجات المقترحة' : 'Suggested Products Images'}</h4>
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" name="has_suggested_products" id="hasSuggestedProductsCheckbox" onchange="ReportManager.toggleSuggestedProductsImages(this)">
                                ${currentLanguage === 'ar' ? 'إضافة صور للمنتجات المقترحة' : 'Add suggested products images'}
                            </label>
                        </div>
                        <div class="form-group suggested-products-section" id="suggestedProductsSection" style="display: none;">
                            <label>${currentLanguage === 'ar' ? 'صور المنتجات المقترحة' : 'Suggested Products Images'}</label>
                            <input type="file" name="suggested_products_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكن اختيار عدة صور للمنتجات المقترحة' : 'You can select multiple images for suggested products'}</small>
                        </div>
                    </div>

                    <!-- Products Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'منتجات الزيارة' : 'Visit Products'}</h4>
                        <div id="productsContainer">
                            <div class="form-group product-group">
                                <div class="product-header">
                                    <label>${currentLanguage === 'ar' ? 'منتج' : 'Product'} 1</label>
                                    <button type="button" class="remove-product-btn" onclick="ReportManager.removeProduct(this)" style="display: none;">
                                        ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
                                    </button>
                                </div>
                                <div class="product-fields">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label>${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</label>
                                            <div class="searchable-select product-select-container">
                                                <input type="text" 
                                                       class="searchable-input product-search-input" 
                                                       placeholder="${currentLanguage === 'ar' ? 'ابحث عن المنتج...' : 'Search for product...'}"
                                                       autocomplete="off">
                                                <div class="searchable-dropdown product-dropdown">
                                                    <div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</div>
                                                </div>
                                                <input type="hidden" name="products[0][product_id]" class="selected-product-id">
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label>${currentLanguage === 'ar' ? 'السعر المعروض' : 'Displayed Price'}</label>
                                            <input type="number" name="products[0][displayed_price]" step="0.01" min="0" placeholder="0.00">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group checkbox-group">
                                            <label>
                                                <input type="checkbox" name="products[0][nearly_expired]" onchange="ReportManager.toggleExpiryDate(this)">
                                                ${currentLanguage === 'ar' ? 'منتهي أو قارب على الانتهاء' : 'Expired or Nearly Expired'}
                                            </label>
                                        </div>
                                        <div class="form-group expiry-group" style="display: none;">
                                            <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                                            <input type="date" name="products[0][expiry_date]">
                                        </div>
                                        <div class="form-group expiry-group" style="display: none;">
                                            <label>${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Units Count'}</label>
                                            <input type="number" name="products[0][units_count]" min="1" placeholder="${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Number of units'}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="ReportManager.addProduct()">
                            ${currentLanguage === 'ar' ? '+ إضافة منتج' : '+ Add Product'}
                        </button>
                    </div>

                    <!-- Predefined Notes Section -->
                    <div class="form-section" id="predefinedNotesSection">
                        <h4>${currentLanguage === 'ar' ? 'الملاحظات المحددة مسبقاً' : 'Predefined Notes'}</h4>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'اختر سؤال محدد مسبقاً' : 'Select Predefined Question'}</label>
                            <select id="predefinedQuestionSelect" onchange="ReportManager.handlePredefinedQuestionChange()">
                                <option value="">${currentLanguage === 'ar' ? '-- اختر سؤال --' : '-- Select Question --'}</option>
                            </select>
                        </div>
                        <div id="predefinedAnswersContainer">
                            <!-- Predefined answers will be added here -->
                        </div>
                    </div>

                    <!-- Notes Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'ملاحظات الزيارة' : 'Visit Notes'}</h4>
                        <div id="notesContainer">
                            <div class="form-group note-group">
                                <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</label>
                                <textarea name="notes[]" rows="3" placeholder="${currentLanguage === 'ar' ? 'اكتب ملاحظة عن الزيارة...' : 'Write a note about the visit...'}"></textarea>
                                <button type="button" class="remove-note-btn" onclick="ReportManager.removeNote(this)" style="display: none;">
                                    ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
                                </button>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="ReportManager.addNote()">
                            ${currentLanguage === 'ar' ? '+ إضافة ملاحظة' : '+ Add Note'}
                        </button>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة التقرير' : 'Add Report'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'addReportForm');

        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addReportForm-close-btn');
            });
        }

        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addReportForm-cancel-btn');
            });
        }

        // Hide predefined notes section for salesmen
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                if (user.role === 'salesman') {
                    const predefinedNotesSection = document.getElementById('predefinedNotesSection');
                    if (predefinedNotesSection) {
                        predefinedNotesSection.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error checking user role:', error);
            }
        }

        // Load clients and products for the dropdowns
        this.loadClientsForDropdown();
        this.loadProductsForDropdown();
    },

    loadReports: async function (statusFilter = 'active') {
        try {
            // Show loading state immediately (Arabic/English)
            const reportsList = document.getElementById('reportsList');
            const loadingText = currentLanguage === 'ar' ? 'جاري تحميل التقارير...' : 'Loading reports...';
            reportsList.innerHTML = `
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${loadingText}</p>
                </div>
            `;

            // Use lightweight list endpoint for FAST loading (metadata only, no images)
            let apiUrl = `${API_BASE_URL}/visit-reports/list`;
            if (statusFilter === 'all' || statusFilter === 'inactive') {
                apiUrl += '?show_all=true';
            }

            console.log('Loading reports from:', apiUrl);
            console.log('Auth headers:', getAuthHeaders());
            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                let reports = data.reports || data; // Handle both old and new format

                // Client-side filtering based on status
                if (statusFilter === 'active') {
                    reports = reports.filter(report => report.is_active !== false);
                } else if (statusFilter === 'inactive') {
                    reports = reports.filter(report => report.is_active === false);
                }
                // 'all' shows everything as loaded

                this.currentReports = reports;
                this.currentStatusFilter = statusFilter;

                // Display cards immediately (without images)
                this.displayReportsLazy(reports);

                // Store pagination info for infinite scroll
                this.currentReportPage = data.page || 1;
                this.hasMoreReports = data.has_more || false;
                this.totalReports = data.total || reports.length;

                console.log(`ReportManager: hasMoreReports = ${this.hasMoreReports}, total = ${this.totalReports}`);

                // Add load more button if there are more reports
                this.addLoadMoreButton('reports');

                // Note: Infinite scroll now uses Intersection Observer in addLoadMoreButton

                // Update status indicator
                this.updateStatusIndicator('reports', statusFilter, this.totalReports);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to load reports:', response.status, errorData);
                reportsList.innerHTML = `<p class="no-data">Error loading reports: ${errorData.message || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            const reportsList = document.getElementById('reportsList');
            reportsList.innerHTML = '<p class="no-data">Error loading visit reports</p>';
        }
    },

    filterReports: async function (searchTerm = '') {
        // If search term is provided, use backend search for ALL reports
        if (searchTerm && searchTerm.trim()) {
            await this.searchReports(searchTerm.trim());
        } else {
            // No search term - reload normal reports
            const statusFilter = document.getElementById('reportStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            await this.loadReports(currentStatus);
        }
    },

    searchReports: async function (searchTerm) {
        /**Search ALL reports by client name using backend API*/
        try {
            const statusFilter = document.getElementById('reportStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';

            let apiUrl = `${API_BASE_URL}/visit-reports/search?q=${encodeURIComponent(searchTerm)}&page=1&per_page=100`;
            if (currentStatus === 'all' || currentStatus === 'inactive') {
                apiUrl += '&show_all=true';
            }

            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const searchResults = data.reports || [];

                const reportsList = document.getElementById('reportsList');
                if (!reportsList) return;

                // Display results
                if (searchResults.length === 0) {
                    reportsList.innerHTML = `
                        <div class="empty-state">
                            <h3>${currentLanguage === 'ar' ? 'لم يتم العثور على تقارير' : 'No reports found'}</h3>
                            <p>${currentLanguage === 'ar' ? 'لا توجد تقارير تطابق بحثك' : 'No reports match your search'}</p>
                        </div>
                    `;
                } else {
                    // Store and display search results
                    this.currentReports = searchResults;
                    this.totalReports = data.total;
                    this.displayReports(searchResults, false);
                }

                // --- FIX: Disable infinite scroll for search results ---
                const loadMoreBtn = document.querySelector('#reportsList .load-more-button');
                if (loadMoreBtn) {
                    loadMoreBtn.remove();
                }
                this.hasMoreReports = false; // Prevent observer from firing
                // -------------------------------------------------------

                // Update count
                this.updateStatusIndicator('reports', currentStatus, data.total);
            } else {
                console.error('Failed to search reports');
            }
        } catch (error) {
            console.error('Error searching reports:', error);
        }
    },

    displayReportsLazy: function (reports, append = false) {
        // Display report cards immediately WITHOUT images (FAST rendering)
        const reportsList = document.getElementById('reportsList');
        if (reports.length === 0 && !append) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد تقارير' : 'No Reports'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة تقرير زيارة جديد' : 'Start by adding a new visit report'}</p>
                </div>
            `;
        } else {
            // Use old displayReports function for consistent card design
            this.displayReports(reports, append);
        }
    },

    displayReports: function (reports, append = false) {
        const reportsList = document.getElementById('reportsList');
        if (reports.length === 0 && !append) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد تقارير' : 'No Reports'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة تقرير زيارة جديد' : 'Start by adding a new visit report'}</p>
                </div>
            `;
        } else {
            // Display reports cards
            const cardsHTML = reports.map(report => {
                const visitDate = ReportManager.formatReportDate(report.visit_date);

                const isInactive = report.is_active === false;
                const cardClass = `report-card ${isInactive ? 'inactive' : ''}`;
                const cardStyle = isInactive ? 'cursor: default; opacity: 0.6;' : 'cursor: pointer;';

                return `
                    <div class="${cardClass}" ${!isInactive ? `onclick="ReportManager.viewReport(${report.id})"` : ''} style="${cardStyle}">
                        <div class="report-info">
                            <h3 class="client-name">${report.client_name || (currentLanguage === 'ar' ? 'عميل غير معروف' : 'Unknown Client')}</h3>
                            <div class="visit-date">${visitDate.line1}</div>
                            <div class="visit-date-islamic">${visitDate.line2}</div>
                            ${isInactive ? `<div class="inactive-badge">${currentLanguage === 'ar' ? 'معطل' : 'Inactive'}</div>` : ''}
                            <div class="report-actions" onclick="event.stopPropagation()">
                                ${!isInactive ? `
                                    <button class="btn-icon-stylish print-btn" onclick="ReportManager.printReport(${report.id})" title="${currentLanguage === 'ar' ? 'طباعة' : 'Print'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                                        </svg>
                                    </button>
                                    <button class="btn-icon-stylish delete-btn" onclick="ReportManager.deleteReport(${report.id})" title="${currentLanguage === 'ar' ? 'إلغاء تفعيل' : 'Deactivate'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                ` : `
                                    <button class="btn-icon-stylish reactivate-btn" onclick="ReportManager.reactivateReport(${report.id})" title="${currentLanguage === 'ar' ? 'إعادة تفعيل' : 'Reactivate'}">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (append) {
                // Append new cards to existing list
                reportsList.insertAdjacentHTML('beforeend', cardsHTML);
            } else {
                // Replace all content
                reportsList.innerHTML = cardsHTML;
            }
        }
    },

    // Format date as: Day - Gregorian (line 1) and Islamic (line 2)
    formatReportDate: function (dateStr) {
        try {
            const parts = String(dateStr).split('/').map(p => parseInt(p, 10));
            const d = (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2]))
                ? new Date(parts[0], parts[1] - 1, parts[2])
                : new Date(dateStr);
            const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(d);
            const greg = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
            const isl = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
            return {
                line1: `${dayName} - ${greg}`,
                line2: isl,
                full: `${dayName} - ${greg} - ${isl}` // For expanded view
            };
        } catch (e) {
            return { line1: dateStr, line2: '', full: dateStr };
        }
    },

    loadMoreReports: async function () {
        /**Load next page of reports for infinite scroll*/
        if (!this.hasMoreReports) return;

        const button = document.querySelector('.load-more-btn');
        const spinner = button.querySelector('.loading-spinner');
        const buttonText = button.querySelector('.button-text');

        // Show loading state
        button.disabled = true;
        spinner.style.display = 'block';
        buttonText.textContent = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';

        try {
            const nextPage = this.currentReportPage + 1;
            let apiUrl = `${API_BASE_URL}/visit-reports/list?page=${nextPage}`;
            if (this.currentStatusFilter === 'all' || this.currentStatusFilter === 'inactive') {
                apiUrl += '&show_all=true';
            }

            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const newReports = data.reports || data;

                // Append new reports to existing list
                this.currentReports = [...this.currentReports, ...newReports];

                // Update pagination info
                this.currentReportPage = data.page;
                this.hasMoreReports = data.has_more;

                // Display new reports
                this.displayReportsLazy(newReports, true); // true = append mode

                // Update load more button
                this.addLoadMoreButton('reports');
            }
        } catch (error) {
            console.error('Error loading more reports:', error);
        } finally {
            // Hide loading state
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More';
        }
    },

    loadClientsForDropdown: async function () {
        try {
            console.log('Loading clients for dropdown...');
            // Use ultra-lightweight names-only endpoint for maximum speed
            const response = await fetch(`${API_BASE_URL}/clients/names`, {
                headers: getAuthHeaders()
            });
            console.log('Clients API response status:', response.status);
            if (response.ok) {
                const clients = await response.json();
                console.log(`Loaded ${clients.length} clients for dropdown`);
                this.clientsData = clients; // Store for search functionality

                const dropdown = document.getElementById('clientDropdown');
                if (!dropdown) {
                    console.error('clientDropdown element not found!');
                    return;
                }

                dropdown.innerHTML = `<div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر العميل' : 'Select Client'}</div>`;
                clients.forEach(client => {
                    dropdown.innerHTML += `<div class="dropdown-item" data-value="${client.id}">${client.name}</div>`;
                });
                console.log('Client dropdown populated with', dropdown.children.length, 'items');

                this.initializeClientSearch();
            } else {
                console.error('Failed to load clients, status:', response.status);
            }
        } catch (error) {
            console.error('Error loading clients for dropdown:', error);
        }
    },

    loadProductsForDropdown: async function () {
        try {
            // Use ultra-lightweight names-only endpoint for maximum speed
            const response = await fetch(`${API_BASE_URL}/products/names`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const products = await response.json();
                this.productsData = products; // Store for search functionality

                const dropdowns = document.querySelectorAll('.product-dropdown');
                dropdowns.forEach(dropdown => {
                    dropdown.innerHTML = `<div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</div>`;
                    products.forEach(product => {
                        dropdown.innerHTML += `<div class="dropdown-item" data-value="${product.id}">${product.name}</div>`;
                    });
                });

                this.initializeProductSearch();
            }
        } catch (error) {
            console.error('Error loading products for dropdown:', error);
        }
    },

    initializeClientSearch: function () {
        const searchInput = document.getElementById('clientSearchInput');
        const dropdown = document.getElementById('clientDropdown');
        const hiddenInput = document.getElementById('selectedClientId');

        if (!searchInput || !dropdown || !hiddenInput) {
            console.error('Client search elements not found:', { searchInput: !!searchInput, dropdown: !!dropdown, hiddenInput: !!hiddenInput });
            return;
        }

        // Prevent duplicate initialization
        if (searchInput.dataset.initialized === 'true') {
            console.log('Client search already initialized');
            return;
        }
        searchInput.dataset.initialized = 'true';

        // Handle input focus - show dropdown
        searchInput.addEventListener('focus', () => {
            dropdown.style.display = 'block';
            this.filterClientOptions('');
        });

        // Handle search input
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterClientOptions(searchTerm);
            hiddenInput.value = ''; // Clear selection when typing
        });

        // Handle item selection
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const value = e.target.getAttribute('data-value');
                const text = e.target.textContent;

                searchInput.value = text;
                hiddenInput.value = value;
                dropdown.style.display = 'none';

                // Load client summary if a client is selected
                if (value) {
                    console.log('Client selected, loading summary for ID:', value);
                    this.loadClientLastReportSummary(value);
                } else {
                    console.log('No client selected, hiding summary');
                    this.hideClientSummary();
                }
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    initializeProductSearch: function () {
        const containers = document.querySelectorAll('.product-select-container');

        containers.forEach(container => {
            const searchInput = container.querySelector('.product-search-input');
            const dropdown = container.querySelector('.product-dropdown');
            const hiddenInput = container.querySelector('.selected-product-id');

            if (!searchInput || !dropdown || !hiddenInput) return;

            // Handle input focus - show dropdown
            searchInput.addEventListener('focus', () => {
                dropdown.style.display = 'block';
                this.filterProductOptions(dropdown, '');
            });

            // Handle search input
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterProductOptions(dropdown, searchTerm);
                hiddenInput.value = ''; // Clear selection when typing

                // Remove all internal price displays when product is cleared
                const productGroup = container.closest('.product-group');
                if (productGroup) {
                    const existingDisplays = productGroup.querySelectorAll('.internal-price-display');
                    existingDisplays.forEach(display => display.remove());
                }
            });

            // Handle item selection
            dropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('dropdown-item')) {
                    const value = e.target.getAttribute('data-value');
                    const text = e.target.textContent;

                    searchInput.value = text;
                    hiddenInput.value = value;
                    dropdown.style.display = 'none';

                    // Display internal price for the selected product
                    if (value) {
                        this.displayInternalPrice(container, value);
                    }

                    // Refresh all product dropdowns to exclude the newly selected product
                    this.refreshAllProductDropdowns();
                }
            });

            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        });
    },

    filterClientOptions: function (searchTerm) {
        const dropdown = document.getElementById('clientDropdown');
        if (!this.clientsData || !dropdown) return;

        dropdown.innerHTML = '';

        // Always show "Select Client" option
        const defaultOption = document.createElement('div');
        defaultOption.className = 'dropdown-item';
        defaultOption.setAttribute('data-value', '');
        defaultOption.textContent = currentLanguage === 'ar' ? 'اختر العميل' : 'Select Client';
        dropdown.appendChild(defaultOption);

        // Filter and display matching clients
        const filteredClients = this.clientsData.filter(client =>
            client.name.toLowerCase().includes(searchTerm) ||
            (client.region && client.region.toLowerCase().includes(searchTerm))
        );

        filteredClients.forEach(client => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.setAttribute('data-value', client.id);
            option.textContent = `${client.name}${client.region ? ` (${client.region})` : ''}`;
            dropdown.appendChild(option);
        });

        // Show "No results" if no matches
        if (filteredClients.length === 0 && searchTerm) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item disabled';
            noResults.textContent = currentLanguage === 'ar' ? 'لا توجد نتائج' : 'No results found';
            dropdown.appendChild(noResults);
        }
    },

    filterProductOptions: function (dropdown, searchTerm) {
        if (!this.productsData || !dropdown) return;

        dropdown.innerHTML = '';

        // Always show "Select Product" option
        const defaultOption = document.createElement('div');
        defaultOption.className = 'dropdown-item';
        defaultOption.setAttribute('data-value', '');
        defaultOption.textContent = currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product';
        dropdown.appendChild(defaultOption);

        // Get already selected product IDs
        const selectedProductIds = this.getSelectedProductIds();

        // Filter and display matching products (excluding already selected ones)
        const filteredProducts = this.productsData.filter(product =>
            product.name.toLowerCase().includes(searchTerm) &&
            !selectedProductIds.includes(product.id)
        );

        filteredProducts.forEach(product => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.setAttribute('data-value', product.id);
            option.textContent = product.name;
            dropdown.appendChild(option);
        });

        // Show "No results" if no matches
        if (filteredProducts.length === 0 && searchTerm) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item disabled';
            noResults.textContent = currentLanguage === 'ar' ? 'لا توجد نتائج' : 'No results found';
            dropdown.appendChild(noResults);
        }
    },

    getSelectedProductIds: function () {
        const selectedIds = [];
        const productGroups = document.querySelectorAll('.product-group');

        productGroups.forEach(group => {
            const hiddenInput = group.querySelector('.selected-product-id');
            if (hiddenInput && hiddenInput.value) {
                selectedIds.push(parseInt(hiddenInput.value));
            }
        });

        return selectedIds;
    },

    addProduct: function () {
        const productsContainer = document.getElementById('productsContainer');
        const productCount = productsContainer.querySelectorAll('.product-group').length;

        const productGroup = document.createElement('div');
        productGroup.className = 'form-group product-group';
        productGroup.innerHTML = `
            <div class="product-header">
                <label>${currentLanguage === 'ar' ? 'منتج' : 'Product'} ${productCount + 1}</label>
                <button type="button" class="remove-product-btn" onclick="ReportManager.removeProduct(this)">
                    ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
                </button>
            </div>
            <div class="product-fields">
                <div class="form-row">
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</label>
                        <div class="searchable-select product-select-container">
                            <input type="text" 
                                   class="searchable-input product-search-input" 
                                   placeholder="${currentLanguage === 'ar' ? 'ابحث عن المنتج...' : 'Search for product...'}"
                                   autocomplete="off">
                            <div class="searchable-dropdown product-dropdown">
                                <div class="dropdown-item" data-value="">${currentLanguage === 'ar' ? 'اختر المنتج' : 'Select Product'}</div>
                            </div>
                            <input type="hidden" name="products[${productCount}][product_id]" class="selected-product-id">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'السعر المعروض' : 'Displayed Price'}</label>
                        <input type="number" name="products[${productCount}][displayed_price]" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="products[${productCount}][nearly_expired]" onchange="ReportManager.toggleExpiryDate(this)">
                            ${currentLanguage === 'ar' ? 'منتهي أو قارب على الانتهاء' : 'Expired or Nearly Expired'}
                        </label>
                    </div>
                    <div class="form-group expiry-group" style="display: none;">
                        <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                        <input type="date" name="products[${productCount}][expiry_date]">
                    </div>
                    <div class="form-group expiry-group" style="display: none;">
                        <label>${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Units Count'}</label>
                        <input type="number" name="products[${productCount}][units_count]" min="1" placeholder="${currentLanguage === 'ar' ? 'عدد الوحدات' : 'Number of units'}">
                    </div>
                </div>
            </div>
        `;

        productsContainer.appendChild(productGroup);
        this.updateRemoveProductButtons();

        // Initialize search for the new product select
        this.initializeProductSearch();
    },

    removeProduct: function (button) {
        const productGroup = button.closest('.product-group');
        productGroup.remove();
        this.updateRemoveProductButtons();
        this.renumberProducts();

        // Refresh all product dropdowns to show the removed product again
        this.refreshAllProductDropdowns();
    },

    refreshAllProductDropdowns: function () {
        const containers = document.querySelectorAll('.product-select-container');
        containers.forEach(container => {
            const dropdown = container.querySelector('.product-dropdown');
            const searchInput = container.querySelector('.product-search-input');
            if (dropdown && searchInput) {
                this.filterProductOptions(dropdown, searchInput.value.toLowerCase());
            }
        });
    },

    displayInternalPrice: function (container, productId) {
        // Find the selected product from our stored data
        const product = this.productsData.find(p => p.id == productId);

        // Find the product group (parent container) to look for existing displays
        const productGroup = container.closest('.product-group');
        if (productGroup) {
            // Remove ALL existing internal price displays in the product group
            const existingDisplays = productGroup.querySelectorAll('.internal-price-display');
            existingDisplays.forEach(display => display.remove());
        }

        if (!product) {
            // If product not found (e.g., selection cleared), just return
            return;
        }

        // Create a single new internal price display element
        const priceDisplay = document.createElement('div');
        priceDisplay.className = 'internal-price-display';

        // Update the display with both internal price and client price on separate lines
        priceDisplay.innerHTML = currentLanguage === 'ar' ?
            `<div>سعر رهش: ${product.internal_price.toFixed(2)} ريال</div><div>سعر العميل: ${product.client_price.toFixed(2)} ريال</div>` :
            `<div>Rahash Price: ${product.internal_price.toFixed(2)} SAR</div><div>Client Price: ${product.client_price.toFixed(2)} SAR</div>`;

        // Insert after the product select container
        container.parentNode.insertBefore(priceDisplay, container.nextSibling);

        // Show the price display with animation
        setTimeout(() => {
            priceDisplay.classList.add('show');
        }, 10);
    },

    updateRemoveProductButtons: function () {
        const productGroups = document.querySelectorAll('.product-group');
        productGroups.forEach((group, index) => {
            const removeBtn = group.querySelector('.remove-product-btn');
            if (productGroups.length > 1) {
                removeBtn.style.display = 'inline-block';
            } else {
                removeBtn.style.display = 'none';
            }
        });
    },

    renumberProducts: function () {
        const productGroups = document.querySelectorAll('.product-group');
        productGroups.forEach((group, index) => {
            const label = group.querySelector('.product-header label');
            label.textContent = `${currentLanguage === 'ar' ? 'منتج' : 'Product'} ${index + 1}`;

            // Update input names to maintain proper indexing
            const hiddenInput = group.querySelector('.selected-product-id');
            const priceInput = group.querySelector('input[type="number"]');
            const checkboxInput = group.querySelector('input[type="checkbox"]');
            const dateInput = group.querySelector('input[type="date"]');
            const unitsInput = group.querySelector('input[name*="units_count"]');

            hiddenInput.name = `products[${index}][product_id]`;
            priceInput.name = `products[${index}][displayed_price]`;
            checkboxInput.name = `products[${index}][nearly_expired]`;
            dateInput.name = `products[${index}][expiry_date]`;
            if (unitsInput) unitsInput.name = `products[${index}][units_count]`;
        });
    },

    toggleExpiryDate: function (checkbox) {
        const productGroup = checkbox.closest('.product-group');
        const expiryGroups = productGroup.querySelectorAll('.expiry-group');
        const expiryInput = productGroup.querySelector('input[type="date"]');
        const unitsInput = productGroup.querySelector('input[name*="units_count"]');

        if (checkbox.checked) {
            expiryGroups.forEach(group => {
                group.style.display = 'block';
                const input = group.querySelector('input');
                if (input) input.required = true;
            });
        } else {
            expiryGroups.forEach(group => {
                group.style.display = 'none';
                const input = group.querySelector('input');
                if (input) {
                    input.required = false;
                    input.value = '';
                }
            });
        }
    },

    toggleSuggestedProductsImages: function (checkbox) {
        const suggestedProductsSection = document.getElementById('suggestedProductsSection');
        const fileInput = suggestedProductsSection.querySelector('input[type="file"]');

        if (checkbox.checked) {
            suggestedProductsSection.style.display = 'block';
            fileInput.required = true;
        } else {
            suggestedProductsSection.style.display = 'none';
            fileInput.required = false;
            fileInput.value = '';
        }
    },

    addNote: function () {
        const notesContainer = document.getElementById('notesContainer');

        const noteGroup = document.createElement('div');
        noteGroup.className = 'form-group note-group';
        noteGroup.innerHTML = `
            <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</label>
            <textarea name="notes[]" rows="3" placeholder="${currentLanguage === 'ar' ? 'اكتب ملاحظة عن الزيارة...' : 'Write a note about the visit...'}"></textarea>
            <button type="button" class="remove-note-btn" onclick="ReportManager.removeNote(this)">
                ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
            </button>
        `;

        notesContainer.appendChild(noteGroup);
        this.updateRemoveButtons();
    },

    removeNote: function (button) {
        const noteGroup = button.closest('.note-group');
        noteGroup.remove();
        this.updateRemoveButtons();
        this.renumberNotes();

        // Refresh predefined questions dropdown if it exists
        if (document.getElementById('predefinedQuestionSelect')) {
            this.populatePredefinedQuestions();
        }
    },

    updateRemoveButtons: function () {
        const noteGroups = document.querySelectorAll('.note-group');
        noteGroups.forEach((group, index) => {
            const removeBtn = group.querySelector('.remove-note-btn');
            if (noteGroups.length > 1) {
                removeBtn.style.display = 'inline-block';
            } else {
                removeBtn.style.display = 'none';
            }
        });
    },

    renumberNotes: function () {
        const noteGroups = document.querySelectorAll('.note-group');
        noteGroups.forEach((group, index) => {
            const label = group.querySelector('label');
            label.textContent = `${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}`;
        });
    },

    convertToBase64: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    },

    saveNewReport: async function (event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Collect basic report data
        const reportData = {
            client_id: parseInt(formData.get('client_id')),
            visit_date: formData.get('visit_date')
        };

        // Handle visit images
        const imageFiles = formData.getAll('visit_images');
        if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
            const images = [];
            for (let file of imageFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        images.push({
                            filename: file.name,
                            data: base64,
                            is_suggested_products: false
                        });
                    } catch (error) {
                        console.error('Error converting visit image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (images.length > 0) {
                reportData.images = images;
            }
        }

        // Handle suggested products images
        const suggestedProductsFiles = formData.getAll('suggested_products_images');
        if (suggestedProductsFiles && suggestedProductsFiles.length > 0 && suggestedProductsFiles[0].size > 0) {
            const suggestedImages = [];
            for (let file of suggestedProductsFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        suggestedImages.push({
                            filename: file.name,
                            data: base64,
                            is_suggested_products: true
                        });
                    } catch (error) {
                        console.error('Error converting suggested products image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (suggestedImages.length > 0) {
                // Add suggested products images to the main images array
                if (!reportData.images) {
                    reportData.images = [];
                }
                reportData.images = reportData.images.concat(suggestedImages);
            }
        }

        // Handle products
        const productGroups = form.querySelectorAll('.product-group');
        const products = [];
        productGroups.forEach(group => {
            const productIdInput = group.querySelector('.selected-product-id');
            const priceInput = group.querySelector('input[name*="displayed_price"]');
            const nearlyExpiredCheckbox = group.querySelector('input[name*="nearly_expired"]');
            const expiryDateInput = group.querySelector('input[name*="expiry_date"]');
            const unitsCountInput = group.querySelector('input[name*="units_count"]');

            if (productIdInput.value) {
                const product = {
                    product_id: parseInt(productIdInput.value),
                    displayed_price: priceInput.value ? parseFloat(priceInput.value) : null,
                    nearly_expired: nearlyExpiredCheckbox.checked,
                    expiry_date: nearlyExpiredCheckbox.checked && expiryDateInput.value ? expiryDateInput.value : null,
                    units_count: nearlyExpiredCheckbox.checked && unitsCountInput.value ? parseInt(unitsCountInput.value) : null
                };
                products.push(product);
            }
        });
        if (products.length > 0) {
            reportData.products = products;
        }

        // Handle notes
        const noteTexts = Array.from(form.querySelectorAll('textarea[name="notes[]"]'))
            .map(textarea => textarea.value.trim())
            .filter(text => text.length > 0);
        if (noteTexts.length > 0) {
            reportData.notes = noteTexts;
        }

        console.log('Creating new visit report with data:', reportData);

        try {
            const response = await fetch(`${API_BASE_URL}/visit-reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                alert(currentLanguage === 'ar' ? 'تم إضافة التقرير بنجاح' : 'Visit report added successfully');
                form.closest('.modal-overlay').remove();
                this.loadReports(); // Refresh the reports list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(currentLanguage === 'ar' ? 'خطأ في إضافة التقرير' : 'Error adding report: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error adding report:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        }
    },

    viewReport: async function (reportId) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report) return;

        const visitDate = ReportManager.formatReportDate(report.visit_date);

        // Create detailed view modal
        const modal = document.createElement('div');
        modal.className = 'expanded-modal';
        modal.innerHTML = `
                <div class="expanded-content">
                    <button class="js-modal-close">&times;</button>
                    
                    <div class="expanded-header">
                        <div class="expanded-title">
                            <h2>${report.client_name}</h2>
                            <p class="visit-date">${visitDate.full}</p>
                        </div>
                    </div>
                
                <div class="expanded-details">
                    ${report.products && report.products.length > 0 ? `
                        <div class="detail-section">
                            <h3>${currentLanguage === 'ar' ? 'منتجات الزيارة' : 'Visit Products'}</h3>
                            <div class="products-list">
                                ${report.products.map((product, index) => {
            // Check if displayed price matches our internal store price within tolerance
            // Tolerance only applies when displayed price is LESS than our price
            // If displayed price is HIGHER than our price, it's always a mismatch (no tolerance)
            const storePrice = product.taxed_price_store;
            const displayedPrice = product.displayed_price;
            const tolerance = SettingsManager.getPriceTolerance();

            let priceMatches = true;
            if (storePrice && displayedPrice) {
                if (displayedPrice > storePrice) {
                    // Displayed price is higher than ours - ALWAYS a mismatch
                    priceMatches = false;
                } else {
                    // Displayed price is lower - allow tolerance
                    priceMatches = (storePrice - displayedPrice) <= tolerance;
                }
            }
            const priceStyle = storePrice && displayedPrice && !priceMatches ? 'color: #e74c3c; font-weight: bold;' : '';

            return `
                                        <div class="product-item">
                                            <div class="product-header">
                                                <h4>${product.product_name || (currentLanguage === 'ar' ? 'منتج غير معروف' : 'Unknown Product')}</h4>
                                                ${product.nearly_expired ? `<span class="expired-badge">${currentLanguage === 'ar' ? 'منتهي أو قارب على الانتهاء' : 'Expired or Nearly Expired'}</span>` : ''}
                                            </div>
                                            <div class="product-details">
                                                ${product.displayed_price ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'السعر المعروض:' : 'Displayed Price:'}</label>
                                                        <span style="${priceStyle}">${product.displayed_price} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</span>
                                                    </div>
                                                ` : ''}
                                                ${product.taxed_price_store ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'سعرنا الداخلي (شامل الضريبة):' : 'Our Internal Price (Taxed):'}</label>
                                                        <span style="${priceStyle}">${product.taxed_price_store} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</span>
                                                    </div>
                                                ` : ''}
                                                ${storePrice && displayedPrice && !priceMatches ? `
                                                    <div class="price-mismatch-alert">
                                                        <span>${currentLanguage === 'ar' ? '⚠️ السعر المعروض لا يطابق سعرنا الداخلي' : '⚠️ Displayed price does not match our internal price'}</span>
                                                    </div>
                                                ` : ''}
                                                ${product.expiry_date ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'تاريخ الانتهاء (ميلادي/هجري):' : 'Expiry (Greg/Islamic):'}</label>
                                                        <span>${ReportManager.formatReportDate(product.expiry_date)}</span>
                                                    </div>
                                                ` : ''}
                                                ${product.units_count ? `
                                                    <div class="product-detail">
                                                        <label>${currentLanguage === 'ar' ? 'عدد الوحدات:' : 'Units Count:'}</label>
                                                        <span>${product.units_count}</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${report.notes && report.notes.length > 0 ? `
                        <div class="detail-section">
                            <h3>${currentLanguage === 'ar' ? 'ملاحظات الزيارة' : 'Visit Notes'}</h3>
                            <div class="notes-list">
                                ${report.notes.map((note, index) => `
                                    <div class="note-item">
                                        <div class="note-header">${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</div>
                                        <div class="note-text">${note.note_text}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${report.image_count > 0 ? `
                        <div class="detail-section" id="images-section-${report.id}">
                            <h3>${currentLanguage === 'ar' ? 'صور الزيارة' : 'Visit Images'} (${report.image_count})</h3>
                            <div class="image-gallery">
                                <div class="modern-spinner">
                                    <div class="spinner-ring"></div>
                                    <div class="spinner-ring"></div>
                                    <div class="spinner-ring"></div>
                                </div>
                                <p class="loading-text">${currentLanguage === 'ar' ? 'جاري تحميل الصور...' : 'Loading images...'}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="expanded-actions">
                    <button class="btn btn-secondary js-modal-cancel">
                        ${currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        `;

        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'viewReportForm');

        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewReport-close-btn');
            });
        }

        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'viewReport-cancel-btn');
            });
        }

        // Close modal when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModalAndRestoreScroll(modal, 'viewReport-overlay-click');
            }
        });

        // Lazy load images after modal is displayed
        if (report.image_count > 0) {
            this.loadReportImages(reportId);
        }
    },

    loadReportImages: async function (reportId) {
        try {
            const response = await fetch(`${API_BASE_URL}/visit-reports/${reportId}/images`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const imagesSection = document.getElementById(`images-section-${reportId}`);

                if (imagesSection && data.images) {
                    // Replace loading spinner with actual images
                    const galleryDiv = imagesSection.querySelector('.image-gallery');
                    galleryDiv.innerHTML = `
                        <div class="gallery-grid">
                            ${data.images.map((img, index) => `
                                <div class="gallery-item" onclick="ReportManager.viewReportImages(${reportId}, ${index})">
                                    <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                    <div class="gallery-overlay">
                                        <span class="gallery-filename">${img.filename}</span>
                                        ${img.is_suggested_products ? `<span class="suggested-products-badge">${currentLanguage === 'ar' ? 'منتجات مقترحة' : 'Suggested Products'}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;

                    // Store images in the report object for viewing
                    const report = this.currentReports.find(r => r.id === reportId);
                    if (report) {
                        report.images = data.images;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading report images:', error);
            const imagesSection = document.getElementById(`images-section-${reportId}`);
            if (imagesSection) {
                const galleryDiv = imagesSection.querySelector('.image-gallery');
                galleryDiv.innerHTML = `<p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images'}</p>`;
            }
        }
    },

    viewReportImages: function (reportId, startIndex = 0) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report || !report.images || report.images.length === 0) return;

        // Use the ClientManager's image viewer (reuse functionality)
        const allImages = report.images.map(img => ({
            data: img.data,
            filename: img.filename,
            title: img.filename || currentLanguage === 'ar' ? 'صورة الزيارة' : 'Visit Image'
        }));

        ClientManager.viewImageFullscreen(
            `data:image/jpeg;base64,${allImages[startIndex].data}`,
            allImages[startIndex].title,
            allImages,
            startIndex
        );
    },

    printReport: function (reportId) {
        // Open HTML report in new window with token in URL
        const token = localStorage.getItem('authToken');
        const reportUrl = `${window.location.protocol}//${window.location.host}/api/visit-reports/${reportId}/html?token=${token}`;

        // Open in new window
        const reportWindow = window.open(reportUrl, '_blank');

        if (!reportWindow) {
            alert(currentLanguage === 'ar' ?
                'يرجى السماح بالنوافذ المنبثقة لعرض التقرير' :
                'Please allow pop-ups to view the report');
        }
    },

    deleteReport: async function (reportId) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report) return;

        const confirmMessage = currentLanguage === 'ar' ?
            `هل أنت متأكد من إلغاء تفعيل تقرير زيارة "${report.client_name}"؟ يمكن إعادة تفعيله لاحقاً.` :
            `Are you sure you want to deactivate the visit report for "${report.client_name}"? It can be reactivated later.`;

        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/visit-reports/${reportId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert(currentLanguage === 'ar' ? 'تم إلغاء تفعيل التقرير بنجاح' : 'Report deactivated successfully');
                    this.loadReports(); // Refresh the reports list
                    loadDashboardData(); // Refresh dashboard counts
                } else {
                    const errorData = await response.json();
                    alert(currentLanguage === 'ar' ? 'خطأ في إلغاء تفعيل التقرير' : 'Error deactivating report: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error deactivating report:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
            }
        }
    },

    reactivateReport: async function (reportId) {
        const report = this.currentReports.find(r => r.id === reportId);
        if (!report) return;

        const confirmMessage = currentLanguage === 'ar' ?
            `هل أنت متأكد من إعادة تفعيل تقرير زيارة "${report.client_name}"؟` :
            `Are you sure you want to reactivate the visit report for "${report.client_name}"?`;

        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/visit-reports/${reportId}/reactivate`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert(currentLanguage === 'ar' ? 'تم إعادة تفعيل التقرير بنجاح' : 'Report reactivated successfully');
                    this.loadReports(); // Refresh the reports list
                    loadDashboardData(); // Refresh dashboard counts
                } else {
                    const errorData = await response.json();
                    alert(currentLanguage === 'ar' ? 'خطأ في إعادة تفعيل التقرير' : 'Error reactivating report: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error reactivating report:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
            }
        }
    },

    updateStatusIndicator: function (type, statusFilter, count) {
        // Update the page title or add status indicator
        const sectionTitle = type === 'clients' ?
            document.querySelector('#clients h2') :
            document.querySelector('#reports h2');

        if (sectionTitle) {
            const baseText = type === 'clients' ?
                (currentLanguage === 'ar' ? 'إدارة العملاء' : 'Client Management') :
                (currentLanguage === 'ar' ? 'تقارير الزيارات' : 'Visit Reports');

            let statusText = '';
            if (statusFilter === 'active') {
                statusText = currentLanguage === 'ar' ? ` (نشط: ${count})` : ` (Active: ${count})`;
            } else if (statusFilter === 'inactive') {
                statusText = currentLanguage === 'ar' ? ` (معطل: ${count})` : ` (Inactive: ${count})`;
            } else {
                statusText = currentLanguage === 'ar' ? ` (الكل: ${count})` : ` (All: ${count})`;
            }

            sectionTitle.textContent = baseText + statusText;
        }
    },

    // Predefined Notes Functions
    predefinedNotes: [],

    loadPredefinedNotes: async function () {
        try {
            // Add cache-busting parameter
            const timestamp = new Date().getTime();
            const response = await fetch(`${API_BASE_URL}/predefined-notes?t=${timestamp}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.predefinedNotes = data.questions || [];
                this.populatePredefinedQuestions();
            } else {
                console.error('Failed to load predefined notes');
            }
        } catch (error) {
            console.error('Error loading predefined notes:', error);
        }
    },

    populatePredefinedQuestions: function () {
        const select = document.getElementById('predefinedQuestionSelect');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">' + (currentLanguage === 'ar' ? '-- اختر سؤال --' : '-- Select Question --') + '</option>';

        // Add predefined questions
        this.predefinedNotes.forEach(question => {
            const option = document.createElement('option');
            option.value = question.id;
            option.textContent = question.question;

            // Disable if already added
            if (this.isPredefinedNoteAlreadyAdded(question.question)) {
                option.disabled = true;
                option.textContent += ' (تم إضافتها)';
            }

            select.appendChild(option);
        });
    },

    handlePredefinedQuestionChange: function () {
        const select = document.getElementById('predefinedQuestionSelect');
        const container = document.getElementById('predefinedAnswersContainer');

        if (!select || !container) return;

        const selectedId = select.value;
        if (!selectedId) {
            container.innerHTML = '';
            return;
        }

        const question = this.predefinedNotes.find(q => q.id == selectedId);
        if (!question) return;

        let answerHtml = '';

        if (question.type === 'mcq') {
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    <div class="mcq-options">
                        ${question.options.map(option => `
                            <label class="mcq-option">
                                <input type="radio" name="predefined_answer_${question.id}" value="${option}">
                                <div class="option-content">
                                    <span>${option}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        } else if (question.type === 'date') {
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    <input type="date" id="predefined_date_${question.id}" class="form-control">
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        } else if (question.type === 'structured') {
            let fieldsHtml = '';
            question.fields.forEach(field => {
                fieldsHtml += `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <input type="text" id="predefined_${field.name}_${question.id}" class="form-control" placeholder="${field.label}">
                    </div>
                `;
            });
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    ${fieldsHtml}
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        } else {
            answerHtml = `
                <div class="form-group predefined-answer-group">
                    <label>${question.question}</label>
                    <textarea id="predefined_text_${question.id}" rows="3" placeholder="${currentLanguage === 'ar' ? 'اكتب إجابتك...' : 'Write your answer...'}"></textarea>
                    <button type="button" class="btn btn-primary btn-sm" onclick="ReportManager.addPredefinedAnswer(${question.id})">
                        ${currentLanguage === 'ar' ? 'إضافة الإجابة' : 'Add Answer'}
                    </button>
                </div>
            `;
        }

        container.innerHTML = answerHtml;
    },

    addPredefinedAnswer: function (questionId) {
        const question = this.predefinedNotes.find(q => q.id == questionId);
        if (!question) return;

        let answer = '';

        if (question.type === 'mcq') {
            const selectedOption = document.querySelector(`input[name="predefined_answer_${questionId}"]:checked`);
            if (!selectedOption) {
                alert(currentLanguage === 'ar' ? 'يرجى اختيار إجابة' : 'Please select an answer');
                return;
            }
            answer = selectedOption.value;
        } else if (question.type === 'date') {
            const dateInput = document.getElementById(`predefined_date_${questionId}`);
            if (!dateInput || !dateInput.value) {
                alert(currentLanguage === 'ar' ? 'يرجى اختيار تاريخ' : 'Please select a date');
                return;
            }
            // Convert date to Gregorian calendar with day name
            const selectedDate = new Date(dateInput.value);
            const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const dayName = dayNames[selectedDate.getDay()];
            const day = selectedDate.getDate();
            const month = monthNames[selectedDate.getMonth()];
            const year = selectedDate.getFullYear();
            answer = `${dayName} - ${day} ${month} ${year}`;
        } else if (question.type === 'structured') {
            // Collect all field values
            let fieldAnswers = [];
            question.fields.forEach(field => {
                const fieldInput = document.getElementById(`predefined_${field.name}_${questionId}`);
                if (fieldInput && fieldInput.value.trim()) {
                    fieldAnswers.push(`${field.label}: ${fieldInput.value.trim()}`);
                }
            });

            if (fieldAnswers.length === 0) {
                alert(currentLanguage === 'ar' ? 'يرجى ملء حقل واحد على الأقل' : 'Please fill at least one field');
                return;
            }

            answer = fieldAnswers.join(' | ');
        } else {
            const textArea = document.getElementById(`predefined_text_${questionId}`);
            if (!textArea || !textArea.value.trim()) {
                alert(currentLanguage === 'ar' ? 'يرجى كتابة إجابة' : 'Please write an answer');
                return;
            }
            answer = textArea.value.trim();
        }

        // Check if this predefined note already exists
        if (this.isPredefinedNoteAlreadyAdded(question.question)) {
            alert(currentLanguage === 'ar' ? 'هذه الملاحظة المحددة مسبقاً تم إضافتها بالفعل' : 'This predefined note has already been added');
            return;
        }

        // Add to notes container
        this.addPredefinedNoteToNotes(question.question, answer);

        // Clear the predefined answer form
        document.getElementById('predefinedAnswersContainer').innerHTML = '';
        document.getElementById('predefinedQuestionSelect').value = '';

        // Refresh the predefined questions dropdown to disable the added question
        this.populatePredefinedQuestions();
    },

    loadClientLastReportSummary: async function (clientId) {
        console.log('loadClientLastReportSummary called with clientId:', clientId);
        try {
            const response = await fetch(`/api/clients/${clientId}/last-report-summary`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('API response status:', response.status);
            console.log('API response headers:', response.headers);

            if (response.ok) {
                const summary = await response.json();
                console.log('Summary data received:', summary);
                this.displayClientSummary(summary);
            } else {
                const errorText = await response.text();
                console.log('API response not ok, status:', response.status);
                console.log('Error response:', errorText);
                this.hideClientSummary();
            }
        } catch (error) {
            console.error('Error loading client summary:', error);
            this.hideClientSummary();
        }
    },

    displayClientSummary: function (summary) {
        console.log('displayClientSummary called with:', summary);
        const container = document.getElementById('clientSummaryContainer');
        const content = document.getElementById('clientSummaryContent');

        console.log('Container found:', !!container);
        console.log('Content found:', !!content);

        if (!container || !content) {
            console.log('Missing container or content elements');
            return;
        }

        let summaryHtml = '';

        // Check if there are any issues to display
        const hasIssues = summary.priceIssues || summary.expirationIssues || summary.complaints || summary.suggestedProducts;

        console.log('Summary has issues:', hasIssues);
        console.log('Summary values:', summary);

        if (hasIssues) {
            summaryHtml = '<div class="summary-issues">';

            if (summary.priceIssues) {
                summaryHtml += `
                    <div class="summary-item price-issue">
                        <span class="summary-icon">⚠️</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'مشاكل في الأسعار' : 'Price Issues'}</span>
                    </div>
                `;
            }

            if (summary.expirationIssues) {
                summaryHtml += `
                    <div class="summary-item expiration-issue">
                        <span class="summary-icon">⏰</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'مشاكل في انتهاء الصلاحية' : 'Expiration Issues'}</span>
                    </div>
                `;
            }

            if (summary.complaints) {
                summaryHtml += `
                    <div class="summary-item complaint-issue">
                        <span class="summary-icon">😞</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'شكاوى (منتجات أو مندوب)' : 'Complaints (Products or Salesman)'}</span>
                    </div>
                `;
            }

            if (summary.suggestedProducts) {
                summaryHtml += `
                    <div class="summary-item suggested-products">
                        <span class="summary-icon">💡</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'منتجات مقترحة' : 'Suggested Products'}</span>
                    </div>
                `;
            }

            summaryHtml += '</div>';

            // Add display button if there's a last report
            if (summary.lastReportId) {
                summaryHtml += `
                    <div class="summary-actions">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="ReportManager.displayLastReport(${summary.lastReportId}, event); return false;">
                            <span class="summary-icon">👁️</span>
                            ${currentLanguage === 'ar' ? 'عرض آخر تقرير' : 'Display Last Report'}
                        </button>
                    </div>
                `;
            }
        } else {
            // Check if this is a client with no previous reports vs a client with no issues
            if (summary.hasPreviousReports === false) {
                summaryHtml = `
                    <div class="summary-no-history">
                        <span class="summary-icon">ℹ️</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'لا توجد تقارير سابقة لهذا العميل' : 'No previous reports for this client'}</span>
                    </div>
                `;
            } else {
                summaryHtml = `
                    <div class="summary-no-issues">
                        <span class="summary-icon">✅</span>
                        <span class="summary-text">${currentLanguage === 'ar' ? 'لا توجد مشاكل في آخر تقرير' : 'No issues in last report'}</span>
                    </div>
                `;
            }
        }

        content.innerHTML = summaryHtml;
        container.style.display = 'block';
        console.log('Summary displayed, container visible:', container.style.display);
    },

    hideClientSummary: function () {
        const container = document.getElementById('clientSummaryContainer');
        if (container) {
            container.style.display = 'none';
        }
    },

    displayLastReport: function (reportId, event) {
        // Prevent any form submission or default behavior
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Open the report display page in a new tab
        const displayUrl = `/api/visit-reports/${reportId}/html?token=${localStorage.getItem('authToken')}`;
        window.open(displayUrl, '_blank');

        return false; // Extra safety to prevent form submission
    },

    isPredefinedNoteAlreadyAdded: function (question) {
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return false;

        const existingNotes = notesContainer.querySelectorAll('.predefined-note textarea');
        for (let note of existingNotes) {
            const noteText = note.value;
            // Check if the question part matches (before the colon)
            const questionPart = noteText.split(':')[0].replace('* ', '').trim();
            if (questionPart === question) {
                return true;
            }
        }
        return false;
    },

    addPredefinedNoteToNotes: function (question, answer) {
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return;

        // Create new note group with single asterisk
        const noteGroup = document.createElement('div');
        noteGroup.className = 'form-group note-group predefined-note';
        noteGroup.innerHTML = `
            <label>${currentLanguage === 'ar' ? 'ملاحظة' : 'Note'}</label>
            <textarea name="notes[]" rows="3" readonly>* ${question}: <span style="color: #B88A2A; font-weight: bold;">${answer}</span></textarea>
            <button type="button" class="remove-note-btn" onclick="ReportManager.removeNote(this)">
                ${currentLanguage === 'ar' ? 'حذف' : 'Remove'}
            </button>
        `;

        notesContainer.appendChild(noteGroup);

        // Show remove button if there are multiple notes
        const allNotes = notesContainer.querySelectorAll('.note-group');
        if (allNotes.length > 1) {
            allNotes.forEach(note => {
                const removeBtn = note.querySelector('.remove-note-btn');
                if (removeBtn) removeBtn.style.display = 'inline-block';
            });
        }
    },

    addLoadMoreButton: function (type) {
        /**Add load more button at the bottom of the list*/
        const listElement = document.getElementById(`${type}List`);
        if (!listElement) return;

        // Remove existing load more button
        const existingButton = listElement.querySelector('.load-more-button');
        if (existingButton) {
            existingButton.remove();
        }

        // Add load more button if there are more items (ReportManager only checks hasMoreReports)
        if (this.hasMoreReports) {
            const button = document.createElement('div');
            button.className = 'load-more-button';
            button.innerHTML = `
                <button class="btn btn-secondary load-more-btn" onclick="ReportManager.loadMoreReports()">
                    <div class="loading-spinner" style="display: none;">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <span class="button-text">${currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More'}</span>
                </button>
            `;
            listElement.appendChild(button);

            // Setup Intersection Observer to auto-load when button comes into view
            this.setupLoadMoreObserver(button, type);
        }
    },

    setupLoadMoreObserver: function (button, type) {
        /**Setup Intersection Observer to auto-click load more when it comes into view (OPTIONAL - button always works manually)*/
        try {
            // Disconnect existing observer if any
            if (this.loadMoreObserver) {
                this.loadMoreObserver.disconnect();
            }

            // Create new observer (this is a convenience feature - button works without it)
            this.loadMoreObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Button is visible, auto-click it (but user can still click manually)
                        console.log(`Load more button visible for ${type}, auto-loading...`);
                        const btn = entry.target.querySelector('.load-more-btn');
                        if (btn && !btn.disabled) {
                            // Add small delay to ensure proper rendering
                            setTimeout(() => {
                                if (btn && !btn.disabled) {
                                    btn.click();
                                }
                            }, 100);
                        }
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '100px', // Trigger 100px before button is visible (reduced from 200px for reliability)
                threshold: 0.1
            });

            // Start observing
            this.loadMoreObserver.observe(button);
            console.log(`✅ Auto-load observer started for ${type} (button also works manually)`);
        } catch (error) {
            // If observer fails, button still works manually
            console.log(`⚠️ Auto-load observer failed for ${type} (button will work manually only):`, error);
        }
    }
};


// Make globally available
window.ReportManager = ReportManager;
