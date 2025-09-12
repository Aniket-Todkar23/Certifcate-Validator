import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const Navbar = ({ isAdminLoggedIn, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <ShieldCheckIcon className="w-6 h-6" />
          Certificate Validator
        </Link>
        
        <ul className="navbar-menu">
          <li>
            <Link 
              to="/" 
              className={`navbar-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          {isAdminLoggedIn ? (
            <>
              <li>
                <Link 
                  to="/admin" 
                  className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                >
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <button 
                  onClick={onLogout}
                  className="navbar-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/admin/login" className="btn btn-primary">
                Admin Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;