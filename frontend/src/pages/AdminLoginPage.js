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
        subtitle="PramanMitra Administration"
        description="Access admin dashboard to manage certificates and view analytics"
      />
      
      <div className="max-w-7xl mx-auto px-6 flex-1">
        <div className="flex justify-center">
          <div className="w-full max-w-md mt-12">
            <div className="glass-card">
              <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600/30 flex items-center gap-2 font-semibold text-slate-100">
                <LockClosedIcon className="w-5 h-5" />
                Administrator Login
              </div>
              <div className="p-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-md">
                    <div className="text-red-400">
                      <strong>Error!</strong> {error}
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block mb-2 font-medium text-slate-300 text-sm">
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="w-full px-4 py-3 border border-slate-600/30 rounded-lg text-sm transition-all duration-300 bg-slate-700/50 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-0.5 placeholder-slate-400"
                      value={credentials.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block mb-2 font-medium text-slate-300 text-sm">
                      <LockClosedIcon className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="w-full px-4 py-3 border border-slate-600/30 rounded-lg text-sm transition-all duration-300 bg-slate-700/50 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-0.5 placeholder-slate-400"
                      value={credentials.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className={`w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 btn-glow inline-flex items-center justify-center gap-2 ${
                      isLoading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>
                
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-400">
                    For demonstration purposes, use any credentials to login.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;