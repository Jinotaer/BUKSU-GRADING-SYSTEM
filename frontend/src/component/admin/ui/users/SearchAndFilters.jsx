import React from "react";

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[250px] max-w-[500px] px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
        />

        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="w-full mr-4 sm:w-auto sm:min-w-[120px] sm:ml-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white cursor-pointer"
        >
          <option value="All">All Roles</option>
          <option value="Student">Students</option>
          <option value="Instructor">Instructors</option>
        </select>
      </div>
    </div>
  );
}
