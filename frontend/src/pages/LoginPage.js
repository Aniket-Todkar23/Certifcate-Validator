import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LockClosedIcon, 
  UserIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import { apiService } from '../services/api';

const LoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.login(credentials);
      
      // Store token and user info
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      
      setSuccess(response.message);
      onLogin(response.user);
      
      // Navigate based on role
      setTimeout(() => {
        if (response.user.role === 'admin') {
          navigate('/admin');
        } else if (response.user.role === 'verifier') {
          navigate('/verifier');
        } else {
          navigate('/'); // fallback
        }
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header 
        title="PramanMitra Login"
        subtitle="Secure Access Portal"
        description="Login with your credentials to access the advanced certificate guardian system"
      />
      
      <div className="max-w-7xl mx-auto px-6 flex-1">
        <div className="flex justify-center">
          <div className="w-full max-w-md mt-12">
            {/* Login Card */}
            <div className="glass-card">
              <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600/30 flex items-center gap-2 font-semibold text-slate-100">
                <LockClosedIcon className="w-5 h-5" />
                System Login
              </div>
              
              <div className="p-6">
                {/* Success Alert */}
                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 backdrop-blur-md">
                    <div className="text-green-400 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      <strong>Success!</strong> {success}
                    </div>
                  </div>
                )}
                
                {/* Error Alert */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-md">
                    <div className="text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
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
                      autoComplete="username"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block mb-2 font-medium text-slate-300 text-sm">
                      <LockClosedIcon className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className="w-full px-4 py-3 pr-12 border border-slate-600/30 rounded-lg text-sm transition-all duration-300 bg-slate-700/50 text-slate-200 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-0.5 placeholder-slate-400"
                        value={credentials.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
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
              </div>
            </div>

            {/* Role Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="glass-card p-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-600/10">
                <div className="flex items-center mb-3">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-100">Admin Access</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Manage certificates database</li>
                  <li>• View fraud detection logs</li>
                  <li>• Access system analytics</li>
                  <li>• Bulk upload capabilities</li>
                </ul>
              </div>

              <div className="glass-card p-4 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-600/10">
                <div className="flex items-center mb-3">
                  <UserGroupIcon className="w-6 h-6 text-green-400 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-100">Verifier Access</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Verify certificates</li>
                  <li>• OCR data extraction</li>
                  <li>• View verification results</li>
                  <li>• Access validation tools</li>
                </ul>
              </div>
            </div>

            {/* Test Credentials Info */}
            <div className="glass-card mt-6 p-4 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-600/10">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Test Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-300">Admin Accounts:</div>
                    <div className="text-slate-300 space-y-1">
                      <div>admin / admin123</div>
                      <div>bob / bob123</div>
                      <div>superadmin / super123</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-green-300">Verifier Accounts:</div>
                    <div className="text-slate-300 space-y-1">
                      <div>verifier / verify123</div>
                      <div>alice / alice123</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  These are demonstration credentials. In production, use secure passwords.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;