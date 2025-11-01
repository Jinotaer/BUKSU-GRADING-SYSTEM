import React from "react";

export function SummaryCard({ title, percentage, weightLabel, icon, bgColor }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-5 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
            {weightLabel && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {weightLabel}
              </span>
            )}
          </div>
        </div>
        <div className={`flex items-center justify-center w-14 h-14 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
