import React from "react";
import { IconChalkboard } from "@tabler/icons-react";

export function EmptyState({ searchTerm, selectedYear, selectedSemester }) {
  const isFiltered = searchTerm || selectedYear !== "all" || selectedSemester !== "all";

  return (
    <div className="col-span-full text-center py-12">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <IconChalkboard className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {isFiltered
            ? "No sections match your filters"
            : "No sections assigned to you yet"}
        </h3>
        <p className="text-gray-500 mb-2">
          {isFiltered
            ? "Try adjusting your search or filter selections."
            : "Contact your admin to get assigned to sections."}
        </p>
      </div>
    </div>
  );
}
