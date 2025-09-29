# Flask application for Business Management System

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from database.init import init_database
from database.models import db, User, Person, Client, Product, VisitReport, VisitReportImage, VisitReportNote, VisitReportProduct, UserRole
import jwt
import base64
from datetime import datetime, timedelta
import os

# Initialize Flask app
app = Flask(__name__, static_folder='frontend')
CORS(app)  # Enable CORS for frontend-backend communication

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///business_management.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'  # Change in production

# Initialize database
init_database(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Authentication Routes

# Signup disabled
# @app.route('/api/auth/signup', methods=['POST'])
# def signup():
#     """User registration - DISABLED"""
#     return jsonify({'message': 'Registration is currently disabled'}), 403

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'message': 'Username and password required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | (User.email == data['username'])
        ).first()
        
        if user and check_password_hash(user.password_hash, data['password']):
            # Create JWT token
            token_payload = {
                'user_id': user.id,
                'username': user.username,
                'role': user.role.value,
                'exp': datetime.utcnow() + timedelta(days=1)
            }
            
            token = jwt.encode(token_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role.value
                }
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """User logout"""
    # For JWT, we just return success (token will be removed on frontend)
    return jsonify({'message': 'Logout successful'}), 200

# Authentication decorator for API routes
def token_required(f):
    from functools import wraps
    
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer TOKEN
            except IndexError:
                return jsonify({'message': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
            current_user_obj = User.query.get(current_user_id)
            if not current_user_obj:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user_obj, *args, **kwargs)
    
    return decorated

# Frontend routes
@app.route('/')
def index():
    """Serve login page as main page"""
    return app.send_static_file('html/login.html')

@app.route('/login')
def login_page():
    """Serve login page"""
    return app.send_static_file('html/login.html')

# Signup disabled
# @app.route('/signup')
# def signup_page():
#     """Serve signup page"""
#     return app.send_static_file('html/signup.html')

@app.route('/dashboard')
def dashboard():
    """Serve dashboard page"""
    return app.send_static_file('html/index.html')

# Static file routes
@app.route('/css/<path:filename>')
def css_files(filename):
    """Serve CSS files"""
    return app.send_static_file(f'css/{filename}')

@app.route('/js/<path:filename>')
def js_files(filename):
    """Serve JavaScript files"""
    return app.send_static_file(f'js/{filename}')

@app.route('/logo.png')
def logo_file():
    """Serve logo file"""
    return send_file('logo.png', mimetype='image/png')

@app.route('/top_bar_logo.png')
def top_bar_logo_file():
    """Serve top bar logo file"""
    return send_file('top_bar_logo.png', mimetype='image/png')

# Client Management Routes
@app.route('/api/clients', methods=['GET'])
@token_required
def get_clients(current_user):
    """Get all active clients assigned to current user"""
    try:
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        
        if current_user.role == UserRole.SUPER_ADMIN:
            if show_all:
                clients = Client.query.all()
            else:
                clients = Client.query.filter_by(is_active=True).all()
        else:
            if show_all:
                clients = Client.query.filter_by(assigned_user_id=current_user.id).all()
            else:
                clients = Client.query.filter_by(assigned_user_id=current_user.id, is_active=True).all()
        
        clients_data = []
        for client in clients:
            # Get person data
            owner_data = None
            if client.owner:
                owner_data = {
                    'name': client.owner.name,
                    'phone': client.owner.phone,
                    'email': client.owner.email
                }
            
            purchasing_manager_data = None
            if client.purchasing_manager:
                purchasing_manager_data = {
                    'name': client.purchasing_manager.name,
                    'phone': client.purchasing_manager.phone,
                    'email': client.purchasing_manager.email
                }
            
            accountant_data = None
            if client.accountant:
                accountant_data = {
                    'name': client.accountant.name,
                    'phone': client.accountant.phone,
                    'email': client.accountant.email
                }
            
            # Get additional images
            additional_images = []
            for img in client.images:
                additional_images.append({
                    'id': img.id,
                    'filename': img.filename,
                    'data': base64.b64encode(img.image_data).decode('utf-8'),
                    'created_at': img.created_at.isoformat()
                })
            
            clients_data.append({
                'id': client.id,
                'name': client.name,
                'region': client.region,
                'location': client.location,
                'salesman_name': client.salesman_name,
                'phone': client.owner.phone if client.owner else None,
                'thumbnail': base64.b64encode(client.thumbnail).decode('utf-8') if client.thumbnail else None,
                'additional_images': additional_images,
                'owner': owner_data,
                'purchasing_manager': purchasing_manager_data,
                'accountant': accountant_data,
                'assigned_user': client.assigned_user.username if client.assigned_user else None,
                'created_at': client.created_at.isoformat(),
                'is_active': client.is_active
            })
        
        return jsonify(clients_data), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch clients', 'error': str(e)}), 500

@app.route('/api/clients', methods=['POST'])
@token_required
def create_client(current_user):
    """Create a new client"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Client name is required'}), 400
        
        # Create client
        client = Client(
            name=data['name'],
            region=data.get('region'),
            location=data.get('location'),
            salesman_name=data.get('salesman_name'),
            assigned_user_id=current_user.id
        )
        
        # Handle thumbnail upload
        if 'thumbnail' in data and data['thumbnail']:
            try:
                # Convert base64 to binary
                image_data = base64.b64decode(data['thumbnail'])
                client.thumbnail = image_data
            except Exception as img_error:
                print(f"Error processing thumbnail: {img_error}")
                # Continue without thumbnail if there's an error
        
        db.session.add(client)
        db.session.flush()  # Get the client ID
        
        # Handle phone - create owner person (for backward compatibility)
        if 'phone' in data and data['phone']:
            from database.models import Person
            owner = Person(
                name=f"{client.name} (Owner)",
                phone=data['phone'],
                email=None
            )
            db.session.add(owner)
            db.session.flush()
            client.owner_id = owner.id
        
        # Handle Owner information
        if 'owner' in data and data['owner']:
            owner_data = data['owner']
            if owner_data.get('name') or owner_data.get('phone') or owner_data.get('email'):
                from database.models import Person
                owner = Person(
                    name=owner_data.get('name'),
                    phone=owner_data.get('phone'),
                    email=owner_data.get('email')
                )
                db.session.add(owner)
                db.session.flush()
                client.owner_id = owner.id
        
        # Handle Purchasing Manager information
        if 'purchasing_manager' in data and data['purchasing_manager']:
            manager_data = data['purchasing_manager']
            if manager_data.get('name') or manager_data.get('phone') or manager_data.get('email'):
                from database.models import Person
                manager = Person(
                    name=manager_data.get('name'),
                    phone=manager_data.get('phone'),
                    email=manager_data.get('email')
                )
                db.session.add(manager)
                db.session.flush()
                client.purchasing_manager_id = manager.id
        
        # Handle Accountant information
        if 'accountant' in data and data['accountant']:
            accountant_data = data['accountant']
            if accountant_data.get('name') or accountant_data.get('phone') or accountant_data.get('email'):
                from database.models import Person
                accountant = Person(
                    name=accountant_data.get('name'),
                    phone=accountant_data.get('phone'),
                    email=accountant_data.get('email')
                )
                db.session.add(accountant)
                db.session.flush()
                client.accountant_id = accountant.id
        
        # Handle additional images
        if 'additional_images' in data and data['additional_images']:
            from database.models import ClientImage
            for img_data in data['additional_images']:
                if img_data.get('data'):
                    try:
                        # Convert base64 to binary
                        image_data = base64.b64decode(img_data['data'])
                        client_image = ClientImage(
                            client_id=client.id,
                            image_data=image_data,
                            filename=img_data.get('filename', 'client_image.jpg')
                        )
                        db.session.add(client_image)
                    except Exception as img_error:
                        print(f"Error processing additional image {img_data.get('filename', 'unknown')}: {img_error}")
                        # Continue with other images if one fails
        
        db.session.commit()
        
        return jsonify({
            'message': 'Client created successfully',
            'client_id': client.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating client: {e}")
        return jsonify({'message': 'Failed to create client', 'error': str(e)}), 500

@app.route('/api/clients/<int:client_id>', methods=['PUT'])
@token_required
def update_client(current_user, client_id):
    """Update a client"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            client.name = data['name']
        if 'region' in data:
            client.region = data['region']
        if 'location' in data:
            client.location = data['location']
        if 'salesman_name' in data:
            client.salesman_name = data['salesman_name']
        
        # Handle thumbnail upload
        if 'thumbnail' in data and data['thumbnail']:
            try:
                # Convert base64 to binary
                image_data = base64.b64decode(data['thumbnail'])
                client.thumbnail = image_data
            except Exception as img_error:
                print(f"Error processing thumbnail: {img_error}")
                # Continue without updating thumbnail if there's an error
        
        # Handle phone - create or update owner person (for backward compatibility)
        if 'phone' in data:
            if client.owner:
                # Update existing owner phone
                client.owner.phone = data['phone']
            else:
                # Create new owner person
                if data['phone']:  # Only create if phone is not empty
                    from database.models import Person
                    owner = Person(
                        name=f"{client.name} (Owner)",
                        phone=data['phone'],
                        email=None
                    )
                    db.session.add(owner)
                    db.session.flush()  # Get the owner ID
                    client.owner_id = owner.id
        
        # Handle Owner information
        if 'owner' in data and data['owner']:
            owner_data = data['owner']
            if not client.owner:
                # Create new owner
                from database.models import Person
                owner = Person(
                    name=owner_data.get('name'),
                    phone=owner_data.get('phone'),
                    email=owner_data.get('email')
                )
                db.session.add(owner)
                db.session.flush()
                client.owner_id = owner.id
            else:
                # Update existing owner
                if owner_data.get('name'):
                    client.owner.name = owner_data.get('name')
                if owner_data.get('phone'):
                    client.owner.phone = owner_data.get('phone')
                if owner_data.get('email'):
                    client.owner.email = owner_data.get('email')
        
        # Handle Purchasing Manager information
        if 'purchasing_manager' in data and data['purchasing_manager']:
            manager_data = data['purchasing_manager']
            if not client.purchasing_manager:
                # Create new manager
                from database.models import Person
                manager = Person(
                    name=manager_data.get('name'),
                    phone=manager_data.get('phone'),
                    email=manager_data.get('email')
                )
                db.session.add(manager)
                db.session.flush()
                client.purchasing_manager_id = manager.id
            else:
                # Update existing manager
                if manager_data.get('name'):
                    client.purchasing_manager.name = manager_data.get('name')
                if manager_data.get('phone'):
                    client.purchasing_manager.phone = manager_data.get('phone')
                if manager_data.get('email'):
                    client.purchasing_manager.email = manager_data.get('email')
        
        # Handle Accountant information
        if 'accountant' in data and data['accountant']:
            accountant_data = data['accountant']
            if not client.accountant:
                # Create new accountant
                from database.models import Person
                accountant = Person(
                    name=accountant_data.get('name'),
                    phone=accountant_data.get('phone'),
                    email=accountant_data.get('email')
                )
                db.session.add(accountant)
                db.session.flush()
                client.accountant_id = accountant.id
            else:
                # Update existing accountant
                if accountant_data.get('name'):
                    client.accountant.name = accountant_data.get('name')
                if accountant_data.get('phone'):
                    client.accountant.phone = accountant_data.get('phone')
                if accountant_data.get('email'):
                    client.accountant.email = accountant_data.get('email')
        
        # Handle additional images
        if 'additional_images' in data and data['additional_images']:
            from database.models import ClientImage
            for img_data in data['additional_images']:
                if img_data.get('data'):
                    try:
                        # Convert base64 to binary
                        image_data = base64.b64decode(img_data['data'])
                        client_image = ClientImage(
                            client_id=client.id,
                            image_data=image_data,
                            filename=img_data.get('filename', 'client_image.jpg')
                        )
                        db.session.add(client_image)
                    except Exception as img_error:
                        print(f"Error processing additional image {img_data.get('filename', 'unknown')}: {img_error}")
                        # Continue with other images if one fails
        
        db.session.commit()
        
        return jsonify({'message': 'Client updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update client', 'error': str(e)}), 500

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
@token_required
def deactivate_client(current_user, client_id):
    """Deactivate a client instead of deleting"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        client.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Client deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete client', 'error': str(e)}), 500

@app.route('/api/clients/<int:client_id>/reactivate', methods=['PUT'])
@token_required
def reactivate_client(current_user, client_id):
    """Reactivate a deactivated client"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        client.is_active = True
        db.session.commit()
        
        return jsonify({'message': 'Client reactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to reactivate client', 'error': str(e)}), 500

# Product Management Routes
@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    """Get all products (accessible to all authenticated users)"""
    try:
        products = Product.query.all()
        
        products_data = []
        for product in products:
            # Get additional images
            additional_images = []
            for img in product.images:
                additional_images.append({
                    'id': img.id,
                    'filename': img.filename,
                    'data': base64.b64encode(img.image_data).decode('utf-8')
                })
            
            products_data.append({
                'id': product.id,
                'name': product.name,
                'taxed_price_store': float(product.taxed_price_store) if product.taxed_price_store else 0.0,
                'untaxed_price_store': float(product.untaxed_price_store) if product.untaxed_price_store else 0.0,
                'taxed_price_client': float(product.taxed_price_client) if product.taxed_price_client else 0.0,
                'untaxed_price_client': float(product.untaxed_price_client) if product.untaxed_price_client else 0.0,
                'thumbnail': base64.b64encode(product.thumbnail).decode('utf-8') if product.thumbnail else None,
                'images': additional_images,
                'created_at': product.created_at.isoformat(),
                'can_edit': current_user.role == UserRole.SUPER_ADMIN  # Add permission info
            })
        
        return jsonify(products_data), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch products', 'error': str(e)}), 500

@app.route('/api/products', methods=['POST'])
@token_required
def create_product(current_user):
    """Create a new product (super admin only)"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can create products'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Product name is required'}), 400
        
        # Create product
        product = Product(
            name=data['name'],
            taxed_price_store=data.get('taxed_price_store'),
            untaxed_price_store=data.get('untaxed_price_store'),
            taxed_price_client=data.get('taxed_price_client'),
            untaxed_price_client=data.get('untaxed_price_client')
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product_id': product.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create product', 'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    """Update a product (super admin only)"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can edit products'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Update fields (handle None values properly)
        if 'name' in data:
            product.name = data['name']
        if 'taxed_price_store' in data:
            product.taxed_price_store = data['taxed_price_store']
        if 'untaxed_price_store' in data:
            product.untaxed_price_store = data['untaxed_price_store']
        if 'taxed_price_client' in data:
            product.taxed_price_client = data['taxed_price_client']
        if 'untaxed_price_client' in data:
            product.untaxed_price_client = data['untaxed_price_client']
        
        # Handle thumbnail upload
        if 'thumbnail' in data and data['thumbnail']:
            try:
                # Convert base64 to binary
                image_data = base64.b64decode(data['thumbnail'])
                product.thumbnail = image_data
            except Exception as img_error:
                print(f"Error processing thumbnail: {img_error}")
                # Continue without updating thumbnail if there's an error
        
        # Handle additional images
        if 'additional_images' in data and data['additional_images']:
            from database.models import ProductImage
            try:
                for img_data in data['additional_images']:
                    if img_data.get('data'):
                        image_binary = base64.b64decode(img_data['data'])
                        new_image = ProductImage(
                            product_id=product.id,
                            image_data=image_binary,
                            filename=img_data.get('filename', 'uploaded_image.jpg')
                        )
                        db.session.add(new_image)
            except Exception as img_error:
                print(f"Error processing additional images: {img_error}")
        
        db.session.commit()
        
        return jsonify({'message': 'Product updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update product', 'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    """Delete a product (super admin only)"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can delete products'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete product', 'error': str(e)}), 500

# Report Export Routes
@app.route('/api/visit-reports', methods=['GET'])
@token_required
def get_visit_reports(current_user):
    """Get all active visit reports for current user"""
    try:
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        
        if current_user.role == UserRole.SUPER_ADMIN:
            if show_all:
                reports = VisitReport.query.all()
            else:
                reports = VisitReport.query.filter_by(is_active=True).all()
        else:
            if show_all:
                reports = VisitReport.query.filter_by(user_id=current_user.id).all()
            else:
                reports = VisitReport.query.filter_by(user_id=current_user.id, is_active=True).all()
        
        reports_data = []
        for report in reports:
            # Get first image for display
            first_image = None
            if report.images:
                first_image = base64.b64encode(report.images[0].image_data).decode('utf-8')
            
            # Get all images
            images = []
            for img in report.images:
                images.append({
                    'id': img.id,
                    'filename': img.filename,
                    'data': base64.b64encode(img.image_data).decode('utf-8'),
                    'created_at': img.created_at.isoformat()
                })
            
            # Get all notes
            notes = []
            for note in report.notes:
                notes.append({
                    'id': note.id,
                    'note_text': note.note_text,
                    'created_at': note.created_at.isoformat()
                })
            
            # Get products information
            products = []
            for rp in report.products:
                product_data = {
                    'id': rp.id,
                    'product_id': rp.product_id,
                    'product_name': rp.product.name if rp.product else 'Unknown Product',
                    'displayed_price': float(rp.displayed_price) if rp.displayed_price else None,
                    'nearly_expired': rp.nearly_expired,
                    'expiry_date': rp.expiry_date.isoformat() if rp.expiry_date else None
                }
                
                # Add product pricing information for comparison
                if rp.product:
                    product_data.update({
                        'taxed_price_client': float(rp.product.taxed_price_client) if rp.product.taxed_price_client else None,
                        'untaxed_price_client': float(rp.product.untaxed_price_client) if rp.product.untaxed_price_client else None,
                        'taxed_price_store': float(rp.product.taxed_price_store) if rp.product.taxed_price_store else None,
                        'untaxed_price_store': float(rp.product.untaxed_price_store) if rp.product.untaxed_price_store else None
                    })
                
                products.append(product_data)
            
            reports_data.append({
                'id': report.id,
                'client_id': report.client_id,
                'client_name': report.client.name if report.client else 'Unknown Client',
                'user_id': report.user_id,
                'username': report.user.username if report.user else 'Unknown User',
                'visit_date': report.visit_date.isoformat(),
                'created_at': report.created_at.isoformat(),
                'first_image': first_image,
                'images': images,
                'notes': notes,
                'products': products,
                'can_edit': current_user.role == UserRole.SUPER_ADMIN or report.user_id == current_user.id,
                'is_active': report.is_active
            })
        
        return jsonify(reports_data), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch visit reports', 'error': str(e)}), 500

@app.route('/api/visit-reports', methods=['POST'])
@token_required
def create_visit_report(current_user):
    """Create a new visit report"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('client_id'):
            return jsonify({'message': 'Client ID is required'}), 400
        if not data.get('visit_date'):
            return jsonify({'message': 'Visit date is required'}), 400
        
        # Create visit report
        report = VisitReport(
            client_id=data['client_id'],
            user_id=current_user.id,
            visit_date=datetime.strptime(data['visit_date'], '%Y-%m-%d').date()
        )
        
        db.session.add(report)
        db.session.flush()  # Get the report ID
        
        # Handle images
        if 'images' in data and data['images']:
            from database.models import VisitReportImage
            for img_data in data['images']:
                if img_data.get('data'):
                    try:
                        # Convert base64 to binary
                        image_data = base64.b64decode(img_data['data'])
                        report_image = VisitReportImage(
                            visit_report_id=report.id,
                            image_data=image_data,
                            filename=img_data.get('filename', 'visit_image.jpg')
                        )
                        db.session.add(report_image)
                    except Exception as img_error:
                        print(f"Error processing visit image {img_data.get('filename', 'unknown')}: {img_error}")
        
        # Handle notes
        if 'notes' in data and data['notes']:
            from database.models import VisitReportNote
            for note_text in data['notes']:
                if note_text and note_text.strip():
                    report_note = VisitReportNote(
                        visit_report_id=report.id,
                        note_text=note_text.strip()
                    )
                    db.session.add(report_note)
        
        # Handle products
        if 'products' in data and data['products']:
            from database.models import VisitReportProduct
            for product_data in data['products']:
                if product_data.get('product_id'):
                    report_product = VisitReportProduct(
                        visit_report_id=report.id,
                        product_id=product_data['product_id'],
                        displayed_price=product_data.get('displayed_price'),
                        nearly_expired=product_data.get('nearly_expired', False),
                        expiry_date=datetime.strptime(product_data['expiry_date'], '%Y-%m-%d').date() if product_data.get('expiry_date') else None
                    )
                    db.session.add(report_product)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Visit report created successfully',
            'report_id': report.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating visit report: {e}")
        return jsonify({'message': 'Failed to create visit report', 'error': str(e)}), 500

@app.route('/api/visit-reports/<int:report_id>', methods=['PUT'])
@token_required
def update_visit_report(current_user, report_id):
    """Update a visit report (only if super admin allows or own report)"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Visit report not found'}), 404
        
        # Check permission - only super admin or report creator can edit
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        data = request.get_json()
        
        # Update basic fields
        if 'visit_date' in data:
            report.visit_date = datetime.strptime(data['visit_date'], '%Y-%m-%d').date()
        
        # For now, we'll keep it simple and not allow updating complex relationships
        # This can be extended later if needed
        
        db.session.commit()
        
        return jsonify({'message': 'Visit report updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update visit report', 'error': str(e)}), 500

@app.route('/api/visit-reports/<int:report_id>', methods=['DELETE'])
@token_required
def deactivate_visit_report(current_user, report_id):
    """Deactivate a visit report instead of deleting"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Visit report not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        report.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Visit report deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete visit report', 'error': str(e)}), 500

@app.route('/api/visit-reports/<int:report_id>/reactivate', methods=['PUT'])
@token_required
def reactivate_visit_report(current_user, report_id):
    """Reactivate a deactivated visit report"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Visit report not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        report.is_active = True
        db.session.commit()
        
        return jsonify({'message': 'Visit report reactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to reactivate visit report', 'error': str(e)}), 500

@app.route('/api/reports/clients', methods=['GET'])
def export_clients_report():
    """Export clients report"""
    # Implementation will go here
    return jsonify({"message": "Export clients report endpoint"})

@app.route('/api/reports/products', methods=['GET'])
def export_products_report():
    """Export products report"""
    # Implementation will go here
    return jsonify({"message": "Export products report endpoint"})

@app.route('/api/reports/summary', methods=['GET'])
def export_summary_report():
    """Export summary report"""
    # Implementation will go here
    return jsonify({"message": "Export summary report endpoint"})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5009)
