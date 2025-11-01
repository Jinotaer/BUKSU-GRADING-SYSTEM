import React from "react";

export function MobileHeader() {
  return (
    <div className="lg:hidden px-4">
      <h2 className="font-outfit text-[#1E3A5F] text-2xl font-bold sm:text-2xl lg:text-4xl">
        Grade Management
      </h2>
      <p className="text-gray-600 mt-1 text-sm md:text-base">
        Manage student grades and generate reports
      </p>
    </div>
  );
}
