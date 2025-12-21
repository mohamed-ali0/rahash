/**
 * // Settings Management Functions
 * Extracted from main.js for modular architecture
 */


// Settings Management Functions
const SettingsManager = {
    currentSettings: {},

    loadSettings: async function () {
        try {
            console.log('Loading settings...');
            const response = await fetch(`${API_BASE_URL}/settings`, {
                headers: getAuthHeaders()
            });
            console.log('Settings response status:', response.status);
            if (response.ok) {
                const settings = await response.json();
                console.log('Settings loaded from server:', settings);
                this.currentSettings = settings;
                this.displaySettings(settings);
            } else {
                console.error('Failed to load settings, status:', response.status);
                this.loadDefaultSettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.loadDefaultSettings();
        }
    },

    loadDefaultSettings: function () {
        const defaultSettings = {
            price_tolerance: 1.00
        };
        this.currentSettings = defaultSettings;
        this.displaySettings(defaultSettings);
    },

    displaySettings: function (settings) {
        console.log('Displaying settings:', settings);
        const priceToleranceInput = document.getElementById('priceTolerance');
        console.log('Price tolerance input found:', !!priceToleranceInput);
        if (priceToleranceInput) {
            // Handle both old format (direct value) and new format (object with value property)
            let toleranceValue = 1.00;
            if (settings.price_tolerance) {
                console.log('Price tolerance setting found:', settings.price_tolerance);
                if (typeof settings.price_tolerance === 'object' && settings.price_tolerance.value) {
                    toleranceValue = parseFloat(settings.price_tolerance.value);
                    console.log('Using object format, value:', toleranceValue);
                } else if (typeof settings.price_tolerance === 'string' || typeof settings.price_tolerance === 'number') {
                    toleranceValue = parseFloat(settings.price_tolerance);
                    console.log('Using direct format, value:', toleranceValue);
                }
            } else {
                console.log('No price_tolerance setting found, using default');
            }
            priceToleranceInput.value = toleranceValue;
            console.log('Set price tolerance input value to:', toleranceValue);
        } else {
            console.error('Price tolerance input not found!');
        }
    },

    savePriceTolerance: async function () {
        const priceToleranceInput = document.getElementById('priceTolerance');
        const tolerance = parseFloat(priceToleranceInput.value);

        if (isNaN(tolerance) || tolerance < 0) {
            alert(currentLanguage === 'ar' ? 'يرجى إدخال قيمة صحيحة لتسامح السعر' : 'Please enter a valid price tolerance value');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/settings/price-tolerance`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ price_tolerance: tolerance })
            });

            if (response.ok) {
                this.currentSettings.price_tolerance = tolerance;
                alert(currentLanguage === 'ar' ? 'تم حفظ إعدادات التسعير بنجاح' : 'Pricing settings saved successfully');
            } else {
                const errorData = await response.json();
                alert(currentLanguage === 'ar' ? 'خطأ في حفظ الإعدادات' : 'Error saving settings: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving price tolerance:', error);
            alert(currentLanguage === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        }
    },

    getPriceTolerance: function () {
        if (this.currentSettings.price_tolerance) {
            if (typeof this.currentSettings.price_tolerance === 'object' && this.currentSettings.price_tolerance.value) {
                return parseFloat(this.currentSettings.price_tolerance.value);
            } else if (typeof this.currentSettings.price_tolerance === 'string' || typeof this.currentSettings.price_tolerance === 'number') {
                return parseFloat(this.currentSettings.price_tolerance);
            }
        }
        return 1.00;
    }
};


// Make globally available
window.SettingsManager = SettingsManager;
