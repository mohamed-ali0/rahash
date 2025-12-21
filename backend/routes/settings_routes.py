# Settings Routes Blueprint

from flask import Blueprint, request, jsonify
from backend.models import db, SystemSetting, UserRole
from backend.utils.auth import token_required
import os
import json

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')
predefined_notes_bp = Blueprint('predefined_notes', __name__, url_prefix='/api')


@settings_bp.route('', methods=['GET'])
@token_required
def get_settings(current_user):
    """Get all system settings (super admin only)"""
    if current_user.role != UserRole.SUPER_ADMIN:
        return jsonify({'message': 'Permission denied'}), 403
    
    try:
        # Load settings from JSON file
        settings_file = 'sys_settings.json'
        print(f"Loading settings from: {settings_file}")
        if os.path.exists(settings_file):
            with open(settings_file, 'r', encoding='utf-8') as f:
                settings_dict = json.load(f)
            print(f"Settings loaded from file: {settings_dict}")
        else:
            # Create default settings file if it doesn't exist
            print("Settings file not found, creating default")
            settings_dict = {
                'price_tolerance': {
                    'value': '1.00',
                    'description': 'Maximum allowed difference between internal and displayed price'
                }
            }
            with open(settings_file, 'w', encoding='utf-8') as f:
                json.dump(settings_dict, f, indent=2, ensure_ascii=False)
            print(f"Default settings created: {settings_dict}")
        
        return jsonify(settings_dict)
    except Exception as e:
        print(f"Error getting settings: {e}")
        return jsonify({'message': 'Error loading settings'}), 500

@settings_bp.route('/price-tolerance', methods=['PUT'])
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
        
        # Update settings in JSON file
        settings_file = 'sys_settings.json'
        settings_dict = {}
        
        # Load existing settings
        if os.path.exists(settings_file):
            with open(settings_file, 'r', encoding='utf-8') as f:
                settings_dict = json.load(f)
            print(f"Loaded existing settings: {settings_dict}")
        else:
            print("Settings file not found, creating new one")
        
        # Update price tolerance
        settings_dict['price_tolerance'] = {
            'value': str(tolerance_value),
            'description': 'Maximum allowed difference between internal and displayed price'
        }
        
        print(f"Updated settings to save: {settings_dict}")
        
        # Save back to file
        with open(settings_file, 'w', encoding='utf-8') as f:
            json.dump(settings_dict, f, indent=2, ensure_ascii=False)
        
        print(f"Settings saved to file: {settings_file}")
        return jsonify({'message': 'Price tolerance updated successfully'})
        
    except Exception as e:
        print(f"Error updating price tolerance: {e}")
        return jsonify({'message': 'Error updating price tolerance'}), 500

@settings_bp.route('/predefined-notes', methods=['GET'])
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


@predefined_notes_bp.route('/predefined-notes', methods=['GET'])
@token_required
def get_predefined_notes_alias(current_user):
    """Get predefined notes - alias route for frontend"""
    try:
        with open('templates/predefined_notes.json', 'r', encoding='utf-8') as f:
            predefined_notes = json.load(f)
        return jsonify(predefined_notes)
    except Exception as e:
        print(f"Error loading predefined notes: {e}")
        return jsonify({'message': 'Error loading predefined notes'}), 500
