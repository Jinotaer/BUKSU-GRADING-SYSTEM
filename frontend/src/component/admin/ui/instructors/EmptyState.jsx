import React from "react";

export function EmptyState({ searchTerm }) {
  return (
    <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
      {searchTerm
        ? `No instructors found matching "${searchTerm}"`
        : "No instructors found."}
    </p>
  );
}
