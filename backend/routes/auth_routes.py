# Authentication Routes Blueprint

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from backend.models import db, User, UserRole
from backend.config import Config
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
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
            
            token = jwt.encode(token_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
            
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
        print(f"❌ LOGIN ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout"""
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration - requires admin password"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email, and password are required'}), 400
        
        # Check admin password
        admin_password = data.get('admin_password')
        if admin_password != Config.ADMIN_PASSWORD:
            return jsonify({'message': 'Invalid admin password'}), 403
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == data['username']) | (User.email == data['email'])
        ).first()
        
        if existing_user:
            return jsonify({'message': 'Username or email already exists'}), 400
        
        # Determine role
        role = data.get('role', 'salesman')
        if role == 'sales_supervisor':
            user_role = UserRole.SALES_SUPERVISOR
        elif role == 'salesman':
            user_role = UserRole.SALESMAN
        else:
            user_role = UserRole.SALESMAN
        
        # Get supervisor_id if provided
        supervisor_id = data.get('supervisor_id')
        if user_role == UserRole.SALESMAN and supervisor_id:
            supervisor = User.query.get(supervisor_id)
            if not supervisor or supervisor.role != UserRole.SALES_SUPERVISOR:
                return jsonify({'message': 'Invalid supervisor'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            role=user_role,
            supervisor_id=supervisor_id if user_role == UserRole.SALESMAN else None
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User registered successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500
