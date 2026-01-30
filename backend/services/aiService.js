// backend/services/aiService.js
import axios from 'axios';
import Student from '../models/student.js';
import Grade from '../models/grades.js';
import Schedule from '../models/schedule.js';
import Section from '../models/sections.js';
import Subject from '../models/subjects.js';
import { decryptStudentData } from '../controller/decryptionController.js';

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

// Fetch student context data
async function getStudentContext(studentId, options = {}) {
  console.log('getStudentContext called with:', { studentId, options });
  const context = { student: null, grades: [], schedule: [], subjects: [] };
  
  try {
    // Get student info
    console.log('Finding student with ID:', studentId);
    const student = await Student.findById(studentId);
    if (!student) {
      console.error('Student not found with ID:', studentId);
      throw new Error('Student not found');
    }
    
    console.log('Student found, decrypting data...');
    // Decrypt student data
    const decryptedStudent = decryptStudentData(student);
    context.student = {
      fullName: decryptedStudent.fullName,
      studid: decryptedStudent.studid,
      college: decryptedStudent.college,
      course: decryptedStudent.course,
      yearLevel: decryptedStudent.yearLevel
    };
    console.log('Student data decrypted for:', decryptedStudent.fullName);
    
    if (options.includeGrades) {
      console.log('Fetching grades...');
      // Get student grades with section and subject details
      const grades = await Grade.find({ student: studentId })
        .populate({
          path: 'section',
          populate: {
            path: 'subject',
            model: 'Subject'
          }
        })
        .lean();
      
      console.log('Found', grades.length, 'grades for student');
      context.grades = grades.map(grade => ({
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
        majorOutput: grade.majorOutput
      }));
    }
    
    if (options.includeSchedule) {
      console.log('Fetching schedule...');
      // Get student schedule
      const studentSections = await Grade.find({ student: studentId }).select('section');
      const sectionIds = studentSections.map(g => g.section);
      console.log('Student is in sections:', sectionIds);
      
      const schedule = await Schedule.find({ 
        section: { $in: sectionIds },
        startDateTime: { $gte: new Date() } // Only future/current events
      })
        .populate('section')
        .populate('subject')
        .sort({ startDateTime: 1 })
        .limit(20) // Limit to next 20 events
        .lean();
      
      console.log('Found', schedule.length, 'upcoming schedule items');
      context.schedule = schedule.map(event => ({
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        subject: event.subject?.subjectName || 'Unknown',
        subjectCode: event.subject?.subjectCode || 'Unknown',
        section: event.section?.sectionName || 'Unknown'
      }));
    }
    
    if (options.includeSubjects) {
      console.log('Fetching subjects...');
      // Get student's current subjects
      const studentSections = await Section.find({
        students: studentId
      }).populate('subject').lean();
      
      console.log('Found', studentSections.length, 'sections with student enrolled');
      context.subjects = studentSections.map(section => ({
        subjectName: section.subject?.subjectName || 'Unknown',
        subjectCode: section.subject?.subjectCode || 'Unknown',
        description: section.subject?.description || '',
        units: section.subject?.units || 0,
        sectionName: section.sectionName,
        semester: section.semester,
        yearLevel: section.yearLevel
      }));
    }
    
  } catch (error) {
    console.error('Error fetching student context:', error);
    // Return partial context instead of failing completely
  }
  
  console.log('Final context:', {
    hasStudent: !!context.student,
    gradesCount: context.grades.length,
    scheduleCount: context.schedule.length,
    subjectsCount: context.subjects.length
  });
  
  return context;
}

// Generate AI response with student context
export async function generateTextWithStudentContext(prompt, studentId, options = {}, contextOptions = {}) {
  console.log('generateTextWithStudentContext called with:', {
    studentId,
    options,
    contextOptions,
    promptLength: prompt?.length
  });

  if (!GEMINI_API_KEY) {
    const e = new Error('Gemini API key not configured');
    e.code = 'NO_API_KEY';
    throw e;
  }

  // Get student context
  console.log('Fetching student context...');
  const studentContext = await getStudentContext(studentId, contextOptions);
  console.log('Student context fetched:', {
    hasStudent: !!studentContext.student,
    gradesCount: studentContext.grades.length,
    scheduleCount: studentContext.schedule.length,
    subjectsCount: studentContext.subjects.length
  });
  
  // Build context string
  let contextString = `Student Information:\n`;
  if (studentContext.student) {
    contextString += `- Name: ${studentContext.student.fullName}\n`;
    contextString += `- Student ID: ${studentContext.student.studid}\n`;
    contextString += `- College: ${studentContext.student.college}\n`;
    contextString += `- Course: ${studentContext.student.course}\n`;
    contextString += `- Year Level: ${studentContext.student.yearLevel}\n\n`;
  }
  
  if (contextOptions.includeSubjects && studentContext.subjects.length > 0) {
    contextString += `Current Subjects:\n`;
    studentContext.subjects.forEach(subject => {
      contextString += `- ${subject.subjectCode}: ${subject.subjectName} (${subject.units} units) - Section ${subject.sectionName}\n`;
    });
    contextString += `\n`;
  }
  
  if (contextOptions.includeGrades && studentContext.grades.length > 0) {
    contextString += `Current Grades:\n`;
    studentContext.grades.forEach(grade => {
      contextString += `- ${grade.subjectCode} (${grade.section}): `;
      contextString += `Midterm: ${grade.midtermGrade}, Final: ${grade.finalTermGrade}, `;
      contextString += `Final Grade: ${grade.finalGrade} (${grade.equivalentGrade}) - ${grade.remarks}\n`;
    });
    contextString += `\n`;
  }
  
  if (contextOptions.includeSchedule && studentContext.schedule.length > 0) {
    contextString += `Upcoming Schedule:\n`;
    studentContext.schedule.forEach(event => {
      const startDate = new Date(event.startDateTime).toLocaleString();
      contextString += `- ${event.title} (${event.eventType}): ${event.subjectCode} - ${startDate}\n`;
      if (event.description) contextString += `  Description: ${event.description}\n`;
    });
    contextString += `\n`;
  }
  
  // Combine context with user prompt
  const fullPrompt = `${contextString}Based on the above student information, please answer the following question:\n\n${prompt}`;
  
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
