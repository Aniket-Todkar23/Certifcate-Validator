#!/usr/bin/env python3
""" Simplified Certificate Verifier for Minimal Field Validation """

from typing import Dict
from fuzzywuzzy import fuzz
from models import db, Certificate, Institution, VerificationLog
from datetime import datetime, timedelta
import json

class CertificateVerifier:
    def __init__(self):
        self.verification_thresholds = {
            'name_similarity': 85,
            'institution_similarity': 85,
            'overall_confidence': 0.6
        }

    def verify_certificate(self, extracted_data: Dict[str, any]) -> Dict[str, any]:
        result = {
            'status': 'UNKNOWN',
            'confidence': 0.0,
            'matched_certificate': None,
            'anomalies': [],
            'institution_verified': False
        }
        try:
            matched_cert = Certificate.query.filter_by(
                seat_no=extracted_data.get('seat_no'),
                is_active=True
            ).first()

            if matched_cert:
                result.update(self.verify_direct_match(matched_cert, extracted_data))
                return result

            institution_check = self.verify_institution(extracted_data)
            result['institution_verified'] = institution_check['verified']

            if institution_check['verified']:
                result['status'] = 'SUSPICIOUS'
                result['confidence'] = 0.4
                result['anomalies'].append('No matching certificate, but institution verified')
            else:
                result['status'] = 'FAKE'
                result['confidence'] = 0.1
                result['anomalies'].append('Institution not found')

            return result
        except Exception as e:
            result['status'] = 'ERROR'
            result['anomalies'].append(f'Verification error: {str(e)}')
            return result

    def verify_direct_match(self, certificate: Certificate, extracted_data: Dict[str, any]) -> Dict[str, any]:
        anomalies = []
        confidence_factors = []

        if extracted_data.get('student_name'):
            similarity = fuzz.ratio(
                extracted_data['student_name'].lower(),
                certificate.student_name.lower()
            )
            confidence_factors.append(0.9 if similarity >= self.verification_thresholds['name_similarity'] else 0.4)
            if similarity < self.verification_thresholds['name_similarity']:
                anomalies.append('Student name mismatch')

        if extracted_data.get('mother_name') and certificate.mother_name:
            similarity = fuzz.ratio(
                extracted_data['mother_name'].lower(),
                certificate.mother_name.lower()
            )
            confidence_factors.append(0.9 if similarity >= self.verification_thresholds['name_similarity'] else 0.4)
            if similarity < self.verification_thresholds['name_similarity']:
                anomalies.append('Mother name mismatch')

        if extracted_data.get('college_name') and certificate.institution:
            similarity = fuzz.ratio(
                extracted_data['college_name'].lower(),
                certificate.institution.name.lower()
            )
            confidence_factors.append(0.9 if similarity >= self.verification_thresholds['institution_similarity'] else 0.4)
            if similarity < self.verification_thresholds['institution_similarity']:
                anomalies.append('College name mismatch')

        if extracted_data.get('sgpa') and certificate.sgpa:
            confidence_factors.append(
                0.9 if abs(extracted_data['sgpa'] - certificate.sgpa) <= 0.5 else 0.4
            )
            if abs(extracted_data['sgpa'] - certificate.sgpa) > 0.5:
                anomalies.append('SGPA mismatch')

        try:
            datetime.strptime(extracted_data['result_date'], '%d %B %Y')
            confidence_factors.append(0.9)
        except:
            anomalies.append('Invalid result date format')
            confidence_factors.append(0.5)

        avg_confidence = sum(confidence_factors) / len(confidence_factors)
        status = 'AUTHENTIC' if avg_confidence >= self.verification_thresholds['overall_confidence'] and not anomalies else 'SUSPICIOUS'

        return {
            'status': status,
            'confidence': avg_confidence,
            'matched_certificate': certificate.to_dict(),
            'anomalies': anomalies,
            'institution_verified': True
        }

    def verify_institution(self, extracted_data: Dict[str, any]) -> Dict[str, any]:
        institution_name = extracted_data.get('college_name')
        if not institution_name:
            return {'verified': False}

        direct_match = Institution.query.filter(
            Institution.is_active == True,
            Institution.name.ilike(f'%{institution_name}%')
        ).first()

        if direct_match:
            return {'verified': True, 'institution': direct_match.to_dict(), 'similarity': 100}

        return {'verified': False}

    def get_verification_stats(self, days: int = 30) -> Dict[str, any]:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        from sqlalchemy import func

        status_counts = db.session.query(
            VerificationLog.verification_result, func.count(VerificationLog.id)
        ).filter(
            VerificationLog.created_at >= cutoff_date
        ).group_by(VerificationLog.verification_result).all()

        avg_confidence = db.session.query(
            VerificationLog.verification_result, func.avg(VerificationLog.confidence_score)
        ).filter(
            VerificationLog.created_at >= cutoff_date
        ).group_by(VerificationLog.verification_result).all()

        return {
            'total_verifications': sum(count for _, count in status_counts),
            'status_distribution': dict(status_counts),
            'average_confidence': dict(avg_confidence),
            'period_days': days
        }

    def log_verification(self, extracted_data: Dict[str, any], result: Dict[str, any],
                         filename: str, raw_text: str,
                         ip_address: str = None, user_agent: str = None) -> VerificationLog:
        log_entry = VerificationLog(
            uploaded_filename=filename,
            extracted_text=raw_text,
            verification_result=result['status'],
            confidence_score=result['confidence'],
            anomalies_detected=json.dumps(result['anomalies']),
            matched_certificate_id=result['matched_certificate']['id'] if result.get('matched_certificate') else None,
            ip_address=ip_address,
            user_agent=user_agent,
            extracted_student_name=extracted_data.get('student_name'),
            extracted_institution=extracted_data.get('college_name'),
            extracted_subject=extracted_data.get('subject'),
            extracted_result_date=extracted_data.get('result_date')
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry
