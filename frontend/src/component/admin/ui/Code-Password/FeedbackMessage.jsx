import React from "react";

export function FeedbackMessage({ success, error }) {
  if (!success && !error) return null;

  return (
    <>
      {success && (
        <p className="text-green-600 text-sm text-center mt-4">{success}</p>
      )}
      {error && (
        <p className="text-red-600 text-sm text-center mt-4">{error}</p>
      )}
    </>
  );
}
