import React from "react";

export function PageHeader({ onCreateClick }) {
  return (
    <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
          Schedule Management
        </h1>
        <p className="text-gray-600 mt-2">
          View and edit your activity schedules. Create schedules by creating activities.
        </p>
      </div>
      {/* Create button removed - schedules are now created automatically when creating activities */}
    </div>
  );
}
