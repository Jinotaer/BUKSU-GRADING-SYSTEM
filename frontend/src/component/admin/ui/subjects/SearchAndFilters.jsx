import React from "react";
import { IconSearch } from "@tabler/icons-react";

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  filterSemester,
  onFilterSemesterChange,
  filterCollege,
  onFilterCollegeChange,
  semesters,
  collegeOptions,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="relative order-1">
          <IconSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            size={18}
          />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
          />
        </div>

        <select
          value={filterSemester}
          onChange={(e) => onFilterSemesterChange(e.target.value)}
          className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-2 transition-shadow hover:border-gray-400 bg-white"
        >
          <option value="">All Semesters</option>
          {semesters.map((semester) => (
            <option key={semester._id} value={semester._id}>
              {semester.schoolYear} - {semester.term} Semester
            </option>
          ))}
        </select>

        <select
          value={filterCollege}
          onChange={(e) => onFilterCollegeChange(e.target.value)}
          className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-3 sm:col-span-2 lg:col-span-1 transition-shadow hover:border-gray-400 bg-white"
        >
          <option value="">All Colleges</option>
          {collegeOptions.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
