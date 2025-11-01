import React from "react";
import { IconChevronDown } from "@tabler/icons-react";

export const GradesFilters = ({
  selectedSemester,
  selectedYear,
  semesters,
  academicYears,
  onSemesterChange,
  onYearChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {/* Semester Dropdown */}
      <div className="relative w-full sm:w-auto">
        <select
          value={selectedSemester}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="appearance-none w-full sm:w-auto bg-white text-gray-700 px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 cursor-pointer"
        >
          {semesters.map((semester) => (
            <option key={semester.value} value={semester.value}>
              {semester.label}
            </option>
          ))}
        </select>
        <IconChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
      </div>

      {/* Academic Year Dropdown */}
      <div className="relative w-full sm:w-auto">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="appearance-none w-full sm:w-auto bg-white text-gray-700 px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 cursor-pointer"
        >
          {academicYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <IconChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
      </div>
    </div>
  );
};
