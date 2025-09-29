#!/usr/bin/env python3
"""
Reset database and create default users
"""

from app import app
from database.init import reset_database

if __name__ == '__main__':
    print("Resetting database...")
    reset_database(app)
    print("Database reset complete!")
    print("\nDefault users:")
    print("1. Admin - username: admin, password: admin123")
    print("2. Abdullah - username: abdullah, password: alitiger2015")
