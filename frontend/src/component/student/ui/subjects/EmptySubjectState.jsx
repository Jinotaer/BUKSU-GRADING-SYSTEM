import React from "react";

export const EmptySubjectState = ({ hasNoSections, onRefresh }) => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 text-6xl mb-4">📚</div>
      {hasNoSections ? (
        <div>
          <p className="text-gray-500 text-lg mb-2">No subjects assigned</p>
          <p className="text-gray-400 text-sm mb-4">
            You are not enrolled in any subjects for the selected academic year
            and semester.
            <br />
            Contact your instructor or admin to be added to course sections.
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-500 text-lg mb-2">
            No subjects match your search
          </p>
          <p className="text-gray-400 text-sm">
            Try adjusting your search term or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};
