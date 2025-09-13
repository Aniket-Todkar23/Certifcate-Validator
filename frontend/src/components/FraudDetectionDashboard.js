import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

const FraudDetectionDashboard = () => {
  const [fraudLogs, setFraudLogs] = useState([]);
  const [fraudStats, setFraudStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadFraudData();
    loadFraudStats();
  }, [currentPage, filters]);

  const loadFraudData = async () => {
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
  };

  const loadFraudStats = async () => {
    try {
      const stats = await apiService.getFraudStats();
      setFraudStats(stats);
    } catch (error) {
      console.error('Failed to load fraud stats:', error);
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
      {fraudStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-6">
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

      {/* Fraud Logs Table */}
      <div className="glass-card">
        <div className="border-b border-slate-600/30 p-6">
          <h3 className="text-xl font-semibold text-slate-100 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Fraud Detection Logs
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-slate-300">Loading fraud logs...</p>
          </div>
        ) : fraudLogs.length === 0 ? (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  );
};

export default FraudDetectionDashboard;