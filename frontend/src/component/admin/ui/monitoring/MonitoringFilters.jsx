import React from 'react';

const MonitoringFilters = ({ filters, setFilters }) => {
  // Count active filters
  const activeFilters = Object.entries(filters).filter(([, value]) => 
    value && value !== ''
  ).length;

  const clearFilters = () => {
    setFilters({
      category: '',
      userType: '',
      success: ''
    });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-4 mb-2">
      <select
        value={filters.category}
        onChange={(e) => setFilters({...filters, category: e.target.value})}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All Categories</option>
        <option value="AUTHENTICATION">Authentication</option>
        <option value="USER_MANAGEMENT">User Management</option>
        <option value="ACADEMIC_MANAGEMENT">Academic Management</option>
        <option value="GRADE_MANAGEMENT">Grade Management</option>
        <option value="SYSTEM">System</option>
        <option value="SECURITY">Security</option>
        <option value="STUDENT_ACTIVITY">Student Activity</option>
        <option value="INSTRUCTOR_ACTIVITY">Instructor Activity</option>
        <option value="PROFILE_MANAGEMENT">Profile Management</option>
      </select>



      <select
        value={filters.userType}
        onChange={(e) => setFilters({...filters, userType: e.target.value})}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All User Types</option>
        <option value="admin">Admin</option>
        <option value="instructor">Instructor</option>
        <option value="student">Student</option>
      </select>

      <select
        value={filters.success}
        onChange={(e) => setFilters({...filters, success: e.target.value})}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All Results</option>
        <option value="true">Success Only</option>
        <option value="false">Failures Only</option>
      </select>
      </div>
      
      {/* Filter status and clear button */}
      {activeFilters > 0 && (
        <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-blue-700">
            {activeFilters} filter{activeFilters > 1 ? 's' : ''} applied
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default MonitoringFilters;