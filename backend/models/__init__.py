# Models package - exports all models

from backend.models.user import db, User, UserRole
from backend.models.client import Person, Client, ClientImage
from backend.models.product import Product, ProductImage
from backend.models.visit_report import VisitReport, VisitReportImage, VisitReportNote, VisitReportProduct
from backend.models.system_setting import SystemSetting

__all__ = [
    'db',
    'User',
    'UserRole',
    'Person',
    'Client',
    'ClientImage',
    'Product',
    'ProductImage',
    'VisitReport',
    'VisitReportImage',
    'VisitReportNote',
    'VisitReportProduct',
    'SystemSetting'
]
