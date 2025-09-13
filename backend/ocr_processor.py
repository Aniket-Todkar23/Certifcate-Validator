#!/usr/bin/env python3
"""
Simplified OCR Processor for Certificate Validator
Extracts minimal required fields from result PDF or image
"""

import os
import re
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
from typing import Dict, Tuple


class OCRProcessor:
    def __init__(self, tesseract_path: str = None):
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path

        self.patterns = {
            'seat_no': [
                r'Seat\s*No[\s.:]*([A-Z0-9$]+)',  # Added $ to handle OCR error
                r'SEAT\s*NO[\s.:]*([A-Z0-9$]+)',  # Added $ to handle OCR error
                r'Seat\s*Number[\s.:]*([A-Z0-9$]+)',  # Added $ to handle OCR error
                r'[S$][0-9]{10}',  # Handle S/$ OCR confusion
                r'(?:^|\s)([SsB$][0-9]{7,12})(?:\s|$)',  # Added $ to handle OCR error
                r'Registration\s*(?:No|Number)[\s.:]*([A-Z0-9$]+)',
                r'Roll\s*(?:No|Number)[\s.:]*([A-Z0-9$]+)'
            ],
            'student_name': [
                r'Student\s*Name[\s.:]*([A-Za-z\s]+?)(?=Mother|$)',
                r'STUDENT\s*NAME[\s.:]*([A-Za-z\s]+?)(?=Mother|MOTHER|$)',
                r'Name\s*of\s*Student[\s.:]*([A-Za-z\s]+?)(?=Mother|$)',
                r'Candidate\s*Name[\s.:]*([A-Za-z\s]+?)(?=Mother|$)',
                r'Name[\s.:]*([A-Za-z\s]+?)(?=Mother|MOTHER|Date|$)',
                r'NAME[\s.:]*([A-Za-z\s]+?)(?=Mother|MOTHER|Date|$)',
                r'STUDENT[\s.:]*([A-Za-z\s]+?)(?=Mother|$)'
            ],
            'mother_name': [
                r'Mother\s*Name[\s.:]*([A-Za-z\s]+?)(?=College|COLLEGE|Father|$)',
                r"Mother[']s\s*Name[\s.:]*([A-Za-z\s]+?)(?=College|Father|$)",
                r'MOTHER\s*NAME[\s.:]*([A-Za-z\s]+?)(?=College|COLLEGE|Father|$)',
                r'Mother[\s.:]*([A-Za-z\s]+?)(?=College|Father|$)',
                r'MOTHER[\s.:]*([A-Za-z\s]+?)(?=College|COLLEGE|Father|$)',
                r"Mother(?:'s)? Name:[\s]*([A-Za-z\s]+)",
                r"Mrs\.[\s]*([A-Za-z\s]+)(?=\n|Mrs\.|$)"
            ],
            'sgpa': [
                r'Third\s*Semester\s*SGPA[\s.:]*([0-9.]+)',
                r'SGPA[\s.:]*([0-9.]+)',
                r'Grade[\s.:]*([0-9.]+)',
                r'Score[\s.:]*([0-9.]+)',
                r'([0-9]\.[0-9]{2})\s*(?:SGPA|GPA)',
                r'CGPA[\s.:]*([0-9.]+)',
                r'GPA[\s.:]*([0-9.]+)',
                r'(?:^|\s)([0-9]\.[0-9]{1,2})(?:\s|$)'  # Any standalone decimal like 9.59
            ],
            'result_date': [
                r'RESULT\s*DATE[\s.:]*([0-9]{1,2}\s*[A-Za-z]+\s*[0-9]{4})',
                r'Result\s*Date[\s.:]*([0-9]{1,2}\s*[A-Za-z]+\s*[0-9]{4})',
                r'DATE\s*OF\s*RESULT[\s.:]*([0-9]{1,2}\s*[A-Za-z]+\s*[0-9]{4})',
                r'Date[\s.:]*([0-9]{1,2}\s*[A-Za-z]+\s*[0-9]{4})',
                r'Dated[\s.:]*([0-9]{1,2}\s*[A-Za-z]+\s*[0-9]{4})',
                r'Examination\s*Date[\s.:]*([0-9]{1,2}\s*[A-Za-z]+\s*[0-9]{4})',
                r'([0-9]{1,2}\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s*[0-9]{4})',
                r'(?:^|\s)([0-9]{2}/[0-9]{2}/[0-9]{4})(?:\s|$)',  # DD/MM/YYYY format
                r'(?:^|\s)([0-9]{2}-[0-9]{2}-[0-9]{4})(?:\s|$)'   # DD-MM-YYYY format
            ],
            'subject': [
                r'SUB[\s.:]*\(([^)]+)\)',
                r'Subject[\s.:]*([A-Za-z\s&]+?)(?=\n|$)',
                r'SUBJECT[\s.:]*([A-Za-z\s&]+?)(?=\n|$)',
                r'Course[\s.:]*([A-Za-z\s&]+?)(?=\n|$)',
                r'Programme[\s.:]*([A-Za-z\s&]+?)(?=\n|$)',
                r'Branch[\s.:]*([A-Za-z\s&]+?)(?=\n|$)',
                r'Specialization[\s.:]*([A-Za-z\s&]+?)(?=\n|$)',
                r'Department\s*of\s*([A-Za-z\s&]+?)(?=\n|$)'
            ]
        }
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        # Convert to grayscale if not already
        if image.mode != 'L':
            image = image.convert('L')
        
        # Resize image if too small (helps with OCR accuracy)
        width, height = image.size
        if width < 1000:
            ratio = 1500 / width
            new_size = (int(width * ratio), int(height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.5)
        
        # Enhance brightness
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        # Apply denoising
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        # Apply edge enhancement
        image = image.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
        return image
    
    def extract_text_from_image(self, image_path: str) -> str:
        try:
            with Image.open(image_path) as img:
                processed_img = self.preprocess_image(img)
                custom_config = r'--oem 3 --psm 6'
                text = pytesseract.image_to_string(processed_img, config=custom_config)
                return text.strip()
        except Exception as e:
            print(f"Error extracting text from image: {str(e)}")
            return ""
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        try:
            from PyPDF2 import PdfReader
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            return ""
    
    def extract_structured_data(self, text: str) -> Dict[str, any]:
        extracted_data = {}
        text_clean = re.sub(r'\s+', ' ', text)
        
        # Try to match lines separately for better accuracy
        lines = text.split('\n')
        combined_text = text_clean + ' ' + '\n'.join(lines)

        for field, patterns in self.patterns.items():
            extracted_data[field] = None
            
            # Try patterns on both the full text and individual lines
            for pattern in patterns:
                # Try on full text first
                matches = re.findall(pattern, text_clean, re.IGNORECASE)
                if matches:
                    value = matches[0].strip()
                    if value and len(value) > 1:  # Ensure meaningful extraction
                        extracted_data[field] = value
                        break
                
                # If not found, try on individual lines
                if not extracted_data[field]:
                    for line in lines:
                        line_matches = re.findall(pattern, line.strip(), re.IGNORECASE)
                        if line_matches:
                            value = line_matches[0].strip()
                            if value and len(value) > 1:
                                extracted_data[field] = value
                                break
                    if extracted_data[field]:
                        break

        # Clean up and format extracted data
        if extracted_data.get('student_name'):
            name = re.sub(r'[^A-Za-z\s]', '', extracted_data['student_name']).strip()
            # Normalize name: handle both CAPS and mixed case properly
            if name:
                # Split and properly title case each word
                words = [word.strip().title() for word in name.split() if len(word.strip()) > 1]
                extracted_data['student_name'] = ' '.join(words) if words else None
            else:
                extracted_data['student_name'] = None
            
        if extracted_data.get('mother_name'):
            name = re.sub(r'[^A-Za-z\s]', '', extracted_data['mother_name']).strip()
            # Normalize name: handle both CAPS and mixed case properly
            if name:
                # Split and properly title case each word
                words = [word.strip().title() for word in name.split() if len(word.strip()) > 1]
                extracted_data['mother_name'] = ' '.join(words) if words else None
            else:
                extracted_data['mother_name'] = None
            
            
        if extracted_data.get('subject'):
            subject = re.sub(r'[^A-Za-z\s&]', '', extracted_data['subject']).strip()
            extracted_data['subject'] = ' '.join(
                word.capitalize() for word in subject.split() if len(word) > 1
            ) if subject else None
            
        if extracted_data.get('seat_no'):
            seat_no = re.sub(r'[^A-Za-z0-9$]', '', extracted_data['seat_no']).strip()
            # Fix common OCR error: $ → S
            seat_no = seat_no.replace('$', 'S')
            extracted_data['seat_no'] = seat_no.upper() if seat_no else None
            
        if extracted_data.get('sgpa'):
            try:
                sgpa_str = re.sub(r'[^0-9.]', '', str(extracted_data['sgpa']))
                if sgpa_str:
                    sgpa_float = float(sgpa_str)
                    if 0 <= sgpa_float <= 10:  # Valid SGPA range
                        extracted_data['sgpa'] = sgpa_float
                    else:
                        extracted_data['sgpa'] = None
                else:
                    extracted_data['sgpa'] = None
            except (ValueError, TypeError):
                extracted_data['sgpa'] = None
        print(extracted_data)
        return extracted_data
    
    def validate_extraction_quality(self, extracted_data: Dict[str, any]) -> Dict[str, any]:
        extracted_fields = sum(1 for v in extracted_data.values() if v)
        total_fields = len(self.patterns)
        confidence = extracted_fields / total_fields

        issues = [f"{k} not found" for k, v in extracted_data.items() if not v]

        return {
            'overall_confidence': round(confidence, 2),
            'field_confidence': {k: bool(v) for k, v in extracted_data.items()},
            'issues': issues
        }
    
    def process_document(self, file_path: str) -> Tuple[str, Dict[str, any]]:
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif']:
            raw_text = self.extract_text_from_image(file_path)
        elif file_ext == '.pdf':
            raw_text = self.extract_text_from_pdf(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

        structured_data = self.extract_structured_data(raw_text)
        return raw_text, structured_data
