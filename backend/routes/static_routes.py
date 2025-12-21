# Static file routes (CSS, JS, images, fonts)

from flask import Blueprint, send_file

static_bp = Blueprint('static_routes', __name__)

@static_bp.route('/css/<path:filename>')
def css_files(filename):
    """Serve CSS files"""
    from flask import current_app
    return current_app.send_static_file(f'css/{filename}')

@static_bp.route('/js/<path:filename>')
def js_files(filename):
    """Serve JavaScript files"""
    from flask import current_app
    return current_app.send_static_file(f'js/{filename}')

@static_bp.route('/logo.png')
def logo_file():
    """Serve logo file"""
    return send_file('logo.png', mimetype='image/png')

@static_bp.route('/top_bar_logo.png')
def top_bar_logo_file():
    """Serve top bar logo file"""
    return send_file('top_bar_logo.png', mimetype='image/png')

@static_bp.route('/font/<path:filename>')
def font_files(filename):
    """Serve font files"""
    return send_file(f'templates/font/{filename}', mimetype='font/ttf')

@static_bp.route('/logo_corner.png')
def logo_corner_file():
    """Serve corner logo file"""
    return send_file('templates/logo_corner.png', mimetype='image/png')

@static_bp.route('/website_logo.png')
def website_logo_file():
    """Serve website logo file for favicon"""
    return send_file('website_logo.png', mimetype='image/png')

@static_bp.route('/')
def index():
    """Serve login page as main page"""
    from flask import current_app
    return current_app.send_static_file('html/login.html')

@static_bp.route('/login')
def login_page():
    """Serve login page"""
    from flask import current_app
    return current_app.send_static_file('html/login.html')

@static_bp.route('/signup')
def signup_page():
    """Serve signup page"""
    from flask import current_app
    return current_app.send_static_file('html/signup.html')

@static_bp.route('/dashboard')
def dashboard():
    """Serve dashboard page"""
    from flask import current_app
    return current_app.send_static_file('html/index.html')
