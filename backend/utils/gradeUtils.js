// utils/gradeUtils.js
export const percentToGrade = (percent) => {
  if (percent >= 96) return 1.0;     // 96-100
  if (percent >= 91) return 1.25;    // 91-95
  if (percent >= 86) return 1.5;     // 86-90
  if (percent >= 80) return 1.75;    // 80-85
  if (percent >= 74) return 2.0;     // 74-79
  if (percent >= 68) return 2.25;    // 68-73
  if (percent >= 62) return 2.5;     // 62-67
  if (percent >= 56) return 2.75;    // 56-61
  if (percent >= 50) return 3.0;     // 50-55
  if (percent >= 44) return 3.25;    // 44-49
  if (percent >= 38) return 3.5;     // 38-43
  if (percent >= 32) return 3.75;    // 32-37
  if (percent >= 26) return 4.0;     // 26-31
  return 5.0;                        // 0-25
};

export const computeScoresByStudent = (activityScores) => {
  const map = {};
  for (const s of activityScores) {
    const sid = s?.student?._id ? String(s.student._id) : null;
    if (!sid) continue;
    const aid = String(s.activity);
    map[sid] ||= {};
    
    // Preserve original score value - don't convert undefined/null/empty to 0
    if (s.score !== undefined && s.score !== null && s.score !== '') {
      map[sid][aid] = Number(s.score);
    }
    // If score is missing/undefined/null/empty, don't add it to the map
  }
  return map;
};

export const avgFor = (acts, student, scoresByStudent) => {
  if (!acts.length) return '';
  const sMap = scoresByStudent[String(student._id)] || {};
  
  // Calculate averages from activities - include zero scores, exclude only missing/blank scores
  const validScores = [];
  
  for (const a of acts) {
    const score = sMap[String(a._id)];
    const max = Number(a.maxScore ?? 100) || 0;
    
    // Include if score exists (including zero) - exclude only undefined/null/empty string
    if (score !== undefined && score !== null && score !== '' && max > 0) {
      validScores.push((Number(score) / max) * 100);
    }
  }
  
  // Return empty string if no valid scores, otherwise return average
  return validScores.length > 0 ? 
    validScores.reduce((a, b) => a + b, 0) / validScores.length : 
    '';
};

/**
 * Check if subject has laboratory based on grading schema
 * @param {Object} gradingSchema - Section's grading schema
 * @returns {boolean} True if has laboratory, false otherwise
 */
export const hasLaboratory = (gradingSchema) => {
  const { laboratory = 0 } = gradingSchema || {};
  return laboratory > 0;
};

/**
 * Calculate midterm or final term grade based on components
 * @param {Object} components - {classStanding, laboratory, majorOutput} averages
 * @param {boolean} hasLab - Whether subject has laboratory
 * @returns {number} Term grade percentage
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
 * Calculate final course grade using midterm/final distribution
 * @param {number} midtermGrade - Midterm grade percentage
 * @param {number} finalTermGrade - Final term grade percentage
 * @returns {number} Final course grade percentage
 */
export const calculateFinalCourseGrade = (midtermGrade, finalTermGrade) => {
  return (midtermGrade * 0.40) + (finalTermGrade * 0.60);
};

/**
 * Get grading weights based on whether subject has laboratory
 * @param {boolean} hasLab - Whether subject has laboratory
 * @returns {Object} Grading weights {classStanding, laboratory, majorOutput}
 */
export const getGradingWeights = (hasLab) => {
  if (hasLab) {
    return { classStanding: 0.30, laboratory: 0.30, majorOutput: 0.40 };
  } else {
    return { classStanding: 0.60, laboratory: 0, majorOutput: 0.40 };
  }
};

export default {
  percentToGrade,
  computeScoresByStudent,
  avgFor,
  hasLaboratory,
  calculateTermGrade,
  calculateFinalCourseGrade,
  getGradingWeights
};
