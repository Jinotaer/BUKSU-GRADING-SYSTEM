import React from "react";

export const ErrorMessage = ({ error }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p className="text-red-700">{error}</p>
    </div>
  );
};
