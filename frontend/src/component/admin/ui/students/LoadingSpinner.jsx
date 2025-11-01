import React from "react";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-6 xs:py-8">
      <div className="animate-spin rounded-full h-6 w-6 xs:h-8 xs:w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
