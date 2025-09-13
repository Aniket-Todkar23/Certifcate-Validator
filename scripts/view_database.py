#!/usr/bin/env python3
"""
Database Viewer Script for Certificate Validator
Shows all records in the database tables
"""

from flask import Flask
from models import db, Certificate, Institution, AdminUser, VerificationLog
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///certificate_validator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

def format_table(headers, rows, title):
    """Format data as a nice table"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")
    
    if not rows:
        print("  No records found.")
        return
    
    # Calculate column widths
    col_widths = []
    for i, header in enumerate(headers):
        max_width = len(str(header))
        for row in rows:
            if i < len(row) and row[i] is not None:
                max_width = max(max_width, len(str(row[i])))
        col_widths.append(min(max_width, 30))  # Max width of 30 chars
    
    # Print header
    header_line = "  "
    separator_line = "  "
    for i, (header, width) in enumerate(zip(headers, col_widths)):
        header_line += f"{str(header):<{width}} | "
        separator_line += "-" * width + " | "
    
    print(header_line)
    print(separator_line)
    
    # Print rows
    for row in rows:
        row_line = "  "
        for i, (value, width) in enumerate(zip(row, col_widths)):
            if value is None:
                value = "NULL"
            value_str = str(value)
            if len(value_str) > width:
                value_str = value_str[:width-3] + "..."
            row_line += f"{value_str:<{width}} | "
        print(row_line)
    
    print(f"\n  Total records: {len(rows)}")

def view_database():
    """View all database contents"""
    with app.app_context():
        try:
            print("\n🔍 CERTIFICATE VALIDATOR DATABASE VIEWER")
            print(f"📅 Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # View Certificates
            certificates = Certificate.query.order_by(Certificate.created_at.desc()).all()
            cert_data = []
            for cert in certificates:
                cert_data.append([
                    cert.id,
                    cert.seat_no,
                    cert.student_name,
                    cert.mother_name,
                    cert.college_name,
                    cert.sgpa,
                    cert.result_date,
                    cert.subject,
                    cert.created_at.strftime('%Y-%m-%d %H:%M:%S') if cert.created_at else 'N/A'
                ])
            
            format_table(
                ['ID', 'Seat No', 'Student Name', 'Mother Name', 'College', 'SGPA', 'Result Date', 'Subject', 'Created At'],
                cert_data,
                'CERTIFICATES'
            )
            
            # View Institutions
            institutions = Institution.query.filter_by(is_active=True).all()
            inst_data = []
            for inst in institutions:
                inst_data.append([
                    inst.id,
                    inst.name,
                    inst.code,
                    inst.address,
                    inst.contact_email,
                    inst.established_year
                ])
            
            format_table(
                ['ID', 'Name', 'Code', 'Address', 'Email', 'Est. Year'],
                inst_data,
                'INSTITUTIONS'
            )
            
            # View Verification Logs (last 10)
            logs = VerificationLog.query.order_by(VerificationLog.created_at.desc()).limit(10).all()
            log_data = []
            for log in logs:
                log_data.append([
                    log.id,
                    log.extracted_seat_no or 'N/A',
                    log.verification_status,
                    f"{log.confidence_score:.2f}" if log.confidence_score else 'N/A',
                    log.filename or 'N/A',
                    log.created_at.strftime('%Y-%m-%d %H:%M:%S') if log.created_at else 'N/A'
                ])
            
            format_table(
                ['ID', 'Seat No', 'Status', 'Confidence', 'Filename', 'Verified At'],
                log_data,
                'RECENT VERIFICATION LOGS (Last 10)'
            )
            
            # View Admin Users
            admins = AdminUser.query.all()
            admin_data = []
            for admin in admins:
                admin_data.append([
                    admin.id,
                    admin.username,
                    admin.email,
                    'Active' if admin.is_active else 'Inactive',
                    admin.created_at.strftime('%Y-%m-%d %H:%M:%S') if admin.created_at else 'N/A'
                ])
            
            format_table(
                ['ID', 'Username', 'Email', 'Status', 'Created At'],
                admin_data,
                'ADMIN USERS'
            )
            
            # Summary Statistics
            print(f"\n{'='*80}")
            print("  DATABASE SUMMARY")
            print(f"{'='*80}")
            print(f"  📊 Total Certificates: {len(cert_data)}")
            print(f"  🏢 Active Institutions: {len(inst_data)}")
            print(f"  📋 Verification Logs: {VerificationLog.query.count()}")
            print(f"  👥 Admin Users: {len(admin_data)}")
            print(f"{'='*80}")
            
            # Recent uploads (last 24 hours)
            from datetime import timedelta
            recent_cutoff = datetime.utcnow() - timedelta(hours=24)
            recent_certs = Certificate.query.filter(Certificate.created_at >= recent_cutoff).all()
            
            if recent_certs:
                print(f"\n🕐 RECENT UPLOADS (Last 24 hours): {len(recent_certs)} certificates")
                for cert in recent_certs:
                    print(f"  • {cert.seat_no} - {cert.student_name} (uploaded {cert.created_at.strftime('%H:%M:%S')})")
            else:
                print(f"\n🕐 No uploads in the last 24 hours")
                
        except Exception as e:
            print(f"❌ Error viewing database: {str(e)}")
            return False
            
    return True

if __name__ == '__main__':
    success = view_database()
    if not success:
        exit(1)