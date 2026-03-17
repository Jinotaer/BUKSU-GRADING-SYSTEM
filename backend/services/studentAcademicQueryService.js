import Student from '../models/student.js';
import Grade from '../models/grades.js';
import Schedule from '../models/schedule.js';
import Section from '../models/sections.js';
import { decryptInstructorData, decryptStudentData } from '../controller/decryptionController.js';

const DEFAULT_CONTEXT_OPTIONS = {
  includeGrades: true,
  includeSchedule: true,
  includeSubjects: true,
};

const GRADE_KEYWORDS = ['grade', 'grades', 'gwa', 'gpa', 'midterm', 'final grade', 'equivalent grade', 'remarks'];
const SUBJECT_KEYWORDS = ['subject', 'subjects', 'enrolled', 'taking', 'classes', 'courses'];
const SCHEDULE_KEYWORDS = ['schedule', 'today', 'tomorrow', 'next class', 'upcoming', 'when is my class', 'class today'];
const PROFILE_KEYWORDS = ['student id', 'studid', 'my id', 'my name', 'college', 'course', 'program', 'year level', 'profile', 'my information'];
const INSTRUCTOR_KEYWORDS = ['instructor', 'teacher', 'professor', 'who teaches', 'under', 'adviser', 'advisor'];
const SECTION_KEYWORDS = ['section', 'section name'];
const ADVISORY_KEYWORDS = ['improve', 'advice', 'tips', 'tip', 'study', 'recommend', 'why', 'explain', 'how can'];
const COUNT_KEYWORDS = ['how many', 'count', 'number of'];

const mergeContextOptions = (options = {}) => ({
  includeGrades: options.includeGrades !== false,
  includeSchedule: options.includeSchedule !== false,
  includeSubjects: options.includeSubjects !== false,
});

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeComparable = (value = '') =>
  normalizeText(value).replace(/[^a-z0-9]+/g, '');

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const hasPostedGrade = (grade) => {
  const numericFields = [
    grade.midtermGrade,
    grade.finalTermGrade,
    grade.finalGrade,
    grade.classStanding,
    grade.laboratory,
    grade.majorOutput,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (numericFields.some((value) => value > 0)) {
    return true;
  }

  if (typeof grade.equivalentGrade === 'string' && grade.equivalentGrade.trim()) {
    return true;
  }

  if (
    typeof grade.remarks === 'string' &&
    grade.remarks.trim() &&
    grade.remarks.trim().toUpperCase() !== 'INC'
  ) {
    return true;
  }

  return false;
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const buildSubjectLabel = (subject) =>
  [subject.subjectCode, subject.subjectName].filter(Boolean).join(' - ');

const findMatchingRecord = (prompt, records, fields) => {
  const promptComparable = normalizeComparable(prompt);
  if (!promptComparable) {
    return null;
  }

  return (
    records.find((record) =>
      fields.some((field) => {
        const value = record[field];
        const comparable = normalizeComparable(value);
        return comparable && promptComparable.includes(comparable);
      })
    ) || null
  );
};

const formatGradeLine = (grade) => {
  const parts = [];

  if (Number(grade.midtermGrade) > 0) parts.push(`Midterm: ${grade.midtermGrade}`);
  if (Number(grade.finalTermGrade) > 0) parts.push(`Final: ${grade.finalTermGrade}`);
  if (Number(grade.finalGrade) > 0) parts.push(`Final Grade: ${grade.finalGrade}`);
  if (grade.equivalentGrade) parts.push(`Equivalent: ${grade.equivalentGrade}`);
  if (grade.remarks) parts.push(`Remarks: ${grade.remarks}`);

  return `${buildSubjectLabel(grade)} (${grade.section || 'No section'}): ${parts.join(', ')}`;
};

const buildProfileResponse = (student) => [
  `Here is your profile information from the system:`,
  `- Name: ${student.fullName || 'Not available'}`,
  `- Student ID: ${student.studid || 'Not available'}`,
  `- College: ${student.college || 'Not available'}`,
  `- Course: ${student.course || 'Not available'}`,
  `- Year Level: ${student.yearLevel || 'Not available'}`,
].join('\n');

const buildSubjectResponse = (subjects) => {
  if (!subjects.length) {
    return 'You do not have any enrolled subjects in the system right now.';
  }

  const lines = subjects.slice(0, 10).map((subject) => {
    const details = [
      subject.subjectCode,
      subject.subjectName,
      `Section ${subject.sectionName}`,
      subject.instructorName ? `Instructor ${subject.instructorName}` : null,
    ].filter(Boolean);
    return `- ${details.join(' | ')}`;
  });

  return ['Here are your current enrolled subjects:', ...lines].join('\n');
};

const buildSectionResponse = (prompt, subjects) => {
  if (!subjects.length) {
    return 'You do not have any enrolled sections in the system right now.';
  }

  const matchedSubject = findMatchingRecord(prompt, subjects, ['subjectCode', 'subjectName', 'sectionName']);
  if (matchedSubject) {
    return `Your section for ${buildSubjectLabel(matchedSubject)} is ${matchedSubject.sectionName}.`;
  }

  if (subjects.length === 1) {
    return `Your current section is ${subjects[0].sectionName}.`;
  }

  const lines = subjects.slice(0, 10).map(
    (subject) => `- ${buildSubjectLabel(subject)}: Section ${subject.sectionName}`
  );

  return ['Here are your current sections:', ...lines].join('\n');
};

const buildInstructorResponse = (prompt, subjects) => {
  if (!subjects.length) {
    return 'You do not have any enrolled subjects in the system right now, so no instructor information is available.';
  }

  const matchedSubject = findMatchingRecord(prompt, subjects, ['subjectCode', 'subjectName', 'sectionName']);
  if (matchedSubject) {
    if (matchedSubject.instructorName) {
      return `Your instructor for ${buildSubjectLabel(matchedSubject)} is ${matchedSubject.instructorName}.`;
    }

    return `The instructor for ${buildSubjectLabel(matchedSubject)} is not currently available in the system data.`;
  }

  const subjectsWithInstructor = subjects.filter((subject) => subject.instructorName);
  if (!subjectsWithInstructor.length) {
    return 'Instructor information is not currently available in the system data.';
  }

  const uniqueInstructorNames = [...new Set(subjectsWithInstructor.map((subject) => subject.instructorName))];
  if (uniqueInstructorNames.length === 1) {
    return `Your current instructor is ${uniqueInstructorNames[0]}.`;
  }

  const lines = subjectsWithInstructor.slice(0, 10).map(
    (subject) => `- ${buildSubjectLabel(subject)}: ${subject.instructorName}`
  );

  return ['Here are your instructors by subject:', ...lines].join('\n');
};

const buildScheduleResponse = (prompt, schedule) => {
  if (!schedule.length) {
    return 'You do not have any upcoming schedule entries in the system right now.';
  }

  const normalizedPrompt = normalizeText(prompt);
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const tomorrowEnd = endOfDay(tomorrowStart);

  let label = 'your upcoming schedule';
  let filtered = schedule;

  if (normalizedPrompt.includes('today')) {
    label = 'your schedule for today';
    filtered = schedule.filter((event) => {
      const start = new Date(event.startDateTime);
      return start >= todayStart && start <= todayEnd;
    });
  } else if (normalizedPrompt.includes('tomorrow')) {
    label = 'your schedule for tomorrow';
    filtered = schedule.filter((event) => {
      const start = new Date(event.startDateTime);
      return start >= tomorrowStart && start <= tomorrowEnd;
    });
  }

  if (!filtered.length) {
    return `I could not find any entries for ${label}.`;
  }

  const lines = filtered.slice(0, 5).map((event) => {
    const parts = [
      event.title || event.eventType || 'Class activity',
      buildSubjectLabel(event),
      event.section,
      formatDateTime(event.startDateTime),
    ].filter(Boolean);

    return `- ${parts.join(' | ')}`;
  });

  return [`Here is ${label}:`, ...lines].join('\n');
};

const buildNextClassResponse = (schedule) => {
  if (!schedule.length) {
    return 'You do not have any upcoming class schedule entries in the system right now.';
  }

  const nextEvent = schedule[0];
  return [
    'Here is your next scheduled class or activity:',
    `- ${nextEvent.title || nextEvent.eventType || 'Class activity'} | ${buildSubjectLabel(nextEvent)} | ${nextEvent.section || 'No section'} | ${formatDateTime(nextEvent.startDateTime)}`,
  ].join('\n');
};

const buildGradeResponse = (prompt, context) => {
  const postedGrades = context.grades.filter(hasPostedGrade);
  const matchedPostedGrade = findMatchingRecord(prompt, postedGrades, ['subjectCode', 'subject']);

  if (matchedPostedGrade) {
    return `Here is your recorded grade:\n- ${formatGradeLine(matchedPostedGrade)}`;
  }

  const matchedSubject = findMatchingRecord(prompt, context.subjects, ['subjectCode', 'subjectName']);
  if (matchedSubject) {
    return `You are enrolled in ${buildSubjectLabel(matchedSubject)}, but there is no posted grade for that subject yet.`;
  }

  if (!postedGrades.length) {
    return 'You do not have any posted grades yet in the system.';
  }

  const lines = postedGrades.slice(0, 10).map((grade) => `- ${formatGradeLine(grade)}`);
  return ['Here are your current recorded grades:', ...lines].join('\n');
};

const buildCountResponse = (prompt, context) => {
  const normalizedPrompt = normalizeText(prompt);

  if (includesAny(normalizedPrompt, SUBJECT_KEYWORDS)) {
    return `You are currently enrolled in ${context.subjects.length} subject${context.subjects.length === 1 ? '' : 's'}.`;
  }

  if (includesAny(normalizedPrompt, GRADE_KEYWORDS)) {
    const postedGrades = context.grades.filter(hasPostedGrade);
    return `You currently have ${postedGrades.length} posted grade record${postedGrades.length === 1 ? '' : 's'} in the system.`;
  }

  if (includesAny(normalizedPrompt, SCHEDULE_KEYWORDS)) {
    return `You currently have ${context.schedule.length} upcoming schedule entr${context.schedule.length === 1 ? 'y' : 'ies'} in the system.`;
  }

  return null;
};

export function classifyStudentPrompt(prompt) {
  const normalizedPrompt = normalizeText(prompt);
  const isAdvisoryQuery = includesAny(normalizedPrompt, ADVISORY_KEYWORDS);
  const isCountQuery = includesAny(normalizedPrompt, COUNT_KEYWORDS);
  const isProfileQuery = includesAny(normalizedPrompt, PROFILE_KEYWORDS);
  const isInstructorQuery = includesAny(normalizedPrompt, INSTRUCTOR_KEYWORDS);
  const isSectionQuery = includesAny(normalizedPrompt, SECTION_KEYWORDS);
  const isGradeQuery = includesAny(normalizedPrompt, GRADE_KEYWORDS) && !isAdvisoryQuery;
  const isSubjectQuery = includesAny(normalizedPrompt, SUBJECT_KEYWORDS);
  const isScheduleQuery = includesAny(normalizedPrompt, SCHEDULE_KEYWORDS) && !normalizedPrompt.includes('study schedule');
  const isNextClassQuery = normalizedPrompt.includes('next class') || normalizedPrompt.includes('next schedule');

  return {
    normalizedPrompt,
    isAdvisoryQuery,
    isCountQuery,
    isProfileQuery,
    isInstructorQuery,
    isSectionQuery,
    isGradeQuery,
    isSubjectQuery,
    isScheduleQuery,
    isNextClassQuery,
  };
}

export async function getStudentAcademicContext(studentId, options = {}) {
  const contextOptions = mergeContextOptions(options);
  const context = {
    student: null,
    grades: [],
    schedule: [],
    subjects: [],
  };

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const decryptedStudent = decryptStudentData(student.toObject());
    context.student = {
      fullName: decryptedStudent.fullName,
      studid: decryptedStudent.studid,
      college: decryptedStudent.college,
      course: decryptedStudent.course,
      yearLevel: decryptedStudent.yearLevel,
    };

    let enrolledSections = [];
    if (contextOptions.includeSubjects || contextOptions.includeSchedule) {
      enrolledSections = await Section.find({
        students: studentId,
        isArchived: { $ne: true },
      })
        .populate('subject')
        .populate('instructor')
        .lean();
    }

    if (contextOptions.includeSubjects) {
      context.subjects = enrolledSections.map((section) => {
        const decryptedInstructor = section.instructor ? decryptInstructorData(section.instructor) : null;

        return {
          ...(decryptedInstructor
            ? {
                instructorName: decryptedInstructor.fullName || null,
                instructorEmail: decryptedInstructor.email || null,
              }
            : {}),
          subjectName: section.subject?.subjectName || 'Unknown',
          subjectCode: section.subject?.subjectCode || 'Unknown',
          description: section.subject?.description || '',
          units: section.subject?.units || 0,
          sectionName: section.sectionName,
          semester: section.semester,
          yearLevel: section.yearLevel,
        };
      });
    }

    if (contextOptions.includeGrades) {
      const grades = await Grade.find({ student: studentId })
        .populate({
          path: 'section',
          populate: {
            path: 'subject',
            model: 'Subject',
          },
        })
        .lean();

      context.grades = grades.map((grade) => ({
        subject: grade.section?.subject?.subjectName || 'Unknown',
        subjectCode: grade.section?.subject?.subjectCode || 'Unknown',
        section: grade.section?.sectionName || 'Unknown',
        midtermGrade: grade.midtermGrade,
        finalTermGrade: grade.finalTermGrade,
        finalGrade: grade.finalGrade,
        equivalentGrade: grade.equivalentGrade,
        remarks: grade.remarks,
        classStanding: grade.classStanding,
        laboratory: grade.laboratory,
        majorOutput: grade.majorOutput,
      }));
    }

    if (contextOptions.includeSchedule) {
      const sectionIds = enrolledSections.map((section) => section._id);
      if (sectionIds.length > 0) {
        const schedule = await Schedule.find({
          section: { $in: sectionIds },
          isActive: { $ne: false },
          startDateTime: { $gte: startOfDay(new Date()) },
        })
          .populate('section')
          .populate('subject')
          .sort({ startDateTime: 1 })
          .limit(20)
          .lean();

        context.schedule = schedule.map((event) => ({
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          subject: event.subject?.subjectName || 'Unknown',
          subjectCode: event.subject?.subjectCode || 'Unknown',
          section: event.section?.sectionName || 'Unknown',
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching student academic context:', error);
  }

  return context;
}

export function resolveDirectStudentAcademicQuery(prompt, studentContext, options = {}) {
  const contextOptions = mergeContextOptions(options);
  const intent = classifyStudentPrompt(prompt);

  if (!intent.normalizedPrompt || !studentContext?.student) {
    return null;
  }

  if (intent.isCountQuery) {
    const countResponse = buildCountResponse(prompt, studentContext);
    if (countResponse) {
      return {
        type: 'count',
        text: countResponse,
      };
    }
  }

  if (intent.isProfileQuery) {
    return {
      type: 'profile',
      text: buildProfileResponse(studentContext.student),
    };
  }

  if (intent.isInstructorQuery && contextOptions.includeSubjects) {
    return {
      type: 'instructor',
      text: buildInstructorResponse(prompt, studentContext.subjects),
    };
  }

  if (intent.isSectionQuery && contextOptions.includeSubjects) {
    return {
      type: 'section',
      text: buildSectionResponse(prompt, studentContext.subjects),
    };
  }

  if (contextOptions.includeGrades && intent.isGradeQuery) {
    return {
      type: 'grades',
      text: buildGradeResponse(prompt, studentContext),
    };
  }

  if (contextOptions.includeSchedule && intent.isNextClassQuery) {
    return {
      type: 'next-class',
      text: buildNextClassResponse(studentContext.schedule),
    };
  }

  if (contextOptions.includeSchedule && intent.isScheduleQuery) {
    return {
      type: 'schedule',
      text: buildScheduleResponse(prompt, studentContext.schedule),
    };
  }

  if (contextOptions.includeSubjects && intent.isSubjectQuery) {
    return {
      type: 'subjects',
      text: buildSubjectResponse(studentContext.subjects),
    };
  }

  return null;
}
