#!/usr/bin/env python3
"""
Migration script to add shared_with_salesman_id field to clients table.

This field allows supervisors to share clients with salesmen while maintaining ownership:
- assigned_user_id = The supervisor who owns the client (full access)
- shared_with_salesman_id = The salesman who can VIEW the client (read-only)
- salesman_name = Display field (remains unchanged)

Run this script once to update your database schema.
"""

import sqlite3
import os

def migrate_database():
    """Add shared_with_salesman_id field to clients table"""
    db_path = 'sales_system.db'
    
    if not os.path.exists(db_path):
        print(f"Error: Database file '{db_path}' not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("ADDING SHARED_WITH_SALESMAN_ID FIELD TO CLIENTS TABLE")
        print("=" * 60)
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(clients)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'shared_with_salesman_id' in columns:
            print("✓ Column 'shared_with_salesman_id' already exists!")
            return True
        
        # Add the new column
        print("\n1. Adding 'shared_with_salesman_id' column...")
        cursor.execute("""
            ALTER TABLE clients 
            ADD COLUMN shared_with_salesman_id INTEGER
        """)
        print("✓ Column added successfully!")
        
        # Create index for better query performance
        print("\n2. Creating index for faster queries...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_clients_shared_salesman 
            ON clients(shared_with_salesman_id)
        """)
        print("✓ Index created successfully!")
        
        # Verify the changes
        print("\n3. Verifying changes...")
        cursor.execute("PRAGMA table_info(clients)")
        columns = cursor.fetchall()
        
        print("\nCurrent clients table schema:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[1]:30} {col[2]:15} {'NOT NULL' if col[3] else 'NULL':10}")
        print("-" * 60)
        
        # Commit changes
        conn.commit()
        print("\n✓ Migration completed successfully!")
        print("\nNEW BUSINESS LOGIC:")
        print("- assigned_user_id = Supervisor (owner, full access)")
        print("- shared_with_salesman_id = Salesman (viewer, read-only)")
        print("- salesman_name = Display field (unchanged)")
        
        return True
        
    except sqlite3.Error as e:
        print(f"\n✗ Error during migration: {e}")
        conn.rollback()
        return False
        
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("CLIENT SHARING FIELD MIGRATION")
    print("=" * 60)
    print("\nThis will add 'shared_with_salesman_id' to the clients table.")
    print("This allows supervisors to share clients with salesmen.\n")
    
    input("Press ENTER to continue or Ctrl+C to cancel...")
    
    success = migrate_database()
    
    if success:
        print("\n" + "=" * 60)
        print("✓ MIGRATION SUCCESSFUL!")
        print("=" * 60)
        print("\nYou can now restart your Flask application.")
    else:
        print("\n" + "=" * 60)
        print("✗ MIGRATION FAILED!")
        print("=" * 60)
        print("\nPlease check the error messages above.")
    
    print()

