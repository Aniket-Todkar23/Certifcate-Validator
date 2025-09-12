import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const Navbar = ({ isAdminLoggedIn, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-slate-800/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-600/30">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center gap-3 text-slate-100 hover:text-blue-400 transition-colors font-semibold text-xl no-underline">
          <ShieldCheckIcon className="w-6 h-6" />
          Certificate Validator
        </Link>
        
        <ul className="flex items-center gap-4 list-none">
          <li>
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-md transition-all font-medium text-sm no-underline ${
                isActive('/') 
                  ? 'text-blue-400 bg-slate-600/30' 
                  : 'text-slate-300 hover:text-blue-400 hover:bg-slate-600/20 hover:-translate-y-0.5'
              }`}
            >
              Home
            </Link>
          </li>
          {isAdminLoggedIn ? (
            <>
              <li>
                <Link 
                  to="/admin" 
                  className={`px-4 py-2 rounded-md transition-all font-medium text-sm no-underline ${
                    isActive('/admin') 
                      ? 'text-blue-400 bg-slate-600/30' 
                      : 'text-slate-300 hover:text-blue-400 hover:bg-slate-600/20 hover:-translate-y-0.5'
                  }`}
                >
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 rounded-md transition-all font-medium text-sm bg-transparent border-none cursor-pointer text-slate-300 hover:text-blue-400 hover:bg-slate-600/20 hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/admin/login" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 no-underline">
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