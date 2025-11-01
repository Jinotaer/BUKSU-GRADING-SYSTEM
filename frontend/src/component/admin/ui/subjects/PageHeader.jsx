import React from "react";
import { IconPlus } from "@tabler/icons-react";

export function PageHeader({ onAddClick }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
      <div className="w-full sm:w-auto">
        <h2 className="pt-2 sm:pt-4 md:pt-6 lg:pt-10 font-outfit text-[#1E3A5F] text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold leading-tight">
          Subject Management
        </h2>
        <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
          Manage academic subjects and courses
        </p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors w-full sm:w-auto text-sm sm:text-base shadow-sm hover:shadow-md flex-shrink-0"
      >
        <IconPlus size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">Add Subject</span>
        <span className="sm:hidden whitespace-nowrap">Add Subject</span>
      </button>
    </div>
  );
}
