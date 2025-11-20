import React from "react";
import { IconEyeOff } from "@tabler/icons-react";

export const SubjectCard = ({ section, onSubjectClick, onHideClick }) => {
  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onSubjectClick(section)}
    >
      {/* Image Section */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-3xl font-bold mb-2">
            {section.subject.subjectCode}
          </div>
          <div className="text-sm opacity-90">{section.sectionName}</div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {section.subject.subjectName}
        </h3>

        <p className="text-gray-600 font-medium text-sm mb-3">
          {section.subject.subjectCode} - {section.sectionName}
        </p>

        <div className="space-y-1 mb-4">
          <p className="text-gray-500 text-sm">{section.term} Semester</p>

          <p className="text-gray-500 text-sm">A.Y. {section.schoolYear}</p>

          <p className="text-gray-500 text-sm">
            {section.subject.units}{" "}
            {section.subject.units === 1 ? "Unit" : "Units"}
          </p>
        </div>

        <p className="text-gray-900 font-semibold text-sm">
          {section.instructor?.fullName || "Instructor TBA"}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {section.subject.college}
          </span>
          <button
            onClick={(e) => onHideClick(section, e)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Hide Subject"
          >
            <IconEyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
