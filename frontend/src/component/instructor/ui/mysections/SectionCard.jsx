import React from "react";
import { IconUsers, IconArchive } from "@tabler/icons-react";

export function SectionCard({ section, onClick, onArchive }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100"
      onClick={() => onClick(section)}
    >
      {/* Image / Hero area */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-3xl font-bold mb-2">
            {section?.subject?.subjectCode || "SUBJ"}
          </div>
          <div className="text-sm opacity-90">{section.sectionName}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {section?.subject?.subjectName || "Untitled Subject"}
        </h3>

        <p className="text-gray-600 font-medium text-sm mb-3">
          {section?.subject?.subjectCode} - {section.sectionName}
        </p>

        <div className="space-y-1 mb-4 text-sm">
          <p className="text-gray-500">{section.term} Semester</p>
          <p className="text-gray-500">A.Y. {section.schoolYear}</p>
          {section?.subject?.units != null && (
            <p className="text-gray-500">
              {section.subject.units}{" "}
              {section.subject.units === 1 ? "Unit" : "Units"}
            </p>
          )}
        </div>

        <p className="text-gray-900 font-semibold text-sm">
          {section.instructor?.fullName || "Assigned to You"}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {section?.subject?.college || "College"}
            </span>
            {Array.isArray(section.students) && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <IconUsers size={14} /> {section.students.length}
              </span>
            )}
          </div>
          <button
            onClick={(e) => onArchive(section, e)}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="Archive Section"
          >
            <IconArchive size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
