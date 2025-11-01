import React from "react";

export function PageHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-outfit text-[#1E3A5F] text-2xl sm:text-2xl lg:text-3sxl font-bold">
          Archived Sections
        </h1>
      </div>
      <p className="text-gray-600">
        View and manage your archived sections. You can restore or permanently delete them.
      </p>
    </div>
  );
}
