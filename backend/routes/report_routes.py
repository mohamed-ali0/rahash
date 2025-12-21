# Report Routes Blueprint - COMPLETE CRUD

from flask import Blueprint, request, jsonify
from backend.models import db, VisitReport, VisitReportImage, VisitReportNote, VisitReportProduct, Client, Product, User, UserRole
from backend.utils.auth import token_required
from datetime import datetime
import base64

report_bp = Blueprint('reports', __name__, url_prefix='/api/visit-reports')

# ==================== GET ROUTES ====================

@report_bp.route('/list', methods=['GET'])
@token_required
def get_reports_list(current_user):
    """Get visit reports list with PAGINATION"""
    try:
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 15))
        
        if current_user.role == UserRole.SUPER_ADMIN:
            query = VisitReport.query if show_all else VisitReport.query.filter_by(is_active=True)
        elif current_user.role == UserRole.SALES_SUPERVISOR:
            salesmen = User.query.filter_by(supervisor_id=current_user.id, role=UserRole.SALESMAN).all()
            salesman_ids = [s.id for s in salesmen] + [current_user.id]
            query = VisitReport.query.filter(VisitReport.user_id.in_(salesman_ids))
            if not show_all:
                query = query.filter(VisitReport.is_active == True)
        else:
            query = VisitReport.query.filter_by(user_id=current_user.id)
            if not show_all:
                query = query.filter_by(is_active=True)
        
        total_count = query.count()
        reports = query.order_by(VisitReport.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        
        reports_data = []
        for report in reports:
            try:
                notes = [{'id': n.id, 'note_text': n.note_text, 'created_at': n.created_at.isoformat()} for n in report.notes] if report.notes else []
                products = []
                for rp in (report.products or []):
                    try:
                        p = {'id': rp.id, 'product_id': rp.product_id, 'product_name': rp.product.name if rp.product else 'Unknown',
                             'displayed_price': float(rp.displayed_price) if rp.displayed_price else None,
                             'nearly_expired': getattr(rp, 'expired_or_nearly_expired', False),
                             'expiry_date': rp.expiry_date.isoformat() if rp.expiry_date else None,
                             'units_count': getattr(rp, 'units_count', None)}
                        if rp.product:
                            p.update({'taxed_price_store': float(rp.product.taxed_price_store) if rp.product.taxed_price_store else None})
                        products.append(p)
                    except:
                        pass
                
                reports_data.append({
                    'id': report.id, 'client_id': report.client_id,
                    'client_name': report.client.name if report.client else 'Unknown',
                    'user_id': report.user_id, 'username': report.user.username if report.user else 'Unknown',
                    'visit_date': report.visit_date.isoformat(), 'created_at': report.created_at.isoformat(),
                    'notes': notes, 'products': products,
                    'can_edit': current_user.role == UserRole.SUPER_ADMIN or report.user_id == current_user.id,
                    'is_active': report.is_active, 'image_count': len(report.images) if report.images else 0
                })
            except Exception as e:
                print(f"Error processing report {report.id}: {e}")
        
        return jsonify({'reports': reports_data, 'page': page, 'per_page': per_page, 'total': total_count, 'has_more': page * per_page < total_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch reports', 'error': str(e)}), 500

@report_bp.route('/<int:report_id>', methods=['GET'])
@token_required
def get_single_report(current_user, report_id):
    """Get a single visit report with ALL details"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Report not found'}), 404
        
        # Permission check
        allowed = current_user.role == UserRole.SUPER_ADMIN or report.user_id == current_user.id
        if not allowed and current_user.role == UserRole.SALES_SUPERVISOR:
            creator = User.query.get(report.user_id)
            if creator and creator.supervisor_id == current_user.id:
                allowed = True
        if not allowed:
            return jsonify({'message': 'Permission denied'}), 403
        
        images = [{'id': img.id, 'filename': img.filename, 'data': base64.b64encode(img.image_data).decode('utf-8'), 'is_suggested_products': getattr(img, 'is_suggested_products', False)} for img in (report.images or [])]
        notes = [{'id': n.id, 'note_text': n.note_text} for n in (report.notes or [])]
        products = [{'id': p.id, 'product_id': p.product_id, 'product_name': p.product.name if p.product else 'Unknown', 'displayed_price': float(p.displayed_price) if p.displayed_price else None} for p in (report.products or [])]
        
        return jsonify({
            'id': report.id, 'client_id': report.client_id,
            'client_name': report.client.name if report.client else 'Unknown',
            'visit_date': report.visit_date.isoformat(), 'created_at': report.created_at.isoformat(),
            'is_active': report.is_active, 'images': images, 'notes': notes, 'products': products
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch report', 'error': str(e)}), 500

@report_bp.route('/<int:report_id>/images', methods=['GET'])
@token_required
def get_report_images(current_user, report_id):
    """Get only images for a specific visit report"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Report not found'}), 404
        
        images = [{'id': img.id, 'filename': img.filename, 'data': base64.b64encode(img.image_data).decode('utf-8'), 'is_suggested_products': getattr(img, 'is_suggested_products', False)} for img in (report.images or [])]
        return jsonify({'images': images}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch images', 'error': str(e)}), 500

@report_bp.route('/<int:report_id>/html', methods=['GET'])
def get_report_html(report_id):
    """Get report as HTML for print preview (token via query param)"""
    import jwt
    import json
    from flask import current_app
    
    try:
        # Get token from query parameter since this is opened in a new window
        token = request.args.get('token')
        if not token:
            return "Unauthorized - Token missing", 401
        
        # Verify token
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return "Unauthorized - Invalid token", 401
        except Exception as e:
            print(f"Token decode error: {e}")
            return "Unauthorized - Invalid token", 401
        
        report = VisitReport.query.get(report_id)
        if not report:
            return "Report not found", 404
        
        # Check permission
        if current_user.role == UserRole.SUPER_ADMIN:
            pass
        elif report.user_id == current_user.id:
            pass
        elif current_user.role == UserRole.SALES_SUPERVISOR:
            report_creator = User.query.get(report.user_id)
            if not report_creator or report_creator.supervisor_id != current_user.id:
                return "Permission denied", 403
        else:
            return "Permission denied", 403
        
        # Choose template based on report creator's role
        report_creator = User.query.get(report.user_id)
        if report_creator and report_creator.role == UserRole.SALESMAN:
            template_file = 'templates/visit_report_salesman.html'
        else:
            template_file = 'templates/visit_report.html'
        
        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
        except FileNotFoundError:
            # Fallback to simple HTML if template not found
            return generate_simple_html(report), 200, {'Content-Type': 'text/html; charset=utf-8'}
        
        # Load price tolerance from settings
        try:
            with open('sys_settings.json', 'r', encoding='utf-8') as f:
                settings = json.load(f)
                price_tolerance = float(settings.get('price_tolerance', {}).get('value', 1.0))
        except:
            price_tolerance = 1.0
        
        # Prepare report data
        report_data = {
            'client_name': report.client.name if report.client else 'غير محدد',
            'client_address': report.client.address if (report.client and hasattr(report.client, 'address') and report.client.address) else '-',
            'client_phone': report.client.owner.phone if (report.client and report.client.owner and report.client.owner.phone) else '-',
            'visit_date': report.visit_date.strftime('%Y/%m/%d'),
            'salesman_name': report.user.username if report.user else 'غير محدد',
            'notes': '\\n'.join([note.note_text for note in report.notes]) if report.notes else '',
            'images': [],
            'products': [],
            'price_tolerance': price_tolerance
        }
        
        # Add images
        for img in (report.images or []):
            if img.image_data:
                report_data['images'].append({
                    'data': base64.b64encode(img.image_data).decode('utf-8'),
                    'is_suggested_products': getattr(img, 'is_suggested_products', False)
                })
        
        # Add products
        for rp in (report.products or []):
            our_price_value = float(rp.product.taxed_price_store) if rp.product and rp.product.taxed_price_store else None
            displayed_price_value = float(rp.displayed_price) if rp.displayed_price else None
            
            report_data['products'].append({
                'name': rp.product.name if rp.product else 'منتج غير محدد',
                'our_price': f"{our_price_value:.2f} ريال" if our_price_value is not None else 'غير محدد',
                'our_price_raw': our_price_value,
                'displayed_price': f"{displayed_price_value:.2f} ريال" if displayed_price_value is not None else 'غير محدد',
                'displayed_price_raw': displayed_price_value,
                'nearly_expired': getattr(rp, 'expired_or_nearly_expired', False),
                'expiry_date': rp.expiry_date.strftime('%Y/%m/%d') if rp.expiry_date else '',
                'units_count': getattr(rp, 'units_count', None)
            })
        
        # Inject data script
        data_script = f"""
        <script>
            window.addEventListener('DOMContentLoaded', function() {{
                const reportData = {json.dumps(report_data, ensure_ascii=False)};
                if (typeof populateReport === 'function') {{
                    populateReport(reportData);
                }}
            }});
        </script>
        """
        
        html_content = html_content.replace('</body>', data_script + '</body>')
        return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}
        
    except Exception as e:
        print(f"Error serving HTML report: {e}")
        return f"Error loading report: {str(e)}", 500

def generate_simple_html(report):
    """Generate simple HTML when template is not available"""
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>تقرير الزيارة</title>
    <style>body{{font-family:Arial,sans-serif;direction:rtl;padding:20px;}}h1{{color:#333;}}.section{{margin:20px 0;}}ul{{list-style-type:disc;}}</style></head>
    <body><h1>تقرير الزيارة</h1>
    <p><strong>العميل:</strong> {report.client.name if report.client else 'Unknown'}</p>
    <p><strong>تاريخ الزيارة:</strong> {report.visit_date.strftime('%Y-%m-%d')}</p>"""
    
    if report.notes:
        html += "<div class='section'><h2>الملاحظات:</h2><ul>"
        for note in report.notes:
            html += f"<li>{note.note_text}</li>"
        html += "</ul></div>"
    
    if report.products:
        html += "<div class='section'><h2>المنتجات:</h2><ul>"
        for p in report.products:
            html += f"<li>{p.product.name if p.product else 'Unknown'}"
            if p.displayed_price:
                html += f" - السعر: {p.displayed_price}"
            html += "</li>"
        html += "</ul></div>"
    
    html += "<script>window.print();</script></body></html>"
    return html


# ==================== CREATE ROUTE ====================

@report_bp.route('', methods=['POST'])
@token_required
def create_report(current_user):
    """Create a new visit report"""
    try:
        data = request.get_json()
        
        if not data.get('client_id'):
            return jsonify({'message': 'Client ID is required'}), 400
        if not data.get('visit_date'):
            return jsonify({'message': 'Visit date is required'}), 400
        
        client = Client.query.get(data['client_id'])
        if not client:
            return jsonify({'message': 'Client not found'}), 404
        
        report = VisitReport(
            client_id=data['client_id'],
            user_id=current_user.id,
            visit_date=datetime.strptime(data['visit_date'], '%Y-%m-%d').date()
        )
        
        db.session.add(report)
        db.session.flush()
        
        # Handle images
        for img_data in (data.get('images') or []):
            if img_data.get('data'):
                try:
                    img = VisitReportImage(visit_report_id=report.id, image_data=base64.b64decode(img_data['data']),
                        filename=img_data.get('filename', 'image.jpg'), is_suggested_products=img_data.get('is_suggested_products', False))
                    db.session.add(img)
                except:
                    pass
        
        # Handle notes
        for note_text in (data.get('notes') or []):
            if note_text and note_text.strip():
                note = VisitReportNote(visit_report_id=report.id, note_text=note_text.strip())
                db.session.add(note)
        
        # Handle products
        for p_data in (data.get('products') or []):
            if p_data.get('product_id'):
                rp = VisitReportProduct(
                    visit_report_id=report.id, product_id=p_data['product_id'],
                    displayed_price=p_data.get('displayed_price'),
                    expired_or_nearly_expired=p_data.get('nearly_expired', False),
                    expiry_date=datetime.strptime(p_data['expiry_date'], '%Y-%m-%d').date() if p_data.get('expiry_date') else None,
                    units_count=p_data.get('units_count')
                )
                db.session.add(rp)
        
        db.session.commit()
        return jsonify({'message': 'Report created successfully', 'report_id': report.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create report', 'error': str(e)}), 500

# ==================== UPDATE ROUTE ====================

@report_bp.route('/<int:report_id>', methods=['PUT'])
@token_required
def update_report(current_user, report_id):
    """Update a visit report"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Report not found'}), 404
        
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        data = request.get_json()
        
        if 'visit_date' in data:
            report.visit_date = datetime.strptime(data['visit_date'], '%Y-%m-%d').date()
        
        # Handle new images
        for img_data in (data.get('images') or []):
            if img_data.get('data') and not img_data.get('id'):
                try:
                    img = VisitReportImage(visit_report_id=report.id, image_data=base64.b64decode(img_data['data']),
                        filename=img_data.get('filename', 'image.jpg'))
                    db.session.add(img)
                except:
                    pass
        
        # Handle new notes
        for note_text in (data.get('notes') or []):
            if isinstance(note_text, str) and note_text.strip():
                note = VisitReportNote(visit_report_id=report.id, note_text=note_text.strip())
                db.session.add(note)
        
        db.session.commit()
        return jsonify({'message': 'Report updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update report', 'error': str(e)}), 500

# ==================== DELETE ROUTE ====================

@report_bp.route('/<int:report_id>', methods=['DELETE'])
@token_required
def deactivate_report(current_user, report_id):
    """Deactivate a visit report (soft delete)"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Report not found'}), 404
        
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        report.is_active = False
        db.session.commit()
        return jsonify({'message': 'Report deactivated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to delete report', 'error': str(e)}), 500

@report_bp.route('/<int:report_id>/reactivate', methods=['PUT'])
@token_required
def reactivate_report(current_user, report_id):
    """Reactivate a deactivated report"""
    try:
        report = VisitReport.query.get(report_id)
        if not report:
            return jsonify({'message': 'Report not found'}), 404
        
        if current_user.role != UserRole.SUPER_ADMIN and report.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403
        
        report.is_active = True
        db.session.commit()
        return jsonify({'message': 'Report reactivated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to reactivate report', 'error': str(e)}), 500

# ==================== SEARCH ROUTE ====================

@report_bp.route('/search', methods=['GET'])
@token_required
def search_reports(current_user):
    """Search reports by client name"""
    try:
        search_term = request.args.get('q', '').strip()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 15))
        show_all = request.args.get('show_all', 'false').lower() == 'true'
        
        if current_user.role == UserRole.SUPER_ADMIN:
            query = VisitReport.query if show_all else VisitReport.query.filter_by(is_active=True)
        else:
            query = VisitReport.query.filter_by(user_id=current_user.id)
            if not show_all:
                query = query.filter_by(is_active=True)
        
        if search_term:
            query = query.join(Client).filter(Client.name.ilike(f'%{search_term}%'))
        
        total_count = query.count()
        reports = query.order_by(VisitReport.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        
        reports_data = [{'id': r.id, 'client_name': r.client.name if r.client else 'Unknown',
            'visit_date': r.visit_date.isoformat(), 'is_active': r.is_active} for r in reports]
        
        return jsonify({'reports': reports_data, 'page': page, 'per_page': per_page, 'total': total_count, 'has_more': page * per_page < total_count}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to search reports', 'error': str(e)}), 500
