import React from "react";
import {
  IconCalendar,
  IconSchool,
  IconUsers,
  IconClock,
  IconRestore,
  IconEye,
} from "@tabler/icons-react";

export const ArchivedSectionCard = ({
  section,
  onViewDetails,
  onUnarchiveClick,
  formatDate,
}) => {
  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
      onClick={() => onViewDetails(section)}
    >
      {/* Card Header with gradient */}
      <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center relative">
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-white/90 text-xs font-semibold text-gray-700 rounded-full">
            ARCHIVED
          </span>
        </div>
        <div className="text-white text-center">
          <div className="text-2xl font-bold mb-1">
            {section.subject?.subjectCode || "SUBJ"}
          </div>
          <div className="text-sm opacity-90">{section.sectionName}</div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {section.subject?.subjectName || "Untitled Subject"}
        </h3>

        <div className="space-y-2 mb-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <IconCalendar className="w-4 h-4" />
            <span>
              {section.schoolYear} - {section.term}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <IconSchool className="w-4 h-4" />
            <span>{section.instructor?.fullName || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <IconUsers className="w-4 h-4" />
            <span>{section.students?.length || 0} students</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <IconClock className="w-3 h-3" />
            <span>Archived {formatDate(section.archivedAt)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
          <button
            onClick={(e) => onUnarchiveClick(section, e)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <IconRestore className="w-4 h-4" />
            Unarchive
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(section);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <IconEye className="w-4 h-4" />
            View
          </button>
        </div>
      </div>
    </div>
  );
};
