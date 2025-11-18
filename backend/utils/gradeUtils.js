// utils/gradeUtils.js
export const percentToGrade = (percent) => {
  if (percent >= 96) return 1.0;     // 96-100
  if (percent >= 93) return 1.25;    // 93-95
  if (percent >= 89) return 1.5;     // 89-92
  if (percent >= 86) return 1.75;    // 86-88
  if (percent >= 83) return 2.0;     // 83-85
  if (percent >= 80) return 2.25;    // 80-82
  if (percent >= 77) return 2.5;     // 77-79
  if (percent >= 74) return 2.75;    // 74-76
  if (percent >= 71) return 3.0;     // 71-73
  if (percent >= 68) return 3.25;    // 68-70
  if (percent >= 65) return 3.5;     // 65-67
  if (percent >= 60) return 3.75;    // 60-64
  if (percent >= 56) return 4.0;     // 56-59
  if (percent >= 50) return 4.5;     // 50-55
  return 5.0;                        // Below 50
};

export const computeScoresByStudent = (activityScores) => {
  const map = {};
  for (const s of activityScores) {
    const sid = s?.student?._id ? String(s.student._id) : null;
    if (!sid) continue;
    const aid = String(s.activity);
    map[sid] ||= {};
    map[sid][aid] = Number(s.score || 0);
  }
  return map;
};

export const avgFor = (acts, student, scoresByStudent) => {
  if (!acts.length) return 0;
  const sMap = scoresByStudent[String(student._id)] || {};
  const percents = acts.map((a) => {
    const score = Number(sMap[String(a._id)] || 0);
    const max = Number(a.maxScore ?? 100) || 0;
    return max > 0 ? (score / max) * 100 : 0;
  });
  return percents.reduce((a, b) => a + b, 0) / percents.length;
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
