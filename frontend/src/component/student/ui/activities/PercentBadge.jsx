import React from "react";
import { getCategoryColors } from "./activityConstants";

export function PercentBadge({ value, color }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  
  return (
    <div className="flex flex-col items-end gap-2 min-w-[110px]">
      <span className={`inline-flex items-center justify-center px-4 py-2 text-sm font-bold rounded-lg ${color} text-white shadow-lg`}>
        {pct.toFixed(1)}%
      </span>
      <div className="w-28 h-2.5 rounded-full bg-gray-200 overflow-hidden shadow-inner">
        <div 
          className={`h-full bg-gradient-to-r ${getCategoryColors("").gradient} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}
