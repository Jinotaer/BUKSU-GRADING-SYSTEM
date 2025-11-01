import React from "react";
import { IconUsers } from "@tabler/icons-react";

export function EmptyState({ filterTerm }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="text-center py-12">
        <IconUsers className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {filterTerm
            ? "No students match your search"
            : "No students in this section"}
        </h3>
        <p className="text-gray-500">
          {filterTerm
            ? "Try adjusting your search terms"
            : "Invite students to this section to start grading"}
        </p>
      </div>
    </div>
  );
}
