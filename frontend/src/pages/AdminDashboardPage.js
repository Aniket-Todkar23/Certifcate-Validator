import React, { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SparklesIcon,
  PlusCircleIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FolderOpenIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import FraudDetectionDashboard from '../components/FraudDetectionDashboard';
import { apiService } from '../services/api';

const AdminDashboardPage = ({ adminUser }) => {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, fraud-detection
  const [ocrLoading, setOcrLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [ocrAlert, setOcrAlert] = useState(null);
  const [certAlert, setCertAlert] = useState(null);
  const [csvAlert, setCsvAlert] = useState(null);
  const [certificateForm, setCertificateForm] = useState({
    seat_no: '',
    student_name: '',
    mother_name: '',
    subject: '',
    sgpa: '',
    result_date: ''
  });
  
  const ocrFileRef = useRef(null);
  const csvFileRef = useRef(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await apiService.getStats(30);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleOcrUpload = async (e) => {
    e.preventDefault();
    const file = ocrFileRef.current?.files[0];
    
    if (!file) {
      setOcrAlert({ type: 'danger', message: 'Please select a file' });
      return;
    }

    setOcrLoading(true);
    try {
      const result = await apiService.extractOCR(file);
      setOcrAlert({ type: 'success', message: 'Data extracted successfully! Review and submit.' });
      
      // Auto-fill the certificate form
      setCertificateForm({
        seat_no: result.extracted_data?.seat_no || '',
        student_name: result.extracted_data?.student_name || '',
        mother_name: result.extracted_data?.mother_name || '',
        subject: result.extracted_data?.subject || '',
        sgpa: result.extracted_data?.sgpa || '',
        result_date: result.extracted_data?.result_date || ''
      });
      
    } catch (error) {
      console.error('OCR Extract Error:', error);
      if (error.response?.status === 401) {
        setOcrAlert({ 
          type: 'danger', 
          message: 'Authentication required. Please log in as admin to use OCR extraction.' 
        });
      } else {
        setOcrAlert({ 
          type: 'danger', 
          message: error.message || 'Failed to extract data. Please try again.' 
        });
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCertificateSubmit = async (e) => {
    e.preventDefault();
    setCertLoading(true);
    
    try {
      // Convert SGPA to number
      const formData = {
        ...certificateForm,
        sgpa: parseFloat(certificateForm.sgpa)
      };
      
      await apiService.addCertificate(formData);
      setCertAlert({ type: 'success', message: 'Certificate added successfully!' });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setCertificateForm({
          seat_no: '',
          student_name: '',
          mother_name: '',
          subject: '',
          sgpa: '',
          result_date: ''
        });
      }, 2000);
      
    } catch (error) {
      setCertAlert({ type: 'danger', message: error.message || 'Failed to add certificate' });
    } finally {
      setCertLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setCertificateForm({
      ...certificateForm,
      [e.target.name]: e.target.value
    });
  };

  const resetCertForm = () => {
    setCertificateForm({
      seat_no: '',
      student_name: '',
      mother_name: '',
      subject: '',
      sgpa: '',
      result_date: ''
    });
    setCertAlert(null);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    const file = csvFileRef.current?.files[0];
    
    if (!file) {
      setCsvAlert({ type: 'danger', message: 'Please select a CSV file' });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvAlert({ type: 'danger', message: 'Please select a valid CSV file' });
      return;
    }

    setCsvLoading(true);
    try {
      const result = await apiService.bulkUploadCertificates(file);
      
      let message = result.message;
      if (result.warning) {
        message += '. ' + result.warning;
      }
      
      setCsvAlert({ 
        type: result.success_count > 0 ? 'success' : 'warning', 
        message: message,
        details: {
          success_count: result.success_count,
          error_count: result.error_count,
          total_rows: result.total_rows,
          errors: result.errors,
          duplicates: result.duplicates
        }
      });
      
      // Reset file input on success
      if (result.success_count > 0) {
        csvFileRef.current.value = '';
        // Reload stats to reflect new certificates
        loadStats();
      }
      
    } catch (error) {
      console.error('CSV Upload Error:', error);
      setCsvAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to upload CSV file. Please try again.' 
      });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await apiService.downloadCsvTemplate();
      setCsvAlert({ 
        type: 'success', 
        message: 'CSV template downloaded successfully!' 
      });
    } catch (error) {
      setCsvAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to download template. Please try again.' 
      });
    }
  };

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (ocrAlert) {
      const timer = setTimeout(() => setOcrAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [ocrAlert]);

  useEffect(() => {
    if (certAlert) {
      const timer = setTimeout(() => setCertAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [certAlert]);

  useEffect(() => {
    if (csvAlert) {
      const timer = setTimeout(() => setCsvAlert(null), 8000); // Longer timeout for CSV alerts with details
      return () => clearTimeout(timer);
    }
  }, [csvAlert]);

  if (isLoadingStats) {
    return (
      <>
        <Header 
          title="Admin Dashboard"
          subtitle="Certificate Management & Verification Analytics"
          description="Manage certificates, institutions, and monitor verification activities"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-slate-300">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Admin Dashboard"
        subtitle="Certificate Management & Verification Analytics"
        description="Manage certificates, institutions, and monitor verification activities"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center">
            <ChartBarIcon className="w-6 h-6 inline mr-2" />
            {activeTab === 'dashboard' ? 'Dashboard Overview' : 'Fraud Detection'}
          </h2>
          <div className="text-slate-400">
            Welcome, {adminUser || 'Administrator'}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-slate-100'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('fraud-detection')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'fraud-detection'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-slate-100'
            }`}
          >
            <ShieldExclamationIcon className="w-5 h-5" />
            Fraud Detection
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
          <div>
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Authentic Certificates - Green */}
          <div className="glass-card p-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-400 hover:via-green-400 hover:to-teal-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <CheckCircleIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-1 drop-shadow-sm">{stats?.status_distribution?.AUTHENTIC || 0}</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Authentic</h5>
            <p className="text-white/85 text-sm">Verified as authentic</p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
          
          {/* Suspicious Certificates - Orange/Amber */}
          <div className="glass-card p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-amber-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <ExclamationTriangleIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-1 drop-shadow-sm">{stats?.status_distribution?.SUSPICIOUS || 0}</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Suspicious</h5>
            <p className="text-white/85 text-sm">Require manual review</p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
          
          {/* Fraudulent Certificates - Red */}
          <div className="glass-card p-6 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 hover:from-red-400 hover:via-rose-400 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <XCircleIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-1 drop-shadow-sm">{stats?.status_distribution?.FAKE || 0}</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Fraudulent</h5>
            <p className="text-white/85 text-sm">Detected as fake</p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
          
          {/* Total Verifications - Blue/Purple */}
          <div className="glass-card p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <ChartBarIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-1 drop-shadow-sm">{stats?.total_verifications || 0}</h3>
            <h5 className="text-lg font-semibold text-white/95 mb-2">Total Verifications</h5>
            <p className="text-white/85 text-sm">Last 30 days</p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Unified Bulk Upload Card */}
          <div className="glass-card p-6 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 hover:from-purple-400 hover:via-violet-400 hover:to-indigo-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <DocumentArrowUpIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">Unified Bulk Upload</h3>
            <p className="text-white/85 text-sm mb-4">Upload multiple files (CSV, PDF, Images) with drag & drop and admin review</p>
            <a 
              href="/admin/bulk-upload" 
              className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm border border-white/20"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Open Bulk Upload
            </a>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
          
          {/* OCR Extract Card */}
          <div className="glass-card p-6 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <SparklesIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">OCR Extract</h3>
            <p className="text-white/85 text-sm mb-4">Extract data from certificate images using AI-powered OCR</p>
            <button 
              onClick={() => ocrFileRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm border border-white/20"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Extract Data
            </button>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
          
          {/* CSV Upload Card */}
          <div className="glass-card p-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 hover:from-green-400 hover:via-emerald-400 hover:to-teal-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25">
            <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4 shadow-inner">
              <TableCellsIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">CSV Upload</h3>
            <p className="text-white/85 text-sm mb-4">Upload certificates in bulk using CSV format</p>
            <button 
              onClick={() => csvFileRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm border border-white/20"
            >
              <TableCellsIcon className="w-4 h-4 mr-2" />
              Upload CSV
            </button>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg pointer-events-none"></div>
          </div>
        </div>

        {/* Hidden file inputs for quick action cards */}
        <input 
          ref={ocrFileRef}
          type="file" 
          className="hidden" 
          accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff,.gif" 
          onChange={handleOcrUpload}
        />
        <input 
          ref={csvFileRef}
          type="file" 
          className="hidden" 
          accept=".csv" 
          onChange={handleCsvUpload}
        />

        {/* Quick OCR/CSV Alerts */}
        {ocrAlert && (
          <div className={`p-4 rounded-lg mb-6 ${ocrAlert.type === 'success' ? 'bg-success-500/20 text-success-200 border border-success-500/30' : 'bg-danger-500/20 text-danger-200 border border-danger-500/30'}`}>
            {ocrAlert.message}
          </div>
        )}
        
        {csvAlert && (
          <div className={`p-4 rounded-lg mb-6 ${
            csvAlert.type === 'success' 
              ? 'bg-success-500/20 text-success-200 border border-success-500/30' 
              : csvAlert.type === 'warning'
              ? 'bg-warning-500/20 text-warning-200 border border-warning-500/30'
              : 'bg-danger-500/20 text-danger-200 border border-danger-500/30'
          }`}>
            <div className="font-medium mb-2">{csvAlert.message}</div>
            {csvAlert.details && (
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>✅ Success: {csvAlert.details.success_count}</div>
                  <div>❌ Errors: {csvAlert.details.error_count}</div>
                  <div>📊 Total: {csvAlert.details.total_rows}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Certificate Section */}
        <div className="glass-card">
          <div className="border-b border-slate-600/30 p-6">
            <h3 className="text-xl font-semibold text-slate-100 flex items-center">
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Add New Certificate to Database
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <form onSubmit={handleCertificateSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="seat_no" className="block text-sm font-medium text-slate-200 mb-2">
                        Seat Number <span className="text-danger-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
                        id="seat_no"
                        name="seat_no"
                        value={certificateForm.seat_no}
                        onChange={handleFormChange}
                        placeholder="e.g., S1900508770"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="student_name" className="block text-sm font-medium text-slate-200 mb-2">
                        Student Name <span className="text-danger-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
                        id="student_name"
                        name="student_name"
                        value={certificateForm.student_name}
                        onChange={handleFormChange}
                        placeholder="e.g., Aniket Todkar"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="mother_name" className="block text-sm font-medium text-slate-200 mb-2">
                        Mother Name <span className="text-danger-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
                        id="mother_name"
                        name="mother_name"
                        value={certificateForm.mother_name}
                        onChange={handleFormChange}
                        placeholder="e.g., Rupali Todkar"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-200 mb-2">
                        Subject <span className="text-danger-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
                        id="subject"
                        name="subject"
                        value={certificateForm.subject}
                        onChange={handleFormChange}
                        placeholder="e.g., Information Technology"
                      />
                    </div>
                    <div>
                      <label htmlFor="sgpa" className="block text-sm font-medium text-slate-200 mb-2">
                        SGPA <span className="text-danger-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
                        id="sgpa"
                        name="sgpa"
                        value={certificateForm.sgpa}
                        onChange={handleFormChange}
                        placeholder="e.g., 9.59"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="result_date" className="block text-sm font-medium text-slate-200 mb-2">
                        Result Date <span className="text-danger-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors duration-200"
                        id="result_date"
                        name="result_date"
                        value={certificateForm.result_date}
                        onChange={handleFormChange}
                        placeholder="e.g., 31 January 2025"
                        required
                      />
                      <div className="text-sm text-slate-400 mt-1">
                        Please enter date in format: DD Month YYYY (e.g., 31 January 2025)
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-success-600 hover:bg-success-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={certLoading}
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      {certLoading ? 'Adding...' : 'Add Certificate'}
                    </button>
                    <button 
                      type="button" 
                      className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      onClick={resetCertForm}
                    >
                      🔄 Reset Form
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="lg:col-span-1">
                <div className="glass-card">
                  <div className="border-b border-slate-600/30 p-4">
                    <h4 className="text-lg font-semibold text-slate-100 flex items-center">
                      <LightBulbIcon className="w-4 h-4 mr-2" />
                      Tips
                    </h4>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <LightBulbIcon className="w-4 h-4 text-warning-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">Use OCR extraction to auto-fill form data</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="w-4 h-4 text-success-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">Verify all fields before submitting</span>
                      </li>
                      <li className="flex items-start">
                        <MagnifyingGlassIcon className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">Ensure seat numbers are unique</span>
                      </li>
                      <li className="flex items-start">
                        <CalendarIcon className="w-4 h-4 text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">Use proper date format</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {certAlert && (
              <div className={`p-4 rounded-lg mt-6 ${certAlert.type === 'success' ? 'bg-success-500/20 text-success-200 border border-success-500/30' : 'bg-danger-500/20 text-danger-200 border border-danger-500/30'}`}>
                {certAlert.message}
              </div>
            )}
          </div>
        </div>
          </div>
        ) : (
          <FraudDetectionDashboard />
        )}
      </div>
    </>
  );
};

export default AdminDashboardPage;