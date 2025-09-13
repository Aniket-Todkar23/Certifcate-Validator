from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import CheckConstraint, Index

db = SQLAlchemy()

class Institution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    address = db.Column(db.Text)
    contact_email = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    established_year = db.Column(db.Integer)
    accreditation = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'address': self.address,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'established_year': self.established_year,
            'accreditation': self.accreditation,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Certificate(db.Model):
    __tablename__ = 'certificate'
    
    id = db.Column(db.Integer, primary_key=True)
    seat_no = db.Column(db.String(50), unique=True, nullable=False, index=True)
    student_name = db.Column(db.String(255), nullable=False)
    mother_name = db.Column(db.String(255), nullable=False)
    sgpa = db.Column(db.Float, nullable=False)
    result_date = db.Column(db.String(50), nullable=False)
    subject = db.Column(db.String(255), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Add database constraints for data integrity
    __table_args__ = (
        CheckConstraint('sgpa >= 0 AND sgpa <= 10', name='check_sgpa_range'),
        CheckConstraint('LENGTH(TRIM(seat_no)) > 0', name='check_seat_no_not_empty'),
        CheckConstraint('LENGTH(TRIM(student_name)) > 0', name='check_student_name_not_empty'),
        CheckConstraint('LENGTH(TRIM(mother_name)) > 0', name='check_mother_name_not_empty'),
        CheckConstraint('LENGTH(TRIM(subject)) > 0', name='check_subject_not_empty'),
        CheckConstraint('LENGTH(TRIM(result_date)) > 0', name='check_result_date_not_empty'),
        Index('idx_certificate_search', 'student_name', 'seat_no'),
        Index('idx_certificate_subject', 'subject'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'seat_no': self.seat_no,
            'student_name': self.student_name,
            'mother_name': self.mother_name,
            'sgpa': self.sgpa,
            'result_date': self.result_date,
            'subject': self.subject,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class VerificationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uploaded_filename = db.Column(db.String(255))
    extracted_text = db.Column(db.Text)
    verification_result = db.Column(db.String(50))
    confidence_score = db.Column(db.Float)
    anomalies_detected = db.Column(db.Text)
    matched_certificate_id = db.Column(db.Integer, db.ForeignKey('certificate.id'), nullable=True)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    extracted_student_name = db.Column(db.String(255))
    extracted_institution = db.Column(db.String(255))
    extracted_subject = db.Column(db.String(255))
    extracted_result_date = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'uploaded_filename': self.uploaded_filename,
            'verification_result': self.verification_result,
            'confidence_score': self.confidence_score,
            'anomalies_detected': self.anomalies_detected,
            'matched_certificate_id': self.matched_certificate_id,
            'extracted_student_name': self.extracted_student_name,
            'extracted_institution': self.extracted_institution,
            'extracted_subject': self.extracted_subject,
            'extracted_result_date': self.extracted_result_date,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class User(db.Model):
    """User model with role-based access control"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100))
    full_name = db.Column(db.String(255))
    role = db.Column(db.String(20), nullable=False, default='verifier')  # admin, verifier
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'verifier')", name='check_valid_role'),
        Index('idx_user_role', 'role'),
        Index('idx_user_active', 'is_active'),
    )

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
            
        return data

# Legacy AdminUser for backward compatibility
class AdminUser(User):
    """Legacy admin user model - deprecated, use User instead"""
    __mapper_args__ = {
        'polymorphic_identity': 'admin'
    }

class FraudDetectionLog(db.Model):
    __tablename__ = 'fraud_detection_log'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Certificate data from the fraudulent submission
    extracted_seat_no = db.Column(db.String(50), nullable=True)
    extracted_student_name = db.Column(db.String(255), nullable=True)
    extracted_mother_name = db.Column(db.String(255), nullable=True)
    extracted_sgpa = db.Column(db.Float, nullable=True)
    extracted_result_date = db.Column(db.String(50), nullable=True)
    extracted_subject = db.Column(db.String(255), nullable=True)
    
    # Detection details
    fraud_status = db.Column(db.String(20), nullable=False)  # FAKE, SUSPICIOUS
    confidence_score = db.Column(db.Float, nullable=False)
    detection_reason = db.Column(db.Text, nullable=False)  # JSON array of anomalies
    
    # Original submission details
    uploaded_filename = db.Column(db.String(255), nullable=True)
    raw_extracted_text = db.Column(db.Text, nullable=True)
    
    # Request metadata
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    
    # Related verification log entry
    verification_log_id = db.Column(db.Integer, db.ForeignKey('verification_log.id'), nullable=True)
    
    # Timestamps
    detected_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Admin actions
    reviewed_by_admin = db.Column(db.Boolean, default=False)
    admin_notes = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'extracted_seat_no': self.extracted_seat_no,
            'extracted_student_name': self.extracted_student_name,
            'extracted_mother_name': self.extracted_mother_name,
            'extracted_sgpa': self.extracted_sgpa,
            'extracted_result_date': self.extracted_result_date,
            'extracted_subject': self.extracted_subject,
            'fraud_status': self.fraud_status,
            'confidence_score': self.confidence_score,
            'detection_reason': self.detection_reason,
            'uploaded_filename': self.uploaded_filename,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'verification_log_id': self.verification_log_id,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'reviewed_by_admin': self.reviewed_by_admin,
            'admin_notes': self.admin_notes,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }
