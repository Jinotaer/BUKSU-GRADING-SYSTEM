import React from "react";
import { IconUsers, IconSearch } from "@tabler/icons-react";

export function StudentsTableHeader({
  selectedSection,
  totalStudents,
  filteredStudentsCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
}) {
  return (
    <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
            {selectedSection.sectionName || selectedSection.section_name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {selectedSection.subject?.subjectName ||
              selectedSection.subject?.subject_name ||
              "No Subject"}{" "}
            ·{" "}
            {selectedSection.term ||
              selectedSection.semester?.semester_name ||
              "No Term"}{" "}
            {selectedSection.schoolYear ||
              selectedSection.semester?.academic_year ||
              ""}
          </p>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 flex-shrink-0">
          <IconUsers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {searchQuery.trim()
            ? `${filteredStudentsCount} of ${totalStudents}`
            : totalStudents}
        </div>
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 sm:max-w-xs relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
            <IconSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-2.5 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {searchQuery.trim() && (
          <button
            onClick={onClearSearch}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
