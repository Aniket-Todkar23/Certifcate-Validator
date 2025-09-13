#!/usr/bin/env python3
"""
Simple Database Viewer - No Unicode characters
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

def view_certificates():
    """View certificate records"""
    with app.app_context():
        try:
            print("\nCERTIFICATE VALIDATOR DATABASE - CERTIFICATES")
            print("=" * 80)
            
            certificates = Certificate.query.order_by(Certificate.created_at.desc()).all()
            
            if not certificates:
                print("No certificates found.")
                return
            
            print(f"{'ID':<3} | {'Seat No':<12} | {'Student Name':<20} | {'College':<30} | {'SGPA':<5} | {'Subject':<20}")
            print("-" * 100)
            
            for cert in certificates:
                college_short = cert.college_name[:30] + "..." if len(cert.college_name) > 30 else cert.college_name
                student_short = cert.student_name[:20] if len(cert.student_name) > 20 else cert.student_name
                subject_short = cert.subject[:20] if len(cert.subject) > 20 else cert.subject
                
                print(f"{cert.id:<3} | {cert.seat_no:<12} | {student_short:<20} | {college_short:<30} | {cert.sgpa:<5} | {subject_short:<20}")
            
            print(f"\nTotal certificates: {len(certificates)}")
            print("=" * 80)
            
            # Show the latest added certificate in detail
            if certificates:
                latest = certificates[0]  # First in desc order
                print(f"\nLATEST CERTIFICATE DETAILS:")
                print(f"Seat No: {latest.seat_no}")
                print(f"Student: {latest.student_name}")
                print(f"Mother/Father: {latest.mother_name}")
                print(f"College: {latest.college_name}")
                print(f"Subject: {latest.subject}")
                print(f"SGPA: {latest.sgpa}")
                print(f"Result Date: {latest.result_date}")
                print(f"Added: {latest.created_at.strftime('%Y-%m-%d %H:%M:%S') if latest.created_at else 'Unknown'}")
            
            return True
            
        except Exception as e:
            print(f"Error viewing database: {str(e)}")
            return False

if __name__ == '__main__':
    success = view_certificates()
    if not success:
        exit(1)