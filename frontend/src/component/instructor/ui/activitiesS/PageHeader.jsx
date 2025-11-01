import React from "react";
import { IconChevronLeft } from "@tabler/icons-react";

export function PageHeader({ activity, section, onBack }) {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <IconChevronLeft size={18} /> Back
        </button>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
        {activity ? `${activity.title} — Max ${activity.maxScore}` : "Activity Scores"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{section?.sectionName}</p>
    </>
  );
}
