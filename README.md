# Certificate Validator - Full Stack Application

🎓 A comprehensive digital platform for authenticating academic certificates and detecting fraudulent documents using OCR, machine learning, and database verification.

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Default Credentials](#-default-credentials)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

## 🚀 Features

### Core Functionality
- **🔍 Certificate Verification**: Upload and verify academic certificates using advanced OCR
- **📁 Bulk Upload**: Process multiple certificates via CSV files or batch image uploads
- **🚨 Fraud Detection**: Automatic detection and flagging of suspicious certificates
- **🔐 Role-Based Access**: Admin and Verifier roles with JWT authentication
- **📊 Analytics Dashboard**: Real-time statistics and verification reports
- **📝 Audit Trail**: Complete logging of all verification attempts

### Technical Features
- **AI-Powered OCR**: Extract text from images (PNG, JPG, JPEG) and PDFs
- **Smart Validation**: Machine learning algorithms for fraud detection
- **Database Verification**: Cross-reference with official certificate records
- **RESTful API**: Clean, documented API endpoints
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### Backend
- **Flask 2.3.3** - Python web framework
- **SQLAlchemy** - Database ORM
- **PyJWT** - JWT authentication
- **bcrypt** - Password hashing
- **Tesseract OCR** - Text extraction
- **Pandas** - Data processing for CSV
- **SQLite** - Database

## 📁 Project Structure

```
certificate-validator/
├── backend/                    # Flask backend application
│   ├── app.py                 # Main Flask application
│   ├── auth.py                # JWT authentication module
│   ├── models.py              # SQLAlchemy database models
│   ├── ocr_processor.py       # OCR processing functionality
│   ├── verifier.py            # Certificate verification logic
│   ├── requirements.txt       # Python dependencies
│   └── run.py                 # Backend entry point
│
├── frontend/                   # React frontend application
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   └── App.js            # Main React component
│   └── package.json          # Frontend dependencies
│
├── data/                      # Data files and database
│   ├── certificate_validator.db   # SQLite database
│   └── test_bulk_upload_fixed.csv # Sample CSV for testing
│
├── scripts/                   # Utility scripts
│   ├── init_users.py         # Initialize users in database
│   ├── init_db.py            # Database initialization
│   └── view_database.py      # Database viewer utility
│
├── uploads/                   # File upload directory (auto-created)
├── start.ps1                 # Main startup script (Windows)
├── run-backend.ps1           # Backend runner script
├── run-frontend.ps1          # Frontend runner script
└── package.json              # Root package configuration
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/)
- **Tesseract OCR** - Required for text extraction

### Installing Tesseract OCR

#### Windows
1. Download installer from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Run the installer and follow the setup wizard
3. Add Tesseract to your system PATH (usually `C:\Program Files\Tesseract-OCR`)

#### macOS
```bash
brew install tesseract
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

## 🔧 Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd certificate-validator
```

### Step 2: Backend Setup

#### Create Python Virtual Environment
```bash
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Windows Command Prompt
python -m venv venv
venv\Scripts\activate.bat

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

#### Initialize Database and Users
```bash
# Initialize the database with test users
python scripts/init_users.py
```

This will create the following test accounts:
- Admin users: admin, superadmin, bob
- Verifier users: verifier, alice

### Step 3: Frontend Setup

#### Install Node Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Return to root directory
cd ..
```

#### Install Root Dependencies (for concurrent running)
```bash
npm install
```

## 🚀 Running the Application

### Option 1: Quick Start (Recommended for Windows)
```powershell
# From the root directory
.\start.ps1
```
This will:
- Check all dependencies
- Install missing packages
- Start both backend and frontend
- Open your browser automatically

### Option 2: Run Backend and Frontend Separately

#### Terminal 1 - Start Backend
```bash
# Windows PowerShell
.\run-backend.ps1

# Or manually
cd backend
python run.py
```

#### Terminal 2 - Start Frontend
```bash
# Windows PowerShell
.\run-frontend.ps1

# Or manually
cd frontend
npm start
```

### Option 3: Using npm scripts
```bash
# Run both services concurrently
npm start

# Or run individually
npm run backend    # Start backend only
npm run frontend   # Start frontend only
```

## 🔐 Default Credentials

After running `python scripts/init_users.py`, you'll have these accounts:

### Admin Accounts
| Username | Password | Role | Full Name |
|----------|----------|------|-----------|
| admin | admin123 | Admin | System Administrator |
| superadmin | super123 | Admin | Super Administrator |
| bob | bob123 | Admin | Bob Wilson |

### Verifier Accounts
| Username | Password | Role | Full Name |
|----------|----------|------|-----------|
| verifier | verify123 | Verifier | Certificate Verifier |
| alice | alice123 | Verifier | Alice Johnson |

## 🌐 Access Points

Once the application is running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:3000/admin (login required)

## 📊 Testing Bulk Upload

1. Login as an admin user
2. Navigate to the Bulk Upload section
3. Use the sample CSV file: `data/test_bulk_upload_fixed.csv`
4. The CSV should have these columns:
   - `seat_no` - Student seat/roll number
   - `student_name` - Full name
   - `mother_name` - Mother's name
   - `sgpa` - Grade (0-10)
   - `result_date` - Date of result
   - `subject` - Subject/Course name

Example CSV format:
```csv
seat_no,student_name,mother_name,sgpa,result_date,subject
S2024001,John Doe,Jane Doe,8.5,15-Mar-24,Computer Science
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/login` - User login (returns JWT token)
- `POST /api/logout` - User logout
- `GET /api/auth/status` - Check authentication status

### Certificate Operations
- `POST /api/verify` - Upload and verify a certificate
- `POST /api/certificates` - Add new certificate (admin only)
- `POST /api/certificates/bulk-upload` - Upload CSV file
- `POST /api/certificates/bulk-approve` - Approve bulk processed items
- `GET /api/certificates/csv-template` - Download CSV template

### OCR & Extraction
- `POST /api/ocr-extract` - Extract text from uploaded document

### Analytics & Reports
- `GET /api/stats` - Get verification statistics
- `GET /api/verification-history` - Get verification logs
- `GET /api/fraud-logs` - Get fraud detection logs
- `GET /api/fraud-logs/stats` - Get fraud statistics

### System
- `GET /api/health` - Health check endpoint
- `GET /api/institutions` - Get list of institutions

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r backend/requirements.txt

# Check database exists
ls data/certificate_validator.db
```

#### 2. Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

#### 3. Database Connection Error
```bash
# Recreate database
python scripts/init_db.py
python scripts/init_users.py
```

#### 4. OCR Not Working
- Ensure Tesseract is installed: `tesseract --version`
- Check PATH includes Tesseract directory
- Restart terminal after Tesseract installation

#### 5. Port Already in Use
```bash
# Windows - Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

#### 6. CORS Issues
- Ensure backend is running on port 5000
- Check frontend `.env` file has correct API URL
- Clear browser cache and cookies

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with 8-hour expiry
- **Password Hashing**: bcrypt with salt for secure storage
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions (max 16MB)
- **SQL Injection Protection**: Parameterized queries via SQLAlchemy
- **CORS Protection**: Configured for specific origins only

## 📝 Development Notes

### Environment Variables
Create `frontend/.env` for custom configuration:
```env
REACT_APP_API_URL=http://localhost:5000
```

### Database Management
```bash
# View database contents
python scripts/view_database.py

# Clear database
python scripts/clear_database.py

# Migrate database
python scripts/migrate_database.py
```

### Running Tests
```bash
# Test backend functionality
python test_simple.py

# Frontend tests
cd frontend
npm test
```

## 🚀 Production Deployment

### Build Frontend for Production
```bash
cd frontend
npm run build
```

### Configure Production Settings
1. Change JWT secret key in `backend/app.py`
2. Set `app.config['DEBUG'] = False`
3. Use production database (PostgreSQL recommended)
4. Configure proper CORS origins
5. Use HTTPS with SSL certificates
6. Set up reverse proxy (nginx/Apache)

## 📄 License

This project is for educational and commercial use in academic certificate verification.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues or questions:
1. Check console for error messages
2. Verify both services are running
3. Check network tab in browser DevTools
4. Review logs in `backend/` directory
5. Ensure all prerequisites are installed

---
**Version**: 1.0.0  
**Last Updated**: September 2025  
**Status**: ✅ Production Ready