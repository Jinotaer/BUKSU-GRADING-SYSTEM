import React from "react";
import { IconRefresh } from "@tabler/icons-react";

export function ToolbarControls({
  showArchived,
  onShowArchivedChange,
  onRefresh,
  loading,
}) {
  return (
    <div className="mb-6 flex items-center gap-4">
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
        <IconRefresh className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}
