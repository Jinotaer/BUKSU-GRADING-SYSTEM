import React from "react";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-16 sm:py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-500">Loading subjects...</p>
      </div>
    </div>
  );
}
