# Visit Report Models

from backend.models.user import db
from datetime import datetime

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

class VisitReportImage(db.Model):
    __tablename__ = 'visit_report_images'
    
    id = db.Column(db.Integer, primary_key=True)
    visit_report_id = db.Column(db.Integer, db.ForeignKey('visit_reports.id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    filename = db.Column(db.String(255))
    is_suggested_products = db.Column(db.Boolean, default=False)  # Flag for suggested products images
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VisitReportImage {self.filename}>'

class VisitReportNote(db.Model):
    __tablename__ = 'visit_report_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    visit_report_id = db.Column(db.Integer, db.ForeignKey('visit_reports.id'), nullable=False)
    note_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VisitReportNote {self.id}>'

class VisitReportProduct(db.Model):
    __tablename__ = 'visit_report_products'
    
    id = db.Column(db.Integer, primary_key=True)
    visit_report_id = db.Column(db.Integer, db.ForeignKey('visit_reports.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    displayed_price = db.Column(db.Numeric(10, 2))  # Price shown in store
    expired_or_nearly_expired = db.Column(db.Boolean, default=False)
    expiry_date = db.Column(db.Date)  # Only if expired_or_nearly_expired = True
    units_count = db.Column(db.Integer)  # Number of units - required if expired_or_nearly_expired = True
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<VisitReportProduct {self.id}>'
