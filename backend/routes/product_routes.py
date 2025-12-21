# Product Routes Blueprint - COMPLETE CRUD

from flask import Blueprint, request, jsonify
from backend.models import db, Product, ProductImage, UserRole
from backend.utils.auth import token_required
from sqlalchemy import text
import base64

product_bp = Blueprint('products', __name__, url_prefix='/api/products')

# ==================== GET ROUTES ====================

@product_bp.route('/list', methods=['GET'])
@token_required
def get_products_list(current_user):
    """Get products list with PAGINATION"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = Product.query
        total_count = query.count()
        products = query.order_by(Product.name).offset((page - 1) * per_page).limit(per_page).all()
        
        products_data = [{
            'id': p.id, 'name': p.name,
            'taxed_price_store': float(p.taxed_price_store) if p.taxed_price_store else 0.0,
            'untaxed_price_store': float(p.untaxed_price_store) if p.untaxed_price_store else 0.0,
            'taxed_price_client': float(p.taxed_price_client) if p.taxed_price_client else 0.0,
            'untaxed_price_client': float(p.untaxed_price_client) if p.untaxed_price_client else 0.0,
            'has_thumbnail': p.thumbnail is not None,
            'image_count': len(p.images) if p.images else 0,
            'can_edit': current_user.role == UserRole.SUPER_ADMIN
        } for p in products]
        
        return jsonify({'products': products_data, 'page': page, 'per_page': per_page, 'total': total_count, 'has_more': page * per_page < total_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch products', 'error': str(e)}), 500

@product_bp.route('/names', methods=['GET'])
@token_required
def get_product_names_only(current_user):
    """Get product IDs, names, and prices for dropdowns"""
    try:
        query = text("SELECT id, name, taxed_price_store, taxed_price_client FROM products ORDER BY name")
        result = db.session.execute(query).fetchall()
        products = [{'id': row[0], 'name': row[1], 'internal_price': float(row[2]) if row[2] else 0.0, 'client_price': float(row[3]) if row[3] else 0.0} for row in result]
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch product names', 'error': str(e)}), 500

@product_bp.route('/<int:product_id>', methods=['GET'])
@token_required
def get_single_product(current_user, product_id):
    """Get a single product with ALL details"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        additional_images = [{'id': img.id, 'filename': img.filename, 'data': base64.b64encode(img.image_data).decode('utf-8')} for img in product.images] if product.images else []
        
        return jsonify({
            'id': product.id, 'name': product.name,
            'taxed_price_store': float(product.taxed_price_store) if product.taxed_price_store else 0.0,
            'untaxed_price_store': float(product.untaxed_price_store) if product.untaxed_price_store else 0.0,
            'taxed_price_client': float(product.taxed_price_client) if product.taxed_price_client else 0.0,
            'untaxed_price_client': float(product.untaxed_price_client) if product.untaxed_price_client else 0.0,
            'thumbnail': base64.b64encode(product.thumbnail).decode('utf-8') if product.thumbnail else None,
            'images': additional_images, 'image_count': len(additional_images),
            'created_at': product.created_at.isoformat() if product.created_at else None,
            'can_edit': current_user.role == UserRole.SUPER_ADMIN
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch product', 'error': str(e)}), 500

@product_bp.route('/<int:product_id>/thumbnail', methods=['GET'])
@token_required
def get_product_thumbnail(current_user, product_id):
    """Get ONLY thumbnail for a specific product"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        thumbnail = base64.b64encode(product.thumbnail).decode('utf-8') if product.thumbnail else None
        return jsonify({'thumbnail': thumbnail}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch thumbnail', 'error': str(e)}), 500

@product_bp.route('/<int:product_id>/images', methods=['GET'])
@token_required
def get_product_images(current_user, product_id):
    """Get only images for a specific product - for lazy loading"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        additional_images = [{'id': img.id, 'filename': img.filename, 'data': base64.b64encode(img.image_data).decode('utf-8')} for img in product.images] if product.images else []
        return jsonify({'images': additional_images}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch product images', 'error': str(e)}), 500

# ==================== CREATE ROUTE ====================

@product_bp.route('', methods=['POST'])
@token_required
def create_product(current_user):
    """Create a new product (super admin only)"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can create products'}), 403
        
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'message': 'Product name is required'}), 400
        
        product = Product(
            name=data['name'],
            taxed_price_store=data.get('taxed_price_store'),
            untaxed_price_store=data.get('untaxed_price_store'),
            taxed_price_client=data.get('taxed_price_client'),
            untaxed_price_client=data.get('untaxed_price_client')
        )
        
        if 'thumbnail' in data and data['thumbnail']:
            try:
                product.thumbnail = base64.b64decode(data['thumbnail'])
            except:
                pass
        
        db.session.add(product)
        db.session.flush()
        
        # Handle additional images
        if 'additional_images' in data and data['additional_images']:
            for img_data in data['additional_images']:
                if img_data.get('data'):
                    try:
                        img = ProductImage(product_id=product.id, image_data=base64.b64decode(img_data['data']), filename=img_data.get('filename', 'image.jpg'))
                        db.session.add(img)
                    except:
                        pass
        
        db.session.commit()
        return jsonify({'message': 'Product created successfully', 'product_id': product.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create product', 'error': str(e)}), 500

# ==================== UPDATE ROUTE ====================

@product_bp.route('/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    """Update a product (super admin only)"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can edit products'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data: product.name = data['name']
        if 'taxed_price_store' in data: product.taxed_price_store = data['taxed_price_store']
        if 'untaxed_price_store' in data: product.untaxed_price_store = data['untaxed_price_store']
        if 'taxed_price_client' in data: product.taxed_price_client = data['taxed_price_client']
        if 'untaxed_price_client' in data: product.untaxed_price_client = data['untaxed_price_client']
        
        if 'thumbnail' in data and data['thumbnail']:
            try:
                product.thumbnail = base64.b64decode(data['thumbnail'])
            except:
                pass
        
        # Handle additional images
        if 'additional_images' in data and data['additional_images']:
            for img_data in data['additional_images']:
                if img_data.get('data'):
                    try:
                        img = ProductImage(product_id=product.id, image_data=base64.b64decode(img_data['data']), filename=img_data.get('filename', 'image.jpg'))
                        db.session.add(img)
                    except:
                        pass
        
        db.session.commit()
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update product', 'error': str(e)}), 500

# ==================== DELETE ROUTE ====================

@product_bp.route('/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    """Delete a product (super admin only)"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can delete products'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        # Delete associated images first
        for img in product.images:
            db.session.delete(img)
        
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete product', 'error': str(e)}), 500

# ==================== SEARCH ROUTE ====================

@product_bp.route('/search', methods=['GET'])
@token_required
def search_products(current_user):
    """Search products by name"""
    try:
        search_term = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = Product.query
        if search_term:
            query = query.filter(Product.name.ilike(f'%{search_term}%'))
        
        total_count = query.count()
        products = query.order_by(Product.name).offset((page - 1) * per_page).limit(per_page).all()
        
        products_data = [{
            'id': p.id, 'name': p.name,
            'taxed_price_store': float(p.taxed_price_store) if p.taxed_price_store else 0.0,
            'taxed_price_client': float(p.taxed_price_client) if p.taxed_price_client else 0.0,
            'has_thumbnail': p.thumbnail is not None,
            'image_count': len(p.images) if p.images else 0
        } for p in products]
        
        return jsonify({'products': products_data, 'page': page, 'per_page': per_page, 'total': total_count, 'has_more': page * per_page < total_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to search products', 'error': str(e)}), 500

# ==================== IMAGE DELETE ROUTE ====================

@product_bp.route('/<int:product_id>/images/<int:image_id>', methods=['DELETE'])
@token_required
def delete_product_image(current_user, product_id, image_id):
    """Delete a specific product image"""
    try:
        if current_user.role != UserRole.SUPER_ADMIN:
            return jsonify({'message': 'Only super admin can delete images'}), 403
        
        image = ProductImage.query.get(image_id)
        if not image or image.product_id != product_id:
            return jsonify({'message': 'Image not found'}), 404
        
        db.session.delete(image)
        db.session.commit()
        return jsonify({'message': 'Image deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete image', 'error': str(e)}), 500
