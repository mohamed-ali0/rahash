# Backend Configuration

from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = 'your-secret-key-here-change-in-production'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///business_management.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-string'  # Change in production
    JWT_TOKEN_EXPIRATION = timedelta(days=1)
    
    # Admin password for user registration
    ADMIN_PASSWORD = 'sYzAZPZd'
