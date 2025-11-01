import React from "react";

export function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center mb-4 xs:mb-6 gap-3 xs:gap-4">
      <input
        type="text"
        placeholder="Search students..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:max-w-sm md:max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm xs:text-sm"
      />
    </div>
  );
}
