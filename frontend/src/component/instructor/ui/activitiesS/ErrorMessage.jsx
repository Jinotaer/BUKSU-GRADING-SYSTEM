import React from "react";

export function ErrorMessage({ error }) {
  if (!error) return null;
  
  return (
    <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
      {error}
    </div>
  );
}
