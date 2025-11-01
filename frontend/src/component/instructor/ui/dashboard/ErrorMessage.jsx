import React from "react";

export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <span className="text-red-700">{message}</span>
    </div>
  );
}
