/**
 * Modal Component
 * Reusable modal dialog system
 * Uses CSS classes - no inline styles
 */

const Modal = {
    activeModals: [],

    // Create a new modal
    create(options = {}) {
        const {
            title = '',
            content = '',
            size = 'medium',
            closable = true,
            onSubmit = null,
            onClose = null
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.dataset.modalId = Date.now();

        const lang = window.currentLanguage || 'ar';
        const submitText = lang === 'ar' ? 'حفظ' : 'Save';
        const cancelText = lang === 'ar' ? 'إلغاء' : 'Cancel';

        modal.innerHTML = `
            <div class="modal-content modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${this.escapeHtml(title)}</h3>
                    ${closable ? '<button class="modal-close-btn" aria-label="Close">×</button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${onSubmit ? `
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-cancel-btn">${cancelText}</button>
                    <button type="button" class="btn btn-primary modal-submit-btn">${submitText}</button>
                </div>
                ` : ''}
            </div>
        `;

        // Store callback references
        modal._onSubmit = onSubmit;
        modal._onClose = onClose;

        // Bind events
        this.bindModalEvents(modal);

        return modal;
    },

    // Bind modal events
    bindModalEvents(modal) {
        // Close button
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close(modal));
        }

        // Cancel button
        const cancelBtn = modal.querySelector('.modal-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close(modal));
        }

        // Submit button
        const submitBtn = modal.querySelector('.modal-submit-btn');
        if (submitBtn && modal._onSubmit) {
            submitBtn.addEventListener('click', () => {
                const form = modal.querySelector('form');
                if (form) {
                    if (form.checkValidity()) {
                        const formData = new FormData(form);
                        modal._onSubmit(formData);
                    } else {
                        form.reportValidity();
                    }
                }
            });
        }

        // Overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close(modal);
            }
        });

        // Escape key
        modal._escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close(modal);
            }
        };
    },

    // Show a modal
    show(modal) {
        document.body.appendChild(modal);
        this.activeModals.push(modal);

        // Add escape listener
        document.addEventListener('keydown', modal._escapeHandler);

        // Disable body scroll
        document.body.classList.add('modal-open');

        // Trigger show animation
        requestAnimationFrame(() => {
            modal.classList.add('modal-visible');
        });

        // Focus first input
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        return modal;
    },

    // Close a modal
    close(modal) {
        if (!modal) return;

        // Call onClose callback
        if (modal._onClose) {
            modal._onClose();
        }

        // Remove escape listener
        document.removeEventListener('keydown', modal._escapeHandler);

        // Hide animation
        modal.classList.remove('modal-visible');
        modal.classList.add('modal-hiding');

        setTimeout(() => {
            modal.remove();

            // Remove from active modals
            const index = this.activeModals.indexOf(modal);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }

            // Re-enable body scroll if no more modals
            if (this.activeModals.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }, 300);
    },

    // Close all modals
    closeAll() {
        [...this.activeModals].forEach(modal => this.close(modal));
    },

    // Utility: Escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Quick confirm dialog
    confirm(message, onConfirm, onCancel) {
        const lang = window.currentLanguage || 'ar';

        const modal = this.create({
            title: lang === 'ar' ? 'تأكيد' : 'Confirm',
            content: `<p class="confirm-message">${this.escapeHtml(message)}</p>`,
            size: 'small',
            onSubmit: () => {
                this.close(modal);
                if (onConfirm) onConfirm();
            },
            onClose: onCancel
        });

        this.show(modal);
        return modal;
    },

    // Quick alert dialog
    alert(message, onClose) {
        const lang = window.currentLanguage || 'ar';

        const modal = this.create({
            title: lang === 'ar' ? 'تنبيه' : 'Alert',
            content: `<p class="alert-message">${this.escapeHtml(message)}</p>`,
            size: 'small',
            onClose: onClose
        });

        this.show(modal);
        return modal;
    }
};

window.Modal = Modal;
