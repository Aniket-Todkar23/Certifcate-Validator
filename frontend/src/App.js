import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { apiService } from './services/api';

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in by trying to access admin endpoint
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authData = await apiService.checkAuthStatus();
      setIsAdminLoggedIn(authData.authenticated);
      setAdminUser(authData.user || 'Administrator');
    } catch (error) {
      setIsAdminLoggedIn(false);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAdminLoggedIn(true);
    setAdminUser('Administrator');
  };

  const handleLogout = async () => {
    try {
      await apiService.adminLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAdminLoggedIn(false);
      setAdminUser(null);
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
      <div className="min-h-screen flex flex-col">
        <Navbar 
          isAdminLoggedIn={isAdminLoggedIn} 
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/admin/login" 
            element={
              isAdminLoggedIn ? 
                <Navigate to="/admin" replace /> : 
                <AdminLoginPage onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAdminLoggedIn ? 
                <AdminDashboardPage adminUser={adminUser} /> : 
                <Navigate to="/admin/login" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
