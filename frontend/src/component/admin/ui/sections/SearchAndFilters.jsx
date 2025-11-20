import React from "react";
import { IconSearch } from "@tabler/icons-react";

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  filterSemester,
  onSemesterChange,
  filterCollege,
  onCollegeChange,
  semesters,
  collegeOptions,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="relative order-1">
          <IconSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search sections / subjects / instructors..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base"
          />
        </div>

        <select
          value={filterSemester}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base order-2 cursor-pointer"
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
          onChange={(e) => onCollegeChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base order-3 sm:col-span-2 lg:col-span-1 cursor-pointer"
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
