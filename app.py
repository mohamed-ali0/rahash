# Flask application for Business Management System - 100% MODULAR
# ALL routes are in blueprint files - this file only initializes and registers them

from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from database.init import init_database

# Import configuration and models
from backend.config import Config
from backend.models import db, User

# Initialize Flask app
app = Flask(__name__, static_folder='frontend')
CORS(app)

# Load configuration
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = Config.SQLALCHEMY_TRACK_MODIFICATIONS
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY

# Initialize database FIRST - this must happen before blueprints!
init_database(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'static_routes.login_page'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register ALL blueprints - AFTER database is initialized!
from backend.routes import register_blueprints
register_blueprints(app)

# Disable caching for development
@app.after_request
def add_no_cache_headers(response):
    """Add headers to disable browser caching in development"""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Run the app
if __name__ == '__main__':
    print("\n" + "🚀 Starting Business Management System...")
    print("📍 Access at: http://localhost:5009")
    print("="*70 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5009,
        debug=True
    )
