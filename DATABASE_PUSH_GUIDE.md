# Database Push Strategy Guide

## Current Configuration

The `.gitignore` file is configured to **TRACK and PUSH** the main database file to the repository.

### What is Tracked:
- ✅ `instance/business_management.db` - Main database (WILL BE PUSHED)
- ✅ All code files (Python, HTML, CSS, JavaScript)
- ✅ Templates folder
- ✅ Configuration files

### What is Ignored:
- ❌ `instance/*_backup_*.db` - Backup database files
- ❌ `instance/*.bak` - Backup files
- ❌ `*.sqlite` and `*.sqlite3` - Other database formats (not used)
- ❌ `__pycache__/` - Python cache
- ❌ Virtual environments (`venv/`, `env/`)
- ❌ IDE folders (`.vscode/`, `.idea/`)
- ❌ Excel temporary files (`~$*.xlsx`)
- ❌ Log files (`*.log`)

## How to Push Changes Safely

### 1. Normal Code Changes (No Database Changes)
```bash
git add .
git commit -m "Your commit message"
git push origin master
```
**Safe**: Code changes only, database remains unchanged on server

### 2. Pushing WITH Database Changes
```bash
# Stage all changes including database
git add .
git add instance/business_management.db

# Commit with descriptive message
git commit -m "Update database with new clients/reports/products"

# Push to server (will overwrite server database)
git push origin master
```
**Warning**: This will OVERWRITE the server's database with your local one

### 3. Pulling Changes from Server
```bash
# Pull latest changes
git pull origin master
```
**Warning**: If database was pushed, your local database will be overwritten

## Important Notes

### ⚠️ When Database is Pushed:
- Your local database OVERWRITES the server database
- Any data added on server since last pull will be LOST
- All users will see your local database state

### ✅ Best Practices:
1. **Coordinate with team** before pushing database changes
2. **Backup server database** before pulling if it has important data
3. **Use migrations** for schema changes instead of pushing entire database
4. Consider pulling before making local changes to stay in sync

### 🔄 Database Sync Workflow:
```bash
# Before starting work
git pull origin master  # Get latest including database

# Work locally, make changes

# Before pushing
# Make sure your database has all the data you want on server

# Push changes
git add .
git commit -m "Your changes"
git push origin master
```

## Current Database Content

To check what's in your database:
```bash
python check_database_content.py  # If you have this script
```

Or use SQLite browser to inspect `instance/business_management.db`

## Troubleshooting

### "Your local changes would be overwritten by merge"
```bash
# Option 1: Keep your local database, overwrite server
git add instance/business_management.db
git commit -m "Update database"
git push origin master

# Option 2: Discard local database, use server's
git checkout -- instance/business_management.db
git pull origin master

# Option 3: Stash local changes, pull, then decide
git stash
git pull origin master
git stash pop  # Brings back your changes, may conflict
```

### After Pulling, App Shows Old Data
- Database was updated, clear any caches
- Restart the Flask app
- Hard refresh browser (Ctrl + Shift + R)

## Summary

✅ **Current Setup**: Database IS tracked and will be pushed  
⚠️ **Be Careful**: Pushing overwrites server database  
💡 **Best Practice**: Coordinate database pushes with your team



