#!/usr/bin/env python3
"""
Main entry point for the PramanMitra backend
"""

from app import app

if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        from models import db
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Database creation error: {e}")
            print("App will continue without creating tables")
    
    # Run the application
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)