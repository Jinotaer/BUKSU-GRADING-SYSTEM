import React from "react";
import { IconRefresh, IconUserPlus } from "@tabler/icons-react";

export function SectionControls({
  sections,
  selectedSection,
  onSectionChange,
  onRefresh,
  onAddStudents,
  loading,
  sectionLabel,
}) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Section
        </label>
        <select
          className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm p-2 sm:p-2.5 border truncate focus:outline-none"
          value={selectedSection?._id || ""}
          onChange={(e) => {
            const sec = sections.find((s) => s._id === e.target.value);
            onSectionChange(sec || null);
          }}
          disabled={loading || sections.length === 0}
        >
          {sections.length === 0 ? (
            <option value="">No sections</option>
          ) : (
            sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sectionLabel(sec)}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm bg-white hover:bg-gray-50 border-gray-300 disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-initial"
        >
          <IconRefresh
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`}
          />
          <span className="hidden xs:inline">Refresh</span>
        </button>
        <button
          onClick={onAddStudents}
          disabled={!selectedSection}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-initial"
        >
          <IconUserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Add Students</span>
        </button>
      </div>
    </div>
  );
}
