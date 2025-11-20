import React from "react";
import { HiddenSectionCard } from "./HiddenSectionCard";
import { EmptyHiddenState } from "./EmptyHiddenState";

export const HiddenGrid = ({
  paginatedSections,
  searchTerm,
  selectedYear,
  selectedSemester,
  onViewDetails,
  onUnhideClick,
  onClearFilters,
  formatDate,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {paginatedSections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {paginatedSections.map((section) => (
            <HiddenSectionCard
              key={section._id}
              section={section}
              onViewDetails={onViewDetails}
              onUnhideClick={onUnhideClick}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <EmptyHiddenState
          searchTerm={searchTerm}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          onClearFilters={onClearFilters}
        />
      )}
    </div>
  );
};
