# Team Management Routes Blueprint
# Handles salesman management and client assignment

from flask import Blueprint, request, jsonify
from backend.models import db, User, Client, UserRole
from backend.utils.auth import token_required
from sqlalchemy import text

team_bp = Blueprint('team', __name__, url_prefix='/api')

@team_bp.route('/salesmen', methods=['GET'])
@token_required
def get_salesmen(current_user):
    """Get all salesmen under current supervisor"""
    # Only supervisors and admins can access
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            # Admin sees all salesmen
            salesmen = User.query.filter_by(role=UserRole.SALESMAN).all()
        else:
            # Supervisor sees only their salesmen
            salesmen = User.query.filter_by(supervisor_id=current_user.id, role=UserRole.SALESMAN).all()
        
        salesmen_data = []
        for salesman in salesmen:
            # Count assigned clients
            client_count = Client.query.filter_by(assigned_user_id=salesman.id, is_active=True).count()
            
            salesmen_data.append({
                'id': salesman.id,
                'username': salesman.username,
                'email': salesman.email,
                'client_count': client_count,
                'created_at': salesman.created_at.isoformat()
            })
        
        return jsonify(salesmen_data), 200
        
    except Exception as e:
        print(f"Error fetching salesmen: {e}")
        return jsonify({'message': 'Failed to fetch salesmen', 'error': str(e)}), 500

@team_bp.route('/salesmen/<int:salesman_id>/clients', methods=['GET'])
@token_required  
def get_salesman_clients(current_user, salesman_id):
    """Get all clients assigned to a specific salesman"""
    # Permission check
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        # Verify salesman exists and user has permission
        salesman = User.query.get(salesman_id)
        if not salesman:
            return jsonify({'message': 'Salesman not found'}), 404
        
        if current_user.role == UserRole.SALES_SUPERVISOR:
            if salesman.supervisor_id != current_user.id:
                return jsonify({'message': 'Permission denied'}), 403
        
        # Get clients
        clients = Client.query.filter_by(assigned_user_id=salesman_id, is_active=True).all()
        
        clients_data = []
        for client in clients:
            clients_data.append({
                'id': client.id,
                'name': client.name,
                'region': client.region,
                'salesman_name': client.salesman_name
            })
        
        return jsonify(clients_data), 200
        
    except Exception as e:
        print(f"Error fetching salesman clients: {e}")
        return jsonify({'message': 'Failed to fetch clients', 'error': str(e)}), 500

@team_bp.route('/assign-client', methods=['POST'])
@token_required
def assign_client(current_user):
    """Assign a client to a salesman"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        salesman_id = data.get('salesman_id')
        
        if not client_id or not salesman_id:
            return jsonify({'message': 'Client ID and Salesman ID required'}), 400
        
        # Verify salesman
        salesman = User.query.get(salesman_id)
        if not salesman or salesman.role != UserRole.SALESMAN:
            return jsonify({'message': 'Invalid salesman'}), 400
        
        # Permission check for supervisor
        if current_user.role == UserRole.SALES_SUPERVISOR:
            if salesman.supervisor_id != current_user.id:
                return jsonify({'message': 'Permission denied'}), 403
        
        # Get and update client
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        client.assigned_user_id = salesman_id
        client.salesman_name = salesman.username
        
        db.session.commit()
        
        return jsonify({'message': 'Client assigned successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error assigning client: {e}")
        return jsonify({'message': 'Failed to assign client', 'error': str(e)}), 500


@team_bp.route('/supervisors/assign-client', methods=['POST'])
@token_required
def supervisor_assign_client(current_user):
    """Assign a client to a salesman - alias for frontend"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        salesman_id = data.get('salesman_id')
        
        if not client_id or not salesman_id:
            return jsonify({'message': 'Client ID and Salesman ID required'}), 400
        
        # Verify salesman
        salesman = User.query.get(salesman_id)
        if not salesman or salesman.role != UserRole.SALESMAN:
            return jsonify({'message': 'Invalid salesman'}), 400
        
        # Permission check for supervisor
        if current_user.role == UserRole.SALES_SUPERVISOR:
            if salesman.supervisor_id != current_user.id:
                return jsonify({'message': 'Permission denied'}), 403
        
        # Get and update client
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        client.assigned_user_id = salesman_id
        client.salesman_name = salesman.username
        
        db.session.commit()
        
        return jsonify({'message': 'Client assigned successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error assigning client: {e}")
        return jsonify({'message': 'Failed to assign client', 'error': str(e)}), 500

@team_bp.route('/batch-assign-clients', methods=['POST'])
@token_required
def batch_assign_clients(current_user):
    """Batch assign multiple clients to a salesman"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        data = request.get_json()
        client_ids = data.get('client_ids', [])
        salesman_id = data.get('salesman_id')
        
        if not client_ids or not salesman_id:
            return jsonify({'message': 'Client IDs and Salesman ID required'}), 400
        
        # Verify salesman
        salesman = User.query.get(salesman_id)
        if not salesman or salesman.role != UserRole.SALESMAN:
            return jsonify({'message': 'Invalid salesman'}), 400
        
        # Permission check
        if current_user.role == UserRole.SALES_SUPERVISOR:
            if salesman.supervisor_id != current_user.id:
                return jsonify({'message': 'Permission denied'}), 403
        
        # Update clients
        updated_count = 0
        for client_id in client_ids:
            client = Client.query.get(client_id)
            if client:
                client.assigned_user_id = salesman_id
                client.salesman_name = salesman.username
                updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully assigned {updated_count} clients',
            'count': updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in batch assign: {e}")
        return jsonify({'message': 'Failed to batch assign clients', 'error': str(e)}), 500

@team_bp.route('/supervisors/salesmen', methods=['GET'])
@token_required
def get_salesmen_for_supervisor(current_user):
    """Get all salesmen - alias endpoint for frontend compatibility"""
    # Only supervisors and admins can access
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            salesmen = User.query.filter_by(role=UserRole.SALESMAN).all()
        else:
            salesmen = User.query.filter_by(supervisor_id=current_user.id, role=UserRole.SALESMAN).all()
        
        salesmen_data = []
        for salesman in salesmen:
            client_count = Client.query.filter_by(assigned_user_id=salesman.id, is_active=True).count()
            salesmen_data.append({
                'id': salesman.id,
                'username': salesman.username,
                'email': salesman.email,
                'client_count': client_count,
                'created_at': salesman.created_at.isoformat()
            })
        
        return jsonify(salesmen_data), 200
        
    except Exception as e:
        print(f"Error fetching salesmen: {e}")
        return jsonify({'message': 'Failed to fetch salesmen', 'error': str(e)}), 500


@team_bp.route('/supervisors/salesmen/<int:salesman_id>/clients', methods=['GET'])
@token_required
def get_supervisor_salesman_clients(current_user, salesman_id):
    """Get all clients assigned to a specific salesman - alias for frontend"""
    # Permission check
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.SALES_SUPERVISOR]:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        # Verify salesman exists and user has permission
        salesman = User.query.get(salesman_id)
        if not salesman:
            return jsonify({'message': 'Salesman not found'}), 404
        
        if current_user.role == UserRole.SALES_SUPERVISOR:
            if salesman.supervisor_id != current_user.id:
                return jsonify({'message': 'Permission denied'}), 403
        
        # Get clients
        clients = Client.query.filter_by(assigned_user_id=salesman_id, is_active=True).all()
        
        clients_data = []
        for client in clients:
            clients_data.append({
                'id': client.id,
                'name': client.name,
                'region': client.region,
                'salesman_name': client.salesman_name
            })
        
        return jsonify(clients_data), 200
        
    except Exception as e:
        print(f"Error fetching salesman clients: {e}")
        return jsonify({'message': 'Failed to fetch clients', 'error': str(e)}), 500
