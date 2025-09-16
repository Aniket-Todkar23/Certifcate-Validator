#!/usr/bin/env python3
"""
Production Database Initialization Script
Run this script to set up the database schema and initial data in production
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from backend.app import app, db
from backend.models import Institution, Certificate, User, VerificationLog, FraudDetectionLog, Blacklist
from backend.auth import JWTAuth
import pandas as pd

def init_database():
    """Initialize database schema and seed data"""
    print("🔄 Initializing production database...")
    
    with app.app_context():
        try:
            # Create all tables
            print("📋 Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Check if admin user already exists
            existing_admin = User.query.filter_by(username='admin').first()
            if not existing_admin:
                print("👤 Creating default admin user...")
                
                # Create default admin user
                jwt_auth = JWTAuth(app.config.get('JWT_SECRET_KEY', 'default-key'))
                admin_user = User(
                    username='admin',
                    password_hash=jwt_auth.hash_password('admin123'),  # Change this password!
                    email='admin@pramanmitra.com',
                    full_name='System Administrator',
                    role='admin',
                    is_active=True
                )
                db.session.add(admin_user)
                
                print("✅ Default admin user created")
                print("⚠️  IMPORTANT: Change the admin password after first login!")
                print("   Username: admin")
                print("   Password: admin123")
            else:
                print("ℹ️  Admin user already exists")
            
            # Load sample certificates if CSV files exist
            csv_files = [
                'data/test_certificates.csv',
                'data/test_bulk_upload_fixed.csv',
                'data/test_certificates_bulk.csv'
            ]
            
            certificates_loaded = False
            for csv_file in csv_files:
                csv_path = Path(__file__).parent.parent / csv_file
                if csv_path.exists():
                    print(f"📊 Loading certificates from {csv_file}...")
                    try:
                        df = pd.read_csv(csv_path)
                        
                        for _, row in df.iterrows():
                            # Check if certificate already exists
                            existing_cert = Certificate.query.filter_by(seat_no=row.get('seat_no')).first()
                            if not existing_cert:
                                certificate = Certificate(
                                    seat_no=row.get('seat_no'),
                                    student_name=row.get('student_name'),
                                    mother_name=row.get('mother_name'),
                                    sgpa=float(row.get('sgpa', 0)),
                                    result_date=row.get('result_date'),
                                    subject=row.get('subject'),
                                    is_active=True
                                )
                                db.session.add(certificate)
                        
                        certificates_loaded = True
                        print(f"✅ Certificates loaded from {csv_file}")
                        break
                        
                    except Exception as e:
                        print(f"⚠️  Could not load {csv_file}: {str(e)}")
                        continue
            
            if not certificates_loaded:
                print("ℹ️  No certificate data loaded - CSV files not found")
            
            # Commit all changes
            db.session.commit()
            print("✅ Database initialization completed successfully!")
            
        except Exception as e:
            print(f"❌ Error initializing database: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    init_database()