import React from "react";
import { IconRefresh, IconSearch } from "@tabler/icons-react";

export function ToolbarControls({
  showArchived,
  onShowArchivedChange,
  onRefresh,
  loading,
  searchTerm,
  onSearchChange,
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      {/* D074: Search input for filtering archive items */}
      <div className="relative flex-1 max-w-md">
        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, code..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
        />
      </div>

      <label className="flex items-center">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => onShowArchivedChange(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="ml-2 text-sm text-gray-700">
          Show all items (including active)
        </span>
      </label>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        <IconRefresh
          className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
        />
        Refresh
      </button>
    </div>
  );
}
