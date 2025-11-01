import React from "react";

const tabs = [
  {
    key: "classStanding",
    label: "Class Standing",
    shortLabel: "Class Standing",
  },
  {
    key: "laboratory",
    label: "Laboratory Activity",
    shortLabel: "Laboratory Activity",
  },
  {
    key: "majorOutput",
    label: "Major Output",
    shortLabel: "Major Output",
  },
];

export function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 hidden sm:block">
          Grade Categories
        </h3>

        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 w-max sm:w-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={[
                  "flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 text-sm sm:text-base font-medium",
                  activeTab === t.key
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400",
                ].join(" ")}
              >
                <span className="xs:hidden">{t.shortLabel}</span>
                <span className="hidden xs:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
