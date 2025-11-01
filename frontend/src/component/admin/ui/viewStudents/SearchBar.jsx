import React from "react";

export function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <h2 className="text-lg font-bold text-blue-900 tracking-tight">
        Student List
      </h2>
      <input
        type="text"
        className="w-fulls sm:w-80 px-5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 transition"
        placeholder="Search students"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
