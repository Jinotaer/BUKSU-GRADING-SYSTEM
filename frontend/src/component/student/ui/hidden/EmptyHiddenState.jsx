import React from "react";
import { IconEyeOff, IconFilterOff } from "@tabler/icons-react";

export const EmptyHiddenState = ({
  searchTerm,
  selectedYear,
  selectedSemester,
  onClearFilters,
}) => {
  const hasActiveFilters =
    searchTerm || selectedYear !== "all" || selectedSemester !== "all";

  return (
    <div className="text-center py-12">
      <IconEyeOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasActiveFilters ? "No hidden subjects found" : "No hidden subjects"}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasActiveFilters
          ? "No subjects match your current filters. Try adjusting your search criteria."
          : "You haven't hidden any subjects yet. Hidden subjects will appear here."}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconFilterOff className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  );
};
