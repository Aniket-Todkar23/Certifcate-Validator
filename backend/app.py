#!/usr/bin/env python3
""" Main Flask Application for PramanMitra
Handles all API endpoints and web interface """

import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from flask import Flask, request, jsonify, redirect, session, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
import json
import pandas as pd
from io import StringIO

from models import db, Institution, Certificate, User, AdminUser, VerificationLog, FraudDetectionLog, Blacklist
from ocr_processor import OCRProcessor
from verifier import CertificateVerifier
from auth import JWTAuth, token_required, admin_required, verifier_or_admin_required, get_current_user

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'  # Change in production

# JWT Configuration
jwt_secret_key = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
app.jwt_auth = JWTAuth(jwt_secret_key)

# Configure session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Enable CORS for React frontend with proper configuration
CORS(app, 
     supports_credentials=True, 
     origins=['http://localhost:3000', 'http://localhost:3001'],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Get the absolute path to the project root
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / 'data' / 'certificate_validator.db'

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
db.init_app(app)

# Initialize processors
ocr_processor = OCRProcessor()
verifier = CertificateVerifier()

# Configuration
UPLOAD_FOLDER = str(BASE_DIR / 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}
CSV_ALLOWED_EXTENSIONS = {'csv'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_csv_file(filename):
    """Check if CSV file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in CSV_ALLOWED_EXTENSIONS


def get_client_info():
    """Get client IP and user agent for logging"""
    return {
        'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR')),
        'user_agent': request.headers.get('User-Agent')
    }


# API Routes for React Frontend
@app.route('/')
def index():
    """Redirect to React frontend"""
    return redirect('http://localhost:3000')


@app.route('/api/login', methods=['POST'])
def login():
    """Unified login endpoint for all user roles"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400

        # Find user by username
        user = User.query.filter_by(username=username, is_active=True).first()
        
        if not user or not app.jwt_auth.verify_password(password, user.password_hash):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        # Generate JWT token
        token = app.jwt_auth.generate_token({
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'full_name': user.full_name
        })

        return jsonify({
            'success': True,
            'message': f'Welcome, {user.full_name}!',
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'role': user.role,
                'email': user.email
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500


@app.route('/api/logout', methods=['POST'])
@token_required
def logout():
    """Logout endpoint - mainly for client-side token cleanup"""
    try:
        current_user = get_current_user()
        return jsonify({
            'success': True, 
            'message': f'Goodbye, {current_user.get("full_name", "User")}!'
        }), 200
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500


@app.route('/api/auth/status')
@token_required
def check_auth_status():
    """Check authentication status and return user info"""
    current_user = get_current_user()
    return jsonify({
        'authenticated': True,
        'user': {
            'id': current_user.get('user_id'),
            'username': current_user.get('username'),
            'full_name': current_user.get('full_name'),
            'role': current_user.get('role')
        }
    }), 200


# API Routes
@app.route('/api/verify', methods=['POST'])
def verify_certificate():
    """ Main certificate verification endpoint
    Accepts file upload and returns verification results """
    try:
        # Check if file was uploaded
        if 'certificate' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['certificate']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        unique_filename = timestamp + filename
        temp_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(temp_path)

        try:
            # Process document with OCR
            raw_text, extracted_data = ocr_processor.process_document(temp_path)

            # Validate extraction quality
            extraction_validation = ocr_processor.validate_extraction_quality(extracted_data)

            # Perform verification
            verification_result = verifier.verify_certificate(extracted_data)

            # Get client info for logging
            client_info = get_client_info()

            # Log verification attempt
            log_entry = verifier.log_verification(
                extracted_data=extracted_data,
                result=verification_result,
                filename=filename,
                raw_text=raw_text,
                ip_address=client_info['ip_address'],
                user_agent=client_info['user_agent']
            )
            
            # Log fraud cases for admin review
            if verification_result['status'] in ['FAKE', 'SUSPICIOUS']:
                verifier.log_fraud_detection(
                    extracted_data=extracted_data,
                    result=verification_result,
                    filename=filename,
                    raw_text=raw_text,
                    verification_log_id=log_entry.id,
                    ip_address=client_info['ip_address'],
                    user_agent=client_info['user_agent']
                )

            # Prepare response
            response = {
                'verification_id': log_entry.id,
                'status': verification_result['status'],
                'confidence': round(verification_result['confidence'], 3),
                'details': {
                    'extracted_data': extracted_data,
                    'matched_certificate': verification_result.get('matched_certificate'),
                    'anomalies': verification_result['anomalies'],
                    'institution_verified': verification_result['institution_verified'],
                    'extraction_confidence': round(extraction_validation['overall_confidence'], 3),
                    'extraction_issues': extraction_validation['issues']
                },
                'timestamp': log_entry.created_at.isoformat(),
                'recommendations': generate_recommendations(verification_result)
            }
            return jsonify(response), 200

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except RequestEntityTooLarge:
        return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413
    except Exception as e:
        app.logger.error(f"Verification error: {str(e)}")
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500


def generate_recommendations(verification_result):
    """Generate recommendations based on verification results"""
    recommendations = []
    status = verification_result['status']
    confidence = verification_result['confidence']
    anomalies = verification_result['anomalies']

    if status == 'AUTHENTIC':
        if confidence >= 0.9:
            recommendations.append("Certificate appears to be authentic with high confidence.")
        else:
            recommendations.append("Certificate appears authentic but some minor discrepancies detected.")
        recommendations.append("Consider manual verification for complete assurance.")

    elif status == 'SUSPICIOUS':
        recommendations.append("Certificate requires manual review by authorized personnel.")
        if confidence < 0.5:
            recommendations.append("Multiple inconsistencies detected. Proceed with caution.")
        recommendations.append("Contact the issuing institution for verification.")

    elif status == 'FAKE':
        recommendations.append("Certificate appears to be fraudulent.")
        recommendations.append("Do not accept this certificate for any official purpose.")
        recommendations.append("Report to appropriate authorities if this was submitted officially.")

    elif status == 'ERROR':
        recommendations.append("Unable to verify certificate due to processing errors.")
        recommendations.append("Try uploading a clearer image or PDF.")
        recommendations.append("Ensure the document is properly scanned and readable.")

    # Add specific recommendations for common anomalies
    for anomaly in anomalies:
        if 'format' in anomaly.lower():
            recommendations.append("Certificate format appears non-standard for the region.")
        elif 'mismatch' in anomaly.lower():
            recommendations.append("Cross-verify details with original records.")
        elif 'not found' in anomaly.lower():
            recommendations.append("Institution verification required.")

    return recommendations


@app.route('/api/institutions', methods=['GET'])
def get_institutions():
    """Get list of registered institutions"""
    try:
        institutions = Institution.query.filter_by(is_active=True).all()
        return jsonify([inst.to_dict() for inst in institutions]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/institutions', methods=['POST'])
@token_required
@admin_required
def add_institution():
    """Add new institution (admin only)"""

    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'code']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check if institution code already exists
        existing = Institution.query.filter_by(code=data['code']).first()
        if existing:
            return jsonify({'error': 'Institution code already exists'}), 400

        # Create new institution
        institution = Institution(
            name=data['name'],
            code=data['code'],
            address=data.get('address'),
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            established_year=data.get('established_year'),
            accreditation=data.get('accreditation')
        )
        db.session.add(institution)
        db.session.commit()
        return jsonify(institution.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/ocr-extract', methods=['POST'])
@token_required
@verifier_or_admin_required
def ocr_extract():
    """OCR extraction endpoint for verifiers and admins"""

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        unique_filename = timestamp + filename
        temp_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(temp_path)

        try:
            # Process document with OCR
            raw_text, extracted_data = ocr_processor.process_document(temp_path)
            
            # Validate extraction quality
            extraction_validation = ocr_processor.validate_extraction_quality(extracted_data)
            
            return jsonify({
                'success': True,
                'extracted_data': extracted_data,
                'raw_text': raw_text,
                'extraction_confidence': round(extraction_validation['overall_confidence'], 3),
                'extraction_issues': extraction_validation['issues']
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        app.logger.error(f"OCR extraction error: {str(e)}")
        return jsonify({'error': f'OCR extraction failed: {str(e)}'}), 500


@app.route('/api/certificates', methods=['POST'])
@token_required
@admin_required
def add_certificate():

    try:
        data = request.get_json()
        required_fields = ['seat_no', 'student_name', 'mother_name', 'sgpa', 'result_date', 'subject']
        for field in required_fields:
            if field not in data or data[field] in [None, '']:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check for duplicate seat_no
        existing = Certificate.query.filter_by(seat_no=data['seat_no']).first()
        if existing:
            return jsonify({'error': f'Certificate with seat_no {data["seat_no"]} already exists.'}), 400

        certificate = Certificate(
            seat_no=data['seat_no'],
            student_name=data['student_name'],
            mother_name=data['mother_name'],
            sgpa=data['sgpa'],
            result_date=data['result_date'],
            subject=data['subject'],
            is_active=True
        )
        db.session.add(certificate)
        db.session.commit()
        return jsonify({'message': 'Certificate added successfully', 'id': certificate.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/certificates/bulk-upload', methods=['POST'])
@token_required
@admin_required
def bulk_upload_certificates():
    """Upload certificates in bulk via CSV file with improved data consistency"""

    try:
        # Check if file was uploaded
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No CSV file uploaded'}), 400

        file = request.files['csv_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_csv_file(file.filename):
            return jsonify({'error': 'Only CSV files are allowed'}), 400

        # Read CSV file with better error handling
        try:
            # Read the file content as string first to handle encoding issues
            file_content = file.read().decode('utf-8')
            df = pd.read_csv(StringIO(file_content))
        except UnicodeDecodeError:
            # Try with different encoding
            file.seek(0)
            try:
                file_content = file.read().decode('latin-1')
                df = pd.read_csv(StringIO(file_content))
            except UnicodeDecodeError:
                # Try with cp1252 encoding
                file.seek(0)
                file_content = file.read().decode('cp1252')
                df = pd.read_csv(StringIO(file_content))
        except Exception as e:
            return jsonify({'error': f'Invalid CSV file: {str(e)}'}), 400

        # Validate CSV columns
        required_columns = ['seat_no', 'student_name', 'mother_name', 'sgpa', 'result_date', 'subject']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({
                'error': f'Missing required columns: {missing_columns}',
                'required_columns': required_columns,
                'found_columns': list(df.columns)
            }), 400

        # Remove completely empty rows
        df = df.dropna(how='all')
        
        if len(df) == 0:
            return jsonify({'error': 'CSV file contains no valid data rows'}), 400
        
        # Pre-validate all data before any database operations
        validated_certificates = []
        validation_errors = []
        duplicates = []
        processed_seat_nos = set()  # Track seat numbers in current batch
        
        # Get all existing seat numbers to check for duplicates efficiently
        existing_seat_nos = set(cert.seat_no for cert in Certificate.query.with_entities(Certificate.seat_no).all())
        
        for index, row in df.iterrows():
            row_num = index + 2  # Account for header row
            
            try:
                # Skip empty rows
                if pd.isna(row['seat_no']) or str(row['seat_no']).strip() == '':
                    continue
                    
                # Clean and validate data
                seat_no = str(row['seat_no']).strip().upper()  # Normalize to uppercase
                student_name = str(row['student_name']).strip().title() if not pd.isna(row['student_name']) else ''
                mother_name = str(row['mother_name']).strip().title() if not pd.isna(row['mother_name']) else ''
                subject = str(row['subject']).strip() if not pd.isna(row['subject']) else ''
                result_date = str(row['result_date']).strip() if not pd.isna(row['result_date']) else ''
                
                # Validate SGPA
                try:
                    sgpa = float(row['sgpa']) if not pd.isna(row['sgpa']) else None
                    if sgpa is None:
                        validation_errors.append(f'Row {row_num}: SGPA is required')
                        continue
                    if sgpa < 0 or sgpa > 10:
                        validation_errors.append(f'Row {row_num}: SGPA must be between 0 and 10, got {sgpa}')
                        continue
                    # Round to 2 decimal places for consistency
                    sgpa = round(sgpa, 2)
                except (ValueError, TypeError) as e:
                    validation_errors.append(f'Row {row_num}: Invalid SGPA value \"{row["sgpa"]}\", must be a number')
                    continue
                
                # Validate required fields
                missing_fields = []
                if not seat_no: missing_fields.append('seat_no')
                if not student_name: missing_fields.append('student_name')
                if not mother_name: missing_fields.append('mother_name')
                if not subject: missing_fields.append('subject')
                if not result_date: missing_fields.append('result_date')
                
                if missing_fields:
                    validation_errors.append(f'Row {row_num}: Missing required fields: {", ".join(missing_fields)}')
                    continue
                
                # Check for duplicate seat_no in database
                if seat_no in existing_seat_nos:
                    duplicates.append(f'Row {row_num}: Certificate with seat_no \"{seat_no}\" already exists in database')
                    continue
                
                # Check for duplicate seat_no within current batch
                if seat_no in processed_seat_nos:
                    duplicates.append(f'Row {row_num}: Duplicate seat_no \"{seat_no}\" found in CSV file at multiple rows')
                    continue
                
                # Additional data validation
                if len(seat_no) > 50:  # Assuming max length constraint
                    validation_errors.append(f'Row {row_num}: seat_no too long (max 50 characters)')
                    continue
                    
                if len(student_name) > 255:
                    validation_errors.append(f'Row {row_num}: student_name too long (max 255 characters)')
                    continue
                    
                if len(mother_name) > 255:
                    validation_errors.append(f'Row {row_num}: mother_name too long (max 255 characters)')
                    continue
                    
                if len(subject) > 255:
                    validation_errors.append(f'Row {row_num}: subject too long (max 255 characters)')
                    continue
                    
                if len(result_date) > 50:
                    validation_errors.append(f'Row {row_num}: result_date too long (max 50 characters)')
                    continue
                
                # Store validated certificate data
                validated_certificates.append({
                    'seat_no': seat_no,
                    'student_name': student_name,
                    'mother_name': mother_name,
                    'sgpa': sgpa,
                    'result_date': result_date,
                    'subject': subject,
                    'row_num': row_num
                })
                
                processed_seat_nos.add(seat_no)
                
            except Exception as e:
                validation_errors.append(f'Row {row_num}: Unexpected error - {str(e)}')
                continue
        
        # If no valid certificates to process, return error
        if not validated_certificates:
            return jsonify({
                'error': 'No valid certificates found in CSV file',
                'total_rows': len(df),
                'validation_errors': validation_errors[:20],
                'duplicates': duplicates[:20]
            }), 400
        
        # Begin database transaction for atomic bulk insert
        success_count = 0
        db_errors = []
        
        try:
            # Use bulk insert for better performance and consistency
            certificate_objects = []
            
            for cert_data in validated_certificates:
                certificate = Certificate(
                    seat_no=cert_data['seat_no'],
                    student_name=cert_data['student_name'],
                    mother_name=cert_data['mother_name'],
                    sgpa=cert_data['sgpa'],
                    result_date=cert_data['result_date'],
                    subject=cert_data['subject'],
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                certificate_objects.append(certificate)
            
            # Bulk insert all certificates
            db.session.bulk_save_objects(certificate_objects)
            db.session.commit()
            success_count = len(certificate_objects)
            
            current_user = get_current_user()
            app.logger.info(f"Bulk upload successful: {success_count} certificates added by user {current_user.get('username', 'unknown') if current_user else 'unknown'}")
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Bulk upload database error: {str(e)}")
            return jsonify({
                'error': f'Database transaction failed: {str(e)}',
                'message': 'No certificates were added due to database error'
            }), 500
        
        # Prepare comprehensive response
        total_errors = len(validation_errors) + len(duplicates)
        response = {
            'message': f'Bulk upload completed successfully: {success_count} certificates added',
            'success_count': success_count,
            'error_count': total_errors,
            'total_rows_processed': len(df),
            'validation_errors': validation_errors[:20],
            'duplicates': duplicates[:20]
        }
        
        if total_errors > 0:
            response['warning'] = f'{total_errors} rows had errors and were skipped'
            
        if len(validation_errors) > 20:
            response['validation_errors'].append(f'... and {len(validation_errors) - 20} more validation errors')
            
        if len(duplicates) > 20:
            response['duplicates'].append(f'... and {len(duplicates) - 20} more duplicates')
        
        return jsonify(response), 200 if success_count > 0 else 400
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Bulk upload error: {str(e)}")
        return jsonify({'error': f'Bulk upload failed: {str(e)}'}), 500


@app.route('/api/certificates/csv-template')
@token_required
@admin_required
def download_csv_template():
    """Download a sample CSV template for bulk certificate upload"""
    
    # Create sample data
    sample_data = {
        'seat_no': ['S1900508770', 'S1900508771', 'S1900508772'],
        'student_name': ['John Doe', 'Jane Smith', 'Robert Johnson'],
        'mother_name': ['Mary Doe', 'Susan Smith', 'Linda Johnson'],
        'sgpa': [9.59, 8.75, 9.12],
        'result_date': ['31 January 2025', '15 February 2025', '28 March 2025'],
        'subject': ['Information Technology', 'Computer Science', 'Electronics Engineering']
    }
    
    # Create DataFrame
    df = pd.DataFrame(sample_data)
    
    # Convert to CSV
    output = StringIO()
    df.to_csv(output, index=False)
    
    # Create response
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename=certificate_template.csv'
    
    return response


@app.route('/api/verification-history')
@token_required
@admin_required
def get_verification_history():
    """Get verification history (admin only)"""

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        logs = VerificationLog.query.order_by(
            VerificationLog.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats')
def get_stats():
    """Get verification statistics"""
    try:
        days = request.args.get('days', 30, type=int)
        stats = verifier.get_verification_stats(days)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/certificate/<certificate_id>')
def get_certificate_details(certificate_id):
    """Get certificate details by ID"""
    try:
        certificate = Certificate.query.get_or_404(certificate_id)
        return jsonify(certificate.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/fraud-logs')
@token_required
@admin_required
def get_fraud_logs():
    """Get fraud detection logs (admin only)"""

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status', '')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        # Build query - exclude blacklisted items
        query = FraudDetectionLog.query.outerjoin(
            Blacklist, FraudDetectionLog.id == Blacklist.fraud_detection_log_id
        ).filter(
            Blacklist.fraud_detection_log_id.is_(None)  # Only include non-blacklisted items
        )
        
        # Apply status filter
        if status_filter and status_filter in ['FAKE', 'SUSPICIOUS']:
            query = query.filter(FraudDetectionLog.fraud_status == status_filter)
        
        # Apply date filters
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(FraudDetectionLog.detected_at >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d')
                # Add one day to include the entire day
                to_date = to_date.replace(hour=23, minute=59, second=59)
                query = query.filter(FraudDetectionLog.detected_at <= to_date)
            except ValueError:
                pass
        
        # Order by most recent first
        query = query.order_by(FraudDetectionLog.detected_at.desc())
        
        # Paginate
        fraud_logs = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'fraud_logs': [log.to_dict() for log in fraud_logs.items],
            'total': fraud_logs.total,
            'pages': fraud_logs.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': fraud_logs.has_next,
            'has_prev': fraud_logs.has_prev
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/fraud-logs/<int:fraud_id>', methods=['PUT'])
@token_required
@admin_required
def update_fraud_log(fraud_id):
    """Update fraud log with admin review (admin only)"""

    try:
        fraud_log = FraudDetectionLog.query.get_or_404(fraud_id)
        data = request.get_json()
        
        if 'admin_notes' in data:
            fraud_log.admin_notes = data['admin_notes']
        
        if 'reviewed_by_admin' in data:
            fraud_log.reviewed_by_admin = data['reviewed_by_admin']
            if data['reviewed_by_admin']:
                fraud_log.reviewed_at = datetime.now(timezone.utc)
        
        db.session.commit()
        return jsonify(fraud_log.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/fraud-logs/stats')
@token_required
@admin_required
def get_fraud_stats():
    """Get fraud detection statistics (admin only)"""

    try:
        from sqlalchemy import func
        
        # Get counts by status - exclude blacklisted items
        status_counts = db.session.query(
            FraudDetectionLog.fraud_status, 
            func.count(FraudDetectionLog.id)
        ).outerjoin(
            Blacklist, FraudDetectionLog.id == Blacklist.fraud_detection_log_id
        ).filter(
            Blacklist.fraud_detection_log_id.is_(None)
        ).group_by(FraudDetectionLog.fraud_status).all()
        
        # Get daily counts for last 30 days - exclude blacklisted items
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        daily_counts = db.session.query(
            func.date(FraudDetectionLog.detected_at).label('date'),
            func.count(FraudDetectionLog.id).label('count')
        ).outerjoin(
            Blacklist, FraudDetectionLog.id == Blacklist.fraud_detection_log_id
        ).filter(
            FraudDetectionLog.detected_at >= thirty_days_ago,
            Blacklist.fraud_detection_log_id.is_(None)
        ).group_by(
            func.date(FraudDetectionLog.detected_at)
        ).all()
        
        # Get review status - exclude blacklisted items
        total_fraud = FraudDetectionLog.query.outerjoin(
            Blacklist, FraudDetectionLog.id == Blacklist.fraud_detection_log_id
        ).filter(
            Blacklist.fraud_detection_log_id.is_(None)
        ).count()
        
        reviewed_count = FraudDetectionLog.query.outerjoin(
            Blacklist, FraudDetectionLog.id == Blacklist.fraud_detection_log_id
        ).filter(
            FraudDetectionLog.reviewed_by_admin == True,
            Blacklist.fraud_detection_log_id.is_(None)
        ).count()
        
        return jsonify({
            'total_fraud_attempts': total_fraud,
            'reviewed_count': reviewed_count,
            'pending_review': total_fraud - reviewed_count,
            'status_distribution': dict(status_counts),
            'daily_counts': [{
                'date': str(date),
                'count': count
            } for date, count in daily_counts],
            'review_percentage': round((reviewed_count / total_fraud * 100) if total_fraud > 0 else 0, 1)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/fraud-logs/export')
@token_required
@admin_required
def export_fraud_logs():
    """Export fraud logs as CSV (admin only)"""

    try:
        status_filter = request.args.get('status', '')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        # Build query (same as get_fraud_logs but without pagination) - exclude blacklisted items
        query = FraudDetectionLog.query.outerjoin(
            Blacklist, FraudDetectionLog.id == Blacklist.fraud_detection_log_id
        ).filter(
            Blacklist.fraud_detection_log_id.is_(None)  # Only include non-blacklisted items
        )
        
        # Apply status filter
        if status_filter and status_filter in ['FAKE', 'SUSPICIOUS']:
            query = query.filter(FraudDetectionLog.fraud_status == status_filter)
        
        # Apply date filters
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(FraudDetectionLog.detected_at >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d')
                to_date = to_date.replace(hour=23, minute=59, second=59)
                query = query.filter(FraudDetectionLog.detected_at <= to_date)
            except ValueError:
                pass
        
        # Order by most recent first
        fraud_logs = query.order_by(FraudDetectionLog.detected_at.desc()).all()
        
        # Prepare CSV data
        csv_data = []
        csv_headers = [
            'ID', 'Detection Date', 'Status', 'Confidence Score', 'Seat No',
            'Student Name', 'Mother Name', 'SGPA', 'Subject', 'Result Date',
            'Detection Reason', 'IP Address', 'Filename', 'Reviewed', 'Admin Notes'
        ]
        
        csv_data.append(csv_headers)
        
        for log in fraud_logs:
            try:
                # Parse detection reason from JSON
                import json as json_lib
                reasons = json_lib.loads(log.detection_reason) if log.detection_reason else []
                reason_text = '; '.join(reasons) if isinstance(reasons, list) else str(reasons)
            except:
                reason_text = log.detection_reason or ''
            
            row = [
                log.id,
                log.detected_at.strftime('%Y-%m-%d %H:%M:%S') if log.detected_at else '',
                log.fraud_status,
                round(log.confidence_score, 3) if log.confidence_score else '',
                log.extracted_seat_no or '',
                log.extracted_student_name or '',
                log.extracted_mother_name or '',
                log.extracted_sgpa or '',
                log.extracted_subject or '',
                log.extracted_result_date or '',
                reason_text,
                log.ip_address or '',
                log.uploaded_filename or '',
                'Yes' if log.reviewed_by_admin else 'No',
                log.admin_notes or ''
            ]
            csv_data.append(row)
        
        # Create CSV content
        csv_output = StringIO()
        import csv
        writer = csv.writer(csv_output)
        writer.writerows(csv_data)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'fraud_detection_logs_{timestamp}.csv'
        
        # Create response
        response = make_response(csv_output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}'
        
        return response

    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500


@app.route('/api/blacklist', methods=['POST'])
@token_required
@admin_required
def add_to_blacklist():
    """Add a fraud detection log to the blacklist (admin only)"""
    
    try:
        data = request.get_json()
        fraud_log_id = data.get('fraud_detection_log_id')
        blacklist_reason = data.get('blacklist_reason', '')
        auto_block_seat_no = data.get('auto_block_seat_no', True)
        auto_block_name_combo = data.get('auto_block_name_combo', False)
        
        if not fraud_log_id:
            return jsonify({'error': 'fraud_detection_log_id is required'}), 400
        
        # Check if fraud log exists and is FAKE
        fraud_log = FraudDetectionLog.query.get_or_404(fraud_log_id)
        if fraud_log.fraud_status != 'FAKE':
            return jsonify({'error': 'Only FAKE certificates can be blacklisted'}), 400
        
        # Check if already blacklisted
        existing_blacklist = Blacklist.query.filter_by(fraud_detection_log_id=fraud_log_id).first()
        if existing_blacklist:
            return jsonify({'error': 'This fraud log is already blacklisted'}), 400
        
        # Get current user
        current_user = get_current_user()
        
        # Create blacklist entry
        blacklist_entry = Blacklist(
            fraud_detection_log_id=fraud_log_id,
            blacklisted_by=current_user.get('user_id'),  # Use 'user_id' from JWT payload
            blacklist_reason=blacklist_reason,
            auto_block_seat_no=auto_block_seat_no,
            auto_block_name_combo=auto_block_name_combo,
            blacklisted_at=datetime.now(timezone.utc)
        )
        
        db.session.add(blacklist_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Certificate added to blacklist successfully',
            'blacklist_entry': blacklist_entry.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Blacklist creation error: {str(e)}")
        return jsonify({'error': f'Failed to add to blacklist: {str(e)}'}), 500


@app.route('/api/blacklist', methods=['GET'])
@token_required
@admin_required
def get_blacklist():
    """Get blacklisted certificates (admin only)"""
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query with joins
        query = Blacklist.query.join(
            FraudDetectionLog, Blacklist.fraud_detection_log_id == FraudDetectionLog.id
        ).filter(Blacklist.is_active == True)
        
        # Order by most recent first
        query = query.order_by(Blacklist.blacklisted_at.desc())
        
        # Paginate
        blacklist_items = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'blacklist_items': [item.to_dict() for item in blacklist_items.items],
            'total': blacklist_items.total,
            'pages': blacklist_items.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': blacklist_items.has_next,
            'has_prev': blacklist_items.has_prev
        }), 200
        
    except Exception as e:
        app.logger.error(f"Get blacklist error: {str(e)}")
        return jsonify({'error': f'Failed to get blacklist: {str(e)}'}), 500


@app.route('/api/blacklist/<int:fraud_log_id>', methods=['DELETE'])
@token_required
@admin_required
def remove_from_blacklist(fraud_log_id):
    """Remove a certificate from blacklist (admin only)"""
    
    try:
        blacklist_entry = Blacklist.query.filter_by(fraud_detection_log_id=fraud_log_id).first()
        if not blacklist_entry:
            return jsonify({'error': 'Blacklist entry not found'}), 404
        
        # Soft delete by setting is_active to False
        blacklist_entry.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Certificate removed from blacklist successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Remove from blacklist error: {str(e)}")
        return jsonify({'error': f'Failed to remove from blacklist: {str(e)}'}), 500


@app.route('/api/blacklist/stats')
@token_required
@admin_required
def get_blacklist_stats():
    """Get blacklist statistics (admin only)"""
    
    try:
        from sqlalchemy import func
        
        # Get total blacklisted count
        total_blacklisted = Blacklist.query.filter_by(is_active=True).count()
        
        # Get counts by auto-block settings
        auto_block_seat_count = Blacklist.query.filter_by(
            is_active=True, auto_block_seat_no=True
        ).count()
        
        auto_block_name_count = Blacklist.query.filter_by(
            is_active=True, auto_block_name_combo=True
        ).count()
        
        # Get daily blacklist counts for last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        daily_counts = db.session.query(
            func.date(Blacklist.blacklisted_at).label('date'),
            func.count(Blacklist.fraud_detection_log_id).label('count')
        ).filter(
            Blacklist.blacklisted_at >= thirty_days_ago,
            Blacklist.is_active == True
        ).group_by(
            func.date(Blacklist.blacklisted_at)
        ).all()
        
        return jsonify({
            'total_blacklisted': total_blacklisted,
            'auto_block_seat_count': auto_block_seat_count,
            'auto_block_name_count': auto_block_name_count,
            'daily_counts': [{
                'date': str(date),
                'count': count
            } for date, count in daily_counts]
        }), 200
        
    except Exception as e:
        app.logger.error(f"Get blacklist stats error: {str(e)}")
        return jsonify({'error': f'Failed to get blacklist stats: {str(e)}'}), 500


@app.route('/api/certificates/bulk-approve', methods=['POST'])
@token_required
@admin_required
def bulk_approve_certificates():
    """Approve and insert bulk processed files (CSV and OCR data)"""

    try:
        data = request.get_json()
        if not data or 'items' not in data:
            return jsonify({'error': 'No items provided for approval'}), 400

        items = data['items']
        if not items:
            return jsonify({'error': 'Empty items list'}), 400

        validated_certificates = []
        validation_errors = []
        duplicates = []
        
        # Get existing seat numbers to check for duplicates
        existing_seat_nos = set(cert.seat_no for cert in Certificate.query.with_entities(Certificate.seat_no).all())
        processed_seat_nos = set()
        
        for idx, item in enumerate(items):
            try:
                source = item.get('source', 'unknown')
                filename = item.get('filename', f'item_{idx}')
                item_data = item.get('data', {})
                
                if source == 'csv':
                    # Handle CSV record
                    cert_data = item_data
                elif source == 'ocr':
                    # Handle OCR extracted data
                    cert_data = item_data
                    confidence = item.get('confidence', 0)
                    if confidence < 0.5:
                        validation_errors.append(f'{filename}: Low OCR confidence ({confidence:.1%})')
                        continue
                else:
                    validation_errors.append(f'{filename}: Unknown source type: {source}')
                    continue
                
                # Validate and normalize certificate data
                seat_no = str(cert_data.get('seat_no', '')).strip().upper()
                student_name = str(cert_data.get('student_name', '')).strip().title()
                mother_name = str(cert_data.get('mother_name', '')).strip().title()
                subject = str(cert_data.get('subject', '')).strip()
                result_date = str(cert_data.get('result_date', '')).strip()
                
                # Validate SGPA
                try:
                    sgpa_value = cert_data.get('sgpa')
                    if sgpa_value is None or sgpa_value == '':
                        validation_errors.append(f'{filename}: SGPA is required')
                        continue
                    sgpa = float(sgpa_value)
                    if sgpa < 0 or sgpa > 10:
                        validation_errors.append(f'{filename}: SGPA must be between 0 and 10, got {sgpa}')
                        continue
                    sgpa = round(sgpa, 2)
                except (ValueError, TypeError):
                    validation_errors.append(f'{filename}: Invalid SGPA value "{sgpa_value}", must be a number')
                    continue
                
                # Validate required fields
                missing_fields = []
                if not seat_no: missing_fields.append('seat_no')
                if not student_name: missing_fields.append('student_name')
                if not mother_name: missing_fields.append('mother_name')
                if not subject: missing_fields.append('subject')
                if not result_date: missing_fields.append('result_date')
                
                if missing_fields:
                    validation_errors.append(f'{filename}: Missing required fields: {", ".join(missing_fields)}')
                    continue
                
                # Check for duplicates
                if seat_no in existing_seat_nos:
                    duplicates.append(f'{filename}: Certificate with seat_no "{seat_no}" already exists')
                    continue
                    
                if seat_no in processed_seat_nos:
                    duplicates.append(f'{filename}: Duplicate seat_no "{seat_no}" in current batch')
                    continue
                
                # Validate field lengths
                if len(seat_no) > 50:
                    validation_errors.append(f'{filename}: seat_no too long (max 50 characters)')
                    continue
                if len(student_name) > 255:
                    validation_errors.append(f'{filename}: student_name too long (max 255 characters)')
                    continue
                if len(mother_name) > 255:
                    validation_errors.append(f'{filename}: mother_name too long (max 255 characters)')
                    continue
                if len(subject) > 255:
                    validation_errors.append(f'{filename}: subject too long (max 255 characters)')
                    continue
                if len(result_date) > 50:
                    validation_errors.append(f'{filename}: result_date too long (max 50 characters)')
                    continue
                
                # Store validated certificate
                validated_certificates.append({
                    'seat_no': seat_no,
                    'student_name': student_name,
                    'mother_name': mother_name,
                    'sgpa': sgpa,
                    'result_date': result_date,
                    'subject': subject,
                    'source': source,
                    'filename': filename
                })
                
                processed_seat_nos.add(seat_no)
                
            except Exception as e:
                validation_errors.append(f'{filename}: Processing error - {str(e)}')
                continue
        
        # If no valid certificates, return error
        if not validated_certificates:
            return jsonify({
                'error': 'No valid certificates to approve',
                'validation_errors': validation_errors[:20],
                'duplicates': duplicates[:20]
            }), 400
        
        # Insert certificates into database
        success_count = 0
        try:
            certificate_objects = []
            
            for cert_data in validated_certificates:
                certificate = Certificate(
                    seat_no=cert_data['seat_no'],
                    student_name=cert_data['student_name'],
                    mother_name=cert_data['mother_name'],
                    sgpa=cert_data['sgpa'],
                    result_date=cert_data['result_date'],
                    subject=cert_data['subject'],
                    is_active=True,
                    created_at=datetime.now(timezone.utc)
                )
                certificate_objects.append(certificate)
            
            # Bulk insert
            db.session.bulk_save_objects(certificate_objects)
            db.session.commit()
            success_count = len(certificate_objects)
            
            current_user = get_current_user()
            app.logger.info(f"Bulk approval successful: {success_count} certificates added by {current_user.get('username', 'unknown') if current_user else 'unknown'}")
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Bulk approval database error: {str(e)}")
            return jsonify({
                'error': f'Database transaction failed: {str(e)}',
                'message': 'No certificates were added due to database error'
            }), 500
        
        # Prepare response
        total_errors = len(validation_errors) + len(duplicates)
        response = {
            'message': f'Bulk approval completed: {success_count} certificates added',
            'success_count': success_count,
            'error_count': total_errors,
            'total_items_processed': len(items),
            'validation_errors': validation_errors[:20],
            'duplicates': duplicates[:20]
        }
        
        if total_errors > 0:
            response['warning'] = f'{total_errors} items had errors and were skipped'
        
        if len(validation_errors) > 20:
            response['validation_errors'].append(f'... and {len(validation_errors) - 20} more validation errors')
        
        if len(duplicates) > 20:
            response['duplicates'].append(f'... and {len(duplicates) - 20} more duplicates')
        
        return jsonify(response), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Bulk approval error: {str(e)}")
        return jsonify({'error': f'Bulk approval failed: {str(e)}'}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(413)
def too_large(error):
    return jsonify({'error': 'File too large'}), 413


# Health check
@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': '1.0.0'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
