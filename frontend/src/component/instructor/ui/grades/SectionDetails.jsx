import React from "react";

export function SectionDetails({ section, studentCount }) {
  return (
    <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
      <h3 className="font-medium text-blue-800 mb-3 text-sm sm:text-base flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        Section Details
      </h3>

      <div className="space-y-2 sm:space-y-3">
        {/* Subject Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="text-blue-600 font-medium text-xs sm:text-sm whitespace-nowrap">
            Subject:
          </span>
          <span className="text-gray-700 text-xs sm:text-sm break-words">
            {section.subject?.subjectCode} - {section.subject?.subjectName}
          </span>
        </div>

        {/* Section and Students Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-medium text-xs sm:text-sm">
              Section:
            </span>
            <span className="text-gray-700 text-xs sm:text-sm">
              {section.sectionName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-medium text-xs sm:text-sm">
              Students:
            </span>
            <span className="text-gray-700 text-xs sm:text-sm font-semibold">
              {studentCount}
            </span>
          </div>
        </div>

        {/* Grading Schema */}
        <div className="pt-2 border-t border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-blue-600 font-medium text-xs sm:text-sm whitespace-nowrap">
              Grading Schema:
            </span>
            <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700">
              <span className="px-2 py-1 bg-white rounded border">
                CS: {section.gradingSchema?.classStanding}%
              </span>
              <span className="px-2 py-1 bg-white rounded border">
                Lab: {section.gradingSchema?.laboratory}%
              </span>
              <span className="px-2 py-1 bg-white rounded border">
                MO: {section.gradingSchema?.majorOutput}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
