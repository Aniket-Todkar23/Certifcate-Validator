#!/usr/bin/env python3
""" Simplified Certificate Verifier for Minimal Field Validation """

from typing import Dict
from fuzzywuzzy import fuzz
from models import db, Certificate, Institution, VerificationLog, FraudDetectionLog
from datetime import datetime, timedelta
import json
import re

class CertificateVerifier:
    def __init__(self):
        self.verification_thresholds = {
            'name_similarity': 80,  # Lowered from 85 to be more forgiving with OCR variations
            'authentic_threshold': 0.8,    # 80% - High confidence for authentic (VERIFIED)
            'suspicious_threshold': 0.5    # 50% - Medium confidence for suspicious
            # Below 50% = FRAUD/FAKE
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

            # No college verification - mark as FAKE if no direct match found
            result['status'] = 'FAKE'
            result['confidence'] = 0.1
            result['anomalies'].append('No matching certificate found')
            result['institution_verified'] = False

            return result
        except Exception as e:
            result['status'] = 'ERROR'
            result['anomalies'].append(f'Verification error: {str(e)}')
            return result

    def normalize_name(self, name: str) -> str:
        """Improved name normalization for better OCR handling"""
        if not name:
            return ""
        
        # Convert to lowercase and strip whitespace
        name = name.strip().lower()
        
        # Remove common OCR artifacts and punctuation
        name = re.sub(r'[^a-zA-Z0-9\s]', ' ', name)  # Replace punctuation with spaces
        name = re.sub(r'\s+', ' ', name)  # Normalize multiple spaces
        
        # Handle common OCR character confusions
        ocr_replacements = {
            '0': 'o',   # Zero to O
            '1': 'i',   # One to I  
            '5': 's',   # Five to S (sometimes)
            '8': 'b',   # Eight to B (sometimes)
            'rn': 'm',  # rn often misread as m
            'ii': 'u',  # ii sometimes misread as u
            'cl': 'd',  # cl sometimes misread as d
        }
        
        for old, new in ocr_replacements.items():
            name = name.replace(old, new)
        
        return name.strip()
    
    def enhanced_name_similarity(self, extracted_name: str, db_name: str) -> int:
        """Enhanced name matching with multiple strategies"""
        if not extracted_name or not db_name:
            return 0
        
        # Normalize both names
        norm_extracted = self.normalize_name(extracted_name)
        norm_db = self.normalize_name(db_name)
        
        # Strategy 1: Standard fuzzy matching
        ratio_sim = fuzz.ratio(norm_extracted, norm_db)
        partial_sim = fuzz.partial_ratio(norm_extracted, norm_db)
        token_sim = fuzz.token_sort_ratio(norm_extracted, norm_db)
        token_set_sim = fuzz.token_set_ratio(norm_extracted, norm_db)
        
        # Strategy 2: Try reversed order (first/last name swap)
        extracted_parts = norm_extracted.split()
        db_parts = norm_db.split()
        
        reversed_similarity = 0
        if len(extracted_parts) >= 2 and len(db_parts) >= 2:
            reversed_extracted = ' '.join(reversed(extracted_parts))
            reversed_ratio = fuzz.ratio(reversed_extracted, norm_db)
            reversed_token = fuzz.token_sort_ratio(reversed_extracted, norm_db)
            reversed_similarity = max(reversed_ratio, reversed_token)
        
        # Strategy 3: Initials matching (for cases like "M. SMITH" vs "MARY SMITH")
        initials_similarity = 0
        if len(extracted_parts) >= 1 and len(db_parts) >= 1:
            extracted_initials = ''.join([part[0] for part in extracted_parts if part])
            db_initials = ''.join([part[0] for part in db_parts if part])
            if len(extracted_initials) > 0 and len(db_initials) > 0:
                initials_similarity = fuzz.ratio(extracted_initials, db_initials)
        
        # Strategy 4: Longest common subsequence for very damaged OCR
        def lcs_similarity(s1, s2):
            """Calculate similarity based on longest common subsequence"""
            m, n = len(s1), len(s2)
            if m == 0 or n == 0:
                return 0
            
            # Simple LCS-based similarity
            dp = [[0] * (n + 1) for _ in range(m + 1)]
            for i in range(1, m + 1):
                for j in range(1, n + 1):
                    if s1[i-1] == s2[j-1]:
                        dp[i][j] = dp[i-1][j-1] + 1
                    else:
                        dp[i][j] = max(dp[i-1][j], dp[i][j-1])
            
            lcs_length = dp[m][n]
            return int((2.0 * lcs_length) / (m + n) * 100)
        
        lcs_sim = lcs_similarity(norm_extracted, norm_db)
        
        # Return the best similarity score from all strategies
        best_similarity = max(
            ratio_sim, partial_sim, token_sim, token_set_sim,
            reversed_similarity, initials_similarity, lcs_sim
        )
        
        return best_similarity
    
    def calculate_name_confidence_score(self, best_similarity: int) -> float:
        """Improved scoring system with more gradual thresholds"""
        if best_similarity >= 95:
            return 1.0
        elif best_similarity >= 90:
            return 0.95
        elif best_similarity >= 85:
            return 0.9
        elif best_similarity >= 80:
            return 0.85
        elif best_similarity >= 75:
            return 0.8
        elif best_similarity >= 70:
            return 0.75
        elif best_similarity >= 65:
            return 0.7
        elif best_similarity >= 60:
            return 0.65
        elif best_similarity >= 55:
            return 0.6
        elif best_similarity >= 50:
            return 0.55
        elif best_similarity >= 45:
            return 0.5
        elif best_similarity >= 40:
            return 0.45
        elif best_similarity >= 35:
            return 0.4
        else:
            return 0.3  # Only truly terrible matches get 30%
    
    def verify_direct_match(self, certificate: Certificate, extracted_data: Dict[str, any]) -> Dict[str, any]:
        anomalies = []
        confidence_scores = {}  # Store individual field scores with names

        # Student name verification with enhanced matching
        if extracted_data.get('student_name'):
            best_similarity = self.enhanced_name_similarity(
                extracted_data['student_name'], 
                certificate.student_name
            )
            
            student_name_score = self.calculate_name_confidence_score(best_similarity)
            confidence_scores['student_name'] = student_name_score
            
            if best_similarity < self.verification_thresholds['name_similarity']:
                anomalies.append(f'Student name mismatch (similarity: {best_similarity}%)')
        else:
            confidence_scores['student_name'] = 0.0
            anomalies.append('Student name not extracted')

        # Mother name verification with enhanced matching
        if extracted_data.get('mother_name') and certificate.mother_name:
            best_similarity = self.enhanced_name_similarity(
                extracted_data['mother_name'], 
                certificate.mother_name
            )
            
            mother_name_score = self.calculate_name_confidence_score(best_similarity)
            confidence_scores['mother_name'] = mother_name_score
            
            if best_similarity < self.verification_thresholds['name_similarity']:
                anomalies.append(f'Mother name mismatch (similarity: {best_similarity}%)')
        else:
            confidence_scores['mother_name'] = 0.5  # Neutral if not available
            if not extracted_data.get('mother_name'):
                anomalies.append('Mother name not extracted')

        # SGPA verification with improved scoring
        if extracted_data.get('sgpa') and certificate.sgpa:
            sgpa_diff = abs(extracted_data['sgpa'] - certificate.sgpa)
            if sgpa_diff <= 0.05:  # Perfect match
                sgpa_score = 1.0
            elif sgpa_diff <= 0.1:  # Very close match
                sgpa_score = 0.95
            elif sgpa_diff <= 0.2:  # Close match
                sgpa_score = 0.9
            elif sgpa_diff <= 0.3:  # Good match
                sgpa_score = 0.85
            elif sgpa_diff <= 0.5:  # Acceptable match
                sgpa_score = 0.75
            elif sgpa_diff <= 0.7:  # Fair match
                sgpa_score = 0.6
            elif sgpa_diff <= 1.0:  # Poor match but within reason
                sgpa_score = 0.4
            else:  # Very poor match
                sgpa_score = 0.2
                
            confidence_scores['sgpa'] = sgpa_score
            
            if sgpa_diff > 0.5:
                anomalies.append(f'SGPA mismatch (extracted: {extracted_data["sgpa"]}, expected: {certificate.sgpa})')
        else:
            confidence_scores['sgpa'] = 0.5  # Neutral if not available
            if not extracted_data.get('sgpa'):
                anomalies.append('SGPA not extracted from certificate')

        # Date format verification with better scoring
        if extracted_data.get('result_date'):
            try:
                # Try multiple date formats
                date_formats = ['%d %B %Y', '%d-%m-%Y', '%d/%m/%Y', '%B %d, %Y', '%Y-%m-%d', '%m/%d/%Y']
                date_parsed = False
                for fmt in date_formats:
                    try:
                        datetime.strptime(extracted_data['result_date'], fmt)
                        date_parsed = True
                        break
                    except:
                        continue
                
                if date_parsed:
                    confidence_scores['date'] = 0.9
                else:
                    confidence_scores['date'] = 0.6  # Date exists but format unclear
                    anomalies.append(f'Date format unclear: {extracted_data["result_date"]}')
            except:
                confidence_scores['date'] = 0.3
                anomalies.append('Invalid result date')
        else:
            confidence_scores['date'] = 0.4
            anomalies.append('Result date not extracted')

        # Subject verification with gradual scoring
        if extracted_data.get('subject') and certificate.subject:
            subject_similarity = max(
                fuzz.ratio(extracted_data['subject'].lower(), certificate.subject.lower()),
                fuzz.partial_ratio(extracted_data['subject'].lower(), certificate.subject.lower()),
                fuzz.token_sort_ratio(extracted_data['subject'].lower(), certificate.subject.lower())
            )
            
            # Gradual scoring for subject match
            if subject_similarity >= 90:
                subject_score = 0.95
            elif subject_similarity >= 80:
                subject_score = 0.9
            elif subject_similarity >= 70:
                subject_score = 0.8
            elif subject_similarity >= 60:
                subject_score = 0.7
            elif subject_similarity >= 50:
                subject_score = 0.6
            else:
                subject_score = 0.4
                
            confidence_scores['subject'] = subject_score
            
            if subject_similarity < 80:
                anomalies.append(f'Subject mismatch (similarity: {subject_similarity}%)')
        else:
            confidence_scores['subject'] = 0.5  # Neutral if subject not available

        # Calculate weighted confidence with improved system
        # Define fixed weights that sum to 1.0
        weights = {
            'student_name': 0.35,  # Most important
            'mother_name': 0.25,   # Second most important
            'sgpa': 0.20,          # Third most important
            'subject': 0.15,       # Moderately important
            'date': 0.05           # Least important (format validation)
        }
        
        # Calculate weighted average
        weighted_sum = 0
        total_weight = 0
        
        for field, weight in weights.items():
            if field in confidence_scores:
                weighted_sum += confidence_scores[field] * weight
                total_weight += weight
        
        avg_confidence = weighted_sum / total_weight if total_weight > 0 else 0

        # Determine status based on new thresholds
        if avg_confidence >= self.verification_thresholds['authentic_threshold']:
            status = 'AUTHENTIC'
        elif avg_confidence >= self.verification_thresholds['suspicious_threshold']:
            status = 'SUSPICIOUS'
        else:
            status = 'FAKE'
            # If confidence is very low, add to anomalies
            if avg_confidence < 0.4:
                anomalies.append('Very low confidence score - likely fraudulent')

        return {
            'status': status,
            'confidence': avg_confidence,
            'matched_certificate': certificate.to_dict(),
            'anomalies': anomalies,
            'institution_verified': True,
            'confidence_breakdown': {
                'field_scores': confidence_scores,
                'field_weights': weights,
                'weighted_average': avg_confidence,
                'total_weight': total_weight,
                'threshold_used': {
                    'authentic': self.verification_thresholds['authentic_threshold'],
                    'suspicious': self.verification_thresholds['suspicious_threshold']
                },
                'status_explanation': self._get_status_explanation(avg_confidence, confidence_scores)
            }
        }
    
    def _get_status_explanation(self, confidence: float, field_scores: Dict[str, float]) -> str:
        """Generate explanation for the verification status"""
        explanations = []
        
        # Overall confidence explanation
        if confidence >= 0.9:
            explanations.append(f"Very high confidence ({confidence:.1%}) - strong match across all fields")
        elif confidence >= 0.8:
            explanations.append(f"High confidence ({confidence:.1%}) - good match with minor variations")
        elif confidence >= 0.65:
            explanations.append(f"Moderate confidence ({confidence:.1%}) - some inconsistencies detected")
        else:
            explanations.append(f"Low confidence ({confidence:.1%}) - significant discrepancies found")
        
        # Field-specific explanations
        field_names = {
            'student_name': 'Student name',
            'mother_name': 'Mother name', 
            'sgpa': 'SGPA',
            'subject': 'Subject',
            'date': 'Date format'
        }
        
        high_scores = []
        low_scores = []
        
        for field, score in field_scores.items():
            field_name = field_names.get(field, field)
            if score >= 0.85:
                high_scores.append(f"{field_name} ({score:.1%})")
            elif score < 0.6:
                low_scores.append(f"{field_name} ({score:.1%})")
        
        if high_scores:
            explanations.append(f"Strong matches: {', '.join(high_scores)}")
        
        if low_scores:
            explanations.append(f"Weak matches: {', '.join(low_scores)}")
        
        return "; ".join(explanations)


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
            extracted_institution=None,
            extracted_subject=extracted_data.get('subject'),
            extracted_result_date=extracted_data.get('result_date')
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry
    
    def log_fraud_detection(self, extracted_data: Dict[str, any], result: Dict[str, any],
                           filename: str, raw_text: str, verification_log_id: int = None,
                           ip_address: str = None, user_agent: str = None) -> FraudDetectionLog:
        """Log detected fraud cases for admin review"""
        fraud_entry = FraudDetectionLog(
            extracted_seat_no=extracted_data.get('seat_no'),
            extracted_student_name=extracted_data.get('student_name'),
            extracted_mother_name=extracted_data.get('mother_name'),
            extracted_sgpa=extracted_data.get('sgpa'),
            extracted_result_date=extracted_data.get('result_date'),
            extracted_subject=extracted_data.get('subject'),
            fraud_status=result['status'],
            confidence_score=result['confidence'],
            detection_reason=json.dumps(result['anomalies']),
            uploaded_filename=filename,
            raw_extracted_text=raw_text,
            ip_address=ip_address,
            user_agent=user_agent,
            verification_log_id=verification_log_id
        )
        db.session.add(fraud_entry)
        db.session.commit()
        return fraud_entry
