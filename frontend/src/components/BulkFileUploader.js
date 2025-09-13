import React, { useState, useCallback } from 'react';
import { Upload, File, Image, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

const BulkFileUploader = ({ onFilesProcessed, isAdmin = false }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
    'application/pdf': ['.pdf'],
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (file.type.includes('csv') || file.type.includes('excel')) {
      return <File className="w-5 h-5 text-green-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFileTypeLabel = (file) => {
    if (file.type.startsWith('image/')) {
      return 'Certificate Image';
    } else if (file.type === 'application/pdf') {
      return 'PDF Document';
    } else if (file.type.includes('csv') || file.type.includes('excel')) {
      return 'CSV Data';
    }
    return 'Unknown File';
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const isValidType = Object.keys(acceptedFileTypes).some(type => 
        file.type === type || 
        acceptedFileTypes[type].some(ext => file.name.toLowerCase().endsWith(ext))
      );
      return isValidType && file.size <= 16 * 1024 * 1024; // 16MB limit
    });

    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueFiles = validFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...uniqueFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        status: 'pending',
        data: null,
        error: null
      }))];
    });
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const processedResults = [];
    
    try {
      // Process each file and update state
      for (const fileItem of files) {
        const { file, id } = fileItem;
        const updatedFileItem = { ...fileItem };
        
        if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
          // Handle CSV files
          try {
            const text = await file.text();
            const rows = text.split('\n').map(row => row.split(','));
            const headers = rows[0].map(h => h.trim());
            const data = rows.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index]?.trim() || '';
              });
              return obj;
            }).filter(row => Object.values(row).some(val => val !== ''));
            
            updatedFileItem.status = 'processed';
            updatedFileItem.data = { type: 'csv', records: data, headers };
            processedResults.push(updatedFileItem);
          } catch (error) {
            console.error('CSV processing error:', error);
            updatedFileItem.status = 'error';
            updatedFileItem.error = 'Failed to parse CSV file';
          }
        } else {
          // Handle images and PDFs - send to OCR endpoint
          try {
            const result = await apiService.extractOCR(file);
            updatedFileItem.status = 'processed';
            updatedFileItem.data = {
              type: 'ocr',
              extracted_data: result.extracted_data,
              raw_text: result.raw_text,
              confidence: result.extraction_confidence
            };
            processedResults.push(updatedFileItem);
          } catch (error) {
            console.error('OCR processing error:', error);
            updatedFileItem.status = 'error';
            updatedFileItem.error = error.message || 'OCR processing failed';
          }
        }
        
        // Update the files state with processed result
        setFiles(prev => prev.map(f => f.id === id ? updatedFileItem : f));
      }
      
      // Call the parent callback with successfully processed files
      const successfulResults = processedResults.filter(item => item.status === 'processed');
      if (onFilesProcessed && successfulResults.length > 0) {
        onFilesProcessed(successfulResults);
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk File Upload</h2>
        <p className="text-gray-600">
          Upload multiple files: Certificate images (PNG, JPG, PDF) and CSV data files
        </p>
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.gif,.bmp,.tiff,.pdf,.csv,.xlsx"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supported: Images (PNG, JPG, PDF), CSV files • Max 16MB each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Files ({files.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Deselect All
              </button>
              <button
                onClick={processFiles}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Process Files'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className={`flex items-center p-3 border rounded-lg ${
                  selectedFiles.has(fileItem.id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(fileItem.id)}
                  onChange={() => toggleFileSelection(fileItem.id)}
                  className="mr-3"
                />
                
                {getFileIcon(fileItem.file)}
                
                <div className="flex-1 ml-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getFileTypeLabel(fileItem.file)} • {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {fileItem.status === 'processed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {fileItem.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800">Processing files...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkFileUploader;