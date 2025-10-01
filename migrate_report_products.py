#!/usr/bin/env python3
"""
Migration script to update VisitReportProduct model:
- Rename 'nearly_expired' to 'expired_or_nearly_expired'
- Add 'units_count' field
- Migrate existing data
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Migrate the database schema and data"""
    
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
        
        # Check if the old column exists
        cursor.execute("PRAGMA table_info(visit_report_products)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'nearly_expired' in columns:
            print("Found 'nearly_expired' column, migrating data...")
            
            # Add the new column
            cursor.execute("ALTER TABLE visit_report_products ADD COLUMN expired_or_nearly_expired BOOLEAN DEFAULT 0")
            print("Added 'expired_or_nearly_expired' column")
            
            # Add units_count column
            cursor.execute("ALTER TABLE visit_report_products ADD COLUMN units_count INTEGER")
            print("Added 'units_count' column")
            
            # Migrate data from old column to new column
            cursor.execute("""
                UPDATE visit_report_products 
                SET expired_or_nearly_expired = nearly_expired
                WHERE nearly_expired IS NOT NULL
            """)
            print("Migrated data from 'nearly_expired' to 'expired_or_nearly_expired'")
            
            # Drop the old column (SQLite doesn't support DROP COLUMN directly)
            # We'll create a new table with the correct structure
            print("Recreating table with correct structure...")
            
            # Create new table with correct structure
            cursor.execute("""
                CREATE TABLE visit_report_products_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    visit_report_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    displayed_price NUMERIC(10, 2),
                    expired_or_nearly_expired BOOLEAN DEFAULT 0,
                    expiry_date DATE,
                    units_count INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (visit_report_id) REFERENCES visit_reports (id),
                    FOREIGN KEY (product_id) REFERENCES products (id)
                )
            """)
            
            # Copy data from old table to new table
            cursor.execute("""
                INSERT INTO visit_report_products_new 
                (id, visit_report_id, product_id, displayed_price, expired_or_nearly_expired, expiry_date, units_count, created_at)
                SELECT id, visit_report_id, product_id, displayed_price, expired_or_nearly_expired, expiry_date, units_count, created_at
                FROM visit_report_products
            """)
            
            # Drop old table
            cursor.execute("DROP TABLE visit_report_products")
            
            # Rename new table
            cursor.execute("ALTER TABLE visit_report_products_new RENAME TO visit_report_products")
            
            print("Table structure updated successfully")
            
        elif 'expired_or_nearly_expired' in columns:
            print("'expired_or_nearly_expired' column already exists")
            
            # Check if units_count exists
            if 'units_count' not in columns:
                cursor.execute("ALTER TABLE visit_report_products ADD COLUMN units_count INTEGER")
                print("Added 'units_count' column")
            else:
                print("'units_count' column already exists")
        else:
            print("Neither 'nearly_expired' nor 'expired_or_nearly_expired' found. Table structure may be different.")
            return False
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(visit_report_products)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Final table structure: {columns}")
        
        # Count records
        cursor.execute("SELECT COUNT(*) FROM visit_report_products")
        count = cursor.fetchone()[0]
        print(f"Total records in visit_report_products: {count}")
        
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting VisitReportProduct migration...")
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
