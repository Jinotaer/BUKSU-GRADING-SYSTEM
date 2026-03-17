// backend/services/aiService.js
import axios from 'axios';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_REST_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || null;

// Simple REST POST to Gemini
export async function generateTextWithGemini(prompt, options = {}) {
  if (!GEMINI_API_KEY) {
    const e = new Error('Gemini API key not configured');
    e.code = 'NO_API_KEY';
    throw e;
  }

  // Build request body according to the Gemini REST API shape.
  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      // optional: maxOutputTokens, temperature, topP, etc.
      ...options
    }
  };

  try {
    const resp = await axios.post(`${GEMINI_REST_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    // Parse the Gemini response structure
    const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(resp?.data);
    return { text, raw: resp.data };
  } catch (err) {
    // Normalize error and include HTTP status/data when available for easier debugging
    const respData = err?.response?.data;
    const status = err?.response?.status;
    const message = respData?.error?.message || respData || err?.message || 'Unknown error';
    const errMessage = `Gemini request failed${status ? ` (status ${status})` : ''}: ${typeof message === 'string' ? message : JSON.stringify(message)}`;
    const e = new Error(errMessage);
    // attach original error and response details for logging
    e.cause = err;
    e.geminiStatus = status;
    e.geminiData = respData;
    throw e;
  }
}

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

const buildConversationHistoryString = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) {
    return '';
  }

  const lines = history
    .filter((message) => message && typeof message.text === 'string' && message.text.trim())
    .slice(-8)
    .map((message) => {
      const role = message.role === 'assistant' ? 'Assistant' : 'Student';
      return `${role}: ${message.text.trim()}`;
    });

  return lines.length > 0 ? `Recent conversation:\n${lines.join('\n')}\n\n` : '';
};

const buildStudentContextString = (studentContext, contextOptions = {}) => {
  let contextString = 'Student Information:\n';

  if (studentContext.student) {
    contextString += `- Name: ${studentContext.student.fullName || 'Not available'}\n`;
    contextString += `- Student ID: ${studentContext.student.studid || 'Not available'}\n`;
    contextString += `- College: ${studentContext.student.college || 'Not available'}\n`;
    contextString += `- Course: ${studentContext.student.course || 'Not available'}\n`;
    contextString += `- Year Level: ${studentContext.student.yearLevel || 'Not available'}\n\n`;
  } else {
    contextString += '- Student profile data is not currently available.\n\n';
  }

  if (contextOptions.includeSubjects) {
    contextString += 'Current Subjects:\n';
    if (studentContext.subjects.length > 0) {
      studentContext.subjects.forEach((subject) => {
        const instructorText = subject.instructorName ? ` - Instructor ${subject.instructorName}` : '';
        contextString += `- ${subject.subjectCode}: ${subject.subjectName} (${subject.units} units) - Section ${subject.sectionName}${instructorText}\n`;
      });
    } else {
      contextString += '- No enrolled subjects found.\n';
    }
    contextString += '\n';
  }

  if (contextOptions.includeGrades) {
    const postedGrades = studentContext.grades.filter(hasPostedGrade);
    contextString += 'Current Grades:\n';

    if (postedGrades.length > 0) {
      postedGrades.forEach((grade) => {
        contextString += `- ${grade.subjectCode} (${grade.section}): `;
        contextString += `Midterm: ${grade.midtermGrade}, Final: ${grade.finalTermGrade}, `;
        contextString += `Final Grade: ${grade.finalGrade} (${grade.equivalentGrade}) - ${grade.remarks}\n`;
      });
    } else {
      contextString += '- No posted grades found.\n';
    }

    contextString += '\n';
  }

  if (contextOptions.includeSchedule) {
    contextString += 'Upcoming Schedule:\n';

    if (studentContext.schedule.length > 0) {
      studentContext.schedule.forEach((event) => {
        const startDate = new Date(event.startDateTime).toLocaleString();
        contextString += `- ${event.title} (${event.eventType}): ${event.subjectCode} - ${startDate}\n`;
        if (event.description) contextString += `  Description: ${event.description}\n`;
      });
    } else {
      contextString += '- No upcoming schedule found.\n';
    }

    contextString += '\n';
  }

  return contextString;
};

// Generate AI response with student context
export async function generateTextWithStudentContext(
  prompt,
  studentContext,
  history = [],
  options = {},
  contextOptions = {}
) {
  console.log('generateTextWithStudentContext called with:', {
    options,
    contextOptions,
    historyCount: Array.isArray(history) ? history.length : 0,
    promptLength: prompt?.length
  });

  if (!GEMINI_API_KEY) {
    const e = new Error('Gemini API key not configured');
    e.code = 'NO_API_KEY';
    throw e;
  }

  console.log('Student context received:', {
    hasStudent: !!studentContext.student,
    gradesCount: studentContext.grades.length,
    scheduleCount: studentContext.schedule.length,
    subjectsCount: studentContext.subjects.length
  });

  const contextString = buildStudentContextString(studentContext, contextOptions);
  const historyString = buildConversationHistoryString(history);

  // Combine context with user prompt
  const fullPrompt = `${contextString}${historyString}Instructions:
- Use the student system data above for factual statements about grades, subjects, instructors, sections, schedule, and profile.
- You may still give helpful academic advice, study tips, time-management guidance, and explanations using general best practices.
- When giving advice, separate facts from the system and your suggestions. Do not invent new grades, schedules, instructors, or subjects.
- Do not ask for the student's name, student ID, college, course, or year level if they are already present in the system data.
- If the system data says there are no posted grades, no schedule, or no subjects, say that clearly and then continue with helpful guidance when the question is advisory.
- Use the recent conversation to understand follow-up questions, but rely on the system data for facts.
- Keep the answer concise and practical.

Student question:
${prompt}`;
  
  // Build request body
  const body = {
    contents: [
      {
        parts: [
          {
            text: fullPrompt
          }
        ]
      }
    ],
    generationConfig: {
      ...options
    }
  };

  try {
    const resp = await axios.post(`${GEMINI_REST_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(resp?.data);
    return { text, raw: resp.data, context: studentContext };
  } catch (err) {
    const respData = err?.response?.data;
    const status = err?.response?.status;
    const message = respData?.error?.message || respData || err?.message || 'Unknown error';
    const errMessage = `Gemini request failed${status ? ` (status ${status})` : ''}: ${typeof message === 'string' ? message : JSON.stringify(message)}`;
    const e = new Error(errMessage);
    e.cause = err;
    e.geminiStatus = status;
    e.geminiData = respData;
    throw e;
  }
}
