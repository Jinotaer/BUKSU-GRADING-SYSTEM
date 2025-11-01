import React from "react";
import { IconSchool } from "@tabler/icons-react";

export function EmptyState() {
  return (
    <div className="col-span-full text-center py-12">
      <IconSchool className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        No semesters found
      </h3>
      <p className="text-gray-500">
        Get started by adding your first semester
      </p>
    </div>
  );
}
