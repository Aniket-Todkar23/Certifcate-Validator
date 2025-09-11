# Authenticity Validator for Academia - MVP

## Overview
A digital platform to authenticate and detect fake degrees or certificates issued by higher education institutions. This MVP provides basic certificate verification using OCR, database matching, and anomaly detection.

## Features
- Certificate upload and verification
- OCR-based text extraction from images and PDFs
- Database verification against registered institutions
- Basic anomaly detection
- Admin dashboard for institution management
- Verification history and logging

## Tech Stack
- **Backend**: Python Flask
- **Database**: SQLite
- **OCR**: Tesseract with pytesseract
- **Frontend**: HTML/CSS/JavaScript with Bootstrap
- **File Processing**: PIL, PyPDF2

## Setup Instructions

### Prerequisites
1. Python 3.8+
2. Tesseract OCR engine

### Installation

1. **Clone and setup:**
```bash
cd certificate-validator
pip install -r requirements.txt
```

2. **Install Tesseract OCR:**
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
- Add Tesseract to your system PATH

3. **Initialize Database:**
```bash
python init_db.py
```

4. **Run the application:**
```bash
python app.py
```

5. **Access the application:**
- Main interface: http://localhost:5000
- Admin dashboard: http://localhost:5000/admin

## API Endpoints
- `POST /api/verify` - Upload and verify certificate
- `GET /api/institutions` - Get list of registered institutions
- `POST /api/institutions` - Add new institution (admin)
- `GET /api/verification-history` - Get verification logs

## Project Structure
```
certificate-validator/
├── app.py              # Main Flask application
├── models.py           # Database models
├── init_db.py          # Database initialization
├── ocr_processor.py    # OCR and document processing
├── verifier.py         # Certificate verification logic
├── requirements.txt    # Python dependencies
├── static/            # CSS, JS, images
├── templates/         # HTML templates
└── uploads/           # Uploaded certificates storage
```

## Sample Usage
1. Upload a certificate image or PDF
2. System extracts text using OCR
3. Verification against institution database
4. Results show authenticity status and confidence score
