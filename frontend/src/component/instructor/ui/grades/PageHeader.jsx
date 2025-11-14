import React from "react";
import { IconRefresh, IconBrandGoogle } from "@tabler/icons-react";

export function PageHeader({ onRefresh, onExport, loading, disabled }) {
  return (
    <div className="hidden lg:block">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
            Grade Management
          </h2>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Manage student grades and generate reports
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <IconRefresh size={18} />
            )}
            Refresh
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <IconBrandGoogle size={18} />
            Export to Google Sheets
          </button>
        </div>
      </div>
    </div>
  );
}
