# Certificate Validator - React Frontend + Flask Backend

This project now consists of a **React frontend** and **Flask backend** that work together to provide certificate validation services.

## Project Structure

```
Certifcate-Validator/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── styles/          # CSS styles
│   ├── public/
│   └── package.json
├── app.py                   # Flask backend application
├── models.py               # Database models
├── verifier.py             # Certificate verification logic
├── ocr_processor.py        # OCR processing
└── requirements.txt        # Python dependencies
```

## Setup and Installation

### Backend Setup (Flask)

1. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # or
   source venv/bin/activate  # On Linux/Mac
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize the database:**
   ```bash
   python init_db.py
   ```

### Frontend Setup (React)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Run Both Simultaneously

1. **Start the Flask backend:**
   ```bash
   python app.py
   ```
   Backend will run on: http://localhost:5000

2. **In a new terminal, start the React frontend:**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on: http://localhost:3000

### Option 2: Production Build

1. **Build the React app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve the built app with Flask:**
   - Configure Flask to serve the React build files
   - Run only the Flask server

## Features

### User Interface (React Frontend)
- **Modern Dark Theme**: Beautiful glassmorphism design with dark slate colors
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Certificate Upload**: Drag & drop or click to upload certificates
- **Real-time Results**: Instant verification results with confidence scores
- **Admin Dashboard**: Comprehensive admin interface for certificate management

### API Endpoints (Flask Backend)
- `POST /api/verify` - Certificate verification
- `POST /api/ocr-extract` - OCR text extraction
- `POST /api/certificates` - Add new certificates
- `GET /api/stats` - Get verification statistics
- `GET /api/institutions` - Get registered institutions
- `POST /admin/login` - Admin authentication
- `GET /api/health` - Health check

### Key Features
1. **AI-Powered OCR**: Extract text from certificate images and PDFs
2. **Smart Detection**: ML algorithms to identify fraudulent certificates
3. **Database Verification**: Cross-check with official records
4. **Admin Portal**: Manage certificates and view analytics
5. **Secure Authentication**: Session-based admin authentication
6. **File Upload**: Support for multiple image formats and PDFs
7. **Real-time Processing**: Instant verification results

## API Usage

### Certificate Verification
```javascript
const formData = new FormData();
formData.append('certificate', file);

const response = await fetch('http://localhost:5000/api/verify', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});

const result = await response.json();
```

### Admin Login
```javascript
const response = await fetch('http://localhost:5000/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
  credentials: 'include'
});
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Heroicons** - Modern SVG icons
- **CSS3** - Custom styling with glassmorphism effects

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **Flask-CORS** - Cross-origin request handling
- **OCR Libraries** - Text extraction from images
- **SQLite** - Database storage

## Development

### Frontend Development
```bash
cd frontend
npm start          # Start development server
npm run build      # Build for production
npm test          # Run tests
```

### Backend Development
```bash
python app.py     # Start Flask development server
python init_db.py # Initialize/reset database
```

## Configuration

### Environment Variables
Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

### Flask Configuration
- Database: SQLite (configurable)
- Upload size limit: 16MB
- Session secret: Change in production
- CORS enabled for React development

## Security Notes

⚠️ **Important for Production:**
1. Change the Flask secret key
2. Implement proper password hashing
3. Add rate limiting
4. Use HTTPS
5. Validate file uploads thoroughly
6. Implement proper session management
7. Add input validation and sanitization

## Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the build/ folder to your web server
```

### Backend Deployment
- Use a production WSGI server (Gunicorn, uWSGI)
- Configure environment variables
- Set up proper database (PostgreSQL, MySQL)
- Enable SSL/HTTPS
- Configure reverse proxy (Nginx)

## Support

For issues and questions:
1. Check the console for error messages
2. Verify backend is running on port 5000
3. Ensure frontend can reach the backend API
4. Check CORS configuration for deployment

## License

This project is developed for academic certificate verification purposes.