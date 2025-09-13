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
import FAQ from '../components/FAQ';
import { apiService } from '../services/api';

const HomePage = ({ isLoggedIn = false, user = null }) => {
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
      
      <div className="max-w-7xl mx-auto px-6 flex-1">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
          {features.map((feature, index) => (
            <div key={index} className="glass-card p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500/50 hover:bg-slate-800/90">
              <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-100">{feature.title}</h3>
              <p className="text-slate-300 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Conditional Content - Upload for authenticated verifiers, FAQ for public */}
        {isLoggedIn && user?.role === 'verifier' ? (
          /* Upload Section - Only for authenticated verifiers */
          <div className="max-w-3xl mx-auto my-12">
            <div className="glass-card">
              <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600/30 flex items-center gap-2 font-semibold text-slate-100">
                <CloudArrowUpIcon className="w-5 h-5" />
                Upload Certificate for Verification
              </div>
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div 
                  className={`border-2 border-dashed rounded-lg p-12 text-center bg-slate-700/30 transition-all duration-300 cursor-pointer relative ${
                    dragActive 
                      ? 'border-blue-500 bg-slate-600/60 shadow-lg shadow-blue-500/20 -translate-y-1' 
                      : 'border-slate-600/40 hover:border-blue-500 hover:bg-slate-600/60 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`text-4xl mb-4 transition-all duration-300 ${
                    dragActive ? 'text-blue-500 scale-110' : 'text-slate-400 hover:text-blue-500 hover:scale-110'
                  }`}>
                    <CloudArrowUpIcon className="w-8 h-8 mx-auto" />
                  </div>
                  <div className="text-xl font-semibold text-slate-100 mb-2">Drag & Drop Certificate Here</div>
                  <div className="text-slate-300 mb-6">or click to browse files</div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                    className="hidden"
                  />
                  
                  <button type="button" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 btn-glow">
                    <FolderOpenIcon className="w-5 h-5" />
                    Choose File
                  </button>
                  
                  <p className="mt-4 text-xs text-slate-400 text-center">
                    Supported formats: PDF, JPG, PNG, GIF, BMP, TIFF (Max size: 16MB)
                  </p>
                </div>

                {file && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 flex items-center gap-2">
                        📄 {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button 
                        type="button" 
                        onClick={clearFile}
                        className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white rounded text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {file && (
                  <button 
                    type="submit" 
                    className={`w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/30 btn-glow inline-flex items-center justify-center gap-2 ${
                      isLoading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Verify Certificate
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Loading Section */}
          {isLoading && (
            <div className="max-w-3xl mx-auto mt-8">
              <div className="glass-card">
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="text-xl font-semibold text-slate-100 mb-2">Processing Certificate...</h4>
                  <p className="text-slate-400">Please wait while we verify your certificate</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && !isLoading && (
            <div className="max-w-3xl mx-auto mt-8">
              <div className={`glass-card p-6 border-2 ${
                results.status.toLowerCase() === 'authentic' ? 'border-green-500/50 bg-green-500/5' :
                results.status.toLowerCase() === 'suspicious' ? 'border-yellow-500/50 bg-yellow-500/5' :
                results.status.toLowerCase() === 'fake' ? 'border-red-500/50 bg-red-500/5' :
                'border-slate-500/50 bg-slate-500/5'
              }`}>
                {/* Status header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl ${
                    results.status.toLowerCase() === 'authentic' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' :
                    results.status.toLowerCase() === 'suspicious' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
                    results.status.toLowerCase() === 'fake' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                    'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
                  }`}>
                    {getStatusIcon(results.status)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-100">{getStatusTitle(results.status)}</h3>
                    <p className="text-slate-400">Verification ID: {results.verification_id}</p>
                  </div>
                </div>

                {/* Confidence meter */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-100 mb-3">Confidence Score: {Math.round(results.confidence * 100)}%</h4>
                  <div className="bg-slate-600/30 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500 ease-out" 
                      style={{ width: `${Math.round(results.confidence * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Extracted data */}
                {results.details?.extracted_data && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-100 mb-4">Extracted Information:</h4>
                    <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                      <table className="w-full">
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
                            <tr key={key} className="border-b border-slate-600/30 last:border-b-0 hover:bg-slate-600/20">
                              <td className="px-4 py-3 text-sm font-medium text-slate-300 uppercase tracking-wide">{label}</td>
                              <td className="px-4 py-3 text-slate-100">{results.details.extracted_data[key]}</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                )}

                {/* Anomalies */}
                {results.details?.anomalies?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-100 mb-4">Issues Detected:</h4>
                    <div className="space-y-2">
                      {results.details.anomalies.map((anomaly, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-200">{anomaly}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {results.recommendations?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-100 mb-4">Recommendations:</h4>
                    <div className="space-y-2">
                      {results.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                          <CheckCircleIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-200">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <div className="text-center mt-6">
                  <button 
                    type="button" 
                    className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white rounded-lg font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg inline-flex items-center gap-2"
                    onClick={resetForm}
                  >
                    🔄 Verify Another Certificate
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        ) : (
          /* FAQ Section - For public users */
          <FAQ />
        )}
      </div>
    </>
  );
};

export default HomePage;