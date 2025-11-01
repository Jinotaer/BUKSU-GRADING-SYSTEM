import React from "react";
import { IconCalendar, IconChevronRight } from "@tabler/icons-react";

export function SemesterList({ semesters, selectedSemester, onSelectSemester }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Semesters
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Select a semester to view details
        </p>
      </div>
      <div className="p-4">
        {semesters.length > 0 ? (
          <div className="space-y-3">
            {semesters.map((semester) => {
              const isSelected = selectedSemester?._id === semester._id;

              return (
                <div
                  key={semester._id}
                  onClick={() => onSelectSemester(semester)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {semester.schoolYear}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {semester.term} Semester
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconChevronRight
                        size={16}
                        className={`transition-transform ${
                          isSelected ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconCalendar className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No semesters available</p>
          </div>
        )}
      </div>
    </div>
  );
}
