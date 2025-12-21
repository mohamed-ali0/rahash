# Client Routes Blueprint - COMPLETE CRUD

from flask import Blueprint, request, jsonify
from backend.models import db, Client, Person, ClientImage, User, UserRole, VisitReport
from backend.utils.auth import token_required
from sqlalchemy import text
import base64

client_bp = Blueprint('clients', __name__, url_prefix='/api/clients')

# ==================== GET ROUTES ====================

@client_bp.route('/names', methods=['GET'])
@token_required
def get_client_names_only(current_user):
    """Get client names for dropdowns"""
    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            query = text("SELECT id, name, region FROM clients WHERE is_active = 1 ORDER BY name")
            result = db.session.execute(query).fetchall()
        elif current_user.role == UserRole.SALES_SUPERVISOR:
            query = text("""SELECT id, name, region FROM clients WHERE is_active = 1 AND (
                assigned_user_id = :user_id OR assigned_user_id IN (SELECT id FROM users WHERE supervisor_id = :user_id)
            ) ORDER BY name""")
            result = db.session.execute(query, {'user_id': current_user.id}).fetchall()
        else:
            query = text("SELECT id, name, region FROM clients WHERE is_active = 1 AND assigned_user_id = :user_id ORDER BY name")
            result = db.session.execute(query, {'user_id': current_user.id}).fetchall()
        
        clients = [{'id': row[0], 'name': row[1], 'region': row[2]} for row in result]
        return jsonify(clients), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch client names', 'error': str(e)}), 500


@client_bp.route('/names-with-salesman', methods=['GET'])
@token_required
def get_client_names_with_salesman(current_user):
    """Get client names with salesman info for team management"""
    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            query = text("SELECT id, name, region, salesman_name, assigned_user_id FROM clients WHERE is_active = 1 ORDER BY name")
            result = db.session.execute(query).fetchall()
        elif current_user.role == UserRole.SALES_SUPERVISOR:
            query = text("""SELECT id, name, region, salesman_name, assigned_user_id FROM clients WHERE is_active = 1 AND (
                assigned_user_id = :user_id OR assigned_user_id IN (SELECT id FROM users WHERE supervisor_id = :user_id)
                OR assigned_user_id IS NULL
            ) ORDER BY name""")
            result = db.session.execute(query, {'user_id': current_user.id}).fetchall()
        else:
            query = text("SELECT id, name, region, salesman_name, assigned_user_id FROM clients WHERE is_active = 1 AND assigned_user_id = :user_id ORDER BY name")
            result = db.session.execute(query, {'user_id': current_user.id}).fetchall()
        
        clients = [{
            'id': row[0], 
            'name': row[1], 
            'region': row[2],
            'salesman_name': row[3],
            'assigned_user_id': row[4]
        } for row in result]
        return jsonify(clients), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch client names', 'error': str(e)}), 500

@client_bp.route('/filter-data', methods=['GET'])
@token_required
def get_client_filter_data(current_user):
    """Get unique regions and salesmen for filter dropdowns"""
    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            regions_result = db.session.execute(text("SELECT DISTINCT region FROM clients WHERE is_active = 1 AND region IS NOT NULL AND region != '' ORDER BY region")).fetchall()
            salesmen_result = db.session.execute(text("SELECT DISTINCT salesman_name FROM clients WHERE is_active = 1 AND salesman_name IS NOT NULL AND salesman_name != '' ORDER BY salesman_name")).fetchall()
        else:
            regions_result = db.session.execute(text("SELECT DISTINCT region FROM clients WHERE is_active = 1 AND assigned_user_id = :user_id AND region IS NOT NULL AND region != '' ORDER BY region"), {'user_id': current_user.id}).fetchall()
            salesmen_result = db.session.execute(text("SELECT DISTINCT salesman_name FROM clients WHERE is_active = 1 AND assigned_user_id = :user_id AND salesman_name IS NOT NULL AND salesman_name != '' ORDER BY salesman_name"), {'user_id': current_user.id}).fetchall()
        
        return jsonify({'regions': [r[0] for r in regions_result], 'salesmen': [s[0] for s in salesmen_result]}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch filter data', 'error': str(e)}), 500

@client_bp.route('/list', methods=['GET'])
@token_required
def get_clients_list(current_user):
    """Get clients list with PAGINATION"""
    try:
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 500))  # Increased for filter results
        region_filter = request.args.get('region', '').strip()
        salesman_filter = request.args.get('salesman', '').strip()

        
        if current_user.role == UserRole.SUPER_ADMIN:
            query = Client.query if show_all else Client.query.filter_by(is_active=True)
        elif current_user.role == UserRole.SALES_SUPERVISOR:
            salesmen = User.query.filter_by(supervisor_id=current_user.id, role=UserRole.SALESMAN).all()
            salesman_ids = [s.id for s in salesmen] + [current_user.id]
            query = Client.query.filter(Client.assigned_user_id.in_(salesman_ids))
            if not show_all:
                query = query.filter(Client.is_active == True)
        else:
            query = Client.query.filter_by(assigned_user_id=current_user.id)
            if not show_all:
                query = query.filter_by(is_active=True)
        
        if region_filter:
            query = query.filter_by(region=region_filter)
        if salesman_filter:
            query = query.filter_by(salesman_name=salesman_filter)
        
        total_count = query.count()
        clients = query.order_by(Client.name).offset((page - 1) * per_page).limit(per_page).all()
        
        clients_data = []
        for client in clients:
            try:
                owner_data = {'name': client.owner.name, 'phone': client.owner.phone, 'email': client.owner.email} if client.owner else None
                pm_data = {'name': client.purchasing_manager.name, 'phone': client.purchasing_manager.phone, 'email': client.purchasing_manager.email} if client.purchasing_manager else None
                acc_data = {'name': client.accountant.name, 'phone': client.accountant.phone, 'email': client.accountant.email} if client.accountant else None
                
                clients_data.append({
                    'id': client.id, 'name': client.name, 'region': client.region,
                    'location': client.location, 'address': getattr(client, 'address', None),
                    'salesman_name': client.salesman_name,
                    'phone': client.owner.phone if client.owner else None,
                    'has_thumbnail': client.thumbnail is not None,
                    'image_count': len(client.images) if client.images else 0,
                    'owner': owner_data, 'purchasing_manager': pm_data, 'accountant': acc_data,
                    'assigned_user': client.assigned_user.username if client.assigned_user else None,
                    'created_at': client.created_at.isoformat(), 'is_active': client.is_active
                })
            except Exception as e:
                print(f"Error processing client {client.id}: {e}")
        
        return jsonify({'clients': clients_data, 'page': page, 'per_page': per_page, 'total': total_count, 'has_more': page * per_page < total_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch clients list', 'error': str(e)}), 500

@client_bp.route('/<int:client_id>', methods=['GET'])
@token_required
def get_single_client(current_user, client_id):
    """Get a single client with ALL details"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        owner_data = {'id': client.owner.id, 'name': client.owner.name, 'phone': client.owner.phone, 'email': client.owner.email} if client.owner else None
        pm_data = {'id': client.purchasing_manager.id, 'name': client.purchasing_manager.name, 'phone': client.purchasing_manager.phone, 'email': client.purchasing_manager.email} if client.purchasing_manager else None
        acc_data = {'id': client.accountant.id, 'name': client.accountant.name, 'phone': client.accountant.phone, 'email': client.accountant.email} if client.accountant else None
        additional_images = [{'id': img.id, 'filename': img.filename, 'data': base64.b64encode(img.image_data).decode('utf-8')} for img in client.images] if client.images else []
        
        return jsonify({
            'id': client.id, 'name': client.name, 'region': client.region,
            'location': client.location, 'address': getattr(client, 'address', None),
            'salesman_name': client.salesman_name,
            'thumbnail': base64.b64encode(client.thumbnail).decode('utf-8') if client.thumbnail else None,
            'images': additional_images, 'image_count': len(additional_images),
            'owner': owner_data, 'purchasing_manager': pm_data, 'accountant': acc_data,
            'assigned_user': client.assigned_user.username if client.assigned_user else None,
            'created_at': client.created_at.isoformat(), 'is_active': client.is_active,
            'phone': client.owner.phone if client.owner else None
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch client', 'error': str(e)}), 500

@client_bp.route('/<int:client_id>/thumbnail', methods=['GET'])
@token_required
def get_client_thumbnail(current_user, client_id):
    """Get ONLY thumbnail for a specific client"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        thumbnail = base64.b64encode(client.thumbnail).decode('utf-8') if client.thumbnail else None
        return jsonify({'thumbnail': thumbnail}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch thumbnail', 'error': str(e)}), 500

# ==================== CREATE ROUTE ====================

@client_bp.route('', methods=['POST'])
@token_required
def create_client(current_user):
    """Create a new client"""
    try:
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'message': 'Client name is required'}), 400
        
        client = Client(
            name=data['name'], region=data.get('region'), location=data.get('location'),
            address=data.get('address'), salesman_name=data.get('salesman_name'),
            assigned_user_id=current_user.id
        )
        
        if 'thumbnail' in data and data['thumbnail']:
            try:
                client.thumbnail = base64.b64decode(data['thumbnail'])
            except:
                pass
        
        db.session.add(client)
        db.session.flush()
        
        # Handle owner
        if 'owner' in data and data['owner']:
            owner_data = data['owner']
            if owner_data.get('name') or owner_data.get('phone') or owner_data.get('email'):
                owner = Person(name=owner_data.get('name'), phone=owner_data.get('phone'), email=owner_data.get('email'))
                db.session.add(owner)
                db.session.flush()
                client.owner_id = owner.id
        
        # Handle purchasing manager
        if 'purchasing_manager' in data and data['purchasing_manager']:
            pm_data = data['purchasing_manager']
            if pm_data.get('name') or pm_data.get('phone') or pm_data.get('email'):
                pm = Person(name=pm_data.get('name'), phone=pm_data.get('phone'), email=pm_data.get('email'))
                db.session.add(pm)
                db.session.flush()
                client.purchasing_manager_id = pm.id
        
        # Handle accountant
        if 'accountant' in data and data['accountant']:
            acc_data = data['accountant']
            if acc_data.get('name') or acc_data.get('phone') or acc_data.get('email'):
                acc = Person(name=acc_data.get('name'), phone=acc_data.get('phone'), email=acc_data.get('email'))
                db.session.add(acc)
                db.session.flush()
                client.accountant_id = acc.id
        
        # Handle additional images
        if 'additional_images' in data and data['additional_images']:
            for img_data in data['additional_images']:
                if img_data.get('data'):
                    try:
                        img = ClientImage(client_id=client.id, image_data=base64.b64decode(img_data['data']), filename=img_data.get('filename', 'image.jpg'))
                        db.session.add(img)
                    except:
                        pass
        
        db.session.commit()
        return jsonify({'message': 'Client created successfully', 'client_id': client.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create client', 'error': str(e)}), 500

# ==================== UPDATE ROUTE ====================

@client_bp.route('/<int:client_id>', methods=['PUT'])
@token_required
def update_client(current_user, client_id):
    """Update a client"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        if current_user.role == UserRole.SALESMAN:
            return jsonify({'message': 'Salesmen cannot edit clients'}), 403
        
        if current_user.role == UserRole.SALES_SUPERVISOR and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        data = request.get_json()
        
        if 'name' in data: client.name = data['name']
        if 'region' in data: client.region = data['region']
        if 'location' in data: client.location = data['location']
        if 'address' in data: client.address = data['address']
        if 'salesman_name' in data: client.salesman_name = data['salesman_name']
        
        if 'thumbnail' in data and data['thumbnail']:
            try:
                client.thumbnail = base64.b64decode(data['thumbnail'])
            except:
                pass
        
        # Update owner
        if 'owner' in data and data['owner']:
            owner_data = data['owner']
            if client.owner:
                if owner_data.get('name'): client.owner.name = owner_data['name']
                if owner_data.get('phone'): client.owner.phone = owner_data['phone']
                if owner_data.get('email'): client.owner.email = owner_data['email']
            else:
                if owner_data.get('name') or owner_data.get('phone') or owner_data.get('email'):
                    owner = Person(name=owner_data.get('name'), phone=owner_data.get('phone'), email=owner_data.get('email'))
                    db.session.add(owner)
                    db.session.flush()
                    client.owner_id = owner.id
        
        db.session.commit()
        return jsonify({'message': 'Client updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update client', 'error': str(e)}), 500

# ==================== DELETE ROUTE ====================

@client_bp.route('/<int:client_id>', methods=['DELETE'])
@token_required
def deactivate_client(current_user, client_id):
    """Deactivate a client (soft delete)"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        if current_user.role == UserRole.SALESMAN:
            return jsonify({'message': 'Salesmen cannot delete clients'}), 403
        
        if current_user.role == UserRole.SALES_SUPERVISOR:
            assigned_user = User.query.get(client.assigned_user_id)
            if not assigned_user or (assigned_user.supervisor_id != current_user.id and client.assigned_user_id != current_user.id):
                return jsonify({'message': 'Permission denied'}), 403
        
        client.is_active = False
        db.session.commit()
        return jsonify({'message': 'Client deactivated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete client', 'error': str(e)}), 500

@client_bp.route('/<int:client_id>/reactivate', methods=['PUT'])
@token_required
def reactivate_client(current_user, client_id):
    """Reactivate a deactivated client"""
    try:
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        if current_user.role != UserRole.SUPER_ADMIN and client.assigned_user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        client.is_active = True
        db.session.commit()
        return jsonify({'message': 'Client reactivated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to reactivate client', 'error': str(e)}), 500

# ==================== SEARCH ROUTE ====================

@client_bp.route('/search', methods=['GET'])
@token_required
def search_clients(current_user):
    """Search clients by name"""
    try:
        search_term = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 500))  # Increased for filter results
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        region_filter = request.args.get('region', '').strip()
        salesman_filter = request.args.get('salesman', '').strip()
        
        if current_user.role == UserRole.SUPER_ADMIN:
            query = Client.query if show_all else Client.query.filter_by(is_active=True)
        elif current_user.role == UserRole.SALES_SUPERVISOR:
            # Include all salesmen under this supervisor
            salesmen = User.query.filter_by(supervisor_id=current_user.id, role=UserRole.SALESMAN).all()
            salesman_ids = [s.id for s in salesmen] + [current_user.id]
            query = Client.query.filter(Client.assigned_user_id.in_(salesman_ids))
            if not show_all:
                query = query.filter(Client.is_active == True)
        else:
            query = Client.query.filter_by(assigned_user_id=current_user.id)
            if not show_all:
                query = query.filter_by(is_active=True)
        
        if search_term:
            query = query.filter(Client.name.ilike(f'%{search_term}%'))
        
        if region_filter:
            query = query.filter_by(region=region_filter)
        if salesman_filter:
            query = query.filter_by(salesman_name=salesman_filter)
        
        total_count = query.count()
        clients = query.order_by(Client.name).offset((page - 1) * per_page).limit(per_page).all()
        
        clients_data = [{
            'id': c.id, 'name': c.name, 'region': c.region, 'location': c.location,
            'salesman_name': c.salesman_name, 'has_thumbnail': c.thumbnail is not None,
            'is_active': c.is_active
        } for c in clients]
        
        return jsonify({'clients': clients_data, 'page': page, 'per_page': per_page, 'total': total_count, 'has_more': page * per_page < total_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to search clients', 'error': str(e)}), 500
