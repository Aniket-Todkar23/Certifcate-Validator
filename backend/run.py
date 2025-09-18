#!/usr/bin/env python3
"""
Main entry point for the PramanMitra backend
"""

from app import app

if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        from models import db
        db.create_all()
    
    # Run the application
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)