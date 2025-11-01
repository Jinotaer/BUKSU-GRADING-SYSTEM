import React from "react";

export const GradesSummary = ({ displayGrades }) => {
  const totalUnits = displayGrades.reduce((sum, grade) => sum + grade.units, 0);
  
  const gradesWithScores = displayGrades.filter((g) => g.finalGrade > 0);
  const averageGrade =
    gradesWithScores.length > 0
      ? gradesWithScores.reduce((sum, grade) => sum + grade.finalGrade, 0) /
        gradesWithScores.length
      : 0;

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left border border-gray-200">
        <div className="text-sm text-gray-600">Total Units</div>
        <div className="text-2xl font-semibold text-gray-900">
          {totalUnits.toFixed(1)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left border border-gray-200">
        <div className="text-sm text-gray-600">Average Grade</div>
        <div className="text-2xl font-semibold text-gray-900">
          {averageGrade > 0 ? averageGrade.toFixed(2) : "N/A"}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left border border-gray-200">
        <div className="text-sm text-gray-600">Total Subjects</div>
        <div className="text-2xl font-semibold text-gray-900">
          {displayGrades.length}
        </div>
      </div>
    </div>
  );
};
