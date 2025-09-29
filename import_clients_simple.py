import os
import sys
import pandas as pd
from app import app
from database.models import db, User, Client, VisitReport

"""
Re-import clients for Abdullah from the Excel file in the root directory.
- Deletes Abdullah's clients and visit reports
- Imports from all sheets
- Columns mapping:
  L (index 11): client name
  J (index 9): region
  K (index 10): salesman name
  I (index 8): address
"""

EXCEL_PATH = os.path.join(os.getcwd(), 'clients.xlsx')

def main():
    if not os.path.exists(EXCEL_PATH):
        print('clients.xlsx not found in project root')
        sys.exit(1)

    with app.app_context():
        abdullah = User.query.filter_by(username='abdullah').first()
        if not abdullah:
            print('User "abdullah" not found')
            sys.exit(1)

        # Delete Abdullah's visit reports and clients
        reports = VisitReport.query.filter_by(user_id=abdullah.id).all()
        for r in reports:
            db.session.delete(r)

        clients = Client.query.filter_by(assigned_user_id=abdullah.id).all()
        for c in clients:
            db.session.delete(c)

        db.session.commit()

        # Read all sheets
        xls = pd.ExcelFile(EXCEL_PATH)
        total_added = 0
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name, header=0)

            # Safely access columns by index to avoid header name issues
            for _, row in df.iterrows():
                name = str(row.iloc[11]).strip() if len(row) > 11 and pd.notna(row.iloc[11]) else None
                region = str(row.iloc[9]).strip() if len(row) > 9 and pd.notna(row.iloc[9]) else None
                salesman_name = str(row.iloc[10]).strip() if len(row) > 10 and pd.notna(row.iloc[10]) else None
                address = str(row.iloc[8]).strip() if len(row) > 8 and pd.notna(row.iloc[8]) else None

                if not name:
                    continue

                client = Client(
                    name=name,
                    region=region,
                    salesman_name=salesman_name,
                    address=address,
                    assigned_user_id=abdullah.id
                )
                db.session.add(client)
                total_added += 1

        db.session.commit()
        print(f'Imported {total_added} clients for abdullah from {len(xls.sheet_names)} sheets')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# Simple client import script - avoid console encoding issues

import pandas as pd
import sqlite3
from datetime import datetime
import os

def import_clients():
    # Database connection
    db_path = 'instance/business_management.db'
    
    if not os.path.exists(db_path):
        print("Database not found.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Find Abdullah's user ID
        cursor.execute("SELECT id FROM users WHERE username = 'abdullah'")
        user_result = cursor.fetchone()
        
        if not user_result:
            print("User 'abdullah' not found.")
            return
        
        abdullah_id = user_result[0]
        print(f"Found Abdullah with user ID: {abdullah_id}")
        
        # Read Excel file
        df = pd.read_excel('clients.xlsx')
        print(f"Excel file loaded with {len(df)} rows")
        
        # Get column J (region) and L (client name) - using 0-based indexing
        region_col = df.columns[9]   # J = 10th column = index 9
        name_col = df.columns[11]    # L = 12th column = index 11
        
        clients_added = 0
        clients_skipped = 0
        
        for index, row in df.iterrows():
            try:
                client_name = str(row[name_col]).strip() if pd.notna(row[name_col]) else None
                region = str(row[region_col]).strip() if pd.notna(row[region_col]) else None
                
                # Skip if name is empty or invalid
                if not client_name or client_name.lower() in ['nan', 'none', '']:
                    clients_skipped += 1
                    continue
                
                # Check if client already exists for Abdullah
                cursor.execute("""
                    SELECT id FROM clients 
                    WHERE name = ? AND assigned_user_id = ?
                """, (client_name, abdullah_id))
                
                if cursor.fetchone():
                    clients_skipped += 1
                    continue
                
                # Insert client
                cursor.execute("""
                    INSERT INTO clients (
                        name, 
                        region, 
                        location, 
                        thumbnail, 
                        assigned_user_id,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    client_name,
                    region,
                    None,  # location - null for now
                    None,  # thumbnail - null for now
                    abdullah_id,
                    datetime.utcnow()
                ))
                
                clients_added += 1
                
                # Print progress every 10 clients without showing names
                if clients_added % 10 == 0:
                    print(f"Progress: {clients_added} clients processed...")
                
            except Exception:
                clients_skipped += 1
                continue
        
        # Commit changes
        conn.commit()
        
        print(f"\nImport completed!")
        print(f"Clients added: {clients_added}")
        print(f"Clients skipped: {clients_skipped}")
        
        # Verify the count
        cursor.execute("SELECT COUNT(*) FROM clients WHERE assigned_user_id = ?", (abdullah_id,))
        total_clients = cursor.fetchone()[0]
        print(f"Total clients for Abdullah: {total_clients}")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Client Import Tool (Simple)")
    print("Importing clients from Excel to Abdullah's database...")
    print("-" * 50)
    
    import_clients()
