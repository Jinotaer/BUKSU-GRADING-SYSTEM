import React from "react";

export const ScheduleStatistics = ({
  totalEvents,
  upcomingCount,
  thisWeekCount,
}) => {
  return (
    <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Events</span>
          <span className="font-semibold text-gray-900">{totalEvents}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Upcoming</span>
          <span className="font-semibold text-blue-600">{upcomingCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">This Week</span>
          <span className="font-semibold text-green-600">{thisWeekCount}</span>
        </div>
      </div>
    </div>
  );
};
