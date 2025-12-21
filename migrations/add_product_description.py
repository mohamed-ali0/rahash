"""
Migration Script: Add description column to products table
Run this script ONCE to add the description column to existing database.

Usage: python migrations/add_product_description.py
"""

import sqlite3
import os
import sys

# Add parent directory to path to access config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def migrate():
    """Add description column to products table if it doesn't exist"""
    
    # Database path (relative to project root)
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance', 'business_management.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    print(f"📂 Database path: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(products)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'description' in columns:
            print("✅ Column 'description' already exists in products table. No migration needed.")
            conn.close()
            return True
        
        # Add the description column
        print("🔄 Adding 'description' column to products table...")
        cursor.execute("ALTER TABLE products ADD COLUMN description TEXT")
        
        conn.commit()
        print("✅ Migration successful! 'description' column added to products table.")
        
        # Verify
        cursor.execute("PRAGMA table_info(products)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"📋 Current products table columns: {columns}")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ SQLite error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Running Migration: Add Product Description Column")
    print("=" * 60)
    
    success = migrate()
    
    print("=" * 60)
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")
    print("=" * 60)
