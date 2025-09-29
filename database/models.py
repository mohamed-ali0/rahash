# Database models for Business Management System

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum

db = SQLAlchemy()

class UserRole(Enum):
    SUPER_ADMIN = 'super_admin'
    SALES_SUPERVISOR = 'sales_supervisor'
    SALESMAN = 'salesman'

# User model
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    clients = db.relationship('Client', back_populates='assigned_user', lazy=True)
    visit_reports = db.relationship('VisitReport', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'

# Person model for contacts
class Person(db.Model):
    __tablename__ = 'persons'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))
    
    # Relationships - clients where this person is owner, manager, or accountant
    owned_clients = db.relationship('Client', foreign_keys='Client.owner_id', backref='owner', lazy=True)
    managed_clients = db.relationship('Client', foreign_keys='Client.purchasing_manager_id', backref='purchasing_manager', lazy=True)
    accounted_clients = db.relationship('Client', foreign_keys='Client.accountant_id', backref='accountant', lazy=True)
    
    def __repr__(self):
        return f'<Person {self.name}>'

# Client model
class Client(db.Model):
    __tablename__ = 'clients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    region = db.Column(db.String(255))
    location = db.Column(db.Text)  # Google Maps coordinates/address
    address = db.Column(db.Text)  # Physical address string
    salesman_name = db.Column(db.String(255))  # Name of the salesman handling this client
    thumbnail = db.Column(db.LargeBinary)  # BLOB for image data
    is_active = db.Column(db.Boolean, default=True)  # For deactivation instead of deletion
    
    # Foreign keys
    owner_id = db.Column(db.Integer, db.ForeignKey('persons.id'))
    purchasing_manager_id = db.Column(db.Integer, db.ForeignKey('persons.id'))
    accountant_id = db.Column(db.Integer, db.ForeignKey('persons.id'))
    assigned_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    assigned_user = db.relationship('User', back_populates='clients', lazy=True)
    images = db.relationship('ClientImage', backref='client', lazy=True, cascade='all, delete-orphan')
    visit_reports = db.relationship('VisitReport', backref='client', lazy=True)
    
    def __repr__(self):
        return f'<Client {self.name}>'

# Product model  
class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    taxed_price_store = db.Column(db.Numeric(10, 2))
    untaxed_price_store = db.Column(db.Numeric(10, 2))
    taxed_price_client = db.Column(db.Numeric(10, 2))
    untaxed_price_client = db.Column(db.Numeric(10, 2))
    thumbnail = db.Column(db.LargeBinary)  # BLOB for image data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    images = db.relationship('ProductImage', backref='product', lazy=True, cascade='all, delete-orphan')
    visit_report_products = db.relationship('VisitReportProduct', backref='product', lazy=True)
    
    def __repr__(self):
        return f'<Product {self.name}>'

# Client Images model
class ClientImage(db.Model):
    __tablename__ = 'client_images'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ClientImage {self.filename}>'

# Product Images model
class ProductImage(db.Model):
    __tablename__ = 'product_images'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ProductImage {self.filename}>'

# Visit Report model
class VisitReport(db.Model):
    __tablename__ = 'visit_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    visit_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)  # For deactivation instead of deletion
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    images = db.relationship('VisitReportImage', backref='visit_report', lazy=True, cascade='all, delete-orphan')
    notes = db.relationship('VisitReportNote', backref='visit_report', lazy=True, cascade='all, delete-orphan')
    products = db.relationship('VisitReportProduct', backref='visit_report', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<VisitReport {self.id} - {self.visit_date}>'

# Visit Report Images model
class VisitReportImage(db.Model):
    __tablename__ = 'visit_report_images'
    
    id = db.Column(db.Integer, primary_key=True)
    visit_report_id = db.Column(db.Integer, db.ForeignKey('visit_reports.id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VisitReportImage {self.filename}>'

# Visit Report Notes model
class VisitReportNote(db.Model):
    __tablename__ = 'visit_report_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    visit_report_id = db.Column(db.Integer, db.ForeignKey('visit_reports.id'), nullable=False)
    note_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VisitReportNote {self.id}>'

# Visit Report Products model
class VisitReportProduct(db.Model):
    __tablename__ = 'visit_report_products'
    
    id = db.Column(db.Integer, primary_key=True)
    visit_report_id = db.Column(db.Integer, db.ForeignKey('visit_reports.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    displayed_price = db.Column(db.Numeric(10, 2))  # Price shown in store
    nearly_expired = db.Column(db.Boolean, default=False)
    expiry_date = db.Column(db.Date)  # Only if nearly_expired = True
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VisitReportProduct {self.id}>'
