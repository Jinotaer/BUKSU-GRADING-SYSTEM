import React from "react";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";

export function PageHeader({ onBack, onAdd }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <IconChevronLeft size={18} /> Back
      </button>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <IconPlus size={16} /> Add activity
      </button>
    </div>
  );
}
