import React from "react";
import { IconUsers } from "@tabler/icons-react";

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <IconUsers className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        No students in this section yet
      </h3>
      <p className="text-gray-500">
        Use the "Added Students" button to add students.
      </p>
    </div>
  );
}
