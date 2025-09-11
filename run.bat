@echo off
echo ========================================
echo Certificate Validator - MVP
echo Government of Jharkhand
echo ========================================
echo.

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Initializing database...
python init_db.py

echo.
echo Starting application...
echo Access the application at http://localhost:5000
echo Admin login: username=admin, password=admin123
echo Press Ctrl+C to stop the server
echo.

python app.py

pause
