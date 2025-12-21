/**
 * // Search Functions
 * Extracted from main.js for modular architecture
 */

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            ProductManager.filterProducts(searchTerm);
        });
    }
}

// Set up search and filter functionality for clients
function setupClientSearch() {
    const clientSearchInput = document.getElementById('clientSearch');
    const regionFilter = document.getElementById('regionFilter');
    const salesmanFilter = document.getElementById('salesmanFilter');
    const statusFilter = document.getElementById('clientStatusFilter');

    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value;
            const selectedRegion = regionFilter ? regionFilter.value : '';
            const selectedSalesman = salesmanFilter ? salesmanFilter.value : '';
            ClientManager.filterClients(searchTerm, selectedRegion, selectedSalesman);
        });
    }

    if (regionFilter) {
        regionFilter.addEventListener('change', function (e) {
            const selectedRegion = e.target.value;
            const searchTerm = clientSearchInput ? clientSearchInput.value : '';
            const selectedSalesman = salesmanFilter ? salesmanFilter.value : '';
            ClientManager.filterClients(searchTerm, selectedRegion, selectedSalesman);
        });
    }

    if (salesmanFilter) {
        salesmanFilter.addEventListener('change', function (e) {
            const selectedSalesman = e.target.value;
            const searchTerm = clientSearchInput ? clientSearchInput.value : '';
            const selectedRegion = regionFilter ? regionFilter.value : '';
            ClientManager.filterClients(searchTerm, selectedRegion, selectedSalesman);
        });
    }

    if (statusFilter) {
        // Load saved filter preference
        const savedClientStatus = localStorage.getItem('clientStatusFilter') || 'active';
        statusFilter.value = savedClientStatus;

        statusFilter.addEventListener('change', function (e) {
            const selectedStatus = e.target.value;
            // Save filter preference
            localStorage.setItem('clientStatusFilter', selectedStatus);
            // Clear search, region, and salesman filters when changing status
            if (clientSearchInput) clientSearchInput.value = '';
            if (regionFilter) regionFilter.value = '';
            if (salesmanFilter) salesmanFilter.value = '';
            // Reload clients with new status filter
            ClientManager.loadClients(selectedStatus);
        });
    }
}

// Set up status filter functionality for reports
function setupReportSearch() {
    const reportSearchInput = document.getElementById('reportSearch');
    const statusFilter = document.getElementById('reportStatusFilter');

    if (reportSearchInput) {
        reportSearchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value;
            ReportManager.filterReports(searchTerm);
        });
    }

    if (statusFilter) {
        // Load saved filter preference
        const savedReportStatus = localStorage.getItem('reportStatusFilter') || 'active';
        statusFilter.value = savedReportStatus;

        statusFilter.addEventListener('change', function (e) {
            const selectedStatus = e.target.value;
            // Save filter preference
            localStorage.setItem('reportStatusFilter', selectedStatus);
            // Clear search when changing status
            if (reportSearchInput) {
                reportSearchInput.value = '';
            }
            // Reload reports with new status filter
            ReportManager.loadReports(selectedStatus);
        });
    }
}

// Add search functionality to ProductManager
ProductManager.filterProducts = async function (searchTerm) {
    // If search is cleared, reload the full list with infinite scroll
    if (!searchTerm || !searchTerm.trim()) {
        await this.loadProducts(); // Reloads page 1 and re-enables infinite scroll
        return;
    }

    // If search term is provided, use backend search for ALL products
    await this.searchProducts(searchTerm.trim());
};

ProductManager.searchProducts = async function (searchTerm) {
    /**Search ALL products using backend API*/
    try {
        const apiUrl = `${API_BASE_URL}/products/search?q=${encodeURIComponent(searchTerm)}&page=1&per_page=100`;

        const response = await fetch(apiUrl, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const searchResults = data.products || [];

            const productsList = document.getElementById('productsList');
            if (!productsList) return;

            // Display results
            if (searchResults.length === 0) {
                productsList.innerHTML = `
                    <div class="empty-state">
                        <h3>${currentLanguage === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}</h3>
                        <p>${currentLanguage === 'ar' ? 'لا توجد منتجات تطابق بحثك' : 'No products match your search'}</p>
                    </div>
                `;
            } else {
                this.displayProducts(searchResults, false);

                // Load thumbnails for search results
                this.loadProductThumbnails(searchResults);
            }

            // --- FIX: Disable infinite scroll for search results ---
            const loadMoreBtn = document.querySelector('#productsList .load-more-button');
            if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            this.hasMoreProducts = false; // Prevent observer from firing
            // -------------------------------------------------------

            // Update count
            this.updateStatusIndicator('products', 'all', data.total);
        } else {
            console.error('Failed to search products');
        }
    } catch (error) {
        console.error('Error searching products:', error);
    }
};

// Header hide on scroll functionality
function setupScrollHideHeader() {
    let lastScrollTop = 0;
    let scrollThreshold = 5; // Minimum scroll distance to trigger hide/show

    const desktopHeader = document.querySelector('.desktop-header');
    const mobileHeader = document.querySelector('.mobile-header');
    const mainContent = document.querySelector('.main-content');

    window.addEventListener('scroll', function () {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Only act if scroll distance is significant enough
        if (Math.abs(scrollTop - lastScrollTop) < scrollThreshold) {
            return;
        }

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide headers
            if (desktopHeader) desktopHeader.classList.add('hidden');
            if (mobileHeader) mobileHeader.classList.add('hidden');

            // Reduce top padding when header is hidden
            if (mainContent) {
                if (window.innerWidth > 768) {
                    mainContent.style.paddingTop = '2rem';
                } else {
                    mainContent.style.paddingTop = '2rem';
                }
            }
        } else if (scrollTop < lastScrollTop) {
            // Scrolling up - show headers
            if (desktopHeader) desktopHeader.classList.remove('hidden');
            if (mobileHeader) mobileHeader.classList.remove('hidden');

            // Restore top padding when header is shown
            if (mainContent) {
                if (window.innerWidth > 768) {
                    mainContent.style.paddingTop = '90px';
                } else {
                    mainContent.style.paddingTop = '80px';
                }
            }
        }

        lastScrollTop = scrollTop;
    });
}

// Add displayFilteredProducts method to handle search results
ProductManager.displayFilteredProducts = function (products) {
    const container = document.getElementById('productsList');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>${currentLanguage === 'ar' ? 'لا توجد منتجات' : 'No Products'}</h3>
                <p>${currentLanguage === 'ar' ? 'لم يتم إضافة أي منتجات بعد' : 'No products have been added yet'}</p>
            </div>
        `;
    } else {
        // Use the same display logic from loadProducts
        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="ProductManager.viewExpanded(${product.id})">
                <div class="product-image">
                    ${product.thumbnail ?
                `<img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">` :
                `<img src="/logo.png" alt="${product.name}" class="logo-fallback">`
            }
                </div>
                <h3>${product.name}</h3>
                <div class="prices-grid">
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</div>
                        <div class="price-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</div>
                        <div class="price-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</div>
                        <div class="price-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="price-item">
                        <div class="price-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</div>
                        <div class="price-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                </div>
                ${product.can_edit ? `
                    <div class="product-actions" onclick="event.stopPropagation()">
                        <button class="btn-icon-stylish btn-edit-stylish" onclick="ProductManager.editProduct(${product.id})" title="${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="btn-icon-stylish btn-delete-stylish" onclick="ProductManager.deleteProduct(${product.id})" title="${currentLanguage === 'ar' ? 'حذف المنتج' : 'Delete Product'}">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
};


// Make globally available
window.setupSearch = setupSearch;
window.setupClientSearch = setupClientSearch;
window.setupReportSearch = setupReportSearch;
window.setupScrollHideHeader = setupScrollHideHeader;
// Note: filterProducts, searchProducts, displayFilteredProducts are methods on ProductManager, not standalone functions
