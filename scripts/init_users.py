#!/usr/bin/env python3
"""
Initialize database with test users
Run this script to create default admin and verifier accounts
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / 'backend'))

from flask import Flask
from models import db, User
from auth import JWTAuth

# Test credentials for demonstration
TEST_USERS = [
    {
        'username': 'admin',
        'password': 'admin123',
        'email': 'admin@certvalidator.com',
        'full_name': 'System Administrator',
        'role': 'admin'
    },
    {
        'username': 'superadmin',
        'password': 'super123',
        'email': 'superadmin@certvalidator.com',
        'full_name': 'Super Administrator',
        'role': 'admin'
    },
    {
        'username': 'verifier',
        'password': 'verify123',
        'email': 'verifier@certvalidator.com',
        'full_name': 'Certificate Verifier',
        'role': 'verifier'
    },
    {
        'username': 'alice',
        'password': 'alice123',
        'email': 'alice@certvalidator.com',
        'full_name': 'Alice Johnson',
        'role': 'verifier'
    },
    {
        'username': 'bob',
        'password': 'bob123',
        'email': 'bob@certvalidator.com',
        'full_name': 'Bob Wilson',
        'role': 'admin'
    }
]

def init_test_users():
    """Initialize database with test users"""
    
    # Create Flask app for context
    app = Flask(__name__)
    # Get the absolute path to the database
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATABASE_PATH = BASE_DIR / 'data' / 'certificate_validator.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_PATH}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize JWT auth
    jwt_secret = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
    auth = JWTAuth(jwt_secret)
    
    with app.app_context():
        db.init_app(app)
        
        # Create tables if they don't exist
        db.create_all()
        
        print("🔐 Initializing test users...")
        print("=" * 60)
        
        created_count = 0
        updated_count = 0
        
        for user_data in TEST_USERS:
            # Check if user already exists
            existing_user = User.query.filter_by(username=user_data['username']).first()
            
            if existing_user:
                # Update existing user
                existing_user.password_hash = auth.hash_password(user_data['password'])
                existing_user.email = user_data['email']
                existing_user.full_name = user_data['full_name']
                existing_user.role = user_data['role']
                existing_user.is_active = True
                updated_count += 1
                status = "UPDATED"
            else:
                # Create new user
                new_user = User(
                    username=user_data['username'],
                    password_hash=auth.hash_password(user_data['password']),
                    email=user_data['email'],
                    full_name=user_data['full_name'],
                    role=user_data['role'],
                    is_active=True
                )
                db.session.add(new_user)
                created_count += 1
                status = "CREATED"
            
            print(f"  {status}: {user_data['username']} ({user_data['role']}) - {user_data['full_name']}")
        
        # Commit all changes
        db.session.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Database initialization completed!")
        print(f"   • Created: {created_count} users")
        print(f"   • Updated: {updated_count} users")
        print(f"   • Total: {len(TEST_USERS)} users available")
        
        print("\n📋 TEST CREDENTIALS:")
        print("=" * 60)
        print("🔴 ADMIN ACCOUNTS:")
        for user in TEST_USERS:
            if user['role'] == 'admin':
                print(f"   Username: {user['username']}")
                print(f"   Password: {user['password']}")
                print(f"   Role:     {user['role'].upper()}")
                print(f"   Name:     {user['full_name']}")
                print()
        
        print("🟡 VERIFIER ACCOUNTS:")
        for user in TEST_USERS:
            if user['role'] == 'verifier':
                print(f"   Username: {user['username']}")
                print(f"   Password: {user['password']}")
                print(f"   Role:     {user['role'].upper()}")
                print(f"   Name:     {user['full_name']}")
                print()
        
        print("🔒 SECURITY NOTES:")
        print("   • These are TEST CREDENTIALS only")
        print("   • Change passwords in production")
        print("   • JWT tokens expire in 8 hours")
        print("   • All passwords are properly hashed with bcrypt")

if __name__ == '__main__':
    init_test_users()