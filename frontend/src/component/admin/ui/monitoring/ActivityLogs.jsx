import React, { useState, useEffect } from 'react';
import {
  IconEye,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';

// Category color mapping
const categoryColors = {
  AUTHENTICATION: 'bg-purple-100 text-purple-800',
  USER_MANAGEMENT: 'bg-green-100 text-green-800',
  ACADEMIC_MANAGEMENT: 'bg-blue-100 text-blue-800',
  GRADE_MANAGEMENT: 'bg-indigo-100 text-indigo-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
  SECURITY: 'bg-red-100 text-red-800',
  STUDENT_ACTIVITY: 'bg-cyan-100 text-cyan-800',
  INSTRUCTOR_ACTIVITY: 'bg-emerald-100 text-emerald-800',
  PROFILE_MANAGEMENT: 'bg-pink-100 text-pink-800'
};

// User type color mapping
const userTypeColors = {
  admin: 'bg-red-100 text-red-800',
  instructor: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800'
};

const ActivityLogs = ({ logs, loading, formatDate, totalLogs = 0, onPageChange, onItemsPerPageChange, currentPage = 1, itemsPerPage = 10 }) => {
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
  
  // Update local state when props change
  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);
  
  useEffect(() => {
    setLocalItemsPerPage(itemsPerPage);
  }, [itemsPerPage]);
  
  // Calculate pagination
  const totalPages = Math.ceil(totalLogs / localItemsPerPage);
  const startItem = (localCurrentPage - 1) * localItemsPerPage + 1;
  const endItem = Math.min(localCurrentPage * localItemsPerPage, totalLogs);
  
  // Handle pagination
  const handlePageChange = (page) => {
    setLocalCurrentPage(page);
    if (onPageChange) onPageChange(page);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setLocalItemsPerPage(newItemsPerPage);
    setLocalCurrentPage(1);
    if (onItemsPerPageChange) onItemsPerPageChange(newItemsPerPage);
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Loading activity logs...</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <IconEye className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No activity logs found</p>
                  <p className="text-xs text-gray-400">Activity logs will appear here as users interact with the system</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{log.userEmail || log.adminEmail}</span>
                      {(log.userType || (log.adminEmail && 'admin')) && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${userTypeColors[log.userType || 'admin']}`}>
                          {log.userType || 'admin'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${categoryColors[log.category] || 'bg-gray-100 text-gray-800'}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.success ? (
                      <IconCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <IconX className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={log.description}>
                    {log.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {!loading && logs.length > 0 && totalLogs > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={localItemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          
          {/* Pagination info */}
          <div className="text-sm text-gray-700 text-center">
            Showing {startItem} to {endItem} of {totalLogs} entries
          </div>
          
          {/* Page navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(localCurrentPage - 1)}
              disabled={localCurrentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              {/* Show page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (localCurrentPage <= 3) {
                  pageNum = i + 1;
                } else if (localCurrentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = localCurrentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      localCurrentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(localCurrentPage + 1)}
              disabled={localCurrentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;