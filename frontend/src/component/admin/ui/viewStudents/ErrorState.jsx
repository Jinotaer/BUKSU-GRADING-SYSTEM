import React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

export function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-12">
      <IconAlertCircle className="mx-auto text-red-300 mb-4" size={48} />
      <h3 className="text-lg font-medium text-red-600 mb-2">
        Error Loading Students
      </h3>
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
