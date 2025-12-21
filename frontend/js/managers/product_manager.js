/**
 * // Product Management Functions
 * Extracted from main.js for modular architecture
 */

// Product Management Functions  
const ProductManager = {
    showAddProductForm: function () {
        // Redirect to the real add modal function
        this.openAddModal();
    },

    loadProducts: async function () {
        try {
            // Show loading state immediately
            const productsList = document.getElementById('productsList');
            const loadingText = currentLanguage === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...';
            productsList.innerHTML = `
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${loadingText}</p>
                </div>
            `;

            // Use lightweight list endpoint WITHOUT images
            console.log('Loading products from:', `${API_BASE_URL}/products/list`);
            console.log('Auth headers:', getAuthHeaders());
            const response = await fetch(`${API_BASE_URL}/products/list`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                const products = data.products || data; // Handle both old and new format

                // Store products for search functionality
                this.currentProducts = products;

                // Show add product button if user can edit (super admin)
                this.updateUIPermissions(products);

                this.displayProducts(products);

                // Load thumbnails for products that have them
                this.loadProductThumbnails(products);

                // Store pagination info for infinite scroll
                this.currentProductPage = data.page || 1;
                this.hasMoreProducts = data.has_more || false;
                this.totalProducts = data.total || products.length;

                console.log(`ProductManager: hasMoreProducts = ${this.hasMoreProducts}, total = ${this.totalProducts}`);

                // Add load more button if there are more products
                this.addLoadMoreButton('products');

                // Note: Infinite scroll now uses Intersection Observer in addLoadMoreButton
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to load products:', response.status, errorData);
                productsList.innerHTML = `<p class="no-data">Error loading products: ${errorData.message || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Error loading products:', error);
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '<p class="no-data">Error loading products</p>';
        }
    },

    loadProductThumbnails: async function (products) {
        /**Load thumbnails for products that have them - called after displaying cards*/
        const productsWithThumbnails = products.filter(product => product.has_thumbnail);

        for (const product of productsWithThumbnails) {
            try {
                const response = await fetch(`${API_BASE_URL}/products/${product.id}/thumbnail`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    const imageElement = document.querySelector(`[data-product-id="${product.id}"]`);
                    if (imageElement && data.thumbnail) {
                        imageElement.innerHTML = `<img src="data:image/jpeg;base64,${data.thumbnail}" alt="${product.name}">`;
                    }
                }
            } catch (error) {
                console.error(`Error loading thumbnail for product ${product.id}:`, error);
                // Keep the loading indicator or show fallback
            }
        }
    },

    loadProductImages: async function (productId) {
        /**Load images for a specific product on demand*/
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const imagesSection = document.querySelector(`#product-expanded-${productId} .additional-images-section`);

                if (imagesSection && data.images) {
                    // Replace loading spinner with actual images
                    const galleryDiv = imagesSection.querySelector('.image-gallery');
                    if (galleryDiv) {
                        galleryDiv.innerHTML = data.images.map((img, index) => `
                            <div class="gallery-item" onclick="ProductManager.viewImageFullscreen('${img.data}', '${img.filename}')">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                <div class="gallery-overlay">
                                    <span class="gallery-filename">${img.filename}</span>
                                </div>
                            </div>
                        `).join('');

                        // Update the product object with loaded images
                        const product = this.currentProducts.find(p => p.id === productId);
                        if (product) {
                            product.images = data.images;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading product images:', error);
            const imagesSection = document.querySelector(`#product-expanded-${productId} .additional-images-section`);
            if (imagesSection) {
                const galleryDiv = imagesSection.querySelector('.image-gallery');
                if (galleryDiv) {
                    galleryDiv.innerHTML = `<p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images'}</p>`;
                }
            }
        }
    },

    loadMoreProducts: async function () {
        /**Load next page of products for infinite scroll*/
        if (!this.hasMoreProducts) return;

        const button = document.querySelector('.load-more-btn');
        const spinner = button.querySelector('.loading-spinner');
        const buttonText = button.querySelector('.button-text');

        // Show loading state
        button.disabled = true;
        spinner.style.display = 'block';
        buttonText.textContent = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';

        try {
            const nextPage = this.currentProductPage + 1;
            const response = await fetch(`${API_BASE_URL}/products/list?page=${nextPage}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const newProducts = data.products || data;

                // Append new products to existing list
                this.currentProducts = [...this.currentProducts, ...newProducts];

                // Update pagination info
                this.currentProductPage = data.page;
                this.hasMoreProducts = data.has_more;

                // Display new products
                this.displayProducts(newProducts, true); // true = append mode

                // Load thumbnails for new products
                this.loadProductThumbnails(newProducts);

                // Update load more button
                this.addLoadMoreButton('products');
            }
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            // Hide loading state
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More';
        }
    },

    updateUIPermissions: function (products) {
        const addProductBtn = document.getElementById('addProductBtn');

        if (addProductBtn) {
            // Check if user has edit permissions (SUPER_ADMIN only)
            let canEdit = false;

            if (products && products.length > 0) {
                // Use can_edit flag from the products API response
                canEdit = products[0].can_edit;
            } else {
                // If no products, check user role from stored data
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                canEdit = userInfo.role === 'super_admin';
            }

            console.log('User can edit products:', canEdit);

            if (canEdit) {
                // Show button for SUPER_ADMIN
                addProductBtn.style.display = 'inline-flex';
                addProductBtn.disabled = false;
                addProductBtn.classList.remove('disabled');
                addProductBtn.style.opacity = '1';
                addProductBtn.style.cursor = 'pointer';
                addProductBtn.style.visibility = 'visible';
                console.log('Add product button shown for SUPER_ADMIN');
            } else {
                // Hide button for non-SUPER_ADMIN users
                addProductBtn.style.display = 'none';
                console.log('Add product button hidden - user is not SUPER_ADMIN');
            }
        } else {
            console.log('Add product button not found in DOM');
        }

        // Show/hide settings menu item based on role
        setupUserInterface();
    },

    displayProducts: function (products, append = false) {
        // Store products data for editing
        if (!append) {
            this.currentProducts = products;
        } else {
            // When appending, accumulate products
            this.currentProducts = [...(this.currentProducts || []), ...products];
        }

        const productsList = document.getElementById('productsList');

        // Handle empty state (only when not appending)
        if (products.length === 0 && !append) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد منتجات' : 'No Products'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة منتج جديد' : 'Start by adding a new product'}</p>
                </div>
            `;
            return;
        }

        // Generate HTML for products
        const cardsHTML = products.map(product => `
            <div class="product-card" onclick="ProductManager.viewExpanded(${product.id})">
                <div class="product-image" data-product-id="${product.id}">
                    ${product.has_thumbnail ?
                `<div class="thumbnail-loading">⏳</div>` :
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

        if (append) {
            // APPEND new cards to existing list (preserves old items)
            productsList.insertAdjacentHTML('beforeend', cardsHTML);
        } else {
            // REPLACE all content
            productsList.innerHTML = cardsHTML;
        }
    },

    editProduct: async function (productId) {
        // Fetch FULL product details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                alert(currentLanguage === 'ar' ? 'فشل تحميل بيانات المنتج' : 'Failed to load product data');
                return;
            }

            const product = await response.json();
            console.log('Product loaded for editing with images:', product.images);

            // Create edit form
            const editForm = `
            <div class="modal-overlay" id="editProductModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${currentLanguage === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</h3>
                        <button class="js-modal-close">×</button>
                    </div>
                    <form class="edit-product-form" onsubmit="ProductManager.saveProduct(event, ${productId})">
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'اسم المنتج' : 'Product Name'}</label>
                            <input type="text" id="editProductName" value="${product.name || ''}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر العميل (شامل)' : 'Client Price (Tax Inc.)'}</label>
                                <input type="number" step="0.01" id="editTaxedPriceStore" value="${product.taxed_price_store || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</label>
                                <input type="number" step="0.01" id="editUntaxedPriceStore" value="${product.untaxed_price_store || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر المحل (شامل)' : 'Store Price (Tax Inc.)'}</label>
                                <input type="number" step="0.01" id="editTaxedPriceClient" value="${product.taxed_price_client || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</label>
                                <input type="number" step="0.01" id="editUntaxedPriceClient" value="${product.untaxed_price_client || ''}" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'الصورة الرئيسية (المصغرة)' : 'Main Thumbnail Image'}</label>
                            ${product.thumbnail ? `
                                <div class="current-image-container">
                                    <div class="current-image">
                                        <img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">
                                        <button type="button" class="btn-delete-image" onclick="ProductManager.deleteThumbnail(${product.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <small class="form-help">${currentLanguage === 'ar' ? 'الصورة الحالية - اضغط على X لحذفها' : 'Current image - click X to delete'}</small>
                                </div>
                            ` : ''}
                            <input type="file" id="editProductThumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'الصورة التي تظهر في بطاقة المنتج' : 'Image that appears on product card'}</small>
                        </div>
                        
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية للمنتج' : 'Additional Product Images'}</label>
                            ${(product.images && Array.isArray(product.images) && product.images.length > 0) ? `
                                <div class="current-images-container">
                                    <h5>${currentLanguage === 'ar' ? 'الصور الحالية:' : 'Current Images:'}</h5>
                                    <div class="images-grid">
                                        ${product.images.map(img => `
                                            <div class="current-image">
                                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}">
                                                <button type="button" class="btn-delete-image" onclick="ProductManager.deleteAdditionalImage(${product.id}, ${img.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <input type="file" id="editAdditionalImages" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'يمكنك اختيار عدة صور للمعرض' : 'You can select multiple images for gallery'}</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary js-modal-cancel">
                                ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${currentLanguage === 'ar' ? 'حفظ' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', editForm);

            // Get the modal and setup handlers
            const modal = document.getElementById('editProductModal');
            if (modal) {
                // Open modal and disable scroll
                openModalAndDisableScroll(modal, 'editProductForm');

                // Setup proper close handlers
                const closeButton = modal.querySelector('.js-modal-close');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        closeModalAndRestoreScroll(modal, 'editProductForm-close-btn');
                    });
                }

                const cancelButton = modal.querySelector('.js-modal-cancel');
                if (cancelButton) {
                    cancelButton.addEventListener('click', () => {
                        closeModalAndRestoreScroll(modal, 'editProductForm-cancel-btn');
                    });
                }
            }

        } catch (error) {
            console.error('Error loading product for edit:', error);
            alert(currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات المنتج' : 'Error loading product data');
        }
    },

    closeEditModal: function () {
        const modal = document.getElementById('editProductModal');
        if (modal) {
            closeModalAndRestoreScroll(modal, 'closeEditModal-function');
        }
    },

    saveProduct: async function (event, productId) {
        event.preventDefault();

        // Helper function to handle null/empty values
        const getValue = (elementId) => {
            const value = document.getElementById(elementId).value;
            return value === '' ? null : parseFloat(value);
        };

        const getStringValue = (elementId) => {
            const value = document.getElementById(elementId).value;
            return value === '' ? null : value;
        };

        const productData = {
            name: getStringValue('editProductName'),
            taxed_price_store: getValue('editTaxedPriceStore'),
            untaxed_price_store: getValue('editUntaxedPriceStore'),
            taxed_price_client: getValue('editTaxedPriceClient'),
            untaxed_price_client: getValue('editUntaxedPriceClient')
        };

        // Check if product name is provided (required field)
        if (!productData.name || productData.name.trim() === '') {
            alert(currentLanguage === 'ar' ? 'يجب إدخال اسم المنتج' : 'Product name is required');
            return;
        }

        try {
            let uploadData = productData;

            // Handle thumbnail upload if provided
            const thumbnailInput = document.getElementById('editProductThumbnail');
            if (thumbnailInput && thumbnailInput.files && thumbnailInput.files[0]) {
                const thumbnailFile = thumbnailInput.files[0];
                const base64Thumbnail = await this.fileToBase64(thumbnailFile);
                uploadData.thumbnail = base64Thumbnail;
            }

            // Handle additional images if provided
            const additionalImagesInput = document.getElementById('editAdditionalImages');
            if (additionalImagesInput && additionalImagesInput.files && additionalImagesInput.files.length > 0) {
                const additionalImages = [];

                for (let i = 0; i < additionalImagesInput.files.length; i++) {
                    const file = additionalImagesInput.files[i];
                    const base64Image = await this.fileToBase64(file);
                    additionalImages.push({
                        filename: file.name,
                        data: base64Image
                    });
                }

                uploadData.additional_images = additionalImages;
            }

            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(uploadData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully');
                this.closeEditModal();
                this.loadProducts(); // Refresh the products list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                alert(result.message || (currentLanguage === 'ar' ? 'فشل في تحديث المنتج' : 'Failed to update product'));
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    // Helper function to convert file to base64
    fileToBase64: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data:image/jpeg;base64, part
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    },

    viewExpanded: async function (productId) {
        // Show loading modal first
        let expandedModal = document.getElementById('expandedModal');
        if (!expandedModal) {
            expandedModal = document.createElement('div');
            expandedModal.id = 'expandedModal';
            expandedModal.className = 'expanded-modal';
            document.body.appendChild(expandedModal);
        }

        // Show loading state
        expandedModal.innerHTML = `
            <div class="expanded-content">
                <button class="js-modal-close">&times;</button>
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${currentLanguage === 'ar' ? 'جاري تحميل بيانات المنتج...' : 'Loading product data...'}</p>
                </div>
            </div>
        `;
        expandedModal.classList.add('active');
        ScrollManager.disableScroll();

        // Fetch FULL product details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                expandedModal.innerHTML = `
                    <div class="expanded-content">
                        <button class="js-modal-close">&times;</button>
                        <p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل بيانات المنتج' : 'Failed to load product data'}</p>
                    </div>
                `;

                // Setup close handler for error state
                const closeBtn = expandedModal.querySelector('.js-modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        closeModalAndRestoreScroll(expandedModal, 'viewExpanded-error-close');
                    });
                }
                return;
            }

            const product = await response.json();
            console.log('Product loaded for viewing:', product);

            // Get thumbnail image (now we have it loaded!)
            const thumbnailImage = product.thumbnail
                ? `<img src="data:image/jpeg;base64,${product.thumbnail}" alt="${product.name}">`
                : product.name.charAt(0).toUpperCase();

            // Build gallery images (now loaded immediately!)
            let galleryHtml = '';
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                galleryHtml = `
                <div class="image-gallery additional-images-section">
                    <h4 class="gallery-title">${currentLanguage === 'ar' ? 'معرض الصور' : 'Image Gallery'} (${product.images.length})</h4>
                    <div class="gallery-grid">
                        ${product.images.map((img, index) => `
                            <div class="gallery-item" onclick="ProductManager.viewProductImages(${product.id}, ${index + 1})">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename || product.name}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            }

            // Set modal content
            expandedModal.innerHTML = `
            <div class="expanded-content">
                <button class="js-modal-close">&times;</button>
                
                <div class="expanded-header">
                    <div class="expanded-image-large" onclick="ProductManager.viewProductImages(${product.id}, 0)">
                        ${thumbnailImage}
                        <div class="image-overlay">
                            <span>🔍</span>
                        </div>
                    </div>
                    <h2 class="expanded-title">${product.name}</h2>
                </div>
                
                <div class="expanded-details">
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر العميل (مع الضريبة)' : 'Client Price (With Tax)'}</div>
                        <div class="detail-value">${product.taxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر العميل (بدون ضريبة)' : 'Client Price (No Tax)'}</div>
                        <div class="detail-value">${product.untaxed_price_store || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر المحل (مع الضريبة)' : 'Store Price (With Tax)'}</div>
                        <div class="detail-value">${product.taxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">${currentLanguage === 'ar' ? 'سعر المحل (بدون ضريبة)' : 'Store Price (No Tax)'}</div>
                        <div class="detail-value">${product.untaxed_price_client || '0.00'} ${currentLanguage === 'ar' ? 'ريال' : 'SAR'}</div>
                    </div>
                </div>
                
                ${galleryHtml}
            </div>
        `;

            // Setup proper close handlers
            const closeButton = expandedModal.querySelector('.js-modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(expandedModal, 'viewExpanded-close-btn');
                });
            }

            // Close modal when clicking outside
            expandedModal.addEventListener('click', function (e) {
                if (e.target === expandedModal) {
                    closeModalAndRestoreScroll(expandedModal, 'viewExpanded-overlay-click');
                }
            });

        } catch (error) {
            console.error('Error loading product for expanded view:', error);
            expandedModal.innerHTML = `
                <div class="expanded-content">
                    <button class="js-modal-close">&times;</button>
                    <p class="error-text">${currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات المنتج' : 'Error loading product data'}</p>
                </div>
            `;

            // Setup close handler for error state
            const closeBtn = expandedModal.querySelector('.js-modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    closeModalAndRestoreScroll(expandedModal, 'viewExpanded-error-close');
                });
            }
        }
    },

    closeExpanded: function () {
        const expandedModal = document.getElementById('expandedModal');
        if (expandedModal) {
            expandedModal.classList.remove('active');
            closeModalAndRestoreScroll(expandedModal, 'closeExpanded-function');
        }
    },

    viewImageFullscreen: function (imageSrc, altText, imagesList = null, currentIndex = 0) {
        // Create fullscreen image modal
        let fullscreenModal = document.getElementById('fullscreenImageModal');
        if (!fullscreenModal) {
            fullscreenModal = document.createElement('div');
            fullscreenModal.id = 'fullscreenImageModal';
            fullscreenModal.className = 'fullscreen-image-modal';
            document.body.appendChild(fullscreenModal);
        }

        // Store images list for navigation
        this.currentImagesList = imagesList || [{ src: imageSrc, alt: altText }];
        this.currentImageIndex = currentIndex;

        const hasMultipleImages = this.currentImagesList.length > 1;

        fullscreenModal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="ProductManager.closeFullscreenImage()">&times;</button>
                ${hasMultipleImages ? `
                    <button class="nav-btn prev-btn" onclick="ProductManager.showPreviousImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="nav-btn next-btn" onclick="ProductManager.showNextImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                ` : ''}
                <img src="${imageSrc}" alt="${altText}">
                <div class="image-info">
                    <div class="image-title">${altText}</div>
                    ${hasMultipleImages ? `<div class="image-counter">${currentIndex + 1} / ${this.currentImagesList.length}</div>` : ''}
                </div>
            </div>
        `;

        fullscreenModal.classList.add('active');
        ScrollManager.disableScroll();

        // Close on overlay click
        fullscreenModal.addEventListener('click', function (e) {
            if (e.target === fullscreenModal) {
                ProductManager.closeFullscreenImage();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    },

    showPreviousImage: function () {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else {
            this.currentImageIndex = this.currentImagesList.length - 1;
        }
        this.updateFullscreenImage();
    },

    showNextImage: function () {
        if (this.currentImageIndex < this.currentImagesList.length - 1) {
            this.currentImageIndex++;
        } else {
            this.currentImageIndex = 0;
        }
        this.updateFullscreenImage();
    },

    updateFullscreenImage: function () {
        const currentImage = this.currentImagesList[this.currentImageIndex];
        const modal = document.getElementById('fullscreenImageModal');
        const img = modal.querySelector('img');
        const title = modal.querySelector('.image-title');
        const counter = modal.querySelector('.image-counter');

        img.src = currentImage.src;
        img.alt = currentImage.alt;
        title.textContent = currentImage.alt;
        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.currentImagesList.length}`;
        }
    },

    handleKeyNavigation: function (e) {
        if (!document.getElementById('fullscreenImageModal').classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                this.showNextImage();
                break;
            case 'Escape':
                this.closeFullscreenImage();
                break;
        }
    },

    closeFullscreenImage: function () {
        const fullscreenModal = document.getElementById('fullscreenImageModal');
        if (fullscreenModal) {
            fullscreenModal.classList.remove('active');
            ScrollManager.enableScroll();
        }

        // Clean up keyboard event listener
        document.removeEventListener('keydown', this.handleKeyNavigation.bind(this));
    },

    viewProductImages: function (productId, startIndex = 0) {
        // Find the product data
        const products = this.currentProducts || [];
        const product = products.find(p => p.id === productId);

        if (!product) {
            console.error('Product not found for fullscreen viewing');
            return;
        }

        // Build images list starting with thumbnail
        const imagesList = [];

        // Add thumbnail as first image
        if (product.thumbnail) {
            imagesList.push({
                src: `data:image/jpeg;base64,${product.thumbnail}`,
                alt: `${product.name} - ${currentLanguage === 'ar' ? 'الصورة الرئيسية' : 'Main Image'}`
            });
        } else {
            imagesList.push({
                src: '/logo.png',
                alt: `${product.name} - ${currentLanguage === 'ar' ? 'الصورة الافتراضية' : 'Default Logo'}`
            });
        }

        // Add additional images
        if (product.images && product.images.length > 0) {
            product.images.forEach(img => {
                imagesList.push({
                    src: `data:image/jpeg;base64,${img.data}`,
                    alt: img.filename || `${product.name} - ${currentLanguage === 'ar' ? 'صورة إضافية' : 'Additional Image'}`
                });
            });
        }

        // Open fullscreen viewer
        if (imagesList.length > 0) {
            const currentImage = imagesList[startIndex];
            this.viewImageFullscreen(currentImage.src, currentImage.alt, imagesList, startIndex);
        }
    },

    openAddModal: function () {
        const modal = document.getElementById('addProductModal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form class="edit-product-form" onsubmit="ProductManager.saveNewProduct(event)">
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'اسم المنتج' : 'Product Name'}</label>
                        <input type="text" id="newProductName" required placeholder="${currentLanguage === 'ar' ? 'أدخل اسم المنتج' : 'Enter product name'}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر العميل (مع)' : 'Client Price (With Tax)'}</label>
                            <input type="number" step="0.01" id="newTaxedPriceStore" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر العميل (بدون)' : 'Client Price (No Tax)'}</label>
                            <input type="number" step="0.01" id="newUntaxedPriceStore" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر المحل (مع)' : 'Store Price (With Tax)'}</label>
                            <input type="number" step="0.01" id="newTaxedPriceClient" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'سعر المحل (بدون)' : 'Store Price (No Tax)'}</label>
                            <input type="number" step="0.01" id="newUntaxedPriceClient" placeholder="${currentLanguage === 'ar' ? 'أدخل السعر' : 'Enter price'}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'الصورة الرئيسية (المصغرة)' : 'Main Thumbnail Image'}</label>
                        <input type="file" id="newProductThumbnail" accept="image/*">
                        <small class="form-help">${currentLanguage === 'ar' ? 'الصورة التي تظهر في بطاقة المنتج' : 'Image that appears on product card'}</small>
                    </div>
                    
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'صور إضافية للمنتج' : 'Additional Product Images'}</label>
                        <input type="file" id="newAdditionalImages" accept="image/*" multiple>
                        <small class="form-help">${currentLanguage === 'ar' ? 'يمكنك اختيار عدة صور للمعرض' : 'You can select multiple images for gallery'}</small>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة المنتج' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'addProductForm');

        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addProductForm-close-btn');
            });
        }

        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addProductForm-cancel-btn');
            });
        }
    },

    closeAddModal: function () {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            closeModalAndRestoreScroll(modal, 'closeAddModal-function');
        }
    },

    saveNewProduct: async function (event) {
        event.preventDefault();

        const productData = {
            name: document.getElementById('newProductName').value,
            taxed_price_store: parseFloat(document.getElementById('newTaxedPriceStore').value) || null,
            untaxed_price_store: parseFloat(document.getElementById('newUntaxedPriceStore').value) || null,
            taxed_price_client: parseFloat(document.getElementById('newTaxedPriceClient').value) || null,
            untaxed_price_client: parseFloat(document.getElementById('newUntaxedPriceClient').value) || null
        };

        if (!productData.name || productData.name.trim() === '') {
            alert(currentLanguage === 'ar' ? 'يجب إدخال اسم المنتج' : 'Product name is required');
            return;
        }

        try {
            let uploadData = productData;

            // Handle thumbnail upload if provided
            const thumbnailInput = document.getElementById('newProductThumbnail');
            if (thumbnailInput && thumbnailInput.files && thumbnailInput.files[0]) {
                const thumbnailFile = thumbnailInput.files[0];
                const base64Thumbnail = await this.fileToBase64(thumbnailFile);
                uploadData.thumbnail = base64Thumbnail;
            }

            // Handle additional images if provided
            const additionalImagesInput = document.getElementById('newAdditionalImages');
            if (additionalImagesInput && additionalImagesInput.files && additionalImagesInput.files.length > 0) {
                const additionalImages = [];

                for (let i = 0; i < additionalImagesInput.files.length; i++) {
                    const file = additionalImagesInput.files[i];
                    const base64Image = await this.fileToBase64(file);
                    additionalImages.push({
                        filename: file.name,
                        data: base64Image
                    });
                }

                uploadData.additional_images = additionalImages;
            }

            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(uploadData)
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully');
                this.closeAddModal();
                this.loadProducts(); // Refresh the products list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                alert(currentLanguage === 'ar' ? 'خطأ في إضافة المنتج' : 'Error adding product: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    deleteProduct: async function (productId) {
        const confirmMessage = currentLanguage === 'ar' ?
            'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.' :
            'Are you sure you want to delete this product? This action cannot be undone.';

        if (confirm(confirmMessage)) {
            try {
                console.log(`Attempting to delete product ${productId}`);

                const token = localStorage.getItem('authToken');
                console.log('Token exists:', !!token);
                console.log('Token length:', token ? token.length : 0);

                if (!token) {
                    alert(currentLanguage === 'ar' ? 'يجب تسجيل الدخول مرة أخرى' : 'Please login again');
                    window.location.href = '/login';
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const successMessage = currentLanguage === 'ar' ?
                        'تم حذف المنتج بنجاح' :
                        'Product deleted successfully';

                    alert(successMessage);
                    console.log(`Product ${productId} deleted successfully`);

                    // Reload the products list to reflect the deletion
                    this.loadProducts();
                    loadDashboardData(); // Refresh dashboard counts

                } else {
                    const errorData = await response.json();

                    // Handle specific token errors
                    if (response.status === 401 && (errorData.message.includes('Token') || errorData.message.includes('expired') || errorData.message.includes('invalid'))) {
                        console.log('Token error detected, redirecting to login');
                        alert(currentLanguage === 'ar' ? 'انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مرة أخرى' : 'Session expired, please login again');
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userInfo');
                        window.location.href = '/login';
                        return;
                    }

                    const errorMessage = currentLanguage === 'ar' ?
                        'خطأ في حذف المنتج: ' + (errorData.message || 'حدث خطأ غير معروف') :
                        'Error deleting product: ' + (errorData.message || 'Unknown error occurred');

                    alert(errorMessage);
                    console.error('Delete product error:', errorData);
                }

            } catch (error) {
                console.error('Error deleting product:', error);
                const errorMessage = currentLanguage === 'ar' ?
                    'فشل في حذف المنتج. تحقق من اتصال الإنترنت.' :
                    'Failed to delete product. Please check your internet connection.';

                alert(errorMessage);
            }
        }
    },

    // Image deletion functions
    deleteThumbnail: async function (productId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف الصورة الرئيسية؟' : 'Are you sure you want to delete the thumbnail?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/thumbnail`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة الرئيسية بنجاح' : 'Thumbnail deleted successfully');
                // Refresh the product data and close the modal
                this.loadProducts();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting thumbnail:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
        }
    },

    deleteAdditionalImage: async function (productId, imageId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/images/${imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully');
                // Refresh the product data and close the modal
                this.loadProducts();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
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

        // Add load more button if there are more items (ProductManager only checks hasMoreProducts)
        if (this.hasMoreProducts) {
            const button = document.createElement('div');
            button.className = 'load-more-button';
            button.innerHTML = `
                <button class="btn btn-secondary load-more-btn" onclick="ProductManager.loadMoreProducts()">
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
window.ProductManager = ProductManager;
