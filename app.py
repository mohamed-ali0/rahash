# Flask application for Business Management System

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from database.init import init_database
from database.models import db, User, Person, Client, Product, VisitReport, VisitReportImage, VisitReportNote, VisitReportProduct, UserRole, SystemSetting, ClientImage, ProductImage
import jwt
import base64
from datetime import datetime, timedelta
import os
import json
import tempfile
from docx import Document
from docx.shared import Inches
import io
from docx2pdf import convert

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

@app.route('/font/<path:filename>')
def font_files(filename):
    """Serve font files"""
    return send_file(f'templates/font/{filename}', mimetype='font/ttf')

@app.route('/logo_corner.png')
def logo_corner_file():
    """Serve corner logo file"""
    return send_file('templates/logo_corner.png', mimetype='image/png')

@app.route('/website_logo.png')
def website_logo_file():
    """Serve website logo file for favicon"""
    return send_file('website_logo.png', mimetype='image/png')

@app.route('/api/predefined-notes')
@token_required
def get_predefined_notes(current_user):
    """Get predefined notes for visit reports"""
    try:
        with open('templates/predefined_notes.json', 'r', encoding='utf-8') as f:
            predefined_notes = json.load(f)
        return jsonify(predefined_notes)
    except Exception as e:
        print(f"Error loading predefined notes: {e}")
        return jsonify({'message': 'Error loading predefined notes'}), 500

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
                'address': getattr(client, 'address', None),
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
            address=data.get('address'),
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
        if 'address' in data:
            client.address = data['address']
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
    """Get all active visit reports - users only see their own reports, super admin sees all"""
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
                    'is_suggested_products': img.is_suggested_products,
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
                    'nearly_expired': rp.expired_or_nearly_expired,
                    'expiry_date': rp.expiry_date.isoformat() if rp.expiry_date else None,
                    'units_count': rp.units_count
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
        
        # Check if user has access to this client
        client = Client.query.get(data['client_id'])
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        # Only super admin can create reports for any client, others only for assigned clients
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied: You can only create reports for clients assigned to you'}), 403
        
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
                            filename=img_data.get('filename', 'visit_image.jpg'),
                            is_suggested_products=img_data.get('is_suggested_products', False)
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
                        expired_or_nearly_expired=product_data.get('nearly_expired', False),
                        expiry_date=datetime.strptime(product_data['expiry_date'], '%Y-%m-%d').date() if product_data.get('expiry_date') else None,
                        units_count=product_data.get('units_count')
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

@app.route('/api/visit-reports/<int:report_id>', methods=['GET'])
@token_required
def get_visit_report(current_user, report_id):
    """Get a specific visit report (only if user owns it or is super admin)"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Visit report not found'}), 404
        
        # Check permission - only super admin or report creator can view
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
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
                'is_suggested_products': img.is_suggested_products,
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
                'displayed_price': float(rp.displayed_price),
                'nearly_expired': rp.expired_or_nearly_expired,
                'expiry_date': rp.expiry_date.isoformat() if rp.expiry_date else None,
                'units_count': rp.units_count,
                'created_at': rp.created_at.isoformat()
            }
            
            # Add product pricing for comparison
            if rp.product:
                product_data.update({
                    'taxed_price_store': float(rp.product.taxed_price_store) if rp.product.taxed_price_store else 0.0,
                    'untaxed_price_store': float(rp.product.untaxed_price_store) if rp.product.untaxed_price_store else 0.0,
                    'taxed_price_client': float(rp.product.taxed_price_client) if rp.product.taxed_price_client else 0.0,
                    'untaxed_price_client': float(rp.product.untaxed_price_client) if rp.product.untaxed_price_client else 0.0
                })
            
            products.append(product_data)
        
        report_data = {
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
        }
        
        return jsonify(report_data), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch visit report', 'error': str(e)}), 500

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

def replace_text_in_docx(doc, find_text, replace_text):
    """Simple find and replace function for Word documents"""
    replaced = False
    
    # Replace in paragraphs
    for paragraph in doc.paragraphs:
        if find_text in paragraph.text:
            # Try replacing in runs first
            for run in paragraph.runs:
                if find_text in run.text:
                    run.text = run.text.replace(find_text, replace_text)
                    replaced = True
            
            # If not found in runs, the text might be split across runs
            # Reconstruct the paragraph if needed
            if not replaced and find_text in paragraph.text:
                # Get the full text and replace
                full_text = paragraph.text
                new_text = full_text.replace(find_text, replace_text)
                # Clear runs and add new one with replaced text
                paragraph.clear()
                paragraph.add_run(new_text)
                replaced = True
    
    # Replace in tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    if find_text in paragraph.text:
                        # Try replacing in runs first
                        cell_replaced = False
                        for run in paragraph.runs:
                            if find_text in run.text:
                                run.text = run.text.replace(find_text, replace_text)
                                cell_replaced = True
                                replaced = True
                        
                        # If not found in runs, text might be split
                        if not cell_replaced and find_text in paragraph.text:
                            full_text = paragraph.text
                            new_text = full_text.replace(find_text, replace_text)
                            paragraph.clear()
                            paragraph.add_run(new_text)
                            replaced = True
    
    if replaced:
        print(f"Replaced '{find_text}' with '{replace_text}'")
    else:
        print(f"WARNING: Could not find '{find_text}' in document")
    
    return replaced

@app.route('/api/visit-reports/<int:report_id>/html', methods=['GET'])
def get_visit_report_html(report_id):
    """Serve the HTML report template with data (no auth required for HTML)"""
    try:
        # Get token from query parameter since this is opened in a new window
        token = request.args.get('token')
        print(f"Received token: {token[:20]}..." if token else "No token received")
        
        if not token:
            return "Unauthorized - Token missing", 401
        
        # Verify token
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return "Unauthorized - Invalid token", 401
        except Exception as e:
            print(f"Token decode error: {e}")
            return "Unauthorized - Invalid token", 401
        
        # Get the report with permission check
        report = VisitReport.query.get(report_id)
        if not report:
            return "Report not found", 404
        
        # Check permission - only super admin or report creator can view
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return "Permission denied", 403
        
        # Read the HTML template and inject data directly
        with open('templates/visit_report.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Prepare report data
        report_data = {
            'client_name': report.client.name if report.client else 'غير محدد',
            'visit_date': report.visit_date.strftime('%Y/%m/%d'),
            'notes': '\\n'.join([note.note_text for note in report.notes]) if report.notes else '',
            'images': [],
            'products': []
        }
        
        # Add images (first 3)
        for img in report.images[:3]:
            if img.image_data:
                report_data['images'].append({
                    'data': base64.b64encode(img.image_data).decode('utf-8'),
                    'is_suggested_products': img.is_suggested_products
                })
        
        # Add products
        for rp in report.products:
            product_data = {
                'name': rp.product.name if rp.product else 'منتج غير محدد',
                'our_price': f"{rp.product.taxed_price_store:.2f} ريال" if rp.product and rp.product.taxed_price_store else 'غير محدد',
                'displayed_price': f"{rp.displayed_price:.2f} ريال",
                'nearly_expired': rp.expired_or_nearly_expired,
                'expiry_date': rp.expiry_date.strftime('%Y/%m/%d') if rp.expiry_date else '',
                'units_count': rp.units_count
            }
            report_data['products'].append(product_data)
        
        # Inject data script into HTML
        data_script = f"""
        <script>
            // Auto-populate data when page loads
            window.addEventListener('DOMContentLoaded', function() {{
                const reportData = {json.dumps(report_data, ensure_ascii=False)};
                if (typeof populateReport === 'function') {{
                    populateReport(reportData);
                }}
            }});
        </script>
        """
        
        # Insert the script before closing body tag
        html_content = html_content.replace('</body>', data_script + '</body>')
        
        return html_content
        
    except Exception as e:
        print(f"Error serving HTML report: {e}")
        return f"Error loading report: {str(e)}", 500

@app.route('/api/visit-reports/<int:report_id>/data', methods=['GET'])
@token_required
def get_visit_report_data(current_user, report_id):
    """Get report data as JSON for the HTML template"""
    try:
        # Get the report with permission check
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Visit report not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        # Prepare data for the HTML template
        report_data = {
            'client_name': report.client.name if report.client else 'غير محدد',
            'visit_date': report.visit_date.strftime('%Y/%m/%d'),
            'notes': '\n'.join([note.note_text for note in report.notes]) if report.notes else '',
            'images': [],
            'products': []
        }
        
        # Add images (first 3)
        for img in report.images[:3]:
            if img.image_data:
                report_data['images'].append({
                    'data': base64.b64encode(img.image_data).decode('utf-8'),
                    'is_suggested_products': img.is_suggested_products
                })
        
        # Add products
        for rp in report.products:
            product_data = {
                'name': rp.product.name if rp.product else 'منتج غير محدد',
                'our_price': f"{rp.product.taxed_price_store:.2f} ريال" if rp.product and rp.product.taxed_price_store else 'غير محدد',
                'displayed_price': f"{rp.displayed_price:.2f} ريال",
                'nearly_expired': rp.expired_or_nearly_expired,
                'expiry_date': rp.expiry_date.strftime('%Y/%m/%d') if rp.expiry_date else '',
                'units_count': rp.units_count
            }
            report_data['products'].append(product_data)
        
        return jsonify({'success': True, 'report': report_data})
        
    except Exception as e:
        print(f"Error getting report data: {e}")
        return jsonify({'message': 'Failed to get report data', 'error': str(e)}), 500

@app.route('/api/visit-reports/<int:report_id>/print', methods=['GET'])
@token_required
def print_visit_report(current_user, report_id):
    """Generate and download PDF report from Word template using JSON mapping"""
    try:
        # Get the report with permission check
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Visit report not found'}), 404
        
        # Check permission - only super admin or report creator can print
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        # Load the JSON mapping
        with open('templates/report_mapping.json', 'r', encoding='utf-8') as f:
            mapping = json.load(f)
        
        # Load the Word document template
        doc = Document('templates/visit_report.docx')
        
        # Debug: Print what we're looking for
        print("\n=== DEBUG: Starting replacements ===")
        print(f"Looking for placeholders from JSON:")
        print(f"  Client name: '{mapping['placeholders']['client_name']}'")
        print(f"  Visit date: '{mapping['placeholders']['visit_date']}'")
        print(f"  Notes: '{mapping['placeholders']['notes']}'")
        
        # Debug: Print what's in the document
        print("\nDocument paragraphs:")
        for i, para in enumerate(doc.paragraphs):
            if para.text.strip():
                print(f"  Para {i}: {para.text[:50]}...")
        
        print("\nDocument tables:")
        for t_idx, table in enumerate(doc.tables):
            print(f"  Table {t_idx}: {len(table.rows)} rows x {len(table.columns)} columns")
        
        # Prepare data
        client_name = report.client.name if report.client else 'غير محدد'
        visit_date = report.visit_date.strftime('%Y-%m-%d')
        
        print(f"\nReplacing with:")
        print(f"  Client name: '{client_name}'")
        print(f"  Visit date: '{visit_date}'")
        
        # SIMPLE FIND AND REPLACE using JSON mapping
        
        # 1. Replace client name
        replace_text_in_docx(doc, mapping['placeholders']['client_name'], client_name)
        
        # 2. Replace visit date
        replace_text_in_docx(doc, mapping['placeholders']['visit_date'], visit_date)
        
        # 3. Replace image placeholders
        images = report.images[:3] if report.images else []
        for i in range(3):
            placeholder = mapping['placeholders'][f'image_{i+1}']
            if i < len(images):
                # For now just mark that image exists - TODO: insert actual image
                replace_text_in_docx(doc, placeholder, f"[صورة متوفرة {i+1}]")
            else:
                replace_text_in_docx(doc, placeholder, f"لا توجد صورة")
        
        # 4. Replace notes placeholder
        if report.notes:
            notes_text = '\n'.join([f"• {note.note_text}" for note in report.notes])
        else:
            notes_text = 'لا توجد ملاحظات'
        replace_text_in_docx(doc, mapping['placeholders']['notes'], notes_text)
        
        # 5. Handle products table - only if we have products
        if report.products and len(doc.tables) >= 3:
            products_table = doc.tables[2]  # Table 2 is products
            
            # Check if we have existing data rows (rows 1-4 are for products, row 0 is header)
            num_existing_data_rows = len(products_table.rows) - 1  # Subtract header row
            num_products = len(report.products)
            
            # Fill existing rows with product data (up to 4 products)
            for idx, rp in enumerate(report.products[:4]):  # Only first 4 products for existing rows
                if idx + 1 < len(products_table.rows):  # Row exists (idx+1 because row 0 is header)
                    row = products_table.rows[idx + 1]
                    
                    # Prepare product data
                    product_name = rp.product.name if rp.product else 'منتج غير محدد'
                    our_price = f"{rp.product.taxed_price_store:.2f} ريال" if rp.product and rp.product.taxed_price_store else 'غير محدد'
                    displayed_price = f"{rp.displayed_price:.2f} ريال"
                    nearly_expired = "نعم" if rp.expired_or_nearly_expired else "لا"
                    expiry_date = rp.expiry_date.strftime('%Y-%m-%d') if rp.expiry_date else 'غير محدد'
                    
                    # Find and replace product placeholders in this row
                    # We'll replace placeholders if they exist, otherwise just set the cell text
                    for cell_idx, cell in enumerate(row.cells):
                        if cell_idx == 0:  # Product name column
                            if mapping['product_fields']['product_name'] in cell.text:
                                for para in cell.paragraphs:
                                    for run in para.runs:
                                        if mapping['product_fields']['product_name'] in run.text:
                                            run.text = run.text.replace(mapping['product_fields']['product_name'], product_name)
                            elif not cell.text.strip():  # Empty cell
                                cell.text = product_name
                        elif cell_idx == 1:  # Our price column
                            if mapping['product_fields']['our_price'] in cell.text:
                                for para in cell.paragraphs:
                                    for run in para.runs:
                                        if mapping['product_fields']['our_price'] in run.text:
                                            run.text = run.text.replace(mapping['product_fields']['our_price'], our_price)
                            elif not cell.text.strip():
                                cell.text = our_price
                        elif cell_idx == 2:  # Displayed price column
                            if mapping['product_fields']['displayed_price'] in cell.text:
                                for para in cell.paragraphs:
                                    for run in para.runs:
                                        if mapping['product_fields']['displayed_price'] in run.text:
                                            run.text = run.text.replace(mapping['product_fields']['displayed_price'], displayed_price)
                            elif not cell.text.strip():
                                cell.text = displayed_price
                        elif cell_idx == 3:  # Nearly expired column
                            if mapping['product_fields']['nearly_expired'] in cell.text:
                                for para in cell.paragraphs:
                                    for run in para.runs:
                                        if mapping['product_fields']['nearly_expired'] in run.text:
                                            run.text = run.text.replace(mapping['product_fields']['nearly_expired'], nearly_expired)
                            elif not cell.text.strip():
                                cell.text = nearly_expired
                        elif cell_idx == 4:  # Expiry date column
                            if mapping['product_fields']['expiry_date'] in cell.text:
                                for para in cell.paragraphs:
                                    for run in para.runs:
                                        if mapping['product_fields']['expiry_date'] in run.text:
                                            run.text = run.text.replace(mapping['product_fields']['expiry_date'], expiry_date)
                            elif not cell.text.strip():
                                cell.text = expiry_date
            
            # If we have more than 4 products, add new rows
            if num_products > 4:
                for rp in report.products[4:]:  # Products beyond the first 4
                    new_row = products_table.add_row()
                    
                    # Fill the new row cells
                    product_name = rp.product.name if rp.product else 'منتج غير محدد'
                    our_price = f"{rp.product.taxed_price_store:.2f} ريال" if rp.product and rp.product.taxed_price_store else 'غير محدد'
                    displayed_price = f"{rp.displayed_price:.2f} ريال"
                    nearly_expired = "نعم" if rp.expired_or_nearly_expired else "لا"
                    expiry_date = rp.expiry_date.strftime('%Y-%m-%d') if rp.expiry_date else 'غير محدد'
                    
                    if len(new_row.cells) > 0:
                        new_row.cells[0].text = product_name
                    if len(new_row.cells) > 1:
                        new_row.cells[1].text = our_price
                    if len(new_row.cells) > 2:
                        new_row.cells[2].text = displayed_price
                    if len(new_row.cells) > 3:
                        new_row.cells[3].text = nearly_expired
                    if len(new_row.cells) > 4:
                        new_row.cells[4].text = expiry_date
        
        # Save modified Word document to temporary file
        temp_docx = tempfile.NamedTemporaryFile(delete=False, suffix='.docx')
        doc.save(temp_docx.name)
        temp_docx.close()
        
        # Convert to PDF
        temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_pdf.close()
        
        try:
            convert(temp_docx.name, temp_pdf.name)
        except Exception as e:
            print(f"Error converting to PDF: {e}")
            # If conversion fails, return the Word document instead
            filename = f"visit_report_{report.id}_{visit_date}.docx"
            
            def cleanup_files():
                try:
                    os.unlink(temp_docx.name)
                except:
                    pass
            
            response = send_file(
                temp_docx.name,
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                as_attachment=True,
                download_name=filename
            )
            response.call_on_close(cleanup_files)
            return response
        
        # Return PDF file
        filename = f"visit_report_{report.id}_{visit_date}.pdf"
        
        def cleanup_files():
            try:
                os.unlink(temp_docx.name)
                os.unlink(temp_pdf.name)
            except:
                pass
        
        response = send_file(
            temp_pdf.name,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
        # Schedule file cleanup after response
        response.call_on_close(cleanup_files)
        
        return response
        
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': 'Failed to generate PDF report', 'error': str(e)}), 500

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Settings API endpoints
@app.route('/api/settings', methods=['GET'])
@token_required
def get_settings(current_user):
    """Get all system settings (super admin only)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        settings = SystemSetting.query.all()
        settings_dict = {}
        for setting in settings:
            settings_dict[setting.key] = {
                'value': setting.value,
                'description': setting.description
            }
        
        # Add default settings if they don't exist
        if 'price_tolerance' not in settings_dict:
            settings_dict['price_tolerance'] = {
                'value': '1.00',
                'description': 'Maximum allowed difference between internal and displayed price'
            }
        
        return jsonify(settings_dict)
    except Exception as e:
        print(f"Error getting settings: {e}")
        return jsonify({'message': 'Error loading settings'}), 500

@app.route('/api/settings/price-tolerance', methods=['PUT'])
@token_required
def update_price_tolerance(current_user):
    """Update price tolerance setting (super admin only)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        data = request.get_json()
        price_tolerance = data.get('price_tolerance')
        
        if price_tolerance is None:
            return jsonify({'message': 'Price tolerance value is required'}), 400
        
        # Convert to float and validate
        try:
            tolerance_value = float(price_tolerance)
            if tolerance_value < 0:
                return jsonify({'message': 'Price tolerance must be non-negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'message': 'Invalid price tolerance value'}), 400
        
        # Update or create the setting
        setting = SystemSetting.query.filter_by(key='price_tolerance').first()
        if setting:
            setting.value = str(tolerance_value)
            setting.updated_at = datetime.utcnow()
        else:
            setting = SystemSetting(
                key='price_tolerance',
                value=str(tolerance_value),
                description='Maximum allowed difference between internal and displayed price'
            )
            db.session.add(setting)
        
        db.session.commit()
        return jsonify({'message': 'Price tolerance updated successfully'})
        
    except Exception as e:
        print(f"Error updating price tolerance: {e}")
        db.session.rollback()
        return jsonify({'message': 'Error updating price tolerance'}), 500

# Image Management Routes
@app.route('/api/clients/<int:client_id>/images/<int:image_id>', methods=['DELETE'])
@token_required
def delete_client_image(current_user, client_id, image_id):
    """Delete a specific client image"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        # Find the specific image
        image = ClientImage.query.filter_by(id=image_id, client_id=client_id).first()
        if not image:
            return jsonify({'message': 'Image not found'}), 404
        
        db.session.delete(image)
        db.session.commit()
        
        return jsonify({'message': 'Image deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting client image: {e}")
        return jsonify({'message': 'Error deleting image'}), 500

@app.route('/api/clients/<int:client_id>/thumbnail', methods=['DELETE'])
@token_required
def delete_client_thumbnail(current_user, client_id):
    """Delete client thumbnail"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        # Check permission
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        client.thumbnail = None
        db.session.commit()
        
        return jsonify({'message': 'Thumbnail deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting client thumbnail: {e}")
        return jsonify({'message': 'Error deleting thumbnail'}), 500

@app.route('/api/products/<int:product_id>/images/<int:image_id>', methods=['DELETE'])
@token_required
def delete_product_image(current_user, product_id, image_id):
    """Delete a specific product image"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        # Find the specific image
        image = ProductImage.query.filter_by(id=image_id, product_id=product_id).first()
        if not image:
            return jsonify({'message': 'Image not found'}), 404
        
        db.session.delete(image)
        db.session.commit()
        
        return jsonify({'message': 'Image deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting product image: {e}")
        return jsonify({'message': 'Error deleting image'}), 500

@app.route('/api/products/<int:product_id>/thumbnail', methods=['DELETE'])
@token_required
def delete_product_thumbnail(current_user, product_id):
    """Delete product thumbnail"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        product.thumbnail = None
        db.session.commit()
        
        return jsonify({'message': 'Thumbnail deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting product thumbnail: {e}")
        return jsonify({'message': 'Error deleting thumbnail'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5009)
