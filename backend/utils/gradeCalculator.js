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
 * Convert percentage to grade using the standard grading scale
 * @param {number} percent - Percentage (0-100)
 * @returns {number} Grade (1.0-5.0)
 */
const percentToGrade = (percent) => {
  if (percent >= 97) return 1.0;
  if (percent >= 94) return 1.25;
  if (percent >= 91) return 1.5;
  if (percent >= 88) return 1.75;
  if (percent >= 85) return 2.0;
  if (percent >= 82) return 2.25;
  if (percent >= 79) return 2.5;
  if (percent >= 76) return 2.75;
  if (percent >= 50) return 3.0;
  return 5.0;
};

/**
 * Calculate average score for a category of activities
 * @param {Array} activities - Array of activities
 * @param {string} studentId - Student ID
 * @param {Object} scoresByStudent - Map of student scores
 * @returns {number} Average percentage (0-100)
 */
const calculateCategoryAverage = (activities, studentId, scoresByStudent) => {
  if (!activities.length) return 0;
  
  const studentScores = scoresByStudent[String(studentId)] || {};
  const percents = activities.map((activity) => {
    const score = Number(studentScores[String(activity._id)] || 0);
    const maxScore = Number(activity.maxScore ?? 100) || 100;
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  });
  
  return percents.reduce((a, b) => a + b, 0) / percents.length;
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

    // Group activities by category
    const classStandingActivities = activities.filter(a => a.category === 'classStanding');
    const laboratoryActivities = activities.filter(a => a.category === 'laboratory');
    const majorOutputActivities = activities.filter(a => a.category === 'majorOutput');

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

    // Calculate category averages
    const classStandingAvg = calculateCategoryAverage(classStandingActivities, studentId, scoresByStudent);
    const laboratoryAvg = calculateCategoryAverage(laboratoryActivities, studentId, scoresByStudent);
    const majorOutputAvg = calculateCategoryAverage(majorOutputActivities, studentId, scoresByStudent);

    // Get grading schema weights
    const {
      classStanding: csWeight = 0,
      laboratory: labWeight = 0,
      majorOutput: moWeight = 0
    } = section.gradingSchema || {};

    // Calculate final percentage
    const finalPercent = (
      (classStandingAvg * csWeight) / 100 +
      (laboratoryAvg * labWeight) / 100 +
      (majorOutputAvg * moWeight) / 100
    );

    // Convert to grade
    const finalGrade = percentToGrade(finalPercent);
    const remarks = finalPercent >= 50 ? 'Passed' : 'Failed';

    // Update or create grade record
    const grade = await Grade.findOneAndUpdate(
      { student: studentId, section: sectionId },
      {
        classStanding: classStandingAvg,
        laboratory: laboratoryAvg,
        majorOutput: majorOutputAvg,
        finalGrade,
        remarks,
        encodedBy: instructorId || section.instructor._id,
        dateRecorded: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      grade,
      calculations: {
        classStandingAvg,
        laboratoryAvg,
        majorOutputAvg,
        finalPercent,
        finalGrade,
        remarks
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
  percentToGrade,
};
