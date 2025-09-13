#!/usr/bin/env python3
"""
Add Certificate Script for Certificate Validator
Adds a specific certificate record to the database
"""

from flask import Flask
from models import db, Certificate
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///certificate_validator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

def add_certificate():
    """Add the specific certificate record"""
    with app.app_context():
        try:
            # Check if certificate already exists
            existing = Certificate.query.filter_by(seat_no='S1900508770').first()
            if existing:
                print(f"❌ Certificate with seat number S1900508770 already exists!")
                print(f"   Student: {existing.student_name}")
                return False
            
            # Create new certificate record
            certificate = Certificate(
                seat_no='S1900508770',
                student_name='Aniket Todkar',  # Using the name format from your request
                mother_name='Pramodappa Todkar',  # Assuming father's name as mother's name wasn't provided
                sgpa=9.59,
                result_date='31 January 2025',  # Using a date format
                subject='Information Technology',
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            # Add to database
            db.session.add(certificate)
            db.session.commit()
            
            print("✅ Certificate added successfully!")
            print("=" * 60)
            print(f"   Seat No: {certificate.seat_no}")
            print(f"   Student: {certificate.student_name}")
            print(f"   Parent: {certificate.mother_name}")
            print(f"   Subject: {certificate.subject}")
            print(f"   SGPA: {certificate.sgpa}")
            print(f"   Result Date: {certificate.result_date}")
            print(f"   Added At: {certificate.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)
            
            # Show updated count
            total_certs = Certificate.query.count()
            print(f"📊 Total certificates in database: {total_certs}")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error adding certificate: {str(e)}")
            return False

if __name__ == '__main__':
    success = add_certificate()
    if not success:
        exit(1)