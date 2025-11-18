// Frontend Grade Utilities
// Updated to match the new BukSU grading algorithm with 3 conversion tables

/**
 * Table 1: Grade Category Equivalency Tables (50% passing rate)
 * Converts percentage scores to equivalent grades for category and term calculations
 * @param {number} percentage - Percentage score (0-100)
 * @returns {string} Equivalent grade ("1.00", "1.25", etc.)
 */
export const getEquivalentGrade = (percentage) => {
  if (percentage === "" || percentage === null || percentage === undefined || isNaN(Number(percentage))) {
    return "5.00";
  }

  const score = Number(percentage);
  
  // Table 1: Grade Category Equivalency Tables (50% passing rate)
  if (score >= 96) return "1.00";      // 96-100
  if (score >= 93) return "1.25";      // 93-95
  if (score >= 89) return "1.50";      // 89-92
  if (score >= 86) return "1.75";      // 86-88
  if (score >= 83) return "2.00";      // 83-85
  if (score >= 80) return "2.25";      // 80-82
  if (score >= 77) return "2.50";      // 77-79
  if (score >= 74) return "2.75";      // 74-76
  if (score >= 71) return "3.00";      // 71-73
  if (score >= 68) return "3.25";      // 68-70
  if (score >= 65) return "3.50";      // 65-67
  if (score >= 60) return "3.75";      // 60-64
  if (score >= 56) return "4.00";      // 56-59
  if (score >= 50) return "4.50";      // 50-55
  
  // Below 50 is failing
  return "5.00";  // Failed
};

/**
 * Table 2: Term Grade Equivalency Table
 * Used for intermediate term grade calculations
 * @param {number} numericGrade - Numeric grade (0.00 - 5.00)
 * @returns {string} Equivalent grade ("1.00", "1.25", etc.)
 */
export const getTermEquivalentGrade = (numericGrade) => {
  if (numericGrade === "" || numericGrade === null || numericGrade === undefined || isNaN(Number(numericGrade))) {
    return "5.00";
  }

  const grade = Number(numericGrade);
  
  // Table 2: Term Grade Equivalency Table
  if (grade >= 0 && grade <= 1.1250) return "1.00";
  if (grade >= 1.1251 && grade <= 1.3750) return "1.25";
  if (grade >= 1.3751 && grade <= 1.6250) return "1.50";
  if (grade >= 1.6251 && grade <= 1.8750) return "1.75";
  if (grade >= 1.8751 && grade <= 2.1250) return "2.00";
  if (grade >= 2.1251 && grade <= 2.3750) return "2.25";
  if (grade >= 2.3751 && grade <= 2.6250) return "2.50";
  if (grade >= 2.6251 && grade <= 2.8750) return "2.75";
  if (grade >= 2.8751 && grade <= 3.1250) return "3.00";
  if (grade >= 3.1251 && grade <= 3.3750) return "3.25";
  if (grade >= 3.37513 && grade <= 3.6250) return "3.50";
  if (grade >= 3.6251 && grade <= 9) return "5.00";
  
  return "5.00";  // Failed
};

/**
 * Table 3: Final Grade Equivalency Table
 * Used for converting the final weighted numeric grade to the final letter grade
 * @param {number} numericGrade - Final numeric grade (0.00 - 9.00)
 * @returns {string} Final equivalent grade ("1.00", "1.25", etc.)
 */
export const getFinalEquivalentGrade = (numericGrade) => {
  if (numericGrade === "" || numericGrade === null || numericGrade === undefined || isNaN(Number(numericGrade))) {
    return "5.00";
  }

  const grade = Number(numericGrade);
  
  // Table 3: Final Grade Equivalency Table
  if (grade >= 0 && grade <= 1.1250) return "1.00";
  if (grade >= 1.1251 && grade <= 1.3750) return "1.25";
  if (grade >= 1.3751 && grade <= 1.6250) return "1.50";
  if (grade >= 1.6251 && grade <= 1.8750) return "1.75";
  if (grade >= 1.8751 && grade <= 2.1250) return "2.00";
  if (grade >= 2.1251 && grade <= 2.3750) return "2.25";
  if (grade >= 2.3751 && grade <= 2.6250) return "2.50";
  if (grade >= 2.6251 && grade <= 2.8750) return "2.75";
  if (grade >= 2.8751 && grade <= 3.1250) return "3.00";
  if (grade >= 3.1251 && grade <= 9.0000) return "5.00";
  
  return "5.00";  // Failed
};

/**
 * Calculate component score percentage from activities
 * @param {Array} activities - Array of activities with scores
 * @param {string} studentId - Student ID
 * @param {Object} scoresByStudent - Map of student scores
 * @returns {number} Component score as percentage (0-100)
 */
export const calculateComponentScore = (activities, studentId, scoresByStudent) => {
  if (!activities.length) return 0;
  
  const studentScores = scoresByStudent[String(studentId)] || {};
  let totalEarned = 0;
  let totalMax = 0;
  
  activities.forEach((activity) => {
    const earned = Number(studentScores[String(activity._id)] || 0);
    const max = Number(activity.maxScore ?? 100) || 100;
    totalEarned += earned;
    totalMax += max;
  });
  
  return totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
};

/**
 * Calculate term grade from component contributions
 * @param {Object} components - Component scores as percentages {classStanding, laboratory, majorOutput}
 * @param {boolean} hasLab - Whether subject has laboratory
 * @returns {number} Term grade as percentage (0-100)
 */
export const calculateTermGrade = (components, hasLab) => {
  const { classStanding = 0, laboratory = 0, majorOutput = 0 } = components;
  
  if (hasLab) {
    // With Laboratory: CS=30%, Lab=30%, MO=40%
    return (classStanding * 0.30) + (laboratory * 0.30) + (majorOutput * 0.40);
  } else {
    // No Laboratory: CS=60%, MO=40%
    return (classStanding * 0.60) + (majorOutput * 0.40);
  }
};

/**
 * Calculate final course grade using the complete BukSU algorithm
 * @param {Object} data
 * @param {boolean} data.hasLab - Whether subject has laboratory component
 * @param {Object} data.midterm - { classPercent?, labPercent?, majorPercent? }
 * @param {Object} data.finalTerm - same shape as midterm
 * @returns {Object} Complete grade calculation results
 */
export const calculateFinalGrade = (data) => {
  const { hasLab, midterm, finalTerm } = data;
  
  // STEP 1: Extract component percentages
  const midtermComponents = {
    classStanding: midterm.classPercent ?? 0,
    laboratory: hasLab ? (midterm.labPercent ?? 0) : 0,
    majorOutput: midterm.majorPercent ?? 0
  };
  
  const finalComponents = {
    classStanding: finalTerm.classPercent ?? 0,
    laboratory: hasLab ? (finalTerm.labPercent ?? 0) : 0,
    majorOutput: finalTerm.majorPercent ?? 0
  };
  
  // STEP 2: Calculate term grades as percentages
  const midtermPercent = calculateTermGrade(midtermComponents, hasLab);
  const finalTermPercent = calculateTermGrade(finalComponents, hasLab);
  
  // STEP 3: Convert term percentages to equivalent grades using Table 1
  const midtermEquivalent = getEquivalentGrade(midtermPercent);
  const finalEquivalent = getEquivalentGrade(finalTermPercent);
  
  // STEP 4: Calculate weighted average of term equivalent grades
  const midtermNumeric = parseFloat(midtermEquivalent) || 5.00;
  const finalNumeric = parseFloat(finalEquivalent) || 5.00;
  const finalGradeNumeric = (midtermNumeric * 0.40) + (finalNumeric * 0.60);
  
  // STEP 5: Convert final numeric grade to equivalent grade using Table 3
  const equivalentGrade = getFinalEquivalentGrade(finalGradeNumeric);
  
  // Determine remarks
  const gradeValue = parseFloat(equivalentGrade);
  const remarks = gradeValue <= 3.00 ? 'PASSED' : 'FAILED';
  
  return {
    midtermPercent,
    finalTermPercent,
    midtermEquivalent,
    finalEquivalent,
    finalGradeNumeric,
    equivalentGrade,
    remarks,
    midtermComponents,
    finalComponents
  };
};

/**
 * Get grade color classes for display
 * @param {string} grade - Grade value ("1.00", "5.00", etc.)
 * @param {string} remarks - Grade remarks ("PASSED", "FAILED")
 * @returns {Object} Color classes for different elements
 */
export const getGradeColorClasses = (grade, remarks) => {
  const gradeValue = parseFloat(grade) || 5.00;
  
  if (remarks === "PASSED" || gradeValue <= 3.00) {
    return {
      badge: "bg-green-100 text-green-800",
      text: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200"
    };
  } else {
    return {
      badge: "bg-red-100 text-red-800",
      text: "text-red-600", 
      bg: "bg-red-50",
      border: "border-red-200"
    };
  }
};

/**
 * Format grade for display
 * @param {number|string} grade - Grade value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted grade
 */
export const formatGrade = (grade, decimals = 2) => {
  if (grade === "" || grade === null || grade === undefined) {
    return "N/A";
  }
  
  const numGrade = Number(grade);
  if (isNaN(numGrade)) return "N/A";
  
  return numGrade.toFixed(decimals);
};

/**
 * Get grade description based on grade value
 * @param {string} grade - Grade value ("1.00", "1.25", etc.)
 * @returns {string} Grade description
 */
export const getGradeDescription = (grade) => {
  const gradeValue = parseFloat(grade);
  
  if (gradeValue >= 1.00 && gradeValue <= 1.24) return "Excellent";
  if (gradeValue >= 1.25 && gradeValue <= 1.49) return "Very Good";
  if (gradeValue >= 1.50 && gradeValue <= 1.74) return "Good";
  if (gradeValue >= 1.75 && gradeValue <= 1.99) return "Satisfactory";
  if (gradeValue >= 2.00 && gradeValue <= 2.49) return "Fair";
  if (gradeValue >= 2.50 && gradeValue <= 2.99) return "Passing";
  if (gradeValue === 3.00) return "Conditional";
  if (gradeValue > 3.00 && gradeValue < 5.00) return "Failing";
  if (gradeValue === 5.00) return "Failed";
  
  return "Unknown";
};

export default {
  getEquivalentGrade,
  getTermEquivalentGrade,
  getFinalEquivalentGrade,
  calculateComponentScore,
  calculateTermGrade,
  calculateFinalGrade,
  getGradeColorClasses,
  formatGrade,
  getGradeDescription
};