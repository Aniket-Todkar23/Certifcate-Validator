#!/usr/bin/env python3
"""
Clear Database Script for PramanMitra
Clears all records from the database tables while keeping the structure
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / 'backend'))

from flask import Flask
from models import db, User, Certificate, Institution, VerificationLog, FraudDetectionLog, Blacklist
from auth import JWTAuth

# Initialize Flask app
app = Flask(__name__)

# Get the absolute path to the database (same as init_users.py)
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / 'data' / 'certificate_validator.db'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

def clear_database():
    """Clear all records from database tables"""
    
    # Initialize JWT auth for password hashing
    jwt_secret = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
    auth = JWTAuth(jwt_secret)
    
    with app.app_context():
        try:
            # Create tables if they don't exist
            db.create_all()
            
            # Clear all tables in reverse order to avoid foreign key conflicts
            print("Clearing database records...")
            
            # Clear blacklist first (depends on fraud detection log)
            deleted_blacklist = Blacklist.query.delete()
            print(f"✓ Deleted {deleted_blacklist} blacklist records")
            
            # Clear fraud detection logs
            deleted_fraud = FraudDetectionLog.query.delete()
            print(f"✓ Deleted {deleted_fraud} fraud detection log records")
            
            # Clear verification logs
            deleted_logs = VerificationLog.query.delete()
            print(f"✓ Deleted {deleted_logs} verification log records")
            
            # Clear certificates
            deleted_certs = Certificate.query.delete()
            print(f"✓ Deleted {deleted_certs} certificate records")
            
            # Clear institutions (keep some for testing if needed)
            deleted_institutions = Institution.query.delete()
            print(f"✓ Deleted {deleted_institutions} institution records")
            
            # Clear users (we'll add back a default admin)
            deleted_users = User.query.delete()
            print(f"✓ Deleted {deleted_users} user records")
            
            # Add back a default admin user for testing
            admin = User(
                username='admin',
                password_hash=auth.hash_password('admin123'),
                email='admin@certvalidator.com',
                full_name='System Administrator',
                role='admin',
                is_active=True
            )
            db.session.add(admin)
            print("✓ Added default admin user (username: admin, password: admin123)")
            
            # Add back some sample institutions for testing
            institutions = [
                Institution(
                    name='Pune Institute of Computer Technology',
                    code='PICT',
                    address='Near Pune Station',
                    contact_email='info@pict.edu',
                    established_year=1983,
                    is_active=True
                ),
                Institution(
                    name='Mumbai University',
                    code='MU',
                    address='Mumbai, Maharashtra',
                    contact_email='info@mu.ac.in',
                    established_year=1857,
                    is_active=True
                ),
                Institution(
                    name='Delhi College of Engineering',
                    code='DCE',
                    address='Delhi, India',
                    contact_email='info@dce.ac.in',
                    established_year=1941,
                    is_active=True
                )
            ]
            
            for institution in institutions:
                db.session.add(institution)
            
            print(f"✓ Added {len(institutions)} sample institutions")
            
            # Commit all changes
            db.session.commit()
            print("✅ Database cleared successfully!")
            print("")
            print("Database is now ready for testing with:")
            print("- 0 certificates")
            print("- 0 verification logs") 
            print("- 0 fraud detection logs")
            print("- 0 blacklist entries")
            print("- 1 admin user (username: admin, password: admin123)")
            print("- 3 sample institutions")
            print("")
            print("You can now test the bulk upload functionality with fresh data.")
            print("Login at: http://localhost:3000/admin/login")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error clearing database: {str(e)}")
            return False
            
    return True

if __name__ == '__main__':
    success = clear_database()
    if not success:
        exit(1)