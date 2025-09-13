#!/usr/bin/env python3
"""
Clear Database Script for Certificate Validator
Clears all records from the database tables while keeping the structure
"""

from flask import Flask
from models import db, Certificate, Institution, AdminUser, VerificationLog

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///certificate_validator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

def clear_database():
    """Clear all records from database tables"""
    with app.app_context():
        try:
            # Clear all tables in reverse order to avoid foreign key conflicts
            print("Clearing database records...")
            
            # Clear verification logs first
            deleted_logs = VerificationLog.query.delete()
            print(f"✓ Deleted {deleted_logs} verification log records")
            
            # Clear certificates
            deleted_certs = Certificate.query.delete()
            print(f"✓ Deleted {deleted_certs} certificate records")
            
            # Clear institutions (keep some for testing if needed)
            deleted_institutions = Institution.query.delete()
            print(f"✓ Deleted {deleted_institutions} institution records")
            
            # Clear admin users (we'll add back a default one)
            deleted_admins = AdminUser.query.delete()
            print(f"✓ Deleted {deleted_admins} admin user records")
            
            # Add back a default admin user for testing
            # Note: In production, use proper password hashing
            admin = AdminUser(
                username='admin',
                password_hash='admin',  # Simple password for testing
                email='admin@example.com',
                is_active=True
            )
            db.session.add(admin)
            print("✓ Added default admin user (username: admin, password: admin)")
            
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
            print("- 1 admin user (username: admin, password: admin)")
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