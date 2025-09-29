#!/usr/bin/env python3
# Import clients from Excel sheet to Abdullah's database

import pandas as pd
import sqlite3
from datetime import datetime
import os
import sys

def import_clients():
    # Database connection - check both locations
    db_paths = ['business_management.db', 'instance/business_management.db']
    db_path = None
    
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("Database not found. Please run the Flask app first to create the database.")
        print("Looked for: " + ", ".join(db_paths))
        return
    
    print(f"Using database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Find Abdullah's user ID
        cursor.execute("SELECT id FROM users WHERE username = 'abdullah'")
        user_result = cursor.fetchone()
        
        if not user_result:
            print("User 'abdullah' not found in database.")
            return
        
        abdullah_id = user_result[0]
        print(f"Found Abdullah with user ID: {abdullah_id}")
        
        # Read Excel file
        try:
            # Try different file names that might exist
            possible_files = ['clients.xlsx', 'clients.xls', 'products.xlsx', 'products.xls']
            excel_file = None
            
            for filename in possible_files:
                if os.path.exists(filename):
                    excel_file = filename
                    break
            
            if not excel_file:
                print("Excel file not found. Looking for: clients.xlsx, clients.xls, products.xlsx, or products.xls")
                return
                
            print(f"Reading from: {excel_file}")
            
            # Read Excel file
            df = pd.read_excel(excel_file)
            print(f"Excel file loaded with {len(df)} rows and columns: {list(df.columns)}")
            
            # Check if columns J and L exist
            if len(df.columns) < 12:  # L is the 12th column (0-indexed = 11)
                print(f"Excel file doesn't have enough columns. Found {len(df.columns)} columns, need at least 12.")
                return
            
            # Get column J (region) and L (client name) - using 0-based indexing
            region_col = df.columns[9]   # J = 10th column = index 9
            name_col = df.columns[11]    # L = 12th column = index 11
            
            print(f"Using columns: {region_col} (region) and {name_col} (client name)")
            
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
                        print(f"Client '{client_name}' already exists for Abdullah. Skipping.")
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
                    print(f"Added client: {client_name} (Region: {region})")
                    
                except Exception as row_error:
                    print(f"Error processing row {index + 1}: {row_error}")
                    clients_skipped += 1
                    continue
            
            # Commit changes
            conn.commit()
            
            print(f"\nImport completed!")
            print(f"Clients added: {clients_added}")
            print(f"Clients skipped: {clients_skipped}")
            print(f"All clients assigned to user: abdullah (ID: {abdullah_id})")
            
        except Exception as excel_error:
            print(f"Error reading Excel file: {excel_error}")
            return
            
    except Exception as e:
        print(f"Database error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Client Import Tool")
    print("Reading from columns J (region) and L (client name)")
    print("Assigning to user: abdullah")
    print("-" * 50)
    
    import_clients()
