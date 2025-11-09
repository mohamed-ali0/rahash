#!/usr/bin/env python3
"""
ROLLBACK script to remove shared_with_salesman_id field from clients table.

This will undo the migration and restore the original structure.
"""

import sqlite3
import os

def rollback_database():
    """Remove shared_with_salesman_id field from clients table"""
    # Check both locations: root and instance folder
    db_paths = ['business_management.db', 'instance/business_management.db']
    db_path = None
    
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print(f"Error: Database file not found in: {db_paths}")
        return False
    
    print(f"Found database at: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("ROLLING BACK SHARED_WITH_SALESMAN_ID MIGRATION")
        print("=" * 60)
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(clients)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'shared_with_salesman_id' not in columns:
            print("✓ Column 'shared_with_salesman_id' does not exist - nothing to rollback!")
            return True
        
        print("\n⚠️  WARNING: SQLite does not support DROP COLUMN directly.")
        print("We need to recreate the table without this column.")
        print("This is a safe operation but will take a moment...\n")
        
        # Step 1: Create new table without shared_with_salesman_id
        print("1. Creating new table structure...")
        cursor.execute("""
            CREATE TABLE clients_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                region VARCHAR(255),
                location TEXT,
                address TEXT,
                salesman_name VARCHAR(255),
                thumbnail BLOB,
                is_active BOOLEAN DEFAULT 1,
                owner_id INTEGER,
                purchasing_manager_id INTEGER,
                accountant_id INTEGER,
                assigned_user_id INTEGER NOT NULL,
                created_at DATETIME,
                FOREIGN KEY (owner_id) REFERENCES persons(id),
                FOREIGN KEY (purchasing_manager_id) REFERENCES persons(id),
                FOREIGN KEY (accountant_id) REFERENCES persons(id),
                FOREIGN KEY (assigned_user_id) REFERENCES users(id)
            )
        """)
        print("✓ New table created")
        
        # Step 2: Copy data (excluding shared_with_salesman_id)
        print("\n2. Copying data...")
        cursor.execute("""
            INSERT INTO clients_new 
            SELECT id, name, region, location, address, salesman_name, thumbnail, 
                   is_active, owner_id, purchasing_manager_id, accountant_id, 
                   assigned_user_id, created_at
            FROM clients
        """)
        rows_copied = cursor.rowcount
        print(f"✓ Copied {rows_copied} rows")
        
        # Step 3: Drop old table
        print("\n3. Removing old table...")
        cursor.execute("DROP TABLE clients")
        print("✓ Old table removed")
        
        # Step 4: Rename new table
        print("\n4. Renaming new table...")
        cursor.execute("ALTER TABLE clients_new RENAME TO clients")
        print("✓ Table renamed")
        
        # Step 5: Recreate indexes
        print("\n5. Recreating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_clients_assigned_user ON clients(assigned_user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_clients_region ON clients(region)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active)")
        print("✓ Indexes recreated")
        
        # Verify the changes
        print("\n6. Verifying changes...")
        cursor.execute("PRAGMA table_info(clients)")
        columns = cursor.fetchall()
        
        print("\nCurrent clients table schema:")
        print("-" * 60)
        for col in columns:
            print(f"  {col[1]:30} {col[2]:15} {'NOT NULL' if col[3] else 'NULL':10}")
        print("-" * 60)
        
        # Commit changes
        conn.commit()
        print("\n✓ Rollback completed successfully!")
        print("\nThe 'shared_with_salesman_id' field has been removed.")
        print("You can now revert the code changes and use the old logic.")
        
        return True
        
    except sqlite3.Error as e:
        print(f"\n✗ Error during rollback: {e}")
        conn.rollback()
        return False
        
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("ROLLBACK CLIENT SHARING FIELD MIGRATION")
    print("=" * 60)
    print("\n⚠️  WARNING: This will REMOVE 'shared_with_salesman_id' from clients table.")
    print("Make sure you have a backup before proceeding!\n")
    
    response = input("Type 'ROLLBACK' to continue or anything else to cancel: ")
    
    if response.strip().upper() == 'ROLLBACK':
        success = rollback_database()
        
        if success:
            print("\n" + "=" * 60)
            print("✓ ROLLBACK SUCCESSFUL!")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Revert code changes in database/models.py and app.py")
            print("2. Restart your Flask application")
        else:
            print("\n" + "=" * 60)
            print("✗ ROLLBACK FAILED!")
            print("=" * 60)
            print("\nPlease restore from backup if available.")
    else:
        print("\nRollback cancelled.")
    
    print()

