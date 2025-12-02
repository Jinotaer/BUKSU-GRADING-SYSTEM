import React, { useState, useEffect } from 'react';
import {
  IconRefresh,
  IconDownload
} from '@tabler/icons-react';
import { NavbarSimple } from './adminsidebar';
import { authenticatedFetch } from '../../utils/auth';

// Import separated components
import MonitoringFilters from './ui/monitoring/MonitoringFilters';
import ActivityLogs from './ui/monitoring/ActivityLogs';



const MonitoringDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [logsPagination, setLogsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    itemsPerPage: 20
  });
  const [filters, setFilters] = useState({
    category: '',
    userType: '',
    success: ''
  });

  // Wrapper to reset pagination when filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setLogsPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Fetch monitoring data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for logs endpoint
      const logsParams = new URLSearchParams({
        page: logsPagination.currentPage.toString(),
        limit: logsPagination.itemsPerPage.toString()
      });
      if (filters.category) logsParams.append('category', filters.category);
      if (filters.userType) logsParams.append('userType', filters.userType);
      if (filters.success) logsParams.append('success', filters.success);
      
      const logsRes = await authenticatedFetch(`http://localhost:5000/api/monitoring/logs?${logsParams}`);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.data?.logs || []);
        
        // Update logs pagination
        if (logsData.data?.pagination) {
          setLogsPagination({
            currentPage: logsData.data.pagination.currentPage,
            totalPages: logsData.data.pagination.totalPages,
            totalLogs: logsData.data.pagination.totalLogs,
            itemsPerPage: logsPagination.itemsPerPage
          });
        }
      }

    } catch (err) {
      setError('Failed to fetch monitoring data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters or pagination changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.userType, filters.success, logsPagination.currentPage, logsPagination.itemsPerPage]);

  const handleExport = async () => {
    try {
      const exportParams = new URLSearchParams({
        format: 'pdf'
      });
      if (filters.category) exportParams.append('category', filters.category);

      if (filters.userType) exportParams.append('userType', filters.userType);
      if (filters.success) exportParams.append('success', filters.success);
      
      const response = await authenticatedFetch(
        `http://localhost:5000/api/monitoring/logs/export?${exportParams}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Pagination handlers
  const handleLogsPageChange = (page) => {
    setLogsPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleLogsItemsPerPageChange = (itemsPerPage) => {
    setLogsPagination(prev => ({ 
      ...prev, 
      itemsPerPage, 
      currentPage: 1 // Reset to first page when changing items per page
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-8 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#1E3A5F]">Activity Logs</h1>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <IconRefresh size={20} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <IconDownload size={20} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <MonitoringFilters filters={filters} setFilters={handleFilterChange} />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Activity Logs Content */}
        <ActivityLogs 
          logs={logs} 
          loading={loading} 
          formatDate={formatDate}
          totalLogs={logsPagination.totalLogs}
          currentPage={logsPagination.currentPage}
          itemsPerPage={logsPagination.itemsPerPage}
          onPageChange={handleLogsPageChange}
          onItemsPerPageChange={handleLogsItemsPerPageChange}
        />
      </div>
    </div>
  );
};

export default MonitoringDashboard;