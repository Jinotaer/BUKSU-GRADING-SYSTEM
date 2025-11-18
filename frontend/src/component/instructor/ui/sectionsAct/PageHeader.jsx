import React from "react";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";

export function PageHeader({ onBack, onAddActivity, onEditGradingSchema }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
      >
        <IconChevronLeft size={18} /> Back
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={onEditGradingSchema}
          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 cursor-pointer"
        >
        Edit Grading Schema 
        </button>
        <button
          onClick={onAddActivity}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
        >
          <IconPlus size={16} /> Add Activity
        </button>
      </div>
    </div>
  );
}
