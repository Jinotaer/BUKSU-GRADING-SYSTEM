import React from "react";

export function EmptyState({ searchTerm }) {
  return (
    <p className="text-gray-500 text-center py-6 xs:py-8 text-xs xs:text-sm sm:text-base px-4">
      {searchTerm ? `No students found matching "${searchTerm}"` : "No students found."}
    </p>
  );
}
