// Frontend Grade Utilities
// Updated to match the new BukSU grading algorithm with 3 conversion tables

/**
 * Table 1: Grade Category Equivalency Tables
 * Converts percentage scores to equivalent grades for category and term calculations
 * @param {number} percentage - Percentage score (0-100)
 * @returns {string} Equivalent grade ("1.00", "1.25", etc.)
 */
export const getEquivalentGrade = (percentage) => {
  if (percentage === "" || percentage === null || percentage === undefined || isNaN(Number(percentage))) {
    return "5.00";
  }

  const score = Number(percentage);
  
  // Table 1: Grade Category Equivalency Tables
  if (score >= 96) return "1.00";      // 96-100
  if (score >= 91) return "1.25";      // 91-95
  if (score >= 86) return "1.50";      // 86-90
  if (score >= 80) return "1.75";      // 80-85
  if (score >= 74) return "2.00";      // 74-79
  if (score >= 68) return "2.25";      // 68-73
  if (score >= 62) return "2.50";      // 62-67
  if (score >= 56) return "2.75";      // 56-61
  if (score >= 50) return "3.00";      // 50-55
  if (score >= 44) return "3.25";      // 44-49
  if (score >= 38) return "3.50";      // 38-43
  if (score >= 32) return "3.75";      // 32-37
  if (score >= 26) return "4.00";      // 26-31
  if (score >= 0) return "5.00";       // 0-25
  
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
 * Round number up if decimal is .5 or higher
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number
 */
export const roundUpAtHalf = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
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
  let totalPercentage = 0;
  
  activities.forEach((activity) => {
    const activityId = String(activity._id);
    const maxScore = Number(activity.maxScore ?? 100);
    
    // Check if student has a score for this activity (blank vs 0)
    if (activityId in studentScores) {
      // Student has a score (could be 0 or any number)
      const earned = Number(studentScores[activityId]);
      const percentage = (earned / maxScore) * 100;
      totalPercentage += percentage;
    } else {
      // Student has no score (blank) - give 5%
      totalPercentage += 5;
    }
  });
  
  // Return average of all activity percentages, rounded to whole number
  const average = totalPercentage / activities.length;
  return roundUpAtHalf(average, 0);
};

/**
 * Calculate term grade from component contributions
 * @param {Object} components - Component scores as percentages {classStanding, laboratory, majorOutput}
 * @param {Object|boolean} gradingSchemaOrHasLab - Section's grading schema or legacy hasLab boolean
 * @returns {number} Term grade as percentage (0-100)
 */
export const calculateTermGrade = (components, gradingSchemaOrHasLab) => {
  const { classStanding = 0, laboratory = 0, majorOutput = 0 } = components;
  
  // Support both grading schema object and legacy hasLab boolean
  let weights;
  if (typeof gradingSchemaOrHasLab === 'object' && gradingSchemaOrHasLab !== null) {
    // New: Using grading schema
    weights = gradingSchemaOrHasLab;
  } else {
    // Legacy: Using hasLab boolean
    const hasLab = gradingSchemaOrHasLab;
    weights = hasLab 
      ? { classStanding: 30, laboratory: 30, majorOutput: 40 }
      : { classStanding: 60, laboratory: 0, majorOutput: 40 };
  }
  
  // Use section's grading schema weights (as percentages)
  const csWeight = (weights.classStanding || 60) / 100;
  const labWeight = (weights.laboratory || 0) / 100;
  const moWeight = (weights.majorOutput || 40) / 100;
  
  const termGrade = (classStanding * csWeight) + (laboratory * labWeight) + (majorOutput * moWeight);
  return roundUpAtHalf(termGrade, 0);
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
  
  if (gradeValue >= 1.00 && gradeValue <= 1.24) return "Passed";
  if (gradeValue >= 1.25 && gradeValue <= 1.49) return "Passed";
  if (gradeValue >= 1.50 && gradeValue <= 1.74) return "Passed";
  if (gradeValue >= 1.75 && gradeValue <= 1.99) return "Passed";
  if (gradeValue >= 2.00 && gradeValue <= 2.49) return "Passed";
  if (gradeValue >= 2.50 && gradeValue <= 2.99) return "Passed";
  if (gradeValue === 3.00) return "Passed";
  if (gradeValue > 3.00 && gradeValue < 5.00) return "Failed";
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
  getGradeDescription,
  roundUpAtHalf
};

/**
 * Calculate category average given an activities array and a student object.
 * Uses a callback `getActivityScore(student, activity)` to obtain the student's score
 * for an activity. Blank (no score) is treated as 5% per business rule.
 * @param {Array} activities
 * @param {Object} student
 * @param {Function} getActivityScore - (student, activity) => score | "" | null
 * @returns {number} average percentage (0-100)
 */
export const calculateCategoryAverage = (activities, student, getActivityScore) => {
  if (!Array.isArray(activities) || activities.length === 0) return 0;

  let totalPercentage = 0;

  activities.forEach((activity) => {
    const score = typeof getActivityScore === "function" ? getActivityScore(student, activity) : undefined;
    const max = Number(activity?.maxScore ?? 100) || 100;

    if (score === null || score === undefined || score === "") {
      totalPercentage += 5;
    } else {
      const earned = Number(score);
      const percentage = (earned / max) * 100;
      totalPercentage += percentage;
    }
  });

  const average = totalPercentage / activities.length;
  return roundUpAtHalf(average, 0);
};

/**
 * Calculate the category average for a specific term from an organized activities map
 * (object with keys `classStanding`, `laboratory`, `majorOutput`).
 * @param {Object} allActivitiesByCategory
 * @param {string} categoryName
 * @param {string} term
 * @param {Object} student
 * @param {Function} getActivityScore
 * @returns {number}
 */
export const calculateTermCategoryAverage = (allActivitiesByCategory, categoryName, term, student, getActivityScore) => {
  if (!allActivitiesByCategory || !Array.isArray(allActivitiesByCategory[categoryName])) {
    return 0;
  }

  const termActivities = allActivitiesByCategory[categoryName].filter(
    (activity) => activity.term && String(activity.term).toLowerCase() === String(term).toLowerCase()
  );

  if (!termActivities.length) return 0;

  return calculateCategoryAverage(termActivities, student, getActivityScore);
};

/**
 * Calculate a term percentage for a student (Midterm or Finalterm) using the
 * grading schema or legacy hasLab boolean. Returns the term percentage (0-100).
 * @param {Object} student
 * @param {Object} allActivitiesByCategory
 * @param {string} term - 'Midterm' or 'Finalterm'
 * @param {Object|boolean} gradingSchemaOrHasLab
 * @param {Function} getActivityScore
 */
export const calculateStudentTermPercent = (student, allActivitiesByCategory, term, gradingSchemaOrHasLab, getActivityScore) => {
  const midCS = calculateTermCategoryAverage(allActivitiesByCategory, 'classStanding', term, student, getActivityScore);
  const midLab = calculateTermCategoryAverage(allActivitiesByCategory, 'laboratory', term, student, getActivityScore);
  const midMO = calculateTermCategoryAverage(allActivitiesByCategory, 'majorOutput', term, student, getActivityScore);

  const components = {
    classStanding: midCS,
    laboratory: midLab,
    majorOutput: midMO,
  };

  return calculateTermGrade(components, gradingSchemaOrHasLab);
};

/**
 * Calculate the complete final grade summary for a student using all activities
 * and the section grading schema (or legacy hasLab boolean). Returns an object
 * with midtermPercent, finalTermPercent, finalGradeNumeric, equivalentGrade, remarks, etc.
 */
export const calculateStudentFinalSummary = (student, allActivitiesByCategory, gradingSchemaOrHasLab, getActivityScore) => {
  // Build midterm and final component percentages per category
  const midtermCS = calculateTermCategoryAverage(allActivitiesByCategory, 'classStanding', 'Midterm', student, getActivityScore);
  const midtermLab = calculateTermCategoryAverage(allActivitiesByCategory, 'laboratory', 'Midterm', student, getActivityScore);
  const midtermMO = calculateTermCategoryAverage(allActivitiesByCategory, 'majorOutput', 'Midterm', student, getActivityScore);

  const finalCS = calculateTermCategoryAverage(allActivitiesByCategory, 'classStanding', 'Finalterm', student, getActivityScore);
  const finalLab = calculateTermCategoryAverage(allActivitiesByCategory, 'laboratory', 'Finalterm', student, getActivityScore);
  const finalMO = calculateTermCategoryAverage(allActivitiesByCategory, 'majorOutput', 'Finalterm', student, getActivityScore);

  const midterm = {
    classPercent: midtermCS,
    labPercent: midtermLab,
    majorPercent: midtermMO,
  };

  const finalTerm = {
    classPercent: finalCS,
    labPercent: finalLab,
    majorPercent: finalMO,
  };

  // Determine hasLab boolean from grading schema object or boolean flag
  let hasLab = false;
  if (typeof gradingSchemaOrHasLab === 'object' && gradingSchemaOrHasLab !== null) {
    hasLab = Boolean(gradingSchemaOrHasLab.laboratory && Number(gradingSchemaOrHasLab.laboratory) > 0);
  } else {
    hasLab = Boolean(gradingSchemaOrHasLab);
  }

  const result = calculateFinalGrade({ hasLab, midterm, finalTerm });
  // mark that this was computed as final summary
  return { ...result, isFinal: true };
};