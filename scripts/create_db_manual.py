#!/usr/bin/env python3
"""
Manually create database with updated schema
"""

import sqlite3
from datetime import datetime

def create_database():
    print("🚀 Creating certificate validator database...")
    
    conn = sqlite3.connect('certificate_validator.db')
    cursor = conn.cursor()
    
    # Create Certificate table (without college_name)
    print("📝 Creating certificate table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS certificate (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seat_no VARCHAR(50) NOT NULL UNIQUE,
            student_name VARCHAR(255) NOT NULL,
            mother_name VARCHAR(255) NOT NULL,
            sgpa FLOAT NOT NULL,
            result_date VARCHAR(50) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for Certificate table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_certificate_seat_no ON certificate(seat_no)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_certificate_search ON certificate(student_name, seat_no)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_certificate_subject ON certificate(subject)')
    
    # Create Fraud Detection Log table
    print("🛡️ Creating fraud_detection_log table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fraud_detection_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            extracted_seat_no VARCHAR(50),
            extracted_student_name VARCHAR(255),
            extracted_mother_name VARCHAR(255),
            extracted_sgpa FLOAT,
            extracted_result_date VARCHAR(50),
            extracted_subject VARCHAR(255),
            fraud_status VARCHAR(20) NOT NULL,
            confidence_score FLOAT NOT NULL,
            detection_reason TEXT NOT NULL,
            uploaded_filename VARCHAR(255),
            raw_extracted_text TEXT,
            ip_address VARCHAR(45),
            user_agent VARCHAR(500),
            verification_log_id INTEGER,
            detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_by_admin BOOLEAN DEFAULT 0,
            admin_notes TEXT,
            reviewed_at DATETIME,
            FOREIGN KEY (verification_log_id) REFERENCES verification_log(id)
        )
    ''')
    
    # Create indexes for Fraud Detection Log
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_fraud_detected_at ON fraud_detection_log(detected_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_fraud_status ON fraud_detection_log(fraud_status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_fraud_reviewed ON fraud_detection_log(reviewed_by_admin)')
    
    # Create Verification Log table
    print("📊 Creating verification_log table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uploaded_filename VARCHAR(255),
            extracted_text TEXT,
            verification_result VARCHAR(50),
            confidence_score FLOAT,
            anomalies_detected TEXT,
            matched_certificate_id INTEGER,
            ip_address VARCHAR(45),
            user_agent VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            extracted_student_name VARCHAR(255),
            extracted_institution VARCHAR(255),
            extracted_subject VARCHAR(255),
            extracted_result_date VARCHAR(50),
            FOREIGN KEY (matched_certificate_id) REFERENCES certificate(id)
        )
    ''')
    
    # Create Institution table
    print("🏛️ Creating institution table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS institution (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) UNIQUE NOT NULL,
            address TEXT,
            contact_email VARCHAR(100),
            contact_phone VARCHAR(20),
            established_year INTEGER,
            accreditation VARCHAR(100),
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create Admin User table
    print("👤 Creating admin_user table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(100),
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Commit changes
    conn.commit()
    
    # Verify creation
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\n✅ Database created successfully!")
    print(f"📋 Created tables: {', '.join(tables)}")
    
    # Add sample certificate
    print("\n📝 Adding sample certificate...")
    cursor.execute('''
        INSERT OR IGNORE INTO certificate 
        (seat_no, student_name, mother_name, sgpa, result_date, subject, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('S1900508770', 'Aniket Todkar', 'Pramodappa Todkar', 9.59, '31 January 2025', 'Information Technology', True, datetime.utcnow()))
    
    conn.commit()
    
    # Count records
    cursor.execute("SELECT COUNT(*) FROM certificate")
    cert_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM fraud_detection_log")
    fraud_count = cursor.fetchone()[0]
    
    print(f"📊 Current data:")
    print(f"   - Certificates: {cert_count}")
    print(f"   - Fraud logs: {fraud_count}")
    
    conn.close()
    print("\n🎉 Database setup completed!")

if __name__ == '__main__':
    create_database()