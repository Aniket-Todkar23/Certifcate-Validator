from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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
    id = db.Column(db.Integer, primary_key=True)
    seat_no = db.Column(db.String(50), unique=True, nullable=False)
    student_name = db.Column(db.String(255), nullable=False)
    mother_name = db.Column(db.String(255), nullable=False)
    college_name = db.Column(db.String(255), nullable=False)
    sgpa = db.Column(db.Float, nullable=False)
    result_date = db.Column(db.String(50), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'seat_no': self.seat_no,
            'student_name': self.student_name,
            'mother_name': self.mother_name,
            'college_name': self.college_name,
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

class AdminUser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
