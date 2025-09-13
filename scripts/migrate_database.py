#!/usr/bin/env python3
"""
Database Migration Script for Certificate Validator
- Removes college_name column from certificates table
- Creates fraud_detection_log table
- Preserves existing data
"""

import sqlite3
import os
from datetime import datetime

def backup_database(db_path):
    """Create a backup of the database before migration"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f"{db_path}.backup_{timestamp}"
    
    try:
        # Create backup using SQLite's backup API
        source = sqlite3.connect(db_path)
        backup = sqlite3.connect(backup_path)
        source.backup(backup)
        source.close()
        backup.close()
        print(f"✅ Database backed up to: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"❌ Backup failed: {str(e)}")
        return None

def migrate_database(db_path):
    """Perform the database migration"""
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    # Create backup first
    backup_path = backup_database(db_path)
    if not backup_path:
        print("❌ Migration aborted due to backup failure")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 Starting database migration...")
        
        # Check if college_name column exists
        cursor.execute("PRAGMA table_info(certificate)")
        columns = cursor.fetchall()
        college_name_exists = any(col[1] == 'college_name' for col in columns)
        
        if college_name_exists:
            print("🔄 Removing college_name column from certificate table...")
            
            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            # 1. Create new table without college_name
            cursor.execute('''
                CREATE TABLE certificate_new (
                    id INTEGER PRIMARY KEY,
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
            
            # 2. Copy data (excluding college_name)
            cursor.execute('''
                INSERT INTO certificate_new (
                    id, seat_no, student_name, mother_name, sgpa, 
                    result_date, subject, is_active, created_at
                )
                SELECT id, seat_no, student_name, mother_name, sgpa, 
                       result_date, subject, is_active, created_at
                FROM certificate
            ''')
            
            # 3. Drop old table and rename new table
            cursor.execute('DROP TABLE certificate')
            cursor.execute('ALTER TABLE certificate_new RENAME TO certificate')
            
            # 4. Recreate indexes
            cursor.execute('CREATE INDEX idx_certificate_seat_no ON certificate(seat_no)')
            cursor.execute('CREATE INDEX idx_certificate_search ON certificate(student_name, seat_no)')
            cursor.execute('CREATE INDEX idx_certificate_subject ON certificate(subject)')
            
            print("✅ Successfully removed college_name column")
        else:
            print("ℹ️  college_name column not found - skipping removal")
        
        # Check if fraud_detection_log table exists
        cursor.execute('''
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='fraud_detection_log'
        ''')
        fraud_table_exists = cursor.fetchone() is not None
        
        if not fraud_table_exists:
            print("🔄 Creating fraud_detection_log table...")
            
            cursor.execute('''
                CREATE TABLE fraud_detection_log (
                    id INTEGER PRIMARY KEY,
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
            
            # Create index for better query performance
            cursor.execute('CREATE INDEX idx_fraud_detected_at ON fraud_detection_log(detected_at)')
            cursor.execute('CREATE INDEX idx_fraud_status ON fraud_detection_log(fraud_status)')
            cursor.execute('CREATE INDEX idx_fraud_reviewed ON fraud_detection_log(reviewed_by_admin)')
            
            print("✅ Successfully created fraud_detection_log table")
        else:
            print("ℹ️  fraud_detection_log table already exists - skipping creation")
        
        # Commit all changes
        conn.commit()
        conn.close()
        
        print("✅ Database migration completed successfully!")
        print(f"📁 Backup saved at: {backup_path}")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        conn.rollback()
        conn.close()
        
        # Restore backup if migration failed
        try:
            os.replace(backup_path, db_path)
            print("✅ Database restored from backup")
        except Exception as restore_error:
            print(f"❌ Failed to restore backup: {str(restore_error)}")
        
        return False

def verify_migration(db_path):
    """Verify that the migration was successful"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n🔍 Verifying migration...")
        
        # Check certificate table structure
        cursor.execute("PRAGMA table_info(certificate)")
        cert_columns = [col[1] for col in cursor.fetchall()]
        
        if 'college_name' in cert_columns:
            print("❌ college_name column still exists in certificate table")
            return False
        else:
            print("✅ college_name column successfully removed from certificate table")
        
        # Check if fraud_detection_log table exists
        cursor.execute('''
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='fraud_detection_log'
        ''')
        if cursor.fetchone():
            print("✅ fraud_detection_log table exists")
        else:
            print("❌ fraud_detection_log table not found")
            return False
        
        # Check fraud table structure
        cursor.execute("PRAGMA table_info(fraud_detection_log)")
        fraud_columns = [col[1] for col in cursor.fetchall()]
        required_fraud_columns = [
            'id', 'fraud_status', 'confidence_score', 'detection_reason',
            'detected_at', 'reviewed_by_admin'
        ]
        
        missing_columns = [col for col in required_fraud_columns if col not in fraud_columns]
        if missing_columns:
            print(f"❌ Missing columns in fraud_detection_log: {missing_columns}")
            return False
        else:
            print("✅ fraud_detection_log table has correct structure")
        
        # Count existing records
        cursor.execute("SELECT COUNT(*) FROM certificate")
        cert_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM fraud_detection_log")
        fraud_count = cursor.fetchone()[0]
        
        print(f"📊 Current data:")
        print(f"   - Certificates: {cert_count}")
        print(f"   - Fraud logs: {fraud_count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
        return False

if __name__ == '__main__':
    db_path = 'certificate_validator.db'
    
    print("🚀 Certificate Validator Database Migration")
    print("=" * 50)
    print("This script will:")
    print("  1. Create a backup of your database")
    print("  2. Remove the college_name column from certificates")
    print("  3. Create the fraud_detection_log table")
    print("  4. Verify the migration was successful")
    print("=" * 50)
    
    # Ask for confirmation
    response = input("\nDo you want to proceed with the migration? (y/N): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        exit(0)
    
    # Perform migration
    success = migrate_database(db_path)
    
    if success:
        # Verify migration
        if verify_migration(db_path):
            print("\n🎉 Migration completed successfully!")
            print("Your certificate validator is now updated with:")
            print("  ✅ College name verification removed")
            print("  ✅ Fraud detection logging enabled")
            print("  ✅ Admin fraud dashboard ready")
        else:
            print("\n⚠️  Migration completed but verification failed")
            print("Please check the database manually")
    else:
        print("\n❌ Migration failed!")
        print("Database has been restored to original state")
        exit(1)