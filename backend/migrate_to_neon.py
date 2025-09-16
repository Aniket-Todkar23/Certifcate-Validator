"""
SQLite to Neon PostgreSQL Migration Script
Migrates all data from local SQLite database to Neon PostgreSQL
"""

import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_sqlite_connection():
    """Connect to SQLite database"""
    db_path = os.path.join(os.path.dirname(__file__), 'certificates.db')
    if not os.path.exists(db_path):
        print(f"❌ SQLite database not found at {db_path}")
        sys.exit(1)
    return sqlite3.connect(db_path)

def get_postgres_connection():
    """Connect to Neon PostgreSQL database"""
    # Get Neon connection string from environment
    neon_connection_string = os.getenv('NEON_DATABASE_URL')
    
    if not neon_connection_string:
        print("❌ NEON_DATABASE_URL not found in environment variables")
        print("Please add your Neon connection string to .env file")
        print("Format: postgresql://username:password@host/database?sslmode=require")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(neon_connection_string)
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to Neon PostgreSQL: {e}")
        sys.exit(1)

def create_postgres_tables(pg_conn):
    """Create tables in PostgreSQL if they don't exist"""
    cursor = pg_conn.cursor()
    
    # Create tables SQL
    create_tables_sql = """
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(80) UNIQUE NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
    );

    -- Certificates table
    CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        seat_no VARCHAR(50) UNIQUE NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        mother_name VARCHAR(100),
        subject VARCHAR(100),
        sgpa DECIMAL(3,2),
        result_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by_user_id INTEGER REFERENCES users(id)
    );

    -- Verification logs table
    CREATE TABLE IF NOT EXISTS verification_logs (
        id SERIAL PRIMARY KEY,
        certificate_id INTEGER REFERENCES certificates(id),
        verification_status VARCHAR(20),
        confidence_score DECIMAL(5,2),
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_by_user_id INTEGER REFERENCES users(id),
        file_name VARCHAR(255),
        file_hash VARCHAR(64)
    );

    -- Fraud detection logs table
    CREATE TABLE IF NOT EXISTS fraud_detection_logs (
        id SERIAL PRIMARY KEY,
        seat_no VARCHAR(50),
        student_name VARCHAR(100),
        mother_name VARCHAR(100),
        detected_issues TEXT,
        fraud_confidence DECIMAL(5,2),
        detection_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by_admin BOOLEAN DEFAULT false,
        is_blacklisted BOOLEAN DEFAULT false,
        blacklist_reason TEXT,
        file_name VARCHAR(255),
        file_hash VARCHAR(64)
    );

    -- Institutions table
    CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(50) UNIQUE,
        type VARCHAR(50),
        location VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_certificates_seat_no ON certificates(seat_no);
    CREATE INDEX IF NOT EXISTS idx_certificates_student_name ON certificates(student_name);
    CREATE INDEX IF NOT EXISTS idx_verification_logs_certificate_id ON verification_logs(certificate_id);
    CREATE INDEX IF NOT EXISTS idx_fraud_detection_logs_seat_no ON fraud_detection_logs(seat_no);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    """
    
    try:
        cursor.execute(create_tables_sql)
        pg_conn.commit()
        print("✅ PostgreSQL tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        pg_conn.rollback()
        raise

def migrate_table(sqlite_conn, pg_conn, table_name, column_mapping=None):
    """Migrate data from SQLite table to PostgreSQL table"""
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    try:
        # Get data from SQLite
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"⏭️  No data in {table_name} table")
            return 0
        
        # Get column names
        column_names = [description[0] for description in sqlite_cursor.description]
        
        # Apply column mapping if provided
        if column_mapping:
            column_names = [column_mapping.get(col, col) for col in column_names]
        
        # Prepare insert query
        placeholders = ', '.join(['%s'] * len(column_names))
        columns = ', '.join(column_names)
        insert_query = f"""
            INSERT INTO {table_name} ({columns}) 
            VALUES ({placeholders})
            ON CONFLICT DO NOTHING
        """
        
        # Insert data
        inserted = 0
        for row in rows:
            try:
                # Convert row to list and handle None values
                row_data = list(row)
                pg_cursor.execute(insert_query, row_data)
                inserted += 1
            except Exception as e:
                print(f"⚠️  Warning: Could not insert row in {table_name}: {e}")
                continue
        
        pg_conn.commit()
        print(f"✅ Migrated {inserted} records to {table_name} table")
        return inserted
    
    except Exception as e:
        print(f"❌ Error migrating {table_name}: {e}")
        pg_conn.rollback()
        return 0

def migrate_all_data():
    """Main migration function"""
    print("🚀 Starting SQLite to Neon PostgreSQL migration...")
    print("-" * 50)
    
    # Connect to databases
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    try:
        # Create tables in PostgreSQL
        create_postgres_tables(pg_conn)
        
        # Get list of tables from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = sqlite_cursor.fetchall()
        
        print(f"\n📊 Found {len(tables)} tables to migrate")
        print("-" * 50)
        
        # Migration statistics
        total_records = 0
        
        # Define table migration order (for foreign key constraints)
        ordered_tables = [
            'users',
            'institutions', 
            'certificates',
            'verification_logs',
            'fraud_detection_logs'
        ]
        
        # Migrate each table
        for table_name in ordered_tables:
            if (table_name,) in tables:
                print(f"\n📋 Migrating {table_name}...")
                records = migrate_table(sqlite_conn, pg_conn, table_name)
                total_records += records
        
        # Reset sequences for PostgreSQL
        pg_cursor = pg_conn.cursor()
        reset_sequences_sql = """
        SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
        SELECT setval('certificates_id_seq', (SELECT MAX(id) FROM certificates), true);
        SELECT setval('verification_logs_id_seq', (SELECT MAX(id) FROM verification_logs), true);
        SELECT setval('fraud_detection_logs_id_seq', (SELECT MAX(id) FROM fraud_detection_logs), true);
        SELECT setval('institutions_id_seq', (SELECT MAX(id) FROM institutions), true);
        """
        
        for sql in reset_sequences_sql.split(';'):
            if sql.strip():
                try:
                    pg_cursor.execute(sql)
                except:
                    pass  # Ignore if table is empty
        
        pg_conn.commit()
        
        print("\n" + "=" * 50)
        print(f"✅ Migration completed successfully!")
        print(f"📊 Total records migrated: {total_records}")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
    
    finally:
        sqlite_conn.close()
        pg_conn.close()

def verify_migration(table_name):
    """Verify data was migrated correctly"""
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    # Count records in both databases
    sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    sqlite_count = sqlite_cursor.fetchone()[0]
    
    pg_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    pg_count = pg_cursor.fetchone()[0]
    
    print(f"Table: {table_name}")
    print(f"  SQLite records: {sqlite_count}")
    print(f"  PostgreSQL records: {pg_count}")
    print(f"  Match: {'✅' if sqlite_count == pg_count else '❌'}")
    
    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "verify":
            print("\n🔍 Verifying migration...")
            print("-" * 50)
            tables = ['users', 'certificates', 'verification_logs', 'fraud_detection_logs', 'institutions']
            for table in tables:
                try:
                    verify_migration(table)
                except Exception as e:
                    print(f"Could not verify {table}: {e}")
        else:
            print("Usage: python migrate_to_neon.py [verify]")
    else:
        # Run migration
        migrate_all_data()
        
        print("\n💡 To verify the migration, run:")
        print("   python migrate_to_neon.py verify")