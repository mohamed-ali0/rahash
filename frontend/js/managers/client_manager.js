/**
 * // Client Management Functions
 * Extracted from main.js for modular architecture
 */

// Client Management Functions
const ClientManager = {
    currentClients: [],
    allRegions: [],

    showAddClientForm: function () {
        // Create comprehensive add client modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form id="addClientForm" onsubmit="ClientManager.saveNewClient(event)">
                    
                    <!-- Basic Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم العميل' : 'Client Name'} *</label>
                                <input type="text" name="name" required>
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'المنطقة' : 'Region'}</label>
                                <input type="text" name="region">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم البائع' : 'Salesman Name'}</label>
                                <input type="text" name="salesman_name">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'الموقع' : 'Location'}</label>
                                <input type="text" name="location" placeholder="${currentLanguage === 'ar' ? 'مثال: الرياض، السعودية' : 'e.g., Riyadh, Saudi Arabia'}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'العنوان' : 'Address'}</label>
                                <input type="text" name="address" placeholder="${currentLanguage === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صورة العميل الرئيسية' : 'Client Thumbnail'}</label>
                            <input type="file" name="thumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - صورة تمثل العميل' : 'Optional - main image representing the client'}</small>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية للعميل' : 'Additional Client Images'}</label>
                            <input type="file" name="additional_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - يمكن اختيار عدة صور' : 'Optional - you can select multiple images'}</small>
                        </div>
                    </div>

                    <!-- Owner Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المالك' : 'Owner Name'}</label>
                                <input type="text" name="owner_name">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المالك' : 'Owner Phone'}</label>
                                <input type="tel" name="owner_phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المالك' : 'Owner Email'}</label>
                            <input type="email" name="owner_email">
                        </div>
                    </div>

                    <!-- Purchasing Manager Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات مدير المشتريات' : 'Purchasing Manager Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم مدير المشتريات' : 'Manager Name'}</label>
                                <input type="text" name="manager_name">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف مدير المشتريات' : 'Manager Phone'}</label>
                                <input type="tel" name="manager_phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل مدير المشتريات' : 'Manager Email'}</label>
                            <input type="email" name="manager_email">
                        </div>
                    </div>

                    <!-- Accountant Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المحاسب' : 'Accountant Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المحاسب' : 'Accountant Name'}</label>
                                <input type="text" name="accountant_name">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المحاسب' : 'Accountant Phone'}</label>
                                <input type="tel" name="accountant_phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المحاسب' : 'Accountant Email'}</label>
                            <input type="email" name="accountant_email">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'إضافة العميل' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Open modal and disable scroll
        openModalAndDisableScroll(modal, 'addClientForm');

        // Setup proper close handlers
        const closeButton = modal.querySelector('.js-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addClientForm-close-btn');
            });
        }

        const cancelButton = modal.querySelector('.js-modal-cancel');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                closeModalAndRestoreScroll(modal, 'addClientForm-cancel-btn');
            });
        }
    },

    saveNewClient: async function (event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Collect basic client data
        const clientData = {
            name: formData.get('name'),
            region: formData.get('region') || null,
            salesman_name: formData.get('salesman_name') || null,
            location: formData.get('location') || null,
            address: formData.get('address') || null
        };

        // Collect owner information
        const ownerData = {};
        const ownerName = formData.get('owner_name');
        const ownerPhone = formData.get('owner_phone');
        const ownerEmail = formData.get('owner_email');
        if (ownerName || ownerPhone || ownerEmail) {
            ownerData.name = ownerName || null;
            ownerData.phone = ownerPhone || null;
            ownerData.email = ownerEmail || null;
            clientData.owner = ownerData;
        }

        // Set phone for backward compatibility and proper display
        // Use owner phone as the main phone
        clientData.phone = ownerPhone || null;

        // Collect purchasing manager information
        const managerData = {};
        const managerName = formData.get('manager_name');
        const managerPhone = formData.get('manager_phone');
        const managerEmail = formData.get('manager_email');
        if (managerName || managerPhone || managerEmail) {
            managerData.name = managerName || null;
            managerData.phone = managerPhone || null;
            managerData.email = managerEmail || null;
            clientData.purchasing_manager = managerData;
        }

        // Collect accountant information
        const accountantData = {};
        const accountantName = formData.get('accountant_name');
        const accountantPhone = formData.get('accountant_phone');
        const accountantEmail = formData.get('accountant_email');
        if (accountantName || accountantPhone || accountantEmail) {
            accountantData.name = accountantName || null;
            accountantData.phone = accountantPhone || null;
            accountantData.email = accountantEmail || null;
            clientData.accountant = accountantData;
        }

        // Handle thumbnail upload
        const thumbnailFile = formData.get('thumbnail');
        if (thumbnailFile && thumbnailFile.size > 0) {
            try {
                const base64 = await this.convertToBase64(thumbnailFile);
                clientData.thumbnail = base64;
                console.log('Added thumbnail to client data');
            } catch (error) {
                console.error('Error converting thumbnail:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في تحميل الصورة الرئيسية' : 'Error uploading thumbnail');
                return;
            }
        }

        // Handle additional images
        const additionalFiles = formData.getAll('additional_images');
        if (additionalFiles && additionalFiles.length > 0 && additionalFiles[0].size > 0) {
            const additionalImages = [];
            for (let file of additionalFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        additionalImages.push({
                            filename: file.name,
                            data: base64
                        });
                    } catch (error) {
                        console.error('Error converting additional image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (additionalImages.length > 0) {
                clientData.additional_images = additionalImages;
                console.log(`Added ${additionalImages.length} additional images to client data`);
            }
        }

        console.log('Creating new client with data:', clientData);
        console.log('Phone fields from form:', {
            'owner_phone': formData.get('owner_phone'),
            'final_phone': clientData.phone
        });

        try {
            const response = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                alert(currentLanguage === 'ar' ? 'تم إضافة العميل بنجاح' : 'Client added successfully');
                form.closest('.modal-overlay').remove();
                this.loadClients(); // Refresh the clients list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(currentLanguage === 'ar' ? 'خطأ في إضافة العميل' : 'Error adding client: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error adding client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        }
    },

    loadClients: async function (statusFilter = 'active') {
        try {
            // Show loading state immediately
            const clientsList = document.getElementById('clientsList');
            const loadingText = currentLanguage === 'ar' ? 'جاري تحميل العملاء...' : 'Loading clients...';
            clientsList.innerHTML = `
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
            let apiUrl = `${API_BASE_URL}/clients/list`;
            if (statusFilter === 'all' || statusFilter === 'inactive') {
                apiUrl += '?show_all=true';
            }

            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                let clients = data.clients || data; // Handle both old and new format

                // Client-side filtering based on status
                if (statusFilter === 'active') {
                    clients = clients.filter(client => client.is_active !== false);
                } else if (statusFilter === 'inactive') {
                    clients = clients.filter(client => client.is_active === false);
                }

                // Store clients for filtering
                this.currentClients = clients;
                this.currentStatusFilter = statusFilter;

                // Load filter data separately (all regions and salesmen)
                this.loadFilterData();

                this.displayClients(clients);

                // Load thumbnails for clients that have them
                this.loadClientThumbnails(clients);

                // Store pagination info for infinite scroll
                this.currentPage = data.page || 1;
                this.hasMoreClients = data.has_more || false;
                this.totalClients = data.total || clients.length;

                // Add load more button if there are more clients
                this.addLoadMoreButton('clients');

                // Update status indicator
                this.updateStatusIndicator('clients', statusFilter, this.totalClients);
            } else {
                console.error('Failed to load clients');
                clientsList.innerHTML = '<p class="no-data">Failed to load clients</p>';
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            const clientsList = document.getElementById('clientsList');
            clientsList.innerHTML = '<p class="no-data">Error loading clients</p>';
        }
    },

    loadClientThumbnails: async function (clients) {
        /**Load thumbnails for clients that have them - called after displaying cards*/
        const clientsWithThumbnails = clients.filter(client => client.has_thumbnail);

        for (const client of clientsWithThumbnails) {
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${client.id}/thumbnail`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    const avatarElement = document.querySelector(`[data-client-id="${client.id}"]`);
                    if (avatarElement && data.thumbnail) {
                        avatarElement.innerHTML = `<img src="data:image/jpeg;base64,${data.thumbnail}" alt="${client.name}">`;
                    }
                }
            } catch (error) {
                console.error(`Error loading thumbnail for client ${client.id}:`, error);
                // Keep the loading indicator or show placeholder
            }
        }
    },

    loadClientImages: async function (clientId) {
        /**Load images for a specific client on demand*/
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/images`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const imagesSection = document.querySelector(`#client-expanded-${clientId} .additional-images-section`);

                if (imagesSection && data.images) {
                    // Replace loading spinner with actual images
                    const galleryDiv = imagesSection.querySelector('.image-gallery');
                    if (galleryDiv) {
                        galleryDiv.innerHTML = data.images.map((img, index) => `
                            <div class="gallery-item" onclick="ClientManager.viewImageFullscreen('${img.data}', '${img.filename}')">
                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}" title="${img.filename}">
                                <div class="gallery-overlay">
                                    <span class="gallery-filename">${img.filename}</span>
                                </div>
                            </div>
                        `).join('');

                        // Update the client object with loaded images
                        const client = this.currentClients.find(c => c.id === clientId);
                        if (client) {
                            client.additional_images = data.images;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading client images:', error);
            const imagesSection = document.querySelector(`#client-expanded-${clientId} .additional-images-section`);
            if (imagesSection) {
                const galleryDiv = imagesSection.querySelector('.image-gallery');
                if (galleryDiv) {
                    galleryDiv.innerHTML = `<p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images'}</p>`;
                }
            }
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

        // Add load more button if there are more items (ClientManager only checks hasMoreClients)
        if (this.hasMoreClients) {
            const button = document.createElement('div');
            button.className = 'load-more-button';
            button.innerHTML = `
                <button class="btn btn-secondary load-more-btn" onclick="ClientManager.loadMoreClients()">
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
    },

    loadMoreClients: async function () {
        /**Load next page of clients for infinite scroll*/
        if (!this.hasMoreClients) return;

        const button = document.querySelector('.load-more-btn');
        const spinner = button.querySelector('.loading-spinner');
        const buttonText = button.querySelector('.button-text');

        // Show loading state
        button.disabled = true;
        spinner.style.display = 'block';
        buttonText.textContent = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';

        try {
            const nextPage = this.currentPage + 1;
            let apiUrl = `${API_BASE_URL}/clients/list?page=${nextPage}`;
            if (this.currentStatusFilter === 'all' || this.currentStatusFilter === 'inactive') {
                apiUrl += '&show_all=true';
            }

            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const newClients = data.clients || data;

                // Append new clients to existing list
                this.currentClients = [...this.currentClients, ...newClients];

                // Update pagination info
                this.currentPage = data.page;
                this.hasMoreClients = data.has_more;

                // Display new clients
                this.displayClients(newClients, true); // true = append mode

                // Load thumbnails for new clients
                this.loadClientThumbnails(newClients);

                // Update load more button
                this.addLoadMoreButton('clients');
            }
        } catch (error) {
            console.error('Error loading more clients:', error);
        } finally {
            // Hide loading state
            button.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = currentLanguage === 'ar' ? 'تحميل المزيد' : 'Load More';
        }
    },


    loadFilterData: async function () {
        /**Load all unique regions and salesmen for filter dropdowns*/
        console.log('Loading filter data...');
        try {
            const response = await fetch(`${API_BASE_URL}/clients/filter-data`, {
                headers: getAuthHeaders()
            });

            console.log('Filter data response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Filter data received:', data);
                this.populateRegionFilter(data.regions);
                this.populateSalesmanFilter(data.salesmen);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to load filter data:', response.status, errorData);
            }
        } catch (error) {
            console.error('Error loading filter data:', error);
        }
    },

    populateRegionFilter: function (regions) {
        const regionFilter = document.getElementById('regionFilter');
        if (!regionFilter) return;

        // Use the regions array directly (already unique from backend)
        this.allRegions = regions;

        // Clear existing options except the first one (All Regions)
        regionFilter.innerHTML = `
            <option value="" data-ar="جميع المناطق" data-en="All Regions">${currentLanguage === 'ar' ? 'جميع المناطق' : 'All Regions'}</option>
        `;

        // Add region options
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionFilter.appendChild(option);
        });
    },

    populateSalesmanFilter: function (salesmen) {
        const salesmanFilter = document.getElementById('salesmanFilter');
        if (!salesmanFilter) {
            console.error('Salesman filter element not found');
            return;
        }

        // Use the salesmen array directly (already unique from backend)
        this.allSalesmen = salesmen;

        // Clear existing options completely
        salesmanFilter.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = currentLanguage === 'ar' ? 'جميع المندوبين' : 'All Salesmen';
        salesmanFilter.appendChild(defaultOption);

        // Add salesman options
        salesmen.forEach(salesman => {
            const option = document.createElement('option');
            option.value = salesman;
            option.textContent = salesman;
            salesmanFilter.appendChild(option);
        });

        console.log('Salesman filter populated with:', salesmen);
    },

    displayClients: function (clients, append = false) {
        const clientsList = document.getElementById('clientsList');

        // Check if user is salesman (no edit/delete permissions)
        const userInfo = localStorage.getItem('userInfo');
        let canEdit = true;
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                canEdit = user.role !== 'salesman';
            } catch (e) {
                console.error('Error parsing user info:', e);
            }
        }

        if (clients.length === 0 && !append) {
            clientsList.innerHTML = `
                <div class="empty-state">
                    <h3>${currentLanguage === 'ar' ? 'لا توجد عملاء' : 'No Clients'}</h3>
                    <p>${currentLanguage === 'ar' ? 'ابدأ بإضافة عميل جديد' : 'Start by adding a new client'}</p>
                </div>
            `;
        } else {
            // Display clients cards with edit/delete buttons (if allowed)
            const cardsHTML = clients.map(client => {
                const isInactive = client.is_active === false;
                const cardClass = `client-card ${isInactive ? 'inactive' : ''}`;

                // Get phone from owner or direct phone field
                const clientPhone = client.phone || (client.owner && client.owner.phone) || '';
                console.log(`Client ${client.id} (${client.name}) phone:`, clientPhone);

                return `
                    <div class="${cardClass}" ${!isInactive ? `onclick="ClientManager.viewClientDetails(${client.id})"` : ''}>
                        <div class="card-header">
                            <div class="client-avatar" data-client-id="${client.id}">
                                ${client.has_thumbnail ?
                        `<div class="thumbnail-loading">⏳</div>` :
                        `<div class="avatar-placeholder">${client.name ? client.name.charAt(0).toUpperCase() : '👤'}</div>`
                    }
                            </div>
                            <div class="client-info">
                                <h3>${client.name}</h3>
                                <div class="region">${client.region || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</div>
                                ${client.salesman_name ?
                        `<div class="salesman">${currentLanguage === 'ar' ? 'البائع:' : 'Salesman:'} ${client.salesman_name}</div>` :
                        ''
                    }
                                ${isInactive ? `<div class="inactive-badge">${currentLanguage === 'ar' ? 'معطل' : 'Inactive'}</div>` : ''}
                            </div>
                        </div>
                        <div class="client-actions" onclick="event.stopPropagation()">
                            ${!isInactive ? `
                                <button class="phone-btn" onclick="ClientManager.copyPhone('${clientPhone}')">
                                    📞 ${clientPhone || (currentLanguage === 'ar' ? 'لا يوجد هاتف' : 'No phone')}
                                </button>
                                <button class="location-btn ${client.location ? 'location-set' : 'location-undefined'}" onclick="ClientManager.openLocation('${client.location || ''}')" title="${client.location ? (currentLanguage === 'ar' ? 'فتح الموقع' : 'Open Location') : (currentLanguage === 'ar' ? 'لا يوجد موقع' : 'No Location')}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    ${client.location ? '' : '!'}
                                </button>
                                ${canEdit ? `
                                    <div class="symbol-buttons">
                                        <button class="btn-icon-stylish btn-edit-stylish" onclick="ClientManager.editClient(${client.id})" title="${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                            </svg>
                                        </button>
                                        <button class="btn-icon-stylish btn-delete-stylish" onclick="ClientManager.deleteClient(${client.id})" title="${currentLanguage === 'ar' ? 'إلغاء تفعيل' : 'Deactivate'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                ` : ''}
                            ` : `
                                ${canEdit ? `
                                    <div style="flex: 1;"></div>
                                    <div class="symbol-buttons">
                                        <button class="btn-icon-stylish reactivate-btn" onclick="ClientManager.reactivateClient(${client.id})" title="${currentLanguage === 'ar' ? 'إعادة تفعيل' : 'Reactivate'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                        </button>
                                    </div>
                                ` : ''}
                            `}
                        </div>
                    </div>
                `;
            }).join('');

            if (append) {
                // Append new cards to existing list
                clientsList.insertAdjacentHTML('beforeend', cardsHTML);
            } else {
                // Replace all content
                clientsList.innerHTML = cardsHTML;
            }
        }

        // Update client count display
        this.updateClientCount(clients.length);
    },

    updateClientCount: function (count) {
        const clientCountElement = document.getElementById('clientCount');
        if (clientCountElement) {
            const span = clientCountElement.querySelector('span');
            if (span) {
                if (currentLanguage === 'ar') {
                    span.textContent = `${count} ${count === 1 ? 'عميل' : 'عميل'}`;
                } else {
                    span.textContent = `${count} ${count === 1 ? 'client' : 'clients'}`;
                }
            }
        }
    },

    filterClients: async function (searchTerm = '', selectedRegion = '', selectedSalesman = '') {
        // If search term or filters are cleared, reload the full list with infinite scroll
        if (!searchTerm.trim() && !selectedRegion.trim() && !selectedSalesman.trim()) {
            const statusFilter = document.getElementById('clientStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';
            this.loadClients(currentStatus); // Reloads page 1 and re-enables infinite scroll
            return;
        }

        // If search term is provided, use backend search for ALL clients
        if (searchTerm.trim()) {
            await this.searchClients(searchTerm, selectedRegion, selectedSalesman);
        } else {
            // Only filters (no search) - use backend to get ALL filtered clients
            await this.loadFilteredClients(selectedRegion, selectedSalesman);
        }
    },

    loadFilteredClients: async function (selectedRegion = '', selectedSalesman = '') {
        /**Load filtered clients from backend (searches ALL data, not just displayed)*/
        try {
            const statusFilter = document.getElementById('clientStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';

            let apiUrl = `${API_BASE_URL}/clients/list?page=1&per_page=500`;
            if (currentStatus === 'all' || currentStatus === 'inactive') {
                apiUrl += '&show_all=true';
            }
            if (selectedRegion) {
                apiUrl += `&region=${encodeURIComponent(selectedRegion)}`;
            }
            if (selectedSalesman) {
                apiUrl += `&salesman=${encodeURIComponent(selectedSalesman)}`;
            }

            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const filteredClients = data.clients || [];

                // ✅ IMPORTANT: Store filtered clients so view/edit/delete functions can access them
                this.currentClients = filteredClients;

                // Display results
                this.displayClients(filteredClients, false);

                // Load thumbnails
                this.loadClientThumbnails(filteredClients);

                // --- FIX: Disable infinite scroll for filtered results ---
                const loadMoreBtn = document.querySelector('#clientsList .load-more-button');
                if (loadMoreBtn) {
                    loadMoreBtn.remove();
                }
                this.hasMoreClients = false; // Prevent observer from firing
                // ---------------------------------------------------------

                // Update count
                this.updateStatusIndicator('clients', currentStatus, data.total);
                this.updateClientCount(filteredClients.length);
            } else {
                console.error('Failed to load filtered clients');
            }
        } catch (error) {
            console.error('Error loading filtered clients:', error);
        }
    },

    searchClients: async function (searchTerm, selectedRegion = '', selectedSalesman = '') {
        /**Search ALL clients using backend API*/
        try {
            const statusFilter = document.getElementById('clientStatusFilter');
            const currentStatus = statusFilter ? statusFilter.value : 'active';

            let apiUrl = `${API_BASE_URL}/clients/search?q=${encodeURIComponent(searchTerm)}&page=1&per_page=500`;
            if (currentStatus === 'all' || currentStatus === 'inactive') {
                apiUrl += '&show_all=true';
            }

            const response = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                let searchResults = data.clients || [];

                // Apply region and salesman filters locally
                if (selectedRegion.trim()) {
                    searchResults = searchResults.filter(client => client.region === selectedRegion);
                }
                if (selectedSalesman.trim()) {
                    searchResults = searchResults.filter(client => client.salesman_name === selectedSalesman);
                }

                // ✅ IMPORTANT: Store search results so view/edit/delete functions can access them
                this.currentClients = searchResults;

                // Display results
                this.displayClients(searchResults, false);

                // Load thumbnails for search results
                this.loadClientThumbnails(searchResults);

                // --- FIX: Disable infinite scroll for search results ---
                const loadMoreBtn = document.querySelector('#clientsList .load-more-button');
                if (loadMoreBtn) {
                    loadMoreBtn.remove();
                }
                this.hasMoreClients = false; // Prevent observer from firing
                // -------------------------------------------------------

                // Update count
                this.updateStatusIndicator('clients', currentStatus, data.total);
                this.updateClientCount(searchResults.length);
            } else {
                console.error('Failed to search clients');
            }
        } catch (error) {
            console.error('Error searching clients:', error);
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

    viewClientDetails: async function (clientId) {
        // Show loading modal first
        const modal = document.createElement('div');
        modal.className = 'expanded-modal';
        modal.innerHTML = `
            <div class="expanded-content">
                <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                <div class="loading-state">
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="loading-text">${currentLanguage === 'ar' ? 'جاري تحميل بيانات العميل...' : 'Loading client data...'}</p>
                </div>
            </div>
        `;

        // Show modal and disable scroll
        document.body.appendChild(modal);
        modal.classList.add('active');
        ScrollManager.disableScroll();

        // Fetch FULL client details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                modal.innerHTML = `
                    <div class="expanded-content">
                        <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                        <p class="error-text">${currentLanguage === 'ar' ? 'فشل تحميل بيانات العميل' : 'Failed to load client data'}</p>
                    </div>
                `;
                return;
            }

            const client = await response.json();
            console.log('Client loaded for viewing:', client);

            // Update modal with actual content (thumbnail is now available!)
            modal.innerHTML = `
            <div class="expanded-content">
                <button class="js-modal-close">&times;</button>
                
                <div class="expanded-header">
                    <div class="expanded-image">
                        ${client.thumbnail ?
                    `<img src="data:image/jpeg;base64,${client.thumbnail}" alt="${client.name}" onclick="ClientManager.viewClientImage('${client.thumbnail}', '${client.name}')">` :
                    `<div class="avatar-placeholder-large">${client.name ? client.name.charAt(0).toUpperCase() : '👤'}</div>`
                }
                    </div>
                    <div class="expanded-title">
                        <h2>${client.name}</h2>
                        <p class="client-region">${client.region || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</p>
                    </div>
                </div>
                
                <div class="expanded-details">
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</h3>
                        <div class="detail-grid">
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</div>
                                <div class="detail-value">
                                    ${client.phone ?
                    `<span class="phone-display">${client.phone}</span>
                                         <button class="copy-btn" onclick="ClientManager.copyPhone('${client.phone}')" title="${currentLanguage === 'ar' ? 'نسخ الرقم' : 'Copy Number'}">📋</button>`
                    : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'الموقع:' : 'Location:'}</div>
                                <div class="detail-value">
                                    ${client.location ?
                    `<span class="location-display">${client.location}</span>
                                         <button class="map-btn location-set" onclick="ClientManager.openLocation('${client.location}')" title="${currentLanguage === 'ar' ? 'فتح الموقع' : 'Open Location'}">
                                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                 <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                 <circle cx="12" cy="10" r="3"/>
                                             </svg>
                                         </button>`
                    : `<span class="location-undefined-text">${currentLanguage === 'ar' ? 'غير محدد' : 'Not specified'}</span>
                                           <button class="map-btn location-undefined" onclick="ClientManager.openLocation('')" title="${currentLanguage === 'ar' ? 'لا يوجد موقع' : 'No Location'}" disabled>
                                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                   <circle cx="12" cy="10" r="3"/>
                                               </svg>
                                               !
                                           </button>`
                }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'العنوان:' : 'Address:'}</div>
                                <div class="detail-value">
                                    ${client.address ?
                    `<span class="address-display">${client.address}</span>`
                    : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'الأشخاص المسؤولون' : 'Responsible Persons'}</h3>
                        <div class="detail-grid">
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'المالك:' : 'Owner:'}</div>
                                <div class="detail-value">
                                    ${client.owner ?
                    `<div class="person-info">
                                            <span class="person-name">${client.owner.name}</span>
                                            ${client.owner.phone ? `<span class="person-phone">📞 ${client.owner.phone}</span>` : ''}
                                            ${client.owner.email ? `<span class="person-email">✉️ ${client.owner.email}</span>` : ''}
                                         </div>`
                    : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'مدير المشتريات:' : 'Purchasing Manager:'}</div>
                                <div class="detail-value">
                                    ${client.purchasing_manager ?
                    `<div class="person-info">
                                            <span class="person-name">${client.purchasing_manager.name}</span>
                                            ${client.purchasing_manager.phone ? `<span class="person-phone">📞 ${client.purchasing_manager.phone}</span>` : ''}
                                            ${client.purchasing_manager.email ? `<span class="person-email">✉️ ${client.purchasing_manager.email}</span>` : ''}
                                         </div>`
                    : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                }
                                </div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'المحاسب:' : 'Accountant:'}</div>
                                <div class="detail-value">
                                    ${client.accountant ?
                    `<div class="person-info">
                                            <span class="person-name">${client.accountant.name}</span>
                                            ${client.accountant.phone ? `<span class="person-phone">📞 ${client.accountant.phone}</span>` : ''}
                                            ${client.accountant.email ? `<span class="person-email">✉️ ${client.accountant.email}</span>` : ''}
                                         </div>`
                    : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')
                }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>${currentLanguage === 'ar' ? 'معلومات إضافية' : 'Additional Information'}</h3>
                        <div class="detail-grid">
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'اسم البائع:' : 'Salesman Name:'}</div>
                                <div class="detail-value">${client.salesman_name || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'تاريخ الإضافة:' : 'Date Added:'}</div>
                                <div class="detail-value">${new Date(client.created_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US')}</div>
                            </div>
                            <div class="detail-group">
                                <div class="detail-label">${currentLanguage === 'ar' ? 'المستخدم المسؤول:' : 'Assigned User:'}</div>
                                <div class="detail-value">${client.assigned_user || (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified')}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${(client.images && Array.isArray(client.images) && client.images.length > 0) ? `
                    <div class="detail-section additional-images-section">
                        <h3>${currentLanguage === 'ar' ? 'الصور الإضافية' : 'Additional Images'} (${client.images.length})</h3>
                        <div class="image-gallery">
                            ${client.images.map(img => `
                                <div class="gallery-item" onclick="ClientManager.viewClientImage('${img.data}', '${img.filename}')">
                                    <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename || client.name}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="expanded-actions">
                    <button class="btn btn-primary js-edit-and-close">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        ${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}
                    </button>
                    <button class="btn btn-secondary js-modal-cancel">
                        ${currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        `;

            // Setup proper close handlers
            const closeButton = modal.querySelector('.js-modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'viewClientDetails-close-btn');
                });
            }

            const cancelButton = modal.querySelector('.js-modal-cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'viewClientDetails-cancel-btn');
                });
            }

            const editButton = modal.querySelector('.js-edit-and-close');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'viewClientDetails-edit-btn');
                    ClientManager.editClient(client.id);
                });
            }

            // Close modal when clicking outside
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    closeModalAndRestoreScroll(modal, 'viewClientDetails-overlay-click');
                }
            });

        } catch (error) {
            console.error('Error loading client for expanded view:', error);
            modal.innerHTML = `
                <div class="expanded-content">
                    <button class="expanded-close" onclick="this.closest('.expanded-modal').remove()">&times;</button>
                    <p class="error-text">${currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات العميل' : 'Error loading client data'}</p>
                </div>
            `;
        }
    },

    viewClientImage: function (imageData, clientName) {
        if (!imageData) return;

        // Create fullscreen image viewer
        const modal = document.createElement('div');
        modal.className = 'fullscreen-image-modal';
        modal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="this.closest('.fullscreen-image-modal').remove(); ScrollManager.enableScroll();">&times;</button>
                <img src="data:image/jpeg;base64,${imageData}" alt="${clientName}">
                <div class="image-title">${clientName}</div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Close on background click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.remove();
                ScrollManager.enableScroll();
            }
        });
    },

    viewClientImages: function (clientId, startIndex = 0) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client || !client.additional_images || client.additional_images.length === 0) return;

        // Prepare all images (thumbnail + additional)
        const allImages = [];

        // Add thumbnail as first image if it exists
        if (client.thumbnail) {
            allImages.push({
                data: client.thumbnail,
                filename: `${client.name} - Thumbnail`,
                title: currentLanguage === 'ar' ? 'الصورة الرئيسية' : 'Main Image'
            });
        }

        // Add additional images
        client.additional_images.forEach((img, index) => {
            allImages.push({
                data: img.data,
                filename: img.filename || `${client.name} - Image ${index + 1}`,
                title: img.filename || currentLanguage === 'ar' ? 'صورة إضافية' : 'Additional Image'
            });
        });

        // Adjust start index if thumbnail was added
        const actualStartIndex = client.thumbnail ? startIndex + 1 : startIndex;

        // Open fullscreen viewer with navigation
        this.viewImageFullscreen(
            `data:image/jpeg;base64,${allImages[actualStartIndex].data}`,
            allImages[actualStartIndex].title,
            allImages,
            actualStartIndex
        );
    },

    viewImageFullscreen: function (imageSrc, altText, imagesList = null, currentIndex = 0) {
        // Create fullscreen image viewer with navigation
        const modal = document.createElement('div');
        modal.className = 'fullscreen-image-modal';
        modal.innerHTML = `
            <div class="fullscreen-image-content">
                <button class="fullscreen-close" onclick="ClientManager.closeFullscreenImage()">&times;</button>
                
                ${imagesList && imagesList.length > 1 ? `
                    <button class="nav-btn prev-btn" onclick="ClientManager.showPreviousImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                        </svg>
                    </button>
                    <button class="nav-btn next-btn" onclick="ClientManager.showNextImage()">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                    </button>
                ` : ''}
                
                <img src="${imageSrc}" alt="${altText}">
                <div class="image-info">
                    <div class="image-title">${altText}</div>
                    ${imagesList && imagesList.length > 1 ? `
                        <div class="image-counter">${currentIndex + 1} ${currentLanguage === 'ar' ? 'من' : 'of'} ${imagesList.length}</div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Store current state
        this.currentImagesList = imagesList;
        this.currentImageIndex = currentIndex;

        // Close on background click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                ClientManager.closeFullscreenImage();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    },

    closeFullscreenImage: function () {
        const modal = document.querySelector('.fullscreen-image-modal');
        if (modal) {
            modal.remove();
            ScrollManager.enableScroll();
        }
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyNavigation.bind(this));
        // Clear state
        this.currentImagesList = null;
        this.currentImageIndex = 0;
    },

    showPreviousImage: function () {
        if (!this.currentImagesList || this.currentImagesList.length <= 1) return;

        this.currentImageIndex = this.currentImageIndex > 0 ?
            this.currentImageIndex - 1 :
            this.currentImagesList.length - 1;

        this.updateFullscreenImage();
    },

    showNextImage: function () {
        if (!this.currentImagesList || this.currentImagesList.length <= 1) return;

        this.currentImageIndex = this.currentImageIndex < this.currentImagesList.length - 1 ?
            this.currentImageIndex + 1 :
            0;

        this.updateFullscreenImage();
    },

    updateFullscreenImage: function () {
        if (!this.currentImagesList || !this.currentImagesList[this.currentImageIndex]) return;

        const modal = document.querySelector('.fullscreen-image-modal');
        if (!modal) return;

        const img = modal.querySelector('img');
        const title = modal.querySelector('.image-title');
        const counter = modal.querySelector('.image-counter');

        const currentImg = this.currentImagesList[this.currentImageIndex];

        if (img) {
            img.src = `data:image/jpeg;base64,${currentImg.data}`;
            img.alt = currentImg.title;
        }

        if (title) {
            title.textContent = currentImg.title;
        }

        if (counter) {
            counter.textContent = `${this.currentImageIndex + 1} ${currentLanguage === 'ar' ? 'من' : 'of'} ${this.currentImagesList.length}`;
        }
    },

    handleKeyNavigation: function (event) {
        switch (event.key) {
            case 'Escape':
                this.closeFullscreenImage();
                break;
            case 'ArrowLeft':
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                this.showNextImage();
                break;
        }
    },

    editClient: async function (clientId) {
        // Fetch FULL client details including thumbnail and images
        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                alert(currentLanguage === 'ar' ? 'فشل تحميل بيانات العميل' : 'Failed to load client data');
                return;
            }

            const client = await response.json();
            console.log('Client loaded for editing with images:', client.images);

            // Create comprehensive edit modal
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Client'}</h3>
                    <button class="js-modal-close">&times;</button>
                </div>
                <form id="editClientForm" onsubmit="ClientManager.saveClient(event, ${client.id}); return false;">
                    
                    <!-- Basic Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم العميل' : 'Client Name'} *</label>
                                <input type="text" name="name" value="${client.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'المنطقة' : 'Region'}</label>
                                <input type="text" name="region" value="${client.region || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم البائع' : 'Salesman Name'}</label>
                                <input type="text" name="salesman_name" value="${client.salesman_name || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'الموقع' : 'Location'}</label>
                                <input type="text" name="location" value="${client.location || ''}" placeholder="${currentLanguage === 'ar' ? 'مثال: الرياض، السعودية' : 'e.g., Riyadh, Saudi Arabia'}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'العنوان' : 'Address'}</label>
                                <input type="text" name="address" value="${client.address || ''}" placeholder="${currentLanguage === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صورة العميل الرئيسية' : 'Client Thumbnail'}</label>
                            ${client.thumbnail ? `
                                <div class="current-image-container">
                                    <div class="current-image">
                                        <img src="data:image/jpeg;base64,${client.thumbnail}" alt="${client.name}">
                                        <button type="button" class="btn-delete-image" onclick="ClientManager.deleteThumbnail(${client.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                            <svg viewBox="0 0 24 24" width="16" height="16">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <small class="form-help">${currentLanguage === 'ar' ? 'الصورة الحالية - اضغط على X لحذفها' : 'Current image - click X to delete'}</small>
                                </div>
                            ` : ''}
                            <input type="file" name="thumbnail" accept="image/*">
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - صورة جديدة تمثل العميل' : 'Optional - new main image representing the client'}</small>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'صور إضافية جديدة' : 'New Additional Images'}</label>
                            ${(client.images && Array.isArray(client.images) && client.images.length > 0) ? `
                                <div class="current-images-container">
                                    <h5>${currentLanguage === 'ar' ? 'الصور الحالية:' : 'Current Images:'}</h5>
                                    <div class="images-grid">
                                        ${client.images.map(img => `
                                            <div class="current-image">
                                                <img src="data:image/jpeg;base64,${img.data}" alt="${img.filename}">
                                                <button type="button" class="btn-delete-image" onclick="ClientManager.deleteAdditionalImage(${client.id}, ${img.id})" title="${currentLanguage === 'ar' ? 'حذف الصورة' : 'Delete Image'}">
                                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <input type="file" name="additional_images" accept="image/*" multiple>
                            <small class="form-help">${currentLanguage === 'ar' ? 'اختياري - إضافة صور جديدة للعميل' : 'Optional - add new images to the client'}</small>
                        </div>
                    </div>

                    <!-- Owner Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المالك' : 'Owner Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المالك' : 'Owner Name'}</label>
                                <input type="text" name="owner_name" value="${client.owner?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المالك' : 'Owner Phone'}</label>
                                <input type="tel" name="owner_phone" value="${client.owner?.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المالك' : 'Owner Email'}</label>
                            <input type="email" name="owner_email" value="${client.owner?.email || ''}">
                        </div>
                    </div>

                    <!-- Purchasing Manager Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات مدير المشتريات' : 'Purchasing Manager Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم مدير المشتريات' : 'Manager Name'}</label>
                                <input type="text" name="manager_name" value="${client.purchasing_manager?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف مدير المشتريات' : 'Manager Phone'}</label>
                                <input type="tel" name="manager_phone" value="${client.purchasing_manager?.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل مدير المشتريات' : 'Manager Email'}</label>
                            <input type="email" name="manager_email" value="${client.purchasing_manager?.email || ''}">
                        </div>
                    </div>

                    <!-- Accountant Information Section -->
                    <div class="form-section">
                        <h4>${currentLanguage === 'ar' ? 'معلومات المحاسب' : 'Accountant Information'}</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'اسم المحاسب' : 'Accountant Name'}</label>
                                <input type="text" name="accountant_name" value="${client.accountant?.name || ''}">
                            </div>
                            <div class="form-group">
                                <label>${currentLanguage === 'ar' ? 'هاتف المحاسب' : 'Accountant Phone'}</label>
                                <input type="tel" name="accountant_phone" value="${client.accountant?.phone || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${currentLanguage === 'ar' ? 'ايميل المحاسب' : 'Accountant Email'}</label>
                            <input type="email" name="accountant_email" value="${client.accountant?.email || ''}">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary js-modal-cancel">
                            ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${currentLanguage === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        `;

            // Open modal and disable scroll
            openModalAndDisableScroll(modal, 'editClientForm');

            // Setup proper close handlers
            const closeButton = modal.querySelector('.js-modal-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'editClientForm-close-btn');
                });
            }

            const cancelButton = modal.querySelector('.js-modal-cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    closeModalAndRestoreScroll(modal, 'editClientForm-cancel-btn');
                });
            }

        } catch (error) {
            console.error('Error loading client for edit:', error);
            alert(currentLanguage === 'ar' ? 'حدث خطأ أثناء تحميل بيانات العميل' : 'Error loading client data');
        }
    },

    saveClient: async function (event, clientId) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // Collect basic client data
        const clientData = {
            name: formData.get('name'),
            region: formData.get('region') || null,
            salesman_name: formData.get('salesman_name') || null,
            location: formData.get('location') || null,
            address: formData.get('address') || null
        };

        // Collect owner information
        const ownerData = {};
        const ownerName = formData.get('owner_name');
        const ownerPhone = formData.get('owner_phone');
        const ownerEmail = formData.get('owner_email');
        if (ownerName || ownerPhone || ownerEmail) {
            ownerData.name = ownerName || null;
            ownerData.phone = ownerPhone || null;
            ownerData.email = ownerEmail || null;
            clientData.owner = ownerData;
        }

        // Set phone for backward compatibility and proper display
        // Use owner phone as the main phone
        clientData.phone = ownerPhone || null;

        // Collect purchasing manager information
        const managerData = {};
        const managerName = formData.get('manager_name');
        const managerPhone = formData.get('manager_phone');
        const managerEmail = formData.get('manager_email');
        if (managerName || managerPhone || managerEmail) {
            managerData.name = managerName || null;
            managerData.phone = managerPhone || null;
            managerData.email = managerEmail || null;
            clientData.purchasing_manager = managerData;
        }

        // Collect accountant information
        const accountantData = {};
        const accountantName = formData.get('accountant_name');
        const accountantPhone = formData.get('accountant_phone');
        const accountantEmail = formData.get('accountant_email');
        if (accountantName || accountantPhone || accountantEmail) {
            accountantData.name = accountantName || null;
            accountantData.phone = accountantPhone || null;
            accountantData.email = accountantEmail || null;
            clientData.accountant = accountantData;
        }

        console.log('Saving client data:', clientData);
        console.log('Phone fields from form:', {
            'owner_phone': formData.get('owner_phone'),
            'final_phone': clientData.phone
        });

        // Handle thumbnail upload
        const thumbnailFile = formData.get('thumbnail');
        if (thumbnailFile && thumbnailFile.size > 0) {
            try {
                const base64 = await this.convertToBase64(thumbnailFile);
                clientData.thumbnail = base64;
                console.log('Added thumbnail to client data');
            } catch (error) {
                console.error('Error converting thumbnail:', error);
            }
        }

        // Handle additional images
        const additionalFiles = formData.getAll('additional_images');
        if (additionalFiles && additionalFiles.length > 0 && additionalFiles[0].size > 0) {
            const additionalImages = [];
            for (let file of additionalFiles) {
                if (file.size > 0) {
                    try {
                        const base64 = await this.convertToBase64(file);
                        additionalImages.push({
                            filename: file.name,
                            data: base64
                        });
                    } catch (error) {
                        console.error('Error converting additional image:', error);
                        alert(currentLanguage === 'ar' ? `خطأ في تحميل الصورة: ${file.name}` : `Error uploading image: ${file.name}`);
                        return;
                    }
                }
            }
            if (additionalImages.length > 0) {
                clientData.additional_images = additionalImages;
                console.log(`Added ${additionalImages.length} additional images to client data`);
            }
        }

        try {
            console.log('Sending PUT request to:', `${API_BASE_URL}/clients/${clientId}`);

            const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                alert(currentLanguage === 'ar' ? 'تم تحديث العميل بنجاح' : 'Client updated successfully');
                form.closest('.modal-overlay').remove();
                this.loadClients(); // Refresh the clients list
                loadDashboardData(); // Refresh dashboard counts
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(currentLanguage === 'ar' ? 'خطأ في التحديث' : 'Error updating client: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error updating client:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    deleteClient: async function (clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;

        const confirmMessage = currentLanguage === 'ar' ?
            `هل أنت متأكد من إلغاء تفعيل العميل "${client.name}"؟ يمكن إعادة تفعيله لاحقاً.` :
            `Are you sure you want to deactivate client "${client.name}"? It can be reactivated later.`;

        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const successMessage = currentLanguage === 'ar' ?
                        'تم إلغاء تفعيل العميل بنجاح' :
                        'Client deactivated successfully';

                    alert(successMessage);
                    this.loadClients(); // Refresh the clients list
                    loadDashboardData(); // Refresh dashboard counts

                } else {
                    const errorData = await response.json();

                    // Handle specific token errors
                    if (response.status === 401 && (errorData.message.includes('Token') || errorData.message.includes('expired') || errorData.message.includes('invalid'))) {
                        alert(currentLanguage === 'ar' ? 'انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مرة أخرى' : 'Session expired, please login again');
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userInfo');
                        window.location.href = '/login';
                        return;
                    }

                    const errorMessage = currentLanguage === 'ar' ?
                        'خطأ في حذف العميل: ' + (errorData.message || 'حدث خطأ غير معروف') :
                        'Error deleting client: ' + (errorData.message || 'Unknown error occurred');

                    alert(errorMessage);
                }

            } catch (error) {
                console.error('Error deleting client:', error);
                const errorMessage = currentLanguage === 'ar' ?
                    'فشل في حذف العميل. تحقق من اتصال الإنترنت.' :
                    'Failed to delete client. Please check your internet connection.';

                alert(errorMessage);
            }
        }
    },

    reactivateClient: async function (clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;

        const confirmMessage = currentLanguage === 'ar' ?
            `هل أنت متأكد من إعادة تفعيل العميل "${client.name}"؟` :
            `Are you sure you want to reactivate client "${client.name}"?`;

        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${clientId}/reactivate`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert(currentLanguage === 'ar' ? 'تم إعادة تفعيل العميل بنجاح' : 'Client reactivated successfully');
                    this.loadClients(); // Refresh the clients list
                    loadDashboardData(); // Refresh dashboard counts
                } else {
                    const errorData = await response.json();
                    alert(currentLanguage === 'ar' ? 'خطأ في إعادة تفعيل العميل' : 'Error reactivating client: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error reactivating client:', error);
                alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
            }
        }
    },

    copyPhone: function (phone) {
        console.log('copyPhone called with:', phone);

        if (phone && phone.trim()) {
            // Copy to clipboard first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(phone).then(() => {
                    console.log('Phone copied to clipboard');
                    // Show success message
                    alert(currentLanguage === 'ar' ? `تم نسخ الرقم: ${phone}` : `Phone copied: ${phone}`);
                }).catch((error) => {
                    console.log('Clipboard API failed:', error);
                    this.fallbackCopyPhone(phone);
                });
            } else {
                this.fallbackCopyPhone(phone);
            }

            // Open dialer
            const normalized = phone.replace(/[^\d+]/g, '');
            const telUrl = `tel:${normalized}`;
            console.log('Opening dialer with URL:', telUrl);

            // Try to open dialer
            try {
                window.location.href = telUrl;
            } catch (error) {
                console.log('Failed to open dialer:', error);
                // Fallback: just copy the number
                this.fallbackCopyPhone(phone);
            }
        } else {
            console.log('No phone number provided');
            alert(currentLanguage === 'ar' ? 'لا يوجد رقم هاتف' : 'No phone number available');
        }
    },

    fallbackCopyPhone: function (phone) {
        const textArea = document.createElement('textarea');
        textArea.value = phone;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('Phone copied via fallback');
                alert(currentLanguage === 'ar' ? `تم نسخ الرقم: ${phone}` : `Phone copied: ${phone}`);
            } else {
                console.log('Fallback copy failed');
                alert(currentLanguage === 'ar' ? `الرقم: ${phone}` : `Phone: ${phone}`);
            }
        } catch (error) {
            console.log('Fallback copy error:', error);
            alert(currentLanguage === 'ar' ? `الرقم: ${phone}` : `Phone: ${phone}`);
        }

        document.body.removeChild(textArea);
    },

    openLocation: function (location) {
        if (location && location.trim()) {
            // Open the URL directly
            window.open(location, '_blank');
        } else {
            alert(currentLanguage === 'ar' ? 'لا يوجد موقع محدد' : 'No location specified');
        }
    },

    convertToBase64: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    },

    // Image deletion functions
    deleteThumbnail: async function (clientId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف الصورة الرئيسية؟' : 'Are you sure you want to delete the thumbnail?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/thumbnail`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة الرئيسية بنجاح' : 'Thumbnail deleted successfully');
                // Refresh the client data and close the modal
                this.loadClients();
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

    deleteAdditionalImage: async function (clientId, imageId) {
        if (!confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/clients/${clientId}/images/${imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully');
                // Refresh the client data and close the modal
                this.loadClients();
                document.querySelector('.modal-overlay')?.remove();
            } else {
                const error = await response.json();
                alert(currentLanguage === 'ar' ? `خطأ في حذف الصورة: ${error.message}` : `Error deleting image: ${error.message}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
        }
    }
};


// Make globally available
window.ClientManager = ClientManager;
