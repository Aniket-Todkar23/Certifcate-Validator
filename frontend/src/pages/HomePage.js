import React, { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  CpuChipIcon,
  MagnifyingGlassIcon,
  ServerStackIcon,
  ClockIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/solid';
import Header from '../components/Header';
import { apiService } from '../services/api';

const HomePage = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const features = [
    {
      icon: <CpuChipIcon className="w-6 h-6" />,
      title: "AI-Powered OCR",
      description: "Advanced text extraction from certificate images and PDFs with high accuracy"
    },
    {
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      title: "Smart Detection",
      description: "Identify fraudulent certificates using machine learning algorithms"
    },
    {
      icon: <ServerStackIcon className="w-6 h-6" />,
      title: "Verified Database",
      description: "Cross-verify with official institution records and databases"
    },
    {
      icon: <ClockIcon className="w-6 h-6" />,
      title: "Instant Results",
      description: "Get comprehensive verification results in seconds, not hours"
    }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Please select a valid file type (PDF, JPG, PNG, GIF, BMP, TIFF)');
        return;
      }
      
      // Validate file size (16MB max)
      if (selectedFile.size > 16 * 1024 * 1024) {
        alert('File size must be less than 16MB');
        return;
      }
      
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a certificate file');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.verifyCertificate(file);
      setResults(result);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    clearFile();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'AUTHENTIC':
        return <CheckCircleIcon className="w-6 h-6" />;
      case 'SUSPICIOUS':
        return <ExclamationTriangleIcon className="w-6 h-6" />;
      case 'FAKE':
        return <XCircleIcon className="w-6 h-6" />;
      case 'ERROR':
        return <QuestionMarkCircleIcon className="w-6 h-6" />;
      default:
        return <QuestionMarkCircleIcon className="w-6 h-6" />;
    }
  };

  const getStatusTitle = (status) => {
    switch(status) {
      case 'AUTHENTIC':
        return 'Certificate Appears Authentic';
      case 'SUSPICIOUS':
        return 'Certificate Requires Review';
      case 'FAKE':
        return 'Certificate Appears Fraudulent';
      case 'ERROR':
        return 'Verification Error';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <>
      <Header 
        title="Certificate Authenticity Validator"
        subtitle="Government of Jharkhand - Digital Certificate Verification System"
        description="Secure and reliable certificate verification powered by AI technology"
      />
      
      <div className="container">
        {/* Features Grid */}
        <div className="feature-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="upload-container">
          <div className="card">
            <div className="card-header">
              <CloudArrowUpIcon className="w-5 h-5" />
              Upload Certificate for Verification
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div 
                  className={`upload-area ${dragActive ? 'dragover' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">
                    <CloudArrowUpIcon className="w-8 h-8" />
                  </div>
                  <div className="upload-title">Drag & Drop Certificate Here</div>
                  <div className="upload-subtitle">or click to browse files</div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                    style={{ display: 'none' }}
                  />
                  
                  <button type="button" className="btn btn-primary btn-lg">
                    <FolderOpenIcon className="w-5 h-5" />
                    Choose File
                  </button>
                  
                  <p className="form-text text-center">
                    Supported formats: PDF, JPG, PNG, GIF, BMP, TIFF (Max size: 16MB)
                  </p>
                </div>

                {file && (
                  <div className="alert alert-info mt-3">
                    <div className="d-flex justify-between align-center">
                      <span>
                        📄 {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button 
                        type="button" 
                        onClick={clearFile}
                        className="btn btn-sm btn-secondary"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {file && (
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100 mt-3"
                    disabled={isLoading}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {isLoading ? 'Verifying...' : 'Verify Certificate'}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Loading Section */}
          {isLoading && (
            <div className="results-container">
              <div className="card">
                <div className="card-body text-center p-4">
                  <div className="spinner"></div>
                  <h4 className="mt-3">Processing Certificate...</h4>
                  <p className="text-muted">Please wait while we verify your certificate</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && !isLoading && (
            <div className="results-container">
              <div className={`result-card result-${results.status.toLowerCase()}`}>
                {/* Status header */}
                <div className="result-header">
                  <div className="result-icon">
                    {getStatusIcon(results.status)}
                  </div>
                  <div>
                    <h3>{getStatusTitle(results.status)}</h3>
                    <p className="text-muted">Verification ID: {results.verification_id}</p>
                  </div>
                </div>

                {/* Confidence meter */}
                <div>
                  <h4>Confidence Score: {Math.round(results.confidence * 100)}%</h4>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${Math.round(results.confidence * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Extracted data */}
                {results.details?.extracted_data && (
                  <div className="mt-4">
                    <h4>Extracted Information:</h4>
                    <table className="table">
                      <tbody>
                        {Object.entries({
                          'seat_no': 'Seat Number',
                          'student_name': 'Student Name', 
                          'mother_name': 'Mother Name',
                          'college_name': 'College Name',
                          'subject': 'Subject',
                          'sgpa': 'SGPA',
                          'result_date': 'Result Date'
                        }).map(([key, label]) => (
                          results.details.extracted_data[key] && (
                            <tr key={key}>
                              <td><strong>{label}</strong></td>
                              <td>{results.details.extracted_data[key]}</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Anomalies */}
                {results.details?.anomalies?.length > 0 && (
                  <div className="mt-4">
                    <h4>Issues Detected:</h4>
                    <ul className="list-group">
                      {results.details.anomalies.map((anomaly, index) => (
                        <li key={index} className="list-group-item list-group-item-warning">
                          <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                          {anomaly}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {results.recommendations?.length > 0 && (
                  <div className="mt-4">
                    <h4>Recommendations:</h4>
                    <ul className="list-group">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="list-group-item">
                          <CheckCircleIcon className="w-4 h-4 text-primary" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reset button */}
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-lg"
                    onClick={resetForm}
                  >
                    🔄 Verify Another Certificate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;