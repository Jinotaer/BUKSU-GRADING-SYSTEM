import React from "react";
import { IconPlus } from "@tabler/icons-react";

export function PageHeader({ onAddClick }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
          Section Management
        </h2>
        <p className="text-gray-600 mt-1">
          Create and manage all class sections
        </p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <IconPlus size={20} />
        Add Section
      </button>
    </div>
  );
}
