import React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
      <IconAlertCircle className="text-red-500" size={20} />
      <span className="text-red-700">{message}</span>
    </div>
  );
}
