// utils/gradeCalculator.js
import Activity from "../models/activity.js";
import ActivityScore from "../models/activityScore.js";
import Grade from "../models/grades.js";
import Section from "../models/sections.js";

/**
 * Convert activity term format from section term format
 * @param {string} sectionTerm - Section term ('1st', '2nd', 'Summer')
 * @returns {string} Activity term format ('First', 'Second', 'Summer')
 */
const toActivityTerm = (sectionTerm) => {
  const mapping = { '1st': 'First', '2nd': 'Second', Summer: 'Summer' };
  return mapping[sectionTerm] || sectionTerm;
};



/**
 * Get equivalent grade based on BukSU grading scale (Table 1 - Grade Category Equivalency Tables)
 * Used for converting percentage scores to equivalent grades for category and term calculations
 * Based on the official BukSU algorithm with 50% passing rate tables
 * @param {number} percentage - Percentage score (0-100)
 * @returns {string} Equivalent grade ("1.00", "1.25", etc.)
 */
function getEquivalentGrade(percentage) {
  if (percentage === "" || percentage === null || percentage === undefined || isNaN(Number(percentage))) {
    return "";
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
}

/**
 * Get equivalent grade from numeric grade using Table 2 (Term Grade Equivalency Table)
 * Used for intermediate term grade calculations
 * @param {number} numericGrade - Numeric grade (0.00 - 5.00)
 * @returns {string} Equivalent grade ("1.00", "1.25", etc.)
 */
function getTermEquivalentGrade(numericGrade) {
  if (numericGrade === "" || numericGrade === null || numericGrade === undefined || isNaN(Number(numericGrade))) {
    return "";
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
  
  // Above 9 or invalid
  return "5.00";  // Failed
}

/**
 * Get final equivalent grade using Table 3 (Final Grade Equivalency Table)
 * Used for converting the final weighted numeric grade to the final letter grade
 * @param {number} numericGrade - Final numeric grade (0.00 - 9.00)
 * @returns {string} Final equivalent grade ("1.00", "1.25", etc.)
 */
function getFinalEquivalentGrade(numericGrade) {
  if (numericGrade === "" || numericGrade === null || numericGrade === undefined || isNaN(Number(numericGrade))) {
    return "";
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
  
  // Above 9 or invalid
  return "5.00";  // Failed
}

/**
 * STEP 1: Calculate component scores from activity items
 * Returns the percentage score (0-100) for a category
 * @param {Array} activities - Array of activities with scores
 * @param {string} studentId - Student ID
 * @param {Object} scoresByStudent - Map of student scores
 * @returns {number} Component score as percentage (0-100)
 */
const calculateComponentScore = (activities, studentId, scoresByStudent) => {
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
 * STEP 2 & 3: Calculate term grade from component contributions
 * Returns the term grade as percentage (0-100)
 * @param {Object} components - Component scores as percentages {classStanding, laboratory, majorOutput}
 * @param {boolean} hasLab - Whether subject has laboratory
 * @returns {number} Term grade as percentage (0-100)
 */
const calculateTermGradeFraction = (components, hasLab) => {
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
 * Main Grade Calculator Function - implements the complete BukSU grading algorithm
 * 
 * ALGORITHM STEPS:
 * 1. Calculate component scores (Class Standing, Laboratory, Major Output) as percentages
 * 2. Calculate term grades (Midterm, Final) as percentages using weighted components
 * 3. Convert term percentages to equivalent grades using Table 1 (Grade Category Equivalency)
 * 4. Calculate weighted average of term equivalent grades (Midterm 40% + Final 60%)
 * 5. Convert final numeric grade to equivalent grade using Table 3 (Final Grade Equivalency)
 * 
 * @param {Object} data
 * @param {boolean} data.hasLab - Whether subject has laboratory component
 * @param {Object} data.midterm - { classPercent?, labPercent?, majorPercent? } as percentages (0-100)
 * @param {Object} data.finalTerm - same shape as midterm
 * @param {Object} [options]
 * @returns {Object} { midtermPercent, finalTermPercent, midtermEquivalent, finalEquivalent, finalGradeNumeric, equivalentGrade, remarks }
 */
const calculateGrades = (data, options = {}) => {
  const { hasLab, midterm, finalTerm } = data;
  
  // STEP 1: Extract component percentages (already calculated as 0-100)
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
  
  // STEP 2: Calculate term grades as percentages (0-100)
  const midtermPercent = calculateTermGradeFraction(midtermComponents, hasLab);
  const finalTermPercent = calculateTermGradeFraction(finalComponents, hasLab);
  
  // STEP 3: Convert term percentages to equivalent grades using Table 1
  const midtermEquivalent = getEquivalentGrade(midtermPercent);
  const finalEquivalent = getEquivalentGrade(finalTermPercent);
  
  // STEP 4: Calculate weighted average of term equivalent grades
  // Midterm = 40%, Final = 60%
  const midtermNumeric = parseFloat(midtermEquivalent) || 5.00;
  const finalNumeric = parseFloat(finalEquivalent) || 5.00;
  const finalGradeNumeric = (midtermNumeric * 0.40) + (finalNumeric * 0.60);
  
  // STEP 5: Convert final numeric grade to equivalent grade using Table 3 (Final Grade Equivalency Table)
  const equivalentGrade = getFinalEquivalentGrade(finalGradeNumeric);
  
  // Determine remarks (Passed if grade is 3.00 or better)
  const gradeValue = parseFloat(equivalentGrade);
  const remarks = gradeValue <= 3.00 ? 'PASSED' : 'FAILED';
  
  return {
    // Term percentages
    midtermPercent,
    finalTermPercent,
    
    // Term equivalent grades (from Table 1)
    midtermEquivalent,
    finalEquivalent,
    
    // Final calculations
    finalGradeNumeric,  // Weighted average of term equivalents
    equivalentGrade,     // Final grade from Table 2
    remarks,
    
    // Component details
    midtermComponents,
    finalComponents
  };
};

/**
 * Calculate term-specific average for a category
 * @param {Array} activities - Array of activities for specific term
 * @param {string} studentId - Student ID
 * @param {Object} scoresByStudent - Map of student scores
 * @returns {number} Average percentage (0-100)
 */
const calculateTermCategoryAverage = (activities, studentId, scoresByStudent) => {
  // Use the same logic as calculateComponentScore
  return calculateComponentScore(activities, studentId, scoresByStudent);
};



/**
 * Detect if subject has laboratory based on grading schema
 * @param {Object} gradingSchema - Section's grading schema
 * @returns {boolean} True if has laboratory, false otherwise
 */
const hasLaboratory = (gradingSchema) => {
  const { laboratory = 0 } = gradingSchema || {};
  return laboratory > 0;
};

/**
 * Calculate midterm or final term grade based on components
 * @param {Object} components - {classStanding, laboratory, majorOutput} averages
 * @param {boolean} hasLab - Whether subject has laboratory
 * @returns {number} Term grade percentage
 */
const calculateTermGrade = (components, hasLab) => {
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
 * Calculate and update grade for a specific student in a section
 * @param {string} studentId - Student ID
 * @param {string} sectionId - Section ID
 * @param {string} instructorId - Instructor ID (optional, for tracking who encoded)
 * @returns {Promise<Object>} Updated grade object
 */
export const calculateAndUpdateGrade = async (studentId, sectionId, instructorId = null) => {
  try {
    // Get section with grading schema
    const section = await Section.findById(sectionId)
      .populate('subject')
      .populate('instructor');
    
    if (!section) {
      throw new Error('Section not found');
    }

    // Verify student is enrolled in this section
    const isEnrolled = section.students.some(s => String(s._id) === String(studentId));
    if (!isEnrolled) {
      throw new Error('Student is not enrolled in this section');
    }

    // Get all active activities for this section
    const activityQuery = {
      subject: section.subject._id,
      schoolYear: section.schoolYear,
      term: toActivityTerm(section.term),
      isActive: true,
    };
    const activities = await Activity.find(activityQuery).sort({ createdAt: 1 });

    // Group activities by category and term
    const midtermActivities = activities.filter(a => a.term === 'Midterm');
    const finalTermActivities = activities.filter(a => a.term === 'Finalterm');
    
    // Midterm activities by category
    const midtermCS = midtermActivities.filter(a => a.category === 'classStanding');
    const midtermLab = midtermActivities.filter(a => a.category === 'laboratory');
    const midtermMO = midtermActivities.filter(a => a.category === 'majorOutput');
    
    // Final term activities by category
    const finalCS = finalTermActivities.filter(a => a.category === 'classStanding');
    const finalLab = finalTermActivities.filter(a => a.category === 'laboratory');
    const finalMO = finalTermActivities.filter(a => a.category === 'majorOutput');

    // Get all activity scores for this student in this section
    const activityIds = activities.map(a => a._id);
    const activityScores = await ActivityScore.find({
      activity: { $in: activityIds },
      student: studentId,
      section: sectionId
    });

    // Create a map of scores by activity ID
    const scoresByStudent = {
      [String(studentId)]: {}
    };
    activityScores.forEach(score => {
      scoresByStudent[String(studentId)][String(score.activity)] = Number(score.score || 0);
    });

    // Detect if subject has laboratory
    const subjectHasLab = hasLaboratory(section.gradingSchema);
    
    // STEP 1: Calculate component scores as percentages (0-100)
    const midtermClassStanding = calculateComponentScore(midtermCS, studentId, scoresByStudent);
    const midtermLaboratory = subjectHasLab ? calculateComponentScore(midtermLab, studentId, scoresByStudent) : 0;
    const midtermMajorOutput = calculateComponentScore(midtermMO, studentId, scoresByStudent);
    
    const finalClassStanding = calculateComponentScore(finalCS, studentId, scoresByStudent);
    const finalLaboratory = subjectHasLab ? calculateComponentScore(finalLab, studentId, scoresByStudent) : 0;
    const finalMajorOutput = calculateComponentScore(finalMO, studentId, scoresByStudent);
    
    // Use the calculateGrades function with correct algorithm implementation
    const gradeResult = calculateGrades({
      hasLab: subjectHasLab,
      midterm: {
        classPercent: midtermClassStanding,
        labPercent: midtermLaboratory,
        majorPercent: midtermMajorOutput
      },
      finalTerm: {
        classPercent: finalClassStanding,
        labPercent: finalLaboratory,
        majorPercent: finalMajorOutput
      }
    });
    
    // Extract results
    const midtermGrade = gradeResult.midtermPercent; // Already a percentage
    const finalTermGrade = gradeResult.finalTermPercent; // Already a percentage
    const midtermEquivalentGrade = gradeResult.midtermEquivalent; // From Table 1
    const finalTermEquivalentGrade = gradeResult.finalEquivalent; // From Table 1
    const finalGradeNumeric = gradeResult.finalGradeNumeric; // Weighted average of term equivalents
    const equivalentGrade = gradeResult.equivalentGrade; // From Table 2
    const remarks = gradeResult.remarks;

    // Update or create grade record
    const grade = await Grade.findOneAndUpdate(
      { student: studentId, section: sectionId },
      {
        // Term grades as percentages (0-100)
        midtermGrade,
        finalTermGrade,
        
        // Term equivalent grades from Table 1
        midtermEquivalentGrade,
        finalTermEquivalentGrade,
        
        // Component percentages for midterm
        midtermClassStanding,
        midtermLaboratory,
        midtermMajorOutput,
        
        // Component percentages for final term
        finalClassStanding,
        finalLaboratory,
        finalMajorOutput,
        
        // Final grade calculation
        finalGradeNumeric,      // Weighted average of term equivalent grades
        finalGrade: equivalentGrade,  // Final grade from Table 2
        equivalentGrade,        // Same as finalGrade for compatibility
        remarks,
        hasLaboratory: subjectHasLab,
        encodedBy: instructorId || section.instructor._id,
        dateRecorded: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      grade,
      calculations: {
        // Component percentages
        midtermClassStanding,
        midtermLaboratory,
        midtermMajorOutput,
        finalClassStanding,
        finalLaboratory,
        finalMajorOutput,
        
        // Term grades
        midtermGrade,
        finalTermGrade,
        midtermEquivalentGrade,
        finalTermEquivalentGrade,
        
        // Final grade
        finalGradeNumeric,
        equivalentGrade,
        remarks,
        hasLaboratory: subjectHasLab
      }
    };
  } catch (error) {
    console.error('Error calculating grade:', error);
    throw error;
  }
};

/**
 * Calculate and update grades for multiple students in a section
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {string} sectionId - Section ID
 * @param {string} instructorId - Instructor ID (optional)
 * @returns {Promise<Object>} Results with successes and failures
 */
export const calculateAndUpdateGrades = async (studentIds, sectionId, instructorId = null) => {
  const results = {
    successful: [],
    failed: []
  };

  for (const studentId of studentIds) {
    try {
      const result = await calculateAndUpdateGrade(studentId, sectionId, instructorId);
      results.successful.push({ studentId, ...result });
    } catch (error) {
      results.failed.push({ studentId, error: error.message });
    }
  }

  return results;
};

/**
 * Calculate and update grades for all students in a section
 * @param {string} sectionId - Section ID
 * @param {string} instructorId - Instructor ID (optional)
 * @returns {Promise<Object>} Results with successes and failures
 */
export const calculateAndUpdateAllGradesInSection = async (sectionId, instructorId = null) => {
  try {
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    const studentIds = section.students.map(s => String(s._id));
    return await calculateAndUpdateGrades(studentIds, sectionId, instructorId);
  } catch (error) {
    console.error('Error calculating grades for section:', error);
    throw error;
  }
};

export default {
  calculateAndUpdateGrade,
  calculateAndUpdateGrades,
  calculateAndUpdateAllGradesInSection,
  getEquivalentGrade,
  getTermEquivalentGrade,
  getFinalEquivalentGrade,
  calculateGrades,
};
