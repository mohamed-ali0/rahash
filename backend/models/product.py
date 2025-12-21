# Product and ProductImage Models

from backend.models.user import db
from datetime import datetime

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

class ProductImage(db.Model):
    __tablename__ = 'product_images'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    image_data = db.Column(db.LargeBinary, nullable=False)
    filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ProductImage {self.filename}>'
