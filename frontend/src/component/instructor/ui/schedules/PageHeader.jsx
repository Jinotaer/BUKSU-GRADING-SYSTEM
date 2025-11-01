import React from "react";
import { IconPlus } from "@tabler/icons-react";

export function PageHeader({ onCreateClick }) {
  return (
    <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-4xl font-bold">
          Schedule Management
        </h1>
        <p className="text-gray-600 mt-2">
          Create and manage your class schedules
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <IconPlus className="w-5 h-5" />
        Create Schedule
      </button>
    </div>
  );
}
