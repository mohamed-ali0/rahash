# Database initialization file

from flask import Flask
from flask_migrate import Migrate
from backend.models import db, User, Person, Client, Product, UserRole  # Import from backend.models!
from werkzeug.security import generate_password_hash
import os

migrate = Migrate()

def init_database(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default super admin user if not exists
        create_default_admin()

def create_default_admin():
    """Create default super admin user and Abdullah user"""
    existing_admin = User.query.filter_by(role=UserRole.SUPER_ADMIN).first()
    
    if not existing_admin:
        admin_user = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),  # Change this in production!
            role=UserRole.SUPER_ADMIN
        )
        
        db.session.add(admin_user)
        print("Default admin user created:")
        print("Username: admin")
        print("Password: admin123")
    
    # Create Abdullah user
    existing_abdullah = User.query.filter_by(username='abdullah').first()
    
    if not existing_abdullah:
        abdullah_user = User(
            username='abdullah',
            email='albadrali61@gmail.com',
            password_hash=generate_password_hash('alitiger2015'),
            role=UserRole.SALES_SUPERVISOR
        )
        
        db.session.add(abdullah_user)
        print("Abdullah user created:")
        print("Username: abdullah")
        print("Email: albadrali61@gmail.com")
        print("Password: alitiger2015")
        print("Role: Sales Supervisor")
    
    db.session.commit()

def create_sample_data():
    """Create sample data for testing (optional)"""
    # Create sample person
    person = Person(
        name='محمد أحمد',
        phone='+201234567890',
        email='mohammed@example.com'
    )
    db.session.add(person)
    
    # Create sample product
    product = Product(
        name='منتج تجريبي',
        taxed_price_store=100.00,
        untaxed_price_store=85.00,
        taxed_price_client=110.00,
        untaxed_price_client=95.00
    )
    db.session.add(product)
    
    db.session.commit()
    print("Sample data created!")

def reset_database(app):
    """Reset database - WARNING: This will delete all data!"""
    with app.app_context():
        db.drop_all()
        db.create_all()
        create_default_admin()
        print("Database reset complete!")
