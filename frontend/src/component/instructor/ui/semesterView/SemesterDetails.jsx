import React from "react";
import { IconCalendar } from "@tabler/icons-react";
import { SemesterStats } from "./SemesterStats";
import { SectionsList } from "./SectionsList";

export function SemesterDetails({
  selectedSemester,
  sections,
  onManageGrades,
  onViewActivities,
}) {
  if (!selectedSemester) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <IconCalendar className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Select a Semester
          </h3>
          <p className="text-gray-500">
            Choose a semester from the list to view your sections and details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Semester Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedSemester.schoolYear} - {selectedSemester.term} Semester
          </h3>
        </div>

        <SemesterStats sections={sections} />
      </div>

      {/* Sections List */}
      <SectionsList
        sections={sections}
        onManageGrades={onManageGrades}
        onViewActivities={onViewActivities}
      />
    </div>
  );
}
