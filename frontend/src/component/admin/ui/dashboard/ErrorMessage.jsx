import React from "react";

export function ErrorMessage({ message }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
      <p className="text-red-600">{message}</p>
    </div>
  );
}
