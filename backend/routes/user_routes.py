# User Management Routes Blueprint

from flask import Blueprint, request, jsonify
from backend.models import db, User, UserRole
from backend.utils.auth import token_required

users_bp = Blueprint('users', __name__, url_prefix='/api/users')
supervisors_bp = Blueprint('supervisors', __name__, url_prefix='/api/supervisors')


@supervisors_bp.route('/all', methods=['GET'])
@token_required
def get_all_supervisors(current_user):
    """Get all supervisors (for assigning to salesmen)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        supervisors = User.query.filter_by(role=UserRole.SALES_SUPERVISOR).all()
        supervisors_data = [{
            'id': s.id,
            'username': s.username,
            'email': s.email
        } for s in supervisors]
        
        return jsonify(supervisors_data), 200
        
    except Exception as e:
        print(f"Error fetching supervisors: {e}")
        return jsonify({'message': 'Failed to fetch supervisors', 'error': str(e)}), 500


@users_bp.route('/all', methods=['GET'])
@token_required
def get_all_users(current_user):
    """Get all users (super admin only)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        users = User.query.all()
        users_data = []
        
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role.value,
                'supervisor_id': user.supervisor_id,
                'supervisor_name': user.supervisor.username if user.supervisor else None,
                'created_at': user.created_at.isoformat()
            })
        
        return jsonify(users_data), 200
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'message': 'Failed to fetch users', 'error': str(e)}), 500


@users_bp.route('/<int:user_id>/supervisor', methods=['PUT'])
@token_required
def assign_supervisor(current_user, user_id):
    """Assign a supervisor to a user (super admin only)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        data = request.get_json()
        supervisor_id = data.get('supervisor_id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if supervisor_id:
            supervisor = User.query.get(supervisor_id)
            if not supervisor:
                return jsonify({'message': 'Supervisor not found'}), 404
            if supervisor.role != UserRole.SALES_SUPERVISOR:
                return jsonify({'message': 'Selected user is not a supervisor'}), 400
        
        user.supervisor_id = supervisor_id
        db.session.commit()
        
        return jsonify({
            'message': 'Supervisor assigned successfully',
            'user_id': user_id,
            'supervisor_id': supervisor_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error assigning supervisor: {e}")
        return jsonify({'message': 'Failed to assign supervisor', 'error': str(e)}), 500
