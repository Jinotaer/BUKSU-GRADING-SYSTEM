import React from "react";

export function PageHeader() {
  return (
    <div className="mb-3 sm:mb-4">
      <h1 className="font-outfit text-[#1E3A5F] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mt-2 sm:mt-4 md:mt-6">
        Students
      </h1>
      <p className="text-sm sm:text-base text-gray-600 mt-1">
        Select a section, review students in a table, and add more.
      </p>
    </div>
  );
}
