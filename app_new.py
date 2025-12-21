# Flask application for Business Management System - MODULAR VERSION
# This is the clean app.py that uses only blueprints

from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from database.init import init_database

# Import from backend modules
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

# Initialize database
init_database(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'static_routes.login_page'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register all blueprints (this handles ALL routes)
from backend.routes import register_blueprints
register_blueprints(app)

# Note: ALL route logic is now in blueprint files under backend/routes/
# - auth_routes.py: Login, logout, register
# - static_routes.py: Serve HTML, CSS, JS, images
# - settings_routes.py: System settings
# - user_routes.py: User management
# - team_routes.py: Team/salesman management
# 
# Client, Product, and Report routes are defined below (not yet in blueprints)

# Import all necessary items for the remaining routes
from flask import request, jsonify, send_file
from werkzeug.security import check_password_hash
from backend.models import Person, Client, Product, VisitReport, VisitReportImage, VisitReportNote, VisitReportProduct, UserRole, SystemSetting, ClientImage, ProductImage
from backend.utils.auth import token_required
from backend.utils.report_generator import replace_text_in_docx
import jwt
import base64
from datetime import datetime
import os
import json
import tempfile
from docx import Document
from docx.shared import Inches
from docx2pdf import convert
from sqlalchemy import text

# CLIENT ROUTES (These should eventually be moved to client_routes.py blueprint)
