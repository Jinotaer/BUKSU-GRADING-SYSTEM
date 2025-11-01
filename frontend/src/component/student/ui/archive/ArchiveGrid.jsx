import React from "react";
import { ArchivedSectionCard } from "./ArchivedSectionCard";
import { EmptyArchiveState } from "./EmptyArchiveState";
import { ArchivePagination } from "./ArchivePagination";

export const ArchiveGrid = ({
  paginatedSections,
  searchTerm,
  selectedYear,
  selectedSemester,
  currentPage,
  totalPages,
  onViewDetails,
  onUnarchiveClick,
  onClearFilters,
  onPageChange,
  formatDate,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {paginatedSections.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {paginatedSections.map((section) => (
              <ArchivedSectionCard
                key={section._id}
                section={section}
                onViewDetails={onViewDetails}
                onUnarchiveClick={onUnarchiveClick}
                formatDate={formatDate}
              />
            ))}
          </div>

          <ArchivePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <EmptyArchiveState
          searchTerm={searchTerm}
          selectedYear={selectedYear}
          selectedSemester={selectedSemester}
          onClearFilters={onClearFilters}
        />
      )}
    </div>
  );
};
