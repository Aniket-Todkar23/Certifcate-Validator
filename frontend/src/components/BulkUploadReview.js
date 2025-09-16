import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Edit, Trash2, Upload } from 'lucide-react';
import { apiService } from '../services/api';

const BulkUploadReview = ({ processedFiles, onApprove, onReject, onEdit }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select successfully processed items when processedFiles changes
  useEffect(() => {
    if (processedFiles && processedFiles.length > 0) {
      // Auto-select all successfully processed items
      setSelectedItems(new Set(processedFiles.filter(f => f.status === 'processed').map(f => f.id)));
    }
  }, [processedFiles]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(processedFiles.map(f => f.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const startEdit = (item) => {
    setEditingItem(item.id);
    if (item.data.type === 'csv') {
      setEditData(item.data.records[0] || {});
    } else if (item.data.type === 'ocr') {
      setEditData(item.data.extracted_data || {});
    }
  };

  const saveEdit = () => {
    if (onEdit) {
      onEdit(editingItem, editData);
    }
    setEditingItem(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditData({});
  };

  const handleSubmitSelected = async () => {
    if (selectedItems.size === 0) return;
    
    setIsSubmitting(true);
    try {
      const selectedFiles = processedFiles.filter(f => selectedItems.has(f.id));
      const approvedItems = [];
      
      for (const item of selectedFiles) {
        if (item.data.type === 'csv') {
          // Prepare CSV data for bulk insert
          approvedItems.push(...item.data.records.map(record => ({
            source: 'csv',
            filename: item.file.name,
            data: record
          })));
        } else if (item.data.type === 'ocr') {
          // Prepare OCR data
          approvedItems.push({
            source: 'ocr',
            filename: item.file.name,
            data: item.data.extracted_data,
            confidence: item.data.confidence
          });
        }
      }
      
      // Submit to backend
      const result = await apiService.bulkApproveCertificates(approvedItems);
      
      if (onApprove) {
        onApprove(selectedFiles, result);
      }
      // Clear selections
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.message || 'Network error during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDataPreview = (item) => {
    if (item.data.type === 'csv') {
      return (
        <div className="mt-3">
          <h5 className="font-medium text-slate-100 mb-2">
            CSV Data ({item.data.records.length} records)
          </h5>
          <div className="bg-slate-700/30 rounded p-3 max-h-60 overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  {item.data.headers.map((header, idx) => (
                    <th key={idx} className="px-2 py-1 text-left font-medium text-slate-100 border-b border-slate-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.data.records.map((record, idx) => (
                  <tr key={idx} className={`border-t border-slate-600 ${idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-700/20'}`}>
                    {item.data.headers.map((header, colIdx) => (
                      <td key={colIdx} className="px-2 py-1 text-slate-300 border-r border-slate-600">
                        {record[header] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Total records: {item.data.records.length}
          </div>
        </div>
      );
    } else if (item.data.type === 'ocr') {
      const data = item.data.extracted_data;
      return (
        <div className="mt-3">
          <h5 className="font-medium text-slate-100 mb-2">
            Extracted Data (Confidence: {(item.data.confidence * 100).toFixed(1)}%)
          </h5>
          <div className="bg-slate-700/30 rounded p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="font-medium text-slate-300 text-xs uppercase tracking-wide">{key.replace('_', ' ')}:</span>
                  <span className="mt-1 text-slate-100 bg-slate-800/50 px-2 py-1 rounded border border-slate-600">{value || 'N/A'}</span>
                </div>
              ))}
            </div>
            {item.data.raw_text && (
              <div className="mt-3">
                <span className="font-medium text-slate-300 text-xs uppercase tracking-wide">Raw OCR Text:</span>
                <div className="mt-1 text-xs text-slate-300 bg-slate-800/50 px-2 py-2 rounded border border-slate-600 max-h-20 overflow-auto">
                  {item.data.raw_text}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const renderEditForm = (item) => {
    if (editingItem !== item.id) return null;
    
    return (
      <div className="mt-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
        <h5 className="font-medium text-slate-100 mb-3">Edit Data</h5>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(editData).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {key}
              </label>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  [key]: e.target.value
                }))}
                className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-600 text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={saveEdit}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={cancelEdit}
            className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (!processedFiles || processedFiles.length === 0) {
    return (
      <div className="text-center py-8">
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-slate-300">No processed files to review</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 glass-card rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Review Processed Files</h2>
        <p className="text-slate-300">
          Review extracted data and approve for database insertion
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6 p-4 bg-slate-700/30 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-100">
            {processedFiles.length} files processed
          </span>
          <span className="text-sm text-slate-400">
            {selectedItems.size} selected
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="text-sm text-slate-400 hover:text-slate-300"
          >
            Deselect All
          </button>
          <button
            onClick={handleSubmitSelected}
            disabled={selectedItems.size === 0 || isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : `Submit Selected (${selectedItems.size})`}
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-4">
        {processedFiles.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              selectedItems.has(item.id) ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-600/50'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  
                  <div className="flex items-center space-x-2">
                    {item.status === 'processed' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-medium text-slate-100">
                      {item.file.name}
                    </span>
                  </div>
                  
                  <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                    {item.data.type.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 text-blue-400 hover:text-blue-300"
                    title="Edit data"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReject && onReject(item)}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Always show data preview */}
              {renderDataPreview(item)}
              {renderEditForm(item)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-medium text-blue-400 mb-2">Submission Summary</h3>
        <div className="text-sm text-slate-300">
          <p>Ready to submit {selectedItems.size} files to the database</p>
          <p className="text-xs mt-1">
            All selected items will be added as new certificate records
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadReview;