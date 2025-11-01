import React from "react";

const categories = [
  { key: "all", label: "All" },
  { key: "classStanding", label: "Class Standing" },
  { key: "laboratory", label: "Laboratory Activities" },
  { key: "majorOutput", label: "Major Output" },
];

export function CategoryTabs({ activeTab, onTabChange }) {
  return (
    <div className="mt-6 flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
      {categories.map((c) => (
        <button
          key={c.key}
          onClick={() => onTabChange(c.key)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === c.key
              ? "bg-white shadow text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
