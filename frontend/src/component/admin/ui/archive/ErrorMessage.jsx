import React from "react";

export function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-600">{error}</p>
    </div>
  );
}
