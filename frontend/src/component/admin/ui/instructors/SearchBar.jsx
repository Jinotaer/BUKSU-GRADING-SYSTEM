import React from "react";

export function SearchBar({ searchTerm, onSearchChange, onInviteClick }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <input
        type="text"
        placeholder="Search instructors..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:max-w-sm md:max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <button
        onClick={onInviteClick}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition text-sm w-full sm:w-auto"
      >
        Invite Instructor
      </button>
    </div>
  );
}
