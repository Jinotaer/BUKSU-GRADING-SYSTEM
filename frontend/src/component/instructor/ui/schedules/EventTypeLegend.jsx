import React from "react";

const eventTypeColors = {
  quiz: { dot: "bg-red-500" },
  laboratory: { dot: "bg-yellow-500" },
  exam: { dot: "bg-blue-500" },
  assignment: { dot: "bg-orange-500" },
  project: { dot: "bg-green-500" },
  other: { dot: "bg-gray-500" },
};

export function EventTypeLegend() {
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
}
