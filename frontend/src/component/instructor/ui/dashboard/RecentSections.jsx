import React from "react";
import { IconChalkboard } from "@tabler/icons-react";

export function RecentSections({ sections }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Sections
      </h2>
      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconChalkboard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {section.sectionName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.subject?.subjectCode} - {section.schoolYear}{" "}
                    {section.term}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {section.students?.length || 0} students
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <IconChalkboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No sections created yet</p>
          <button
            onClick={() =>
              (window.location.href = "/instructor/add-sections")
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Section
          </button>
        </div>
      )}
    </div>
  );
}
