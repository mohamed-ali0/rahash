# ROUTE EXTRACTION GUIDE
# This document shows how to systematically extract remaining routes from app.py

## Overview

The app.py file currently has ~3200 lines with 40+ route endpoints that need extraction.

## Current Status

### ✅ Completed Blueprints
- `auth_routes.py` - Login, logout, register (3 routes)
- `static_routes.py` - Static files and HTML pages (9 routes) 
- `settings_routes.py` - System settings (3 routes)
- `user_routes.py` - User management (1 route)
- `team_routes.py` - Team/salesman management (4 routes)

### ⏳ Remaining Routes in app.py

#### Client Routes (16 routes) → Extract to `client_routes.py`
```python
@app.route('/api/clients/names', methods=['GET'])
@app.route('/api/clients/names-with-salesman', methods=['GET'])
@app.route('/api/clients/filter-data', methods=['GET'])
@app.route('/api/clients/search', methods=['GET'])
@app.route('/api/clients/list', methods=['GET'])
@app.route('/api/clients/<int:client_id>', methods=['GET'])
@app.route('/api/clients/<int:client_id>/thumbnail', methods=['GET'])
@app.route('/api/clients/<int:client_id>/images', methods=['GET'])
@app.route('/api/clients', methods=['GET'])
@app.route('/api/clients', methods=['POST'])
@app.route('/api/clients/<int:client_id>', methods=['PUT'])
@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
@app.route('/api/clients/<int:client_id>/reactivate', methods=['PUT'])
@app.route('/api/clients/<int:client_id>/last-report-summary', methods=['GET'])
@app.route('/api/clients/<int:client_id>/images/<int:image_id>', methods=['DELETE'])
@app.route('/api/clients/<int:client_id>/thumbnail', methods=['DELETE'])
```

#### Product Routes (12 routes) → Extract to `product_routes.py`
```python
@app.route('/api/products/names', methods=['GET'])
@app.route('/api/products/search', methods=['GET'])
@app.route('/api/products/list', methods=['GET'])
@app.route('/api/products/<int:product_id>/thumbnail', methods=['GET'])
@app.route('/api/products/<int:product_id>', methods=['GET'])
@app.route('/api/products/<int:product_id>/images', methods=['GET'])
@app.route('/api/products', methods=['GET'])
@app.route('/api/products', methods=['POST'])
@app.route('/api/products/<int:product_id>', methods=['PUT'])
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@app.route('/api/products/<int:product_id>/images/<int:image_id>', methods=['DELETE'])
@app.route('/api/products/<int:product_id>/thumbnail', methods=['DELETE'])
```

#### Report Routes (12 routes) → Extract to `report_routes.py`
```python
@app.route('/api/visit-reports/search', methods=['GET'])
@app.route('/api/visit-reports/list', methods=['GET'])
@app.route('/api/visit-reports', methods=['GET'])
@app.route('/api/visit-reports', methods=['POST'])
@app.route('/api/visit-reports/<int:report_id>/images', methods=['GET'])
@app.route('/api/visit-reports/<int:report_id>', methods=['GET'])
@app.route('/api/visit-reports/<int:report_id>', methods=['PUT'])
@app.route('/api/visit-reports/<int:report_id>', methods=['DELETE'])
@app.route('/api/visit-reports/<int:report_id>/reactivate', methods=['PUT'])
@app.route('/api/visit-reports/<int:report_id>/html', methods=['GET'])
@app.route('/api/visit-reports/<int:report_id>/data', methods=['GET'])
@app.route('/api/visit-reports/<int:report_id>/print', methods=['GET'])
```

## Extraction Pattern

### Step 1: Create Blueprint File

Create file: `backend/routes/client_routes.py`

```python
# Client Management Routes Blueprint

from flask import Blueprint, request, jsonify
import base64
from sqlalchemy import text
from backend.models import db, Client, Person, ClientImage, User, UserRole
from backend.utils.auth import token_required

client_bp = Blueprint('clients', __name__, url_prefix='/api/clients')

# Extract route functions here
```

### Step 2: Extract Route Functions

For each route in app.py:
1. Copy the function definition
2. Remove the `@app.route` decorator
3. Add `@client_bp.route` decorator with adjusted path
4. Keep the `@token_required` decorator
5. Paste into blueprint file

**Example:**

**From app.py:**
```python
@app.route('/api/clients/names', methods=['GET'])
@token_required
def get_client_names_only(current_user):
    # ... function body ...
```

**To client_routes.py:**
```python
@client_bp.route('/names', methods=['GET'])
@token_required
def get_client_names_only(current_user):
    # ... same function body ...
```

Note: `/api/clients` prefix is in blueprint definition, so route path is just `/names`

### Step 3: Update Routes __init__.py

Add to `backend/routes/__init__.py`:

```python
from backend.routes.client_routes import client_bp
app.register_blueprint(client_bp)
```

### Step 4: Remove from app.py

After extracting all client routes, remove them from app.py.

### Step 5: Test

Run `python app.py` and test the endpoints work.

## Quick Reference

### Blueprint Path Mapping

| Original app.py | Blueprint file | Route decorator |
|----------------|----------------|-----------------|
| `/api/clients/names` | client_routes.py | `@client_bp.route('/names')` |
| `/api/products/<int:id>` | product_routes.py | `@product_bp.route('/<int:id>')` |
| `/api/visit-reports/list` | report_routes.py | `@report_bp.route('/list')` |

### Common Imports Needed

Most route files will need:
```python
from flask import Blueprint, request, jsonify
from backend.models import db, [Models needed]
from backend.utils.auth import token_required
import base64  # for image routes
from sqlalchemy import text  # for raw SQL
```

## Automation Tip

You can use a script to help extract routes. Here's a simple pattern:

```bash
# Find all client routes
grep -n "@app.route('/api/clients" app.py

# View specific line range
sed -n '270,308p' app.py  # View lines 270-308
```

## Final Result

After complete extraction, app.py should be ~100 lines:
- Imports
- Flask app creation  
- Configuration
- Database initialization
- Blueprint registration
- Error handlers
- `if __name__ == '__main__'`

All business logic will be in the blueprint files.
