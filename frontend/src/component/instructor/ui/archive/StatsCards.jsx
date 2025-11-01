import React from "react";
import { IconArchive, IconFilter, IconBook } from "@tabler/icons-react";

export function StatsCards({ 
  totalArchived, 
  filteredCount, 
  currentPage, 
  totalPages 
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Archived</p>
            <p className="text-2xl font-bold text-gray-900">{totalArchived}</p>
          </div>
          <IconArchive className="w-8 h-8 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-gray-900">{filteredCount}</p>
          </div>
          <IconFilter className="w-8 h-8 text-blue-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current Page</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentPage} / {totalPages || 1}
            </p>
          </div>
          <IconBook className="w-8 h-8 text-purple-400" />
        </div>
      </div>
    </div>
  );
}
