import React from "react";

export function PageHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
          Archived Sections
        </h1>
      </div>
      <p className="text-gray-600">
        View and manage your archived sections, with the option to restore them.
      </p>
    </div>
  );
}
