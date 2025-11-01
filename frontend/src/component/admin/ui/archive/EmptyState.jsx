import React from "react";

export function EmptyState({ showArchived }) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        {showArchived ? "No items found" : "No archived items found"}
      </p>
    </div>
  );
}
