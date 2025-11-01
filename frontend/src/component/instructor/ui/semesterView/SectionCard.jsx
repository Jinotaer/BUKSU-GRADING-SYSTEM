import React from "react";

export function SectionCard({ section, onManageGrades, onViewActivities }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-medium text-gray-900">{section.sectionName}</h5>
          <p className="text-sm text-gray-600">
            {section.subject?.subjectCode} - {section.subject?.subjectName}
          </p>
          {section.subject?.isArchived && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
              Archived Subject
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {section.students?.length || 0} Students
          </p>
          <p className="text-xs text-gray-500">
            {section.subject?.units} Units
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Created: {new Date(section.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onManageGrades(section._id)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Manage Grades
          </button>
          <button
            onClick={() => onViewActivities(section._id)}
            className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            View Activities
          </button>
        </div>
      </div>
    </div>
  );
}
