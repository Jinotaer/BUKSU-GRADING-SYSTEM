import React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

export function ErrorMessage({ error }) {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
      <IconAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      <span className="text-red-700">{error}</span>
    </div>
  );
}
