#!/usr/bin/env python3
""" Main Flask Application for Certificate Validator
Handles all API endpoints and web interface """

import os
import tempfile
from datetime import datetime
from flask import Flask, request, render_template, jsonify, redirect, url_for, flash, session
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
import json

from models import db, Institution, Certificate, AdminUser, VerificationLog
from ocr_processor import OCRProcessor
from verifier import CertificateVerifier

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'  # Change in production

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///certificate_validator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
db.init_app(app)

# Initialize processors
ocr_processor = OCRProcessor()
verifier = CertificateVerifier()

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_client_info():
    """Get client IP and user agent for logging"""
    return {
        'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR')),
        'user_agent': request.headers.get('User-Agent')
    }


# Web Routes
@app.route('/')
def index():
    """Main page for certificate verification"""
    return render_template('index.html')


@app.route('/admin')
def admin_dashboard():
    """Admin dashboard"""
    # Simple session-based auth for MVP (implement proper auth in production)
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    # Get statistics
    stats = verifier.get_verification_stats(30)
    recent_logs = VerificationLog.query.order_by(VerificationLog.created_at.desc()).limit(10).all()
    return render_template('admin.html', stats=stats, recent_logs=recent_logs)


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Simple authentication for MVP (use proper hashing in production)
        admin = AdminUser.query.filter_by(username=username, is_active=True).first()
        if admin and admin.password_hash == password:  # In production, use proper password hashing
            session['admin_logged_in'] = True
            session['admin_user'] = username
            flash('Successfully logged in!', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid credentials!', 'error')

    return render_template('admin_login.html')


@app.route('/admin/logout')
def admin_logout():
    """Admin logout"""
    session.clear()
    flash('Successfully logged out!', 'success')
    return redirect(url_for('index'))


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
def add_institution():
    """Add new institution (admin only)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Admin access required'}), 401

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
def ocr_extract():
    """OCR extraction endpoint for admin use"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Admin access required'}), 401

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
def add_certificate():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Admin access required'}), 401

    try:
        data = request.get_json()
        required_fields = ['seat_no', 'student_name', 'mother_name', 'college_name', 'sgpa', 'result_date', 'subject']
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
            college_name=data['college_name'],
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


@app.route('/api/verification-history')
def get_verification_history():
    """Get verification history (admin only)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Admin access required'}), 401

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
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500


if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
