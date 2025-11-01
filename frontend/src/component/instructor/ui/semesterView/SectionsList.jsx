import React from "react";
import { IconBook } from "@tabler/icons-react";
import { SectionCard } from "./SectionCard";

export function SectionsList({ sections, onManageGrades, onViewActivities }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900">Your Sections</h4>
        <p className="text-sm text-gray-600 mt-1">
          Sections you're teaching in this semester
        </p>
      </div>

      <div className="p-4">
        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionCard
                key={section._id}
                section={section}
                onManageGrades={onManageGrades}
                onViewActivities={onViewActivities}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <IconBook className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-2">No sections for this semester</p>
            <p className="text-sm text-gray-400">
              You haven't been assigned any sections for this semester yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
