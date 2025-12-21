/**
 * // User Management Functions
 * Extracted from main.js for modular architecture
 */

// =====================================================
// USER MANAGEMENT (Admin only)
// =====================================================

const UserManager = {
    allUsers: [],
    allSupervisors: [],


    loadUsers: async function () {
        try {
            const response = await fetch(`${API_BASE_URL}/users/all`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const users = await response.json();
                this.allUsers = users;
                this.displayUsers(users);
                this.loadSupervisors();
                this.setupFilters();
            } else {
                console.error('Failed to load users');
                alert(currentLanguage === 'ar' ? 'فشل في تحميل المستخدمين' : 'Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    },

    loadSupervisors: async function () {
        try {
            const response = await fetch(`${API_BASE_URL}/supervisors/all`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                this.allSupervisors = await response.json();
            }
        } catch (error) {
            console.error('Error loading supervisors:', error);
        }
    },

    displayUsers: function (users) {
        const tbody = document.getElementById('usersTableBody');

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        ${currentLanguage === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const roleText = this.getRoleText(user.role);
            const isSalesman = user.role === 'salesman';

            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${roleText}</td>
                    <td>
                        ${isSalesman ?
                    (user.supervisor_name || `<span style="color: #999;">${currentLanguage === 'ar' ? 'غير معين' : 'Unassigned'}</span>`) :
                    '<span style="color: #999;">-</span>'
                }
                    </td>
                    <td>
                        ${isSalesman ?
                    `<button class="btn btn-primary btn-sm" onclick="UserManager.showAssignSupervisorModal(${user.id}, '${user.username}', ${user.supervisor_id || 'null'})">
                                ${currentLanguage === 'ar' ? 'تعيين مشرف' : 'Assign Supervisor'}
                            </button>` :
                    ''
                }
                    </td>
                </tr>
            `;
        }).join('');
    },

    getRoleText: function (role) {
        const roleMap = {
            'super_admin': currentLanguage === 'ar' ? 'مسؤول النظام' : 'Super Admin',
            'sales_supervisor': currentLanguage === 'ar' ? 'مشرف مبيعات' : 'Sales Supervisor',
            'salesman': currentLanguage === 'ar' ? 'مندوب مبيعات' : 'Salesman'
        };
        return roleMap[role] || role;
    },

    setupFilters: function () {
        const searchInput = document.getElementById('userSearch');
        const roleFilter = document.getElementById('roleFilter');

        const applyFilters = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const roleFilter = document.getElementById('roleFilter').value;

            let filtered = this.allUsers;

            if (searchTerm) {
                filtered = filtered.filter(user =>
                    user.username.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm)
                );
            }

            if (roleFilter) {
                filtered = filtered.filter(user => user.role === roleFilter);
            }

            this.displayUsers(filtered);
        };

        searchInput.addEventListener('input', applyFilters);
        roleFilter.addEventListener('change', applyFilters);
    },

    showAssignSupervisorModal: function (userId, username, currentSupervisorId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${currentLanguage === 'ar' ? 'تعيين مشرف' : 'Assign Supervisor'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${currentLanguage === 'ar' ? 'المستخدم:' : 'User:'} <strong>${username}</strong></p>
                    <div class="form-group">
                        <label>${currentLanguage === 'ar' ? 'اختر المشرف' : 'Select Supervisor'}</label>
                        <select id="supervisorSelect" class="filter-select">
                            <option value="">${currentLanguage === 'ar' ? 'لا يوجد مشرف' : 'No Supervisor'}</option>
                            ${this.allSupervisors.map(supervisor => `
                                <option value="${supervisor.id}" ${supervisor.id === currentSupervisorId ? 'selected' : ''}>
                                    ${supervisor.username}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        ${currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button class="btn btn-primary" onclick="UserManager.assignSupervisor(${userId})">
                        ${currentLanguage === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    },

    assignSupervisor: async function (userId) {
        const supervisorId = document.getElementById('supervisorSelect').value;

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/supervisor`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    supervisor_id: supervisorId ? parseInt(supervisorId) : null
                })
            });

            if (response.ok) {
                alert(currentLanguage === 'ar' ? 'تم تعيين المشرف بنجاح' : 'Supervisor assigned successfully');
                document.querySelector('.modal-overlay')?.remove();
                this.loadUsers();
            } else {
                const error = await response.json();
                alert(error.message || (currentLanguage === 'ar' ? 'فشل في تعيين المشرف' : 'Failed to assign supervisor'));
            }
        } catch (error) {
            console.error('Error assigning supervisor:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
        }
    }
};


// Make globally available
window.UserManager = UserManager;
