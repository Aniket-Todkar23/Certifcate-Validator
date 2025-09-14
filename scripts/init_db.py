#!/usr/bin/env python3
"""
Database initialization script for PramanMitra
Creates tables and populates with sample data for testing
"""

import os
from flask import Flask
from models import db, Institution, Certificate, AdminUser, VerificationLog

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///certificate_validator.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def init_database():
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.drop_all()
        db.create_all()
        
        # Sample institutions
        print("Adding sample institutions...")
        institutions = [
            Institution(
                name="Ranchi University",
                code="RU",
                address="Ranchi, Jharkhand - 834008",
                contact_email="info@ranchiuniversity.ac.in",
                contact_phone="+91-651-2451234",
                established_year=1960,
                accreditation="NAAC A+",
                is_active=True
            ),
            Institution(
                name="Birla Institute of Technology",
                code="BIT",
                address="Mesra, Ranchi, Jharkhand - 835215",
                contact_email="info@bitmesra.ac.in",
                contact_phone="+91-651-2275444",
                established_year=1955,
                accreditation="NAAC A++",
                is_active=True
            )
        ]
        
        for inst in institutions:
            db.session.add(inst)
        db.session.commit()
        
        # Sample certificates (with minimal fields)
        print("Adding sample certificates...")
        certificates = [
            Certificate(
                seat_no="S1900508778",
                student_name="Aniket Todkar",
                mother_name="Rupali Todkar",
                college_name="Ranchi University",
                sgpa=9.59,
                result_date="31 January 2025",
                subject="Information Technology",
                is_active=True
            ),
            Certificate(
                seat_no="S1900508771",
                student_name="Priya Sharma",
                mother_name="Sunita Sharma",
                college_name="Birla Institute of Technology",
                sgpa=8.45,
                result_date="15 February 2025",
                subject="Computer Science",
                is_active=True
            )
        ]
        
        for cert in certificates:
            db.session.add(cert)
        
        # Sample admin user
        print("Adding admin user...")
        admin = AdminUser(
            username="admin",
            password_hash="admin123",  # In production, use proper hashing
            email="admin@jharkhand.gov.in",
            is_active=True
        )
        db.session.add(admin)
        
        db.session.commit()
        
        print("Database initialized successfully with minimal fields.")

if __name__ == "__main__":
    init_database()
