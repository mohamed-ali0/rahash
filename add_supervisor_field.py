#!/usr/bin/env python3
"""
Migration script to add supervisor_id field to users table
"""

from flask import Flask
from database.models import db
from sqlalchemy import text
import os

def add_supervisor_field():
    """Add supervisor_id column to users table"""
    # Create Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///business_management.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    
    with app.app_context():
        try:
            # First, create all tables if they don't exist
            db.create_all()
            print("✓ Database tables verified/created")
            
            # Check if column already exists
            result = db.session.execute(text(
                "SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='supervisor_id'"
            )).scalar()
            
            if result > 0:
                print("✓ supervisor_id column already exists")
                return
            
            # Add the column
            print("Adding supervisor_id column to users table...")
            db.session.execute(text(
                "ALTER TABLE users ADD COLUMN supervisor_id INTEGER REFERENCES users(id)"
            ))
            db.session.commit()
            print("✓ supervisor_id column added successfully")
            
            # Verify
            result = db.session.execute(text(
                "SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='supervisor_id'"
            )).scalar()
            
            if result > 0:
                print("✓ Migration verified successfully")
            else:
                print("✗ Migration verification failed")
                
        except Exception as e:
            print(f"✗ Error during migration: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    print("=" * 50)
    print("Database Migration: Add supervisor_id to users")
    print("=" * 50)
    add_supervisor_field()
    print("\n✓ Migration completed successfully!")

