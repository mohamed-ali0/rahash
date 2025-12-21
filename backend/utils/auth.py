# Authentication utilities

import jwt
from functools import wraps
from flask import request, jsonify
from backend.models import User
from backend.config import Config

def token_required(f):
    """Decorator to require JWT token for API routes"""
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
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
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
