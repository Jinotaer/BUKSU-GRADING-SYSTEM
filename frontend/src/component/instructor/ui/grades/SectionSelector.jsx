import React from "react";
import { IconFilter } from "@tabler/icons-react";

export function SectionSelector({
  sections,
  selectedSection,
  onSectionChange,
  filterTerm,
  onFilterChange,
  selectedTerm,
  onTermChange,
}) {
  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    const section = sections.find((s) => s._id === sectionId) || null;
    onSectionChange(section);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
      <div className="space-y-4">
        {/* Section Selector */}
        <div className="w-full">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          <select
            value={selectedSection?._id || ""}
            onChange={handleSectionChange}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white cursor-pointer"
          >
            <option value="">Select a section</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.subject?.subjectCode} - {s.sectionName} ({s.schoolYear}{" "}
                {s.term} Semester)
              </option>
            ))}
          </select>
        </div>

        {/* Term Filter - Only show when section is selected */}
        {selectedSection && (
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter by Term
            </label>
            <select
              value={selectedTerm || ""}
              onChange={(e) => onTermChange(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white cursor-pointer"
            >
              <option value="">All Terms</option>
              <option value="Midterm">Mid Term</option>
              <option value="Finalterm">Final Term</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
        )}

        {/* Search Students - Only show when section is selected */}
        {selectedSection && (
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={filterTerm}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              />
              <IconFilter
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
