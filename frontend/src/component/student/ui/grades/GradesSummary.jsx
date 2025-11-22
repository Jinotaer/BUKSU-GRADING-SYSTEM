import React from "react";

export const GradesSummary = ({ displayGrades }) => {
  const totalUnits = displayGrades.reduce((sum, grade) => {
    const units = Number(grade.units) || 0;
    return sum + units;
  }, 0);
  
  // Calculate average by adding ALL grades and dividing by total number of subjects
  // Handle invalid grades properly
  let totalGrades = 0;
  let validGradeCount = 0;
  
  console.log('All grades for debugging:', displayGrades.map(g => ({ 
    subject: g.subjectName, 
    finalGrade: g.finalGrade, 
    type: typeof g.finalGrade 
  })));
  
  displayGrades.forEach(grade => {
    const gradeValue = grade.finalGrade;
    
    // Check if it's a valid numeric grade (not "No Grade" or similar strings)
    if (gradeValue && gradeValue !== 'No Grade' && !isNaN(Number(gradeValue))) {
      totalGrades += Number(gradeValue);
      validGradeCount++;
    }
    // For "No Grade" or invalid values, we count them as 0 for the average
    // but still include them in the total count
  });
  
  // Calculate average including subjects with no grades (count as 0)
  const averageGrade = displayGrades.length > 0 ? totalGrades / displayGrades.length : 0;
  
  console.log('Debug calculation:', {
    totalGrades,
    validGradeCount,
    totalSubjects: displayGrades.length,
    averageGrade
  });

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
          {displayGrades.length > 0 && !isNaN(averageGrade) ? averageGrade.toFixed(2) : '0.00'}
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
