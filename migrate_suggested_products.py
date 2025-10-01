#!/usr/bin/env python3
"""
Migration script to add is_suggested_products field to VisitReportImage model
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Migrate the database schema to add is_suggested_products field"""
    
    # Database path
    db_path = 'instance/business_management.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    # Backup the database
    backup_path = f'instance/business_management_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
    print(f"Creating backup at {backup_path}")
    
    try:
        # Create backup
        with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
            dst.write(src.read())
        print("Backup created successfully")
    except Exception as e:
        print(f"Failed to create backup: {e}")
        return False
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting migration...")
        
        # Check if the field already exists
        cursor.execute("PRAGMA table_info(visit_report_images)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_suggested_products' not in columns:
            print("Adding 'is_suggested_products' field to visit_report_images table...")
            
            # Add the new column
            cursor.execute("ALTER TABLE visit_report_images ADD COLUMN is_suggested_products BOOLEAN DEFAULT 0")
            print("Added 'is_suggested_products' column")
            
        else:
            print("'is_suggested_products' column already exists")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(visit_report_images)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Final table structure: {columns}")
        
        # Count records
        cursor.execute("SELECT COUNT(*) FROM visit_report_images")
        count = cursor.fetchone()[0]
        print(f"Total records in visit_report_images: {count}")
        
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting VisitReportImage migration...")
    print("=" * 50)
    
    success = migrate_database()
    
    print("=" * 50)
    if success:
        print("Migration completed successfully!")
        print("You can now start the application with the updated schema.")
    else:
        print("Migration failed!")
        print("Check the error messages above and try again.")
        print("You can restore from the backup if needed.")
