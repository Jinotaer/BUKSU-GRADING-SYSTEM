import React from "react";

export function PercentBadge({ value, color }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  
  // Always round to nearest whole number
  const formatPercentage = (num) => {
    return Math.round(num).toString();
  };
  
  const roundedPct = Math.round(pct);
  
  return (
    <div className="flex flex-col items-end gap-2 min-w-[110px]">
      <span className={`inline-flex items-center justify-center px-4 py-2 text-sm font-bold rounded-lg ${color} text-white`}>
        {formatPercentage(pct)}%
      </span>
      <div className="w-28 h-2.5 rounded-full bg-gray-200 overflow-hidden shadow-inner">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${roundedPct}%` }} 
        />
      </div>
    </div>
  );
}
