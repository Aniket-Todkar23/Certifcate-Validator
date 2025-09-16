import React, { useState, useEffect, useCallback } from 'react';
import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  NoSymbolIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

const FraudDetectionDashboard = () => {
  const [activeTab, setActiveTab] = useState('fraud-logs');
  const [fraudLogs, setFraudLogs] = useState([]);
  const [blacklistItems, setBlacklistItems] = useState([]);
  const [fraudStats, setFraudStats] = useState(null);
  const [blacklistStats, setBlacklistStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [selectedFraudLog, setSelectedFraudLog] = useState(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  const loadFraudData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getFraudLogs(
        currentPage, 
        20, 
        filters.status, 
        filters.dateFrom, 
        filters.dateTo
      );
      setFraudLogs(data.fraud_logs || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      setAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to load fraud logs' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  const loadFraudStats = async () => {
    try {
      const stats = await apiService.getFraudStats();
      setFraudStats(stats);
    } catch (error) {
      console.error('Failed to load fraud stats:', error);
    }
  };

  const loadBlacklistData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getBlacklistItems(currentPage, 20);
      setBlacklistItems(data.blacklist_items || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      setAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to load blacklist items' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === 'fraud-logs') {
      loadFraudData();
      loadFraudStats();
    } else if (activeTab === 'blacklist') {
      loadBlacklistData();
      loadBlacklistStats();
    }
  }, [currentPage, filters, activeTab, loadFraudData, loadBlacklistData]);

  const loadBlacklistStats = async () => {
    try {
      const stats = await apiService.getBlacklistStats();
      setBlacklistStats(stats);
    } catch (error) {
      console.error('Failed to load blacklist stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await apiService.exportFraudLogs(filters.status, filters.dateFrom, filters.dateTo);
      setAlert({ 
        type: 'success', 
        message: 'Fraud logs exported successfully!' 
      });
    } catch (error) {
      setAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to export fraud logs' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkReviewed = async (fraudId) => {
    try {
      await apiService.updateFraudLog(fraudId, { reviewed_by_admin: true });
      loadFraudData(); // Reload data
      setAlert({ 
        type: 'success', 
        message: 'Fraud log marked as reviewed' 
      });
    } catch (error) {
      setAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to update fraud log' 
      });
    }
  };

  const handleShowBlacklistModal = (fraudLog) => {
    setSelectedFraudLog(fraudLog);
    setBlacklistReason('');
    setShowBlacklistModal(true);
  };

  const handleAddToBlacklist = async () => {
    if (!selectedFraudLog) return;
    
    try {
      await apiService.addToBlacklist(
        selectedFraudLog.id,
        blacklistReason,
        true, // auto_block_seat_no
        false // auto_block_name_combo
      );
      
      setShowBlacklistModal(false);
      setSelectedFraudLog(null);
      setBlacklistReason('');
      
      // Reload fraud logs data to remove the newly blacklisted item
      loadFraudData();
      // Also reload fraud stats to update counts
      loadFraudStats();
      
      setAlert({ 
        type: 'success', 
        message: 'Certificate added to blacklist successfully' 
      });
    } catch (error) {
      setAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to add to blacklist' 
      });
    }
  };

  const handleRemoveFromBlacklist = async (fraudLogId) => {
    if (!window.confirm('Are you sure you want to remove this item from the blacklist?')) {
      return;
    }
    
    try {
      await apiService.removeFromBlacklist(fraudLogId);
      loadBlacklistData(); // Reload blacklist data
      // Also reload fraud logs and stats in case the item should reappear there
      loadFraudData();
      loadFraudStats();
      setAlert({ 
        type: 'success', 
        message: 'Item removed from blacklist successfully' 
      });
    } catch (error) {
      setAlert({ 
        type: 'danger', 
        message: error.message || 'Failed to remove from blacklist' 
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    if (status === 'FAKE') {
      return `${baseClasses} bg-red-500/20 text-red-200 border border-red-500/30`;
    } else if (status === 'SUSPICIOUS') {
      return `${baseClasses} bg-yellow-500/20 text-yellow-200 border border-yellow-500/30`;
    }
    return `${baseClasses} bg-slate-500/20 text-slate-200 border border-slate-500/30`;
  };

  const parseReasons = (reasonString) => {
    try {
      const reasons = JSON.parse(reasonString || '[]');
      return Array.isArray(reasons) ? reasons : [reasonString];
    } catch {
      return reasonString ? [reasonString] : [];
    }
  };

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-red-400" />
            Fraud Detection Dashboard
          </h2>
          <p className="text-slate-400 mt-1">Monitor and manage detected fraudulent certificate attempts</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`p-4 rounded-lg ${
          alert.type === 'success' 
            ? 'bg-success-500/20 text-success-200 border border-success-500/30' 
            : 'bg-danger-500/20 text-danger-200 border border-danger-500/30'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Statistics Cards */}
      {((activeTab === 'fraud-logs' && fraudStats) || (activeTab === 'blacklist' && blacklistStats)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeTab === 'fraud-logs' && fraudStats && (
            <>
              <div className="glass-card p-6 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <XCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{fraudStats.total_fraud_attempts}</h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Total Fraud Attempts</h5>
                <p className="text-white/85 text-sm">All time</p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{fraudStats.pending_review}</h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Pending Review</h5>
                <p className="text-white/85 text-sm">Needs admin attention</p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{fraudStats.reviewed_count}</h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Reviewed</h5>
                <p className="text-white/85 text-sm">{fraudStats.review_percentage}% completed</p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {Object.entries(fraudStats.status_distribution || {}).reduce((max, [status, count]) => 
                    count > max.count ? { status, count } : max, { status: '', count: 0 }
                  ).status || 'N/A'}
                </h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Most Common</h5>
                <p className="text-white/85 text-sm">Fraud type</p>
              </div>
            </>
          )}
          
          {activeTab === 'blacklist' && blacklistStats && (
            <>
              <div className="glass-card p-6 bg-gradient-to-br from-gray-600 via-slate-600 to-gray-700">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <NoSymbolIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{blacklistStats.total_blacklisted}</h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Total Blacklisted</h5>
                <p className="text-white/85 text-sm">Certificates blocked</p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <XCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{blacklistStats.auto_block_seat_count}</h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Auto-Block by Seat</h5>
                <p className="text-white/85 text-sm">Seat number blocking</p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{blacklistStats.auto_block_name_count}</h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Auto-Block by Name</h5>
                <p className="text-white/85 text-sm">Name combo blocking</p>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-teal-500 via-green-500 to-emerald-600">
                <div className="flex items-center justify-center w-12 h-12 bg-white/25 backdrop-blur-sm rounded-xl mb-4">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {blacklistStats.daily_counts?.length || 0}
                </h3>
                <h5 className="text-lg font-semibold text-white/95 mb-2">Active Days</h5>
                <p className="text-white/85 text-sm">Last 30 days</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-slate-600/30">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => {
                setActiveTab('fraud-logs');
                setCurrentPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fraud-logs'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2 inline" />
              Fraud Detection Logs
            </button>
            <button
              onClick={() => {
                setActiveTab('blacklist');
                setCurrentPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blacklist'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <NoSymbolIcon className="w-5 h-5 mr-2 inline" />
              Blacklisted Certificates
            </button>
          </nav>
        </div>

        {/* Filters - Only for fraud logs */}
        {activeTab === 'fraud-logs' && (
          <div className="p-6 border-b border-slate-600/30">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="FAKE">Fake</option>
                  <option value="SUSPICIOUS">Suspicious</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div>
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-slate-300">
                Loading {activeTab === 'fraud-logs' ? 'fraud logs' : 'blacklist items'}...
              </p>
            </div>
          ) : activeTab === 'fraud-logs' ? (
            // Fraud Logs Content
            fraudLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No fraud attempts detected yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Detection</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Certificate Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reasons</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600/30">
                    {fraudLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-700/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-slate-200 font-medium">{formatDate(log.detected_at)}</div>
                            <div className="text-slate-400">Confidence: {(log.confidence_score * 100).toFixed(1)}%</div>
                            <div className="text-slate-400 text-xs">ID: {log.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <div className="text-slate-200">{log.extracted_student_name || 'N/A'}</div>
                            <div className="text-slate-400">Seat: {log.extracted_seat_no || 'N/A'}</div>
                            <div className="text-slate-400">SGPA: {log.extracted_sgpa || 'N/A'}</div>
                            <div className="text-slate-400">Subject: {log.extracted_subject || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(log.fraud_status)}>
                            {log.fraud_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {parseReasons(log.detection_reason).map((reason, index) => (
                              <div key={index} className="text-slate-300 mb-1">
                                • {reason}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-slate-400">{log.uploaded_filename || 'N/A'}</div>
                            <div className="text-slate-400 text-xs">{log.ip_address || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {log.fraud_status === 'FAKE' && !log.blacklist_entry && (
                              <button
                                onClick={() => handleShowBlacklistModal(log)}
                                className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
                              >
                                <NoSymbolIcon className="w-3 h-3 mr-1" />
                                Add to Blacklist
                              </button>
                            )}
                            {!log.reviewed_by_admin ? (
                              <button
                                onClick={() => handleMarkReviewed(log.id)}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                              >
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Mark Reviewed
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-200 rounded text-xs">
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Reviewed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Blacklist Content
            blacklistItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <NoSymbolIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No certificates are currently blacklisted</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Blacklisted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Certificate Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Detection Info</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Blacklist Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Auto-Block Settings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600/30">
                    {blacklistItems.map((item) => (
                      <tr key={item.fraud_detection_log_id} className="hover:bg-slate-700/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-slate-200 font-medium">{formatDate(item.blacklisted_at)}</div>
                            <div className="text-slate-400">By: {item.blacklisted_by_username || 'Unknown'}</div>
                            <div className="text-slate-400 text-xs">ID: {item.fraud_detection_log_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <div className="text-slate-200">{item.fraud_log?.extracted_student_name || 'N/A'}</div>
                            <div className="text-slate-400">Seat: {item.fraud_log?.extracted_seat_no || 'N/A'}</div>
                            <div className="text-slate-400">SGPA: {item.fraud_log?.extracted_sgpa || 'N/A'}</div>
                            <div className="text-slate-400">Subject: {item.fraud_log?.extracted_subject || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className={getStatusBadge(item.fraud_log?.fraud_status)}>
                              {item.fraud_log?.fraud_status}
                            </span>
                            <div className="text-slate-400 mt-1">
                              Confidence: {((item.fraud_log?.confidence_score || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-300">
                            {item.blacklist_reason || 'No specific reason provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              item.auto_block_seat_no 
                                ? 'bg-green-500/20 text-green-200' 
                                : 'bg-gray-500/20 text-gray-200'
                            }`}>
                              Seat No: {item.auto_block_seat_no ? 'ON' : 'OFF'}
                            </div>
                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              item.auto_block_name_combo 
                                ? 'bg-green-500/20 text-green-200' 
                                : 'bg-gray-500/20 text-gray-200'
                            }`}>
                              Name Combo: {item.auto_block_name_combo ? 'ON' : 'OFF'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRemoveFromBlacklist(item.fraud_detection_log_id)}
                            className="inline-flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors"
                          >
                            <TrashIcon className="w-3 h-3 mr-1" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-600/30">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blacklist Modal */}
      {showBlacklistModal && selectedFraudLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Add to Blacklist</h3>
            <div className="mb-4">
              <p className="text-slate-300 mb-2">
                Certificate: <span className="font-medium">{selectedFraudLog.extracted_student_name}</span>
              </p>
              <p className="text-slate-400 text-sm">
                Seat No: {selectedFraudLog.extracted_seat_no}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Blacklist Reason (Optional)
              </label>
              <textarea
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                rows={3}
                placeholder="Enter reason for blacklisting this certificate..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBlacklistModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToBlacklist}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Add to Blacklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudDetectionDashboard;