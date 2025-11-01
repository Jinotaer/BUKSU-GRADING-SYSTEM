import React from "react";
import { IconBook, IconChalkboard } from "@tabler/icons-react";

export function EmptyState({ type }) {
  if (type === "no-sections") {
    return (
      <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 p-6 sm:p-8 md:p-10 text-center">
        <IconBook className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          No Sections Assigned
        </h3>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          You don't have any sections yet.
        </p>
      </div>
    );
  }

  if (type === "no-selection") {
    return (
      <div className="mt-4 sm:mt-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 p-6 sm:p-8 md:p-10 text-center">
        <IconChalkboard className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Choose a section
        </h3>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Use the dropdown above to view students.
        </p>
      </div>
    );
  }

  return null;
}
