import React from "react";

const categories = [
  { key: "all", label: "All" },
  { key: "classStanding", label: "Class Standing" },
  { key: "laboratory", label: "Laboratory Activities" },
  { key: "majorOutput", label: "Major Output" },
];

const terms = [
  { key: "all", label: "All Terms" },
  { key: "Midterm", label: "Midterm" },
  { key: "Finalterm", label: "Finalterm" },
  { key: "Summer", label: "Summer" },
];

export function CategoryTabs({ activeTab, onTabChange, activeTerm, onTermChange }) {
  return (
    <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
      {/* Term Filter - Mobile First */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Term:</span>
        <select
          value={activeTerm || "all"}
          onChange={(e) => onTermChange(e.target.value)}
          className="flex-1 sm:flex-none sm:w-auto px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
        >
          {terms.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Tabs - Scrollable on Mobile */}
      <div className="flex gap-1 sm:gap-2 bg-white p-1 sm:p-1.5 rounded-md border border-gray-300 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 sm:gap-2 min-w-max">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => onTabChange(c.key)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium rounded transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === c.key
                  ? "bg-gray-200 text-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
