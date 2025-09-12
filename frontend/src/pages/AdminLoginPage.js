import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import { apiService } from '../services/api';

const AdminLoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiService.adminLogin(credentials);
      onLogin();
      navigate('/admin');
    } catch (error) {
      setError(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header 
        title="Admin Login"
        subtitle="Certificate Validator Administration"
        description="Access admin dashboard to manage certificates and view analytics"
      />
      
      <div className="container">
        <div className="d-flex justify-center">
          <div className="card" style={{ maxWidth: '400px', width: '100%', marginTop: '3rem' }}>
            <div className="card-header">
              <LockClosedIcon className="w-5 h-5" />
              Administrator Login
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <strong>Error!</strong> {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={credentials.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <LockClosedIcon className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              
              <div className="text-center mt-3">
                <p className="text-small text-muted">
                  For demonstration purposes, use any credentials to login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;