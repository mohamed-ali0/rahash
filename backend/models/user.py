# User Model

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum

db = SQLAlchemy()  # Create db instance here

class UserRole(Enum):
    SUPER_ADMIN = 'super_admin'
    SALES_SUPERVISOR = 'sales_supervisor'
    SALESMAN = 'salesman'

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    clients = db.relationship('Client', back_populates='assigned_user', lazy=True)
    visit_reports = db.relationship('VisitReport', backref='user', lazy=True)
    
    # Supervisor-Salesman relationship
    salesmen = db.relationship('User', backref=db.backref('supervisor', remote_side=[id]), lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'
