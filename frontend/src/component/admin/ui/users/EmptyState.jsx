import React from "react";

export function EmptyState({ hasFilters }) {
  return (
    <p className="text-gray-500 text-center py-6 sm:py-8 text-xs sm:text-sm md:text-base">
      {hasFilters
        ? "No users found matching your criteria"
        : "No users found."}
    </p>
  );
}
