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
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import { apiService } from '../services/api';

const AdminDashboardPage = ({ adminUser }) => {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [ocrAlert, setOcrAlert] = useState(null);
  const [certAlert, setCertAlert] = useState(null);
  const [certificateForm, setCertificateForm] = useState({
    seat_no: '',
    student_name: '',
    mother_name: '',
    college_name: '',
    subject: '',
    sgpa: '',
    result_date: ''
  });
  
  const ocrFileRef = useRef(null);

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
        college_name: result.extracted_data?.college_name || '',
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
          college_name: '',
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
      college_name: '',
      subject: '',
      sgpa: '',
      result_date: ''
    });
    setCertAlert(null);
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

  if (isLoadingStats) {
    return (
      <>
        <Header 
          title="Admin Dashboard"
          subtitle="Certificate Management & Verification Analytics"
          description="Manage certificates, institutions, and monitor verification activities"
        />
        <div className="container">
          <div className="text-center mt-4">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
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
      
      <div className="container mt-4">
        <div className="d-flex justify-between align-center mb-4">
          <h2>
            <ChartBarIcon className="w-6 h-6 inline mr-2" />
            Dashboard Overview
          </h2>
          <div className="text-muted">
            Welcome, {adminUser || 'Administrator'}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid mb-4">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--success), #0d7d4a)' }}>
            <div className="feature-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3>{stats?.status_distribution?.AUTHENTIC || 0}</h3>
            <h5>Authentic</h5>
            <p>Verified as authentic</p>
          </div>
          
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--warning), #d97706)' }}>
            <div className="feature-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <h3>{stats?.status_distribution?.SUSPICIOUS || 0}</h3>
            <h5>Suspicious</h5>
            <p>Require manual review</p>
          </div>
          
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--danger), #dc2626)' }}>
            <div className="feature-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <XCircleIcon className="w-6 h-6" />
            </div>
            <h3>{stats?.status_distribution?.FAKE || 0}</h3>
            <h5>Fraudulent</h5>
            <p>Detected as fake</p>
          </div>
          
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
            <div className="feature-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <ChartBarIcon className="w-6 h-6" />
            </div>
            <h3>{stats?.total_verifications || 0}</h3>
            <h5>Total Verifications</h5>
            <p>Last 30 days</p>
          </div>
        </div>

        {/* OCR Upload Section */}
        <div className="card mt-4">
          <div className="card-header">
            <SparklesIcon className="w-5 h-5" />
            OCR Document Extraction
          </div>
          <div className="card-body">
            <div className="upload-area" style={{ cursor: 'pointer', minHeight: 'auto', padding: '2rem' }}>
              <div className="upload-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                <FolderOpenIcon className="w-8 h-8 mx-auto" />
              </div>
              <div className="upload-title" style={{ fontSize: '1.1rem' }}>Upload Certificate for OCR Extraction</div>
              <div className="upload-subtitle">Drag & drop or click to select PDF/Image files</div>
              
              <form onSubmit={handleOcrUpload} style={{ marginTop: '1rem' }}>
                <input 
                  ref={ocrFileRef}
                  type="file" 
                  className="form-control" 
                  accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff,.gif" 
                  style={{ display: 'none' }}
                  required 
                />
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => ocrFileRef.current?.click()}
                >
                  <FolderOpenIcon className="w-4 h-4" />
                  Choose File
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary ms-2"
                  disabled={ocrLoading}
                >
                  <SparklesIcon className="w-4 h-4" />
                  {ocrLoading ? 'Extracting...' : 'Extract Data'}
                </button>
              </form>
            </div>
            
            {ocrAlert && (
              <div className={`alert alert-${ocrAlert.type} mt-3`}>
                {ocrAlert.message}
              </div>
            )}
          </div>
        </div>

        {/* Add Certificate Section */}
        <div className="card mt-4">
          <div className="card-header">
            <PlusCircleIcon className="w-5 h-5" />
            Add New Certificate to Database
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-lg-8">
                <form onSubmit={handleCertificateSubmit}>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label htmlFor="seat_no" className="form-label">
                        Seat Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="seat_no"
                        name="seat_no"
                        value={certificateForm.seat_no}
                        onChange={handleFormChange}
                        placeholder="e.g., S1900508770"
                        required
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="student_name" className="form-label">
                        Student Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="student_name"
                        name="student_name"
                        value={certificateForm.student_name}
                        onChange={handleFormChange}
                        placeholder="e.g., Aniket Todkar"
                        required
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="mother_name" className="form-label">
                        Mother Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="mother_name"
                        name="mother_name"
                        value={certificateForm.mother_name}
                        onChange={handleFormChange}
                        placeholder="e.g., Rupali Todkar"
                        required
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="college_name" className="form-label">
                        College Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="college_name"
                        name="college_name"
                        value={certificateForm.college_name}
                        onChange={handleFormChange}
                        placeholder="e.g., Pune Institute of Computer Technology"
                        required
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="subject" className="form-label">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="subject"
                        name="subject"
                        value={certificateForm.subject}
                        onChange={handleFormChange}
                        placeholder="e.g., Information Technology"
                        required
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="sgpa" className="form-label">
                        SGPA <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="form-control"
                        id="sgpa"
                        name="sgpa"
                        value={certificateForm.sgpa}
                        onChange={handleFormChange}
                        placeholder="e.g., 9.59"
                        required
                      />
                    </div>
                    <div className="col-md-12 form-group">
                      <label htmlFor="result_date" className="form-label">
                        Result Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="result_date"
                        name="result_date"
                        value={certificateForm.result_date}
                        onChange={handleFormChange}
                        placeholder="e.g., 31 January 2025"
                        required
                      />
                      <div className="form-text">
                        Please enter date in format: DD Month YYYY (e.g., 31 January 2025)
                      </div>
                    </div>
                  </div>

                  <div className="form-group mt-4">
                    <button 
                      type="submit" 
                      className="btn btn-success btn-lg"
                      disabled={certLoading}
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      {certLoading ? 'Adding...' : 'Add Certificate'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-lg ms-2"
                      onClick={resetCertForm}
                    >
                      🔄 Reset Form
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="col-lg-4">
                <div className="card">
                  <div className="card-header">
                    <LightBulbIcon className="w-4 h-4" />
                    Tips
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <LightBulbIcon className="w-4 h-4 text-warning inline mr-2" />
                        Use OCR extraction to auto-fill form data
                      </li>
                      <li className="mb-2">
                        <CheckCircleIcon className="w-4 h-4 text-success inline mr-2" />
                        Verify all fields before submitting
                      </li>
                      <li className="mb-2">
                        <MagnifyingGlassIcon className="w-4 h-4 text-info inline mr-2" />
                        Ensure seat numbers are unique
                      </li>
                      <li>
                        <CalendarIcon className="w-4 h-4 text-primary inline mr-2" />
                        Use proper date format
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {certAlert && (
              <div className={`alert alert-${certAlert.type} mt-3`}>
                {certAlert.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;