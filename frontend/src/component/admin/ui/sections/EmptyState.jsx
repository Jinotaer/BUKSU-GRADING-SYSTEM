import React from "react";
import { IconChalkboard } from "@tabler/icons-react";

export function EmptyState({ onAddClick }) {
  return (
    <div className="col-span-full text-center py-12">
      <IconChalkboard className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        No sections created yet
      </h3>
      <p className="text-gray-500 mb-4">
        Create your first section to get started
      </p>
      <button
        onClick={onAddClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Your First Section
      </button>
    </div>
  );
}
