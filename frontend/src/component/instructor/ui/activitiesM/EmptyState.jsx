import React from "react";
import { IconListDetails } from "@tabler/icons-react";

export function EmptyState() {
  return (
    <div className="col-span-full text-center py-12">
      <IconListDetails className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        No matching activities
      </h3>
      <p className="text-gray-500 mb-4">
        Try adjusting your search or add a new activity.
      </p>
    </div>
  );
}
