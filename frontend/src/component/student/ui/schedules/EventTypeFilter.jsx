import React from "react";

export const EventTypeFilter = ({ filter, onFilterChange }) => {
  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Event Type
      </label>
      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <option value="all">All Events</option>
        <option value="quiz">Quizzes</option>
        <option value="laboratory">Laboratory</option>
        <option value="exam">Exams</option>
        <option value="assignment">Assignments</option>
        <option value="project">Projects</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
};
