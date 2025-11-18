import React from "react";

const activityTabs = [
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

const gradeTabs = [
  {
    key: "midtermGrade",
    label: "Midterm Grade",
    shortLabel: "Midterm Grade",
    availableFor: ["Midterm"]
  },
  {
    key: "finalTermGrade", 
    label: "Final Term Grade",
    shortLabel: "Final Term Grade",
    availableFor: ["Finalterm"]
  },
  {
    key: "finalGrade",
    label: "Final Grade", 
    shortLabel: "Final Grade",
    availableFor: [""]
  },
];

export function TabNavigation({ activeTab, onTabChange, selectedTerm }) {
  // Determine which tabs to show based on selected term
  const getAvailableTabs = () => {
    let availableGradeTabs = [];
    
    // Show specific grade tab based on selected term
    if (selectedTerm === "Midterm") {
      availableGradeTabs = gradeTabs.filter(tab => tab.key === "midtermGrade");
    } else if (selectedTerm === "Finalterm") {
      availableGradeTabs = gradeTabs.filter(tab => tab.key === "finalTermGrade");
    } else if (!selectedTerm || selectedTerm === "") {
      // Show Final Grade when All Terms is selected
      availableGradeTabs = gradeTabs.filter(tab => tab.key === "finalGrade");
    }
    
    // Always show activity tabs, plus relevant grade tabs
    return [...activityTabs, ...availableGradeTabs];
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 w-max sm:w-auto">
            {availableTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={[
                  "flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 text-sm sm:text-base font-medium cursor-pointer",
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
