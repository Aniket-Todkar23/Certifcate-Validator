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
            'seat_no': [r'Seat No\s*:\s*([A-Z0-9]+)'],
            'student_name': [r'Student Name\s*:\s*([A-Z\s]+)Mother Name'],
            'mother_name': [r'Mother Name\s*:\s*([A-Z\s]+)\s+College Name'],
            'college_name': [r'College Name\s*:\s*(.+?)\n'],
            'sgpa': [r'Third Semester SGPA\s*:\s*([0-9.]+)'],
            'result_date': [r'RESULT DATE\s*:\s*([\d\w\s]+)'],
            'subject': [r'SUB:\((.+?)\)']
        }
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        if image.mode != 'L':
            image = image.convert('L')
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)
        image = image.filter(ImageFilter.MedianFilter(size=3))
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

        for field, patterns in self.patterns.items():
            extracted_data[field] = None
            for pattern in patterns:
                matches = re.findall(pattern, text_clean, re.IGNORECASE)
                if matches:
                    value = matches[0].strip()
                    if value:
                        extracted_data[field] = value
                        break

        if extracted_data.get('student_name'):
            extracted_data['student_name'] = ' '.join(
                word.capitalize() for word in extracted_data['student_name'].split()
            )
        if extracted_data.get('mother_name'):
            extracted_data['mother_name'] = ' '.join(
                word.capitalize() for word in extracted_data['mother_name'].split()
            )
        if extracted_data.get('college_name'):
            extracted_data['college_name'] = ' '.join(
                word.capitalize() for word in extracted_data['college_name'].split()
            )
        if extracted_data.get('sgpa'):
            try:
                extracted_data['sgpa'] = float(extracted_data['sgpa'])
            except ValueError:
                extracted_data['sgpa'] = None

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
