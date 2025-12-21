# Client, Person, and ClientImage Models

from backend.models.user import db
from datetime import datetime

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

class ClientImage(db.Model):
    __tablename__ = 'client_images'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ClientImage {self.filename}>'
