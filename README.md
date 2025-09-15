
# Authenticity Validator for Academia - MVP

## Overview
A digital platform to authenticate and detect fake degrees or certificates issued by higher education institutions. This MVP provides certificate verification using OCR, database matching, and anomaly detection, with a modern dark-themed UI.

## Features
- Certificate upload and verification (image, PDF, CSV)
- OCR-based text extraction (Tesseract)
- Database verification against registered institutions
- Basic anomaly and fraud detection
- Admin dashboard for institution management
- Bulk upload and review interface
- Verification history and logging
- Role-based authentication (Admin, Verifier)
- Modern dark theme UI with conditional background animations

## Tech Stack
- **Backend**: Python Flask
- **Database**: SQLite
- **OCR**: Tesseract (pytesseract)
- **Frontend**: React, Tailwind CSS (dark theme), Heroicons
- **File Processing**: PIL, PyPDF2

## Setup Instructions

### Prerequisites
1. Python 3.8+
2. Node.js & npm (for frontend)
3. Tesseract OCR engine

### Installation

#### Backend
1. Clone and setup:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Install Tesseract OCR:
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - Add Tesseract to your system PATH
3. Initialize Database:
   ```bash
   python init_db.py
   ```
4. Run the backend:
   ```bash
   python app.py
   ```

#### Frontend
1. Setup frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. Access the application:
   - Main interface: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints
- `POST /api/verify` - Upload and verify certificate
- `GET /api/institutions` - Get list of registered institutions
- `POST /api/institutions` - Add new institution (admin)
- `GET /api/verification-history` - Get verification logs

## Project Structure
```
Certifcate-Validator/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── ocr_processor.py    # OCR and document processing
│   ├── verifier.py         # Certificate verification logic
│   ├── requirements.txt    # Python dependencies
│   ├── init_db.py          # Database initialization
│   └── uploads/            # Uploaded certificates storage
├── frontend/
│   ├── package.json        # React app config
│   ├── src/                # React source code
│   └── public/             # Static assets
├── data/                   # Sample data and database
├── scripts/                # Utility scripts
└── README.md               # Project documentation
```

## Sample Usage
1. Upload a certificate image, PDF, or CSV
2. System extracts text using OCR
3. Verification against institution database
4. Results show authenticity status and confidence score
5. Admins can review and approve bulk uploads

## Notes
- Ensure Tesseract is installed and added to PATH for OCR functionality
- Use the admin dashboard for institution and bulk certificate management
- The UI uses a dark theme for consistency and accessibility
- Animations are shown only on landing and login pages for a professional look

---
For more details, see the documentation in each folder or contact the project maintainers.