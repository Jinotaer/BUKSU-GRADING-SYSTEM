import React from "react";
import { eventTypeColors } from "./scheduleConstants";

export const EventTypeLegend = () => {
  return (
    <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-2">Event Types</h3>
      <div className="flex flex-wrap gap-4">
        {Object.entries(eventTypeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${colors.dot}`}></div>
            <span className="text-sm text-gray-700 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
