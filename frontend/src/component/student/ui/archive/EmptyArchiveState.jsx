import React from "react";
import { IconArchive } from "@tabler/icons-react";

export const EmptyArchiveState = ({
  searchTerm,
  selectedYear,
  selectedSemester,
  onClearFilters,
}) => {
  const hasFilters =
    searchTerm || selectedYear !== "all" || selectedSemester !== "all";

  return (
    <div className="text-center py-12">
      <IconArchive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Archived Subjects
      </h3>
      <p className="text-gray-500 mb-4">
        {hasFilters
          ? "No subjects match your search criteria"
          : "You don't have any archived subjects yet"}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
