import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingAnimations from './components/FloatingAnimations';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VerifierDashboardPage from './pages/VerifierDashboardPage';
import BulkUploadPage from './pages/BulkUploadPage';
import { apiService } from './services/api';
import './styles/PramanMitraAnimations.css';

// Component to conditionally render animations based on route
const ConditionalAnimations = () => {
  const location = useLocation();
  const showAnimations = location.pathname === '/' || location.pathname === '/login';
  
  return showAnimations ? <FloatingAnimations /> : null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in by checking localStorage and validating token
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userInfo = localStorage.getItem('user_info');
      
      if (token && userInfo) {
        // Validate token with server
        const authData = await apiService.checkAuthStatus();
        setIsLoggedIn(authData.authenticated);
        setUser(authData.user);
      } else {
        // No token or user info found
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      // Token invalid or expired
      console.warn('Auth check failed:', error.message);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto px-6 text-center flex-1 flex items-center justify-center">
          <div>
            <div className="w-10 h-10 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col relative">
        <ConditionalAnimations />
        <Navbar 
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} user={user} />} />
          
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              isLoggedIn ? 
                <Navigate to={user?.role === 'admin' ? '/admin' : '/verifier'} replace /> : 
                <LoginPage onLogin={handleLogin} />
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              isLoggedIn && user?.role === 'admin' ? 
                <AdminDashboardPage user={user} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/admin/bulk-upload" 
            element={
              isLoggedIn && user?.role === 'admin' ? 
                <BulkUploadPage /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Verifier Routes */}
          <Route 
            path="/verifier" 
            element={
              isLoggedIn && user?.role === 'verifier' ? 
                <VerifierDashboardPage user={user} /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Legacy admin login redirect */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
