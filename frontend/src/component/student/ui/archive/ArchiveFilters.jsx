import React from "react";
import { IconFilter, IconSearch } from "@tabler/icons-react";

export const ArchiveFilters = ({
  searchTerm,
  selectedYear,
  selectedSemester,
  academicYears,
  semesters,
  onSearchChange,
  onYearChange,
  onSemesterChange,
  onPageReset,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <IconFilter className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageReset();
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          />
        </div>

        {/* Academic Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => {
            onYearChange(e.target.value);
            onPageReset();
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
        >
          {academicYears.map((year) => (
            <option key={year.value} value={year.value}>
              {year.label}
            </option>
          ))}
        </select>

        {/* Semester Filter */}
        <select
          value={selectedSemester}
          onChange={(e) => {
            onSemesterChange(e.target.value);
            onPageReset();
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
        >
          {semesters.map((sem) => (
            <option key={sem.value} value={sem.value}>
              {sem.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
