# Routes package - register all blueprints

from flask import Flask

def register_blueprints(app: Flask):
    """Register all blueprint routes with the Flask app"""
    
    # Import all blueprints
    from backend.routes.auth_routes import auth_bp
    from backend.routes.static_routes import static_bp
    from backend.routes.settings_routes import settings_bp
    from backend.routes.user_routes import users_bp, supervisors_bp
    from backend.routes.team_routes import team_bp
    from backend.routes.client_routes import client_bp
    from backend.routes.product_routes import product_bp
    from backend.routes.report_routes import report_bp
    
    # Register all blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(static_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(supervisors_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(report_bp)

    
    print("✅ ALL BLUEPRINTS REGISTERED!")
    print("="*70)
    print("Registered blueprints:")
    print("  - auth_bp: /api/auth/*")
    print("  - static_bp: /, /css/*, /js/*, etc.")
    print("  - settings_bp: /api/settings/*")
    print("  - users_bp: /api/users/*")
    print("  - team_bp: /api/salesmen/*, /api/assign-client, etc.")
    print("  - client_bp: /api/clients/*")
    print("  - product_bp: /api/products/*")
    print("  - report_bp: /api/visit-reports/*")
    print("="*70)
    print("🎉 100% MODULAR ARCHITECTURE ACTIVE!")

