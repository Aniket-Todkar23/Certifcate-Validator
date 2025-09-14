import React, { useState } from 'react';
import BulkFileUploader from '../components/BulkFileUploader';
import BulkUploadReview from '../components/BulkUploadReview';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

const BulkUploadPage = () => {
  const [step, setStep] = useState('upload'); // 'upload' | 'review'
  const [processedFiles, setProcessedFiles] = useState([]);
  const [approvalResults, setApprovalResults] = useState(null);

  const handleFilesProcessed = (files) => {
    setProcessedFiles(files);
    setStep('review');
  };

  const handleApprove = (files, results) => {
    setApprovalResults(results);
    // Remove approved files from the processed files list
    const approvedIds = new Set(files.map(f => f.id));
    setProcessedFiles(prev => prev.filter(f => !approvedIds.has(f.id)));
  };

  const handleReject = (item) => {
    // Remove rejected item from processed files
    setProcessedFiles(prev => prev.filter(f => f.id !== item.id));
  };

  const handleEdit = (itemId, editedData) => {
    setProcessedFiles(prev => prev.map(f => {
      if (f.id === itemId) {
        // Update the processed data with edited values
        if (f.data.type === 'csv') {
          f.data.records[0] = { ...f.data.records[0], ...editedData };
        } else if (f.data.type === 'ocr') {
          f.data.extracted_data = { ...f.data.extracted_data, ...editedData };
        }
      }
      return f;
    }));
  };

  const handleStartOver = () => {
    setStep('upload');
    setProcessedFiles([]);
    setApprovalResults(null);
  };

  const handleBackToUpload = () => {
    setStep('upload');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Bulk Upload</h1>
              <p className="mt-2 text-slate-300">
                Upload and manage certificate files in bulk
              </p>
            </div>
            
            {step === 'review' && (
              <button
                onClick={handleBackToUpload}
                className="flex items-center px-4 py-2 text-slate-300 hover:text-slate-100 border border-slate-600 rounded-lg hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
              </button>
            )}
          </div>
          
          {/* Step Indicator */}
          <div className="mt-6">
            <div className="flex items-center">
              <div className={`flex items-center ${step === 'upload' ? 'text-blue-400' : 'text-green-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'upload' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {step === 'upload' ? '1' : <CheckCircle className="w-5 h-5" />}
                </div>
                <span className="ml-2 font-medium">Upload Files</span>
              </div>
              
              <div className={`flex items-center ml-8 ${step === 'review' ? 'text-blue-400' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'review' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                }`}>
                  2
                </div>
                <span className="ml-2 font-medium">Review & Approve</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {approvalResults && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  Bulk Upload Completed Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{approvalResults.message}</p>
                  {approvalResults.warning && (
                    <p className="mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {approvalResults.warning}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleStartOver}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Upload More Files
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="glass-card">
          {step === 'upload' && (
            <div className="p-6">
              <BulkFileUploader onFilesProcessed={handleFilesProcessed} isAdmin={true} />
            </div>
          )}

          {step === 'review' && (
            <div className="p-6">
              <BulkUploadReview
                processedFiles={processedFiles}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
              />
              
              {processedFiles.length === 0 && approvalResults && (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-100 mb-2">
                    All Files Processed
                  </h3>
                  <p className="text-slate-300 mb-4">
                    All uploaded files have been successfully processed and approved.
                  </p>
                  <button
                    onClick={handleStartOver}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Upload More Files
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 glass-card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">How to Use Bulk Upload</h3>
            <div className="space-y-2 text-slate-300">
              <p>📁 <strong>Step 1:</strong> Drag and drop or select multiple files (CSV, PDF, Images)</p>
              <p>🔄 <strong>Step 2:</strong> Click "Process Files" to extract data automatically</p>
              <p>👁️ <strong>Step 3:</strong> Review extracted data, edit if needed, and select files to approve</p>
              <p>✅ <strong>Step 4:</strong> Click "Submit Selected" to add certificates to database</p>
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Supported Files:</strong> PNG, JPG, PDF (for OCR), CSV (for bulk data) • Max 16MB each
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPage;