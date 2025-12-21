# Project Refactoring - Code Organization

## Overview

This project has been refactored from a monolithic architecture to a clean, modular structure while preserving all existing functionality.

## Backend Structure

### Directory Structure
```
backend/
├── config.py                 # Flask configuration
├── models/                   # Database models
│   ├── __init__.py
│   ├── user.py              # User, UserRole
│   ├── client.py            # Client, Person, ClientImage
│   ├── product.py           # Product, ProductImage
|   ├── visit_report.py      # VisitReport and related models
│   └── system_setting.py    # SystemSetting
├── routes/                   # API route blueprints
│   ├── __init__.py          # Blueprint registration
│   ├── auth_routes.py       # Authentication endpoints
│   └── static_routes.py     # Static files and pages
└── utils/                    # Utility functions
    ├── __init__.py
    ├── auth.py              # JWT token decorator
    ├── permissions.py       # Role-based access control
    └── report_generator.py  # DOCX report generation
```

### Key Changes
- **config.py**: Centralized configuration (SECRET_KEY, DATABASE_URI, etc.)
- **Models**: Separated into logical files by domain (user, client, product, etc.)
- **Routes**: Blueprint pattern for modular routing (auth, static, etc.)
- **Utils**: Reusable utilities (authentication, permissions, report generation)
- **app.py**: Updated to import from backend modules and register blueprints

## Frontend Structure

### JavaScript Organization
```
frontend/js/
├── main.js                  # Main application (manager objects remain here)
├── utils/                   # Utility modules
│   ├── api.js              # API calls and auth headers
│   ├── language.js          # Arabic/English switching
│   ├── scroll_manager.js    # Modal scroll management
│   ├── permissions.js       # UI role-based permissions
│   └── helpers.js           # Helper functions
└── components/             # Reusable components
    └── sidebar.js           # Sidebar navigation
```

### CSS Organization
```
frontend/css/
├── globals.css              # Original file (preserved for compatibility)
├── base.css                 # Reset, variables, typography
├── layout.css               # Grid, flexbox, main structure
├── utilities.css            # Animations, helper classes
├── components/             # Component-specific styles
└── pages/                  # Page-specific styles
```

## Benefits

1. **Maintainability**: Related code is grouped together
2. **Scalability**: Easy to add new features in dedicated files
3. **Reusability**: Utilities and components can be reused
4. **Testing**: Easier to test individual modules
5. **Collaboration**: Multiple developers can work on different modules
6. **Organization**: Clear structure makes code easier to navigate

## File Naming Convention

All files use **snake_case** naming:
- `client_manager.js`
- `auth_routes.py`
- `scroll_manager.js`

## Usage

### Backend
```python
# Import from modular backend
from backend.config import Config
from backend.models import db, User, Client
from backend.utils.auth import token_required
from backend.utils.permissions import is_super_admin
```

### Frontend
```javascript
// Import utilities (when using ES6 modules)
import { getAuthHeaders, checkAuthentication } from './utils/api.js';
import { switchToEnglish, switchToArabic } from './utils/language.js';
import { toggleSidebar } from './components/sidebar.js';
```

## Running the Application

The application runs exactly as before:
```bash
python app.py
```

Navigate to: http://localhost:5009

## Notes

- All existing functionality is preserved
- Database models remain compatible
- API endpoints unchanged
- UI/UX identical to original
- This refactoring is purely organizational - no functional changes

## Next Steps (Optional Future Improvements)

1. Extract remaining route blueprints (client_routes, product_routes, etc.)
2. Split main.js manager objects into separate modules
3. Complete CSS component and page extraction
4. Add unit tests for backend modules
5. Add integration tests for API endpoints
6. Consider using ES6 modules for frontend (requires build step)
