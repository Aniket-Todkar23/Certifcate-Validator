#!/usr/bin/env python3
"""
Test Certificate Generator
Creates a simple test certificate image/text file for testing the validator
"""

from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

def create_text_certificate(certificate_data, output_path="test_certificate.txt"):
    """Create a simple text file certificate for testing"""
    
    template = f"""
=====================================
        CERTIFICATE OF COMPLETION
=====================================

{certificate_data.get('institution_name', 'RANCHI UNIVERSITY').upper()}
Jharkhand, India

This is to certify that

        {certificate_data['student_name'].upper()}
        
Roll Number: {certificate_data.get('roll_number', 'N/A')}

has successfully completed the degree of

        {certificate_data.get('degree_type', 'Bachelor of Technology')}
        
in

        {certificate_data.get('course_name', 'Computer Science')}
        
with {certificate_data.get('grade', 'First Class')} ({certificate_data.get('percentage', '85')}%)

during the academic year {certificate_data.get('year_of_passing', '2024')}

Certificate Number: {certificate_data['certificate_number']}
Date of Issue: {certificate_data.get('date_of_issue', datetime.now().strftime('%d-%m-%Y'))}

=====================================
Authorized Signature
Registrar
=====================================
"""
    
    with open(output_path, 'w') as f:
        f.write(template)
    
    print(f"✅ Text certificate created: {output_path}")
    return output_path

def create_image_certificate(certificate_data, output_path="test_certificate.png"):
    """Create a simple image certificate for testing"""
    
    # Create a white image
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        # Try to use a better font if available
        title_font = ImageFont.truetype("arial.ttf", 24)
        text_font = ImageFont.truetype("arial.ttf", 16)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except:
        # Use default font if TrueType fonts are not available
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw border
    draw.rectangle([(20, 20), (width-20, height-20)], outline='black', width=2)
    draw.rectangle([(30, 30), (width-30, height-30)], outline='black', width=1)
    
    # Certificate content
    y_position = 60
    
    # Title
    draw.text((width/2, y_position), "CERTIFICATE OF COMPLETION", 
              font=title_font, anchor="mt", fill='black')
    y_position += 60
    
    # Institution
    draw.text((width/2, y_position), 
              certificate_data.get('institution_name', 'RANCHI UNIVERSITY').upper(), 
              font=text_font, anchor="mt", fill='black')
    y_position += 30
    
    draw.text((width/2, y_position), "Jharkhand, India", 
              font=small_font, anchor="mt", fill='black')
    y_position += 60
    
    # Certification text
    draw.text((width/2, y_position), "This is to certify that", 
              font=text_font, anchor="mt", fill='black')
    y_position += 40
    
    # Student name
    draw.text((width/2, y_position), certificate_data['student_name'].upper(), 
              font=title_font, anchor="mt", fill='blue')
    y_position += 40
    
    # Roll number
    draw.text((width/2, y_position), 
              f"Roll No: {certificate_data.get('roll_number', 'N/A')}", 
              font=small_font, anchor="mt", fill='black')
    y_position += 40
    
    # Degree
    draw.text((width/2, y_position), "has successfully completed", 
              font=text_font, anchor="mt", fill='black')
    y_position += 30
    
    draw.text((width/2, y_position), 
              certificate_data.get('degree_type', 'Bachelor of Technology'), 
              font=text_font, anchor="mt", fill='black')
    y_position += 30
    
    draw.text((width/2, y_position), "in", 
              font=text_font, anchor="mt", fill='black')
    y_position += 30
    
    draw.text((width/2, y_position), 
              certificate_data.get('course_name', 'Computer Science'), 
              font=text_font, anchor="mt", fill='black')
    y_position += 40
    
    # Grade
    draw.text((width/2, y_position), 
              f"with {certificate_data.get('grade', 'First Class')} ({certificate_data.get('percentage', '85')}%)", 
              font=text_font, anchor="mt", fill='black')
    y_position += 30
    
    draw.text((width/2, y_position), 
              f"Year: {certificate_data.get('year_of_passing', '2024')}", 
              font=text_font, anchor="mt", fill='black')
    y_position += 60
    
    # Certificate number
    draw.text((width/2, y_position), 
              f"Certificate No: {certificate_data['certificate_number']}", 
              font=text_font, anchor="mt", fill='red')
    y_position += 30
    
    # Date
    draw.text((width/2, y_position), 
              f"Date: {certificate_data.get('date_of_issue', datetime.now().strftime('%d-%m-%Y'))}", 
              font=small_font, anchor="mt", fill='black')
    
    # Save image
    img.save(output_path)
    print(f"✅ Image certificate created: {output_path}")
    return output_path

def main():
    """Interactive certificate generator"""
    print("=" * 50)
    print("TEST CERTIFICATE GENERATOR")
    print("=" * 50)
    print("\nThis tool helps you create test certificates for validation")
    print("\n1. First, add your certificate data in the Admin Dashboard")
    print("2. Then use this tool to create a test document\n")
    
    # Get certificate details from user
    print("Enter certificate details (press Enter for defaults):\n")
    
    cert_number = input("Certificate Number (e.g., RU/2024/CSE/999): ").strip()
    if not cert_number:
        cert_number = "RU/2024/CSE/999"
    
    student_name = input("Student Name (e.g., Your Name): ").strip()
    if not student_name:
        student_name = "Test Student"
    
    roll_number = input("Roll Number (e.g., 24CSE001): ").strip()
    if not roll_number:
        roll_number = "24CSE001"
    
    institution = input("Institution (1=Ranchi Univ, 2=BIT, 3=NIT, 4=CUJ, 5=JRSU): ").strip()
    institutions = {
        '1': 'Ranchi University',
        '2': 'Birla Institute of Technology',
        '3': 'National Institute of Technology Jamshedpur',
        '4': 'Central University of Jharkhand',
        '5': 'Jharkhand Raksha Shakti University'
    }
    institution_name = institutions.get(institution, 'Ranchi University')
    
    course_name = input("Course Name (e.g., Computer Science and Engineering): ").strip()
    if not course_name:
        course_name = "Computer Science and Engineering"
    
    degree_type = input("Degree Type (e.g., Bachelor of Technology): ").strip()
    if not degree_type:
        degree_type = "Bachelor of Technology"
    
    percentage = input("Percentage (e.g., 85.5): ").strip()
    if not percentage:
        percentage = "85.5"
    
    year = input("Year of Passing (e.g., 2024): ").strip()
    if not year:
        year = "2024"
    
    # Create certificate data
    certificate_data = {
        'certificate_number': cert_number,
        'student_name': student_name,
        'roll_number': roll_number,
        'institution_name': institution_name,
        'course_name': course_name,
        'degree_type': degree_type,
        'percentage': percentage,
        'grade': 'First Class' if float(percentage) >= 60 else 'Second Class',
        'year_of_passing': year,
        'date_of_issue': datetime.now().strftime('%d-%m-%Y')
    }
    
    print("\n" + "=" * 50)
    print("CERTIFICATE DATA SUMMARY:")
    print("=" * 50)
    for key, value in certificate_data.items():
        print(f"{key}: {value}")
    
    print("\n" + "=" * 50)
    print("Choose output format:")
    print("1. Text file (.txt)")
    print("2. Image file (.png)")
    print("3. Both")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    print("\n" + "=" * 50)
    print("GENERATING CERTIFICATE...")
    print("=" * 50)
    
    if choice == '1' or choice == '3':
        text_file = create_text_certificate(certificate_data)
    
    if choice == '2' or choice == '3':
        image_file = create_image_certificate(certificate_data)
    
    print("\n" + "=" * 50)
    print("NEXT STEPS:")
    print("=" * 50)
    print("1. Make sure you've added this certificate to the database via Admin Dashboard")
    print("2. Go to http://localhost:5000")
    print("3. Upload the generated test certificate file")
    print("4. See the verification results!")
    print("\nNote: The system will mark it as AUTHENTIC if it matches the database entry")

if __name__ == "__main__":
    main()
