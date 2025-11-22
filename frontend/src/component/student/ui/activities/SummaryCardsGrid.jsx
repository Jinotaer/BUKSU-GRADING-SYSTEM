import React from "react";
import { SummaryCard } from "./SummaryCard";
import { getCategoryColors } from "./activityConstants";

// Utility function for formatting percentages
const formatPercentage = (num) => {
  // Always round to nearest whole number
  return Math.round(num).toString();
};

export function SummaryCardsGrid({ categories = [] }) {
  // Filter out categories that have no activities/rows
  const categoriesWithActivities = categories.filter(cat => 
    cat.rows && cat.rows.length > 0
  );
  
  // Determine grid columns based on number of cards
  const getGridCols = (count) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  };
  
  return (
    <div className={`grid ${getGridCols(categoriesWithActivities.length)} gap-4 mb-8`}>
      {/* Category Cards */}
      {categoriesWithActivities.map((cat) => {
        const colors = getCategoryColors(cat.name);
        let IconComponent;
        
        if (cat.name === "Class Standing") {
          IconComponent = (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
        } else if (cat.name === "Laboratory") {
          IconComponent = (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          );
        } else {
          IconComponent = (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          );
        }
        
        const percent = cat.percent || 0;
        const weightLabel = cat.weightLabel || 'Weight: 0%';
        
        return (
          <SummaryCard 
            key={cat.name}
            title={cat.name}
            percentage={formatPercentage(percent)}
            weightLabel={weightLabel.replace('Weight: ', '').replace(' of final grade', '')}
            bgColor={colors.iconColor}
            icon={IconComponent}
          />
        );
      })}
    </div>
  );
}
