import React from "react";
import { IconSchool } from "@tabler/icons-react";

export function EmptyState({ hasFilters }) {
  return (
    <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
      <IconSchool className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
        No subjects found
      </h3>
      <p className="text-gray-500 text-xs sm:text-sm md:text-base max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your search or filters"
          : "Get started by adding your first subject"}
      </p>
    </div>
  );
}
