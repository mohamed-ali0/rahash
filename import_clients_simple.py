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
