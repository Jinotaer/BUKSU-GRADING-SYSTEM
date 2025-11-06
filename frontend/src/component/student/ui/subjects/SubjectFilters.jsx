import React from "react";

export const SubjectFilters = ({
  searchTerm,
  selectedYear,
  selectedSemester,
  academicYears,
  semesters,
  onSearchChange,
  onYearChange,
  onSemesterChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between mb-8 gap-5">
      <input
        type="text"
        placeholder="Search Class"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Academic Year
          </span>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {academicYears.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Semester</span>
          <select
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {semesters.map((semester) => (
              <option key={semester.value} value={semester.value}>
                {semester.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
