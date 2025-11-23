// services/sheetDataService.js
import Section from '../models/sections.js';
import Activity from '../models/activity.js';
import ActivityScore from '../models/activityScore.js';
import Grade from '../models/grades.js';
import { HttpError } from '../utils/googleSheetsHelpers.js';
import { percentToGrade, computeScoresByStudent, avgFor } from '../utils/gradeUtils.js';
import { bulkDecryptUserData, decryptInstructorData } from '../controller/decryptionController.js';

export const toActivityTerm = (sectionTerm) => {
  const mapping = { '1st': 'First', '2nd': 'Second', Summer: 'Summer' };
  return mapping[sectionTerm] || sectionTerm;
};

export const loadSection = async (sectionId) => {
  try {
    const section = await Section.findById(sectionId)
      .populate('subject')
      .populate('instructor')
      .populate('students')
      .lean(); // Use lean() to get plain objects
      
    if (!section) throw new HttpError(402, 'Section not found');
    
    // Decrypt instructor data
    if (section.instructor) {
      section.instructor = decryptInstructorData(section.instructor);
    }
    
    // Decrypt student data
    if (section.students && section.students.length > 0) {
      section.students = await bulkDecryptUserData(section.students, 'student');
    }
    
    return section;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(500, 'Failed loading section', { cause: err?.message });
  }
};

export const authorizeInstructor = (section, instructorId) => {
  if (String(section.instructor?._id) !== String(instructorId)) {
    throw new HttpError(403, 'Unauthorized');
  }
};

export const loadActivities = async (section, termFilter) => {
  try {
    if (!section?.subject?._id) return [];
    const query = {
      subject: section.subject._id,
      schoolYear: section.schoolYear,
      isActive: true,
    };
    
    console.log('[loadActivities] Term filter received:', termFilter);
    
    // If a specific term is requested, filter by it
    if (termFilter && termFilter !== '' && termFilter !== 'All Terms') {
      query.term = termFilter;
      console.log('[loadActivities] Filtering for specific term:', termFilter);
    } else {
      // For "All Terms" or empty filter, explicitly load all terms
      query.term = { $in: ['Midterm', 'Finalterm'] };
      console.log('[loadActivities] Loading all terms (Midterm, Finalterm)');
    }
    
    const activities = await Activity.find(query).sort({ createdAt: 1 });
    console.log('[loadActivities] Found activities:', activities.length, 'Terms:', [...new Set(activities.map(a => a.term))]);
    return activities;
  } catch (err) {
    throw new HttpError(500, 'Failed loading activities', { cause: err?.message });
  }
};

export const loadActivityScores = async (activityIds) => {
  try {
    const scores = await ActivityScore.find({ activity: { $in: activityIds } }).populate('student');
    return scores;
  } catch (err) {
    throw new HttpError(500, 'Failed loading activity scores', { cause: err?.message });
  }
};

export const buildFinalGradeSheetData = (section, activities, scoresByStudent, schedule) => {
  const headerData = [
    ['BUKIDNON STATE UNIVERSITY'],
    ['Malaybalay City, Bukidnon 8700'],
    ['=HYPERLINK("http://www.buksu.edu.ph", "Tel (088) 813-5661 to 5663; Telefax (088) 813-2717; www.buksu.edu.ph")'],
    [],
    ['HYBRID-FLEXIBLE LEARNING GRADE SHEET'],
    [],
  ];

  const sectionInfo = [
    ['Section Code:', String(section.sectionCode || section.sectionName || 'N/A'), '', '', '', '', 'Unit(s):', String(section.subject?.units ?? 3)],
    ['Subject Code:', String(section.subject?.subjectCode || 'N/A'), '', '', '', '', 'Day/Time:', `${schedule.day || 'TBA'}, ${schedule.time || 'TBA'}`],
    ['Course Description.:', String(section.subject?.subjectName || 'N/A'), '', '', '', '', 'Room:', String(schedule.room || 'TBA')],
    ['Semester/School Year:', `${section.term || ''} Sem/${section.schoolYear || 'N/A'}`],
    [],
  ];

  // Get grading schema weights
  const gradingSchema = section.gradingSchema || {};
  const csWeight = gradingSchema.classStanding || 0;
  const labWeight = gradingSchema.laboratory || 0;
  const moWeight = gradingSchema.majorOutput || 0;
  const subjectHasLab = labWeight > 0;

  // Group activities by term
  const midtermActivities = activities.filter(a => a.term === 'Midterm');
  const finalTermActivities = activities.filter(a => a.term === 'Finalterm');

  // Build header structure for comprehensive grade sheet
  const baseHeaders = ['No.', 'Student No.', 'Name of Students'];
  
  // Midterm section headers based on grading schema
  const midtermHeaders = [];
  if (subjectHasLab) {
    midtermHeaders.push(`CS (${csWeight}%)`, `LAB (${labWeight}%)`, `MO (${moWeight}%)`, 'MTG');
  } else {
    midtermHeaders.push(`CS (${csWeight}%)`, `MO (${moWeight}%)`, 'MTG');
  }

  // Final term section headers based on grading schema
  const finalHeaders = [];
  if (subjectHasLab) {
    finalHeaders.push(`CS (${csWeight}%)`, `LAB (${labWeight}%)`, `MO (${moWeight}%)`, 'FTG');
  } else {
    finalHeaders.push(`CS (${csWeight}%)`, `MO (${moWeight}%)`, 'FTG');
  }

  // Final grade section headers
  const finalGradeHeaders = ['MTG(1/3)', 'FTG(2/3)', 'FG', 'Remarks'];

  // Combine all headers
  const completeHeaders = [
    ...baseHeaders,
    ...midtermHeaders,
    ...finalHeaders, 
    ...finalGradeHeaders
  ];

  // Create category row (showing Midterm, Finalterm, Final Grade sections)
  const categoryRow = ['', '', ''];
  
  // Add Midterm category
  categoryRow.push('Midterm');
  for (let i = 1; i < midtermHeaders.length; i++) {
    categoryRow.push('');
  }
  
  // Add Finalterm category
  categoryRow.push('Finalterm');
  for (let i = 1; i < finalHeaders.length; i++) {
    categoryRow.push('');
  }
  
  // Add Final Grade category
  categoryRow.push('Final Grade');
  for (let i = 1; i < finalGradeHeaders.length; i++) {
    categoryRow.push('');
  }

  // Student data rows
  const studentRows = section.students.map((student, idx) => {
    // Calculate midterm component averages
    const midtermCS = avgFor(midtermActivities.filter(a => a.category === 'classStanding'), student, scoresByStudent);
    const midtermLab = subjectHasLab ? avgFor(midtermActivities.filter(a => a.category === 'laboratory'), student, scoresByStudent) : 0;
    const midtermMO = avgFor(midtermActivities.filter(a => a.category === 'majorOutput'), student, scoresByStudent);
    
    // Calculate final term component averages
    const finalCS = avgFor(finalTermActivities.filter(a => a.category === 'classStanding'), student, scoresByStudent);
    const finalLab = subjectHasLab ? avgFor(finalTermActivities.filter(a => a.category === 'laboratory'), student, scoresByStudent) : 0;
    const finalMO = avgFor(finalTermActivities.filter(a => a.category === 'majorOutput'), student, scoresByStudent);
    
    // Calculate term grades using custom grading schema (with rounding)
    let midtermGrade, finalTermGrade;
    if (subjectHasLab) {
      midtermGrade = Math.round((midtermCS * csWeight / 100) + (midtermLab * labWeight / 100) + (midtermMO * moWeight / 100));
      finalTermGrade = Math.round((finalCS * csWeight / 100) + (finalLab * labWeight / 100) + (finalMO * moWeight / 100));
    } else {
      midtermGrade = Math.round((midtermCS * csWeight / 100) + (midtermMO * moWeight / 100));
      finalTermGrade = Math.round((finalCS * csWeight / 100) + (finalMO * moWeight / 100));
    }
    
    // Calculate final grade using proper BukSU algorithm
    // Step 1: Convert term percentages to equivalent grades  
    const midtermEquivalent = percentToGrade(midtermGrade);
    const finalTermEquivalent = percentToGrade(finalTermGrade);
    
    // Step 2: Calculate weighted average of equivalent grades (40%/60%)
    const finalGradeNumeric = (midtermEquivalent * 0.40) + (finalTermEquivalent * 0.60);
    
    // Step 3: Final grade result
    const finalGrade = finalGradeNumeric;
    const remarks = finalGrade <= 3.00 ? 'PASSED' : 'FAILED';
    
    // Convert all components and term grades to grade equivalents (round percentages first)
    const midtermCSGrade = percentToGrade(Math.round(midtermCS));
    const midtermLabGrade = percentToGrade(Math.round(midtermLab));
    const midtermMOGrade = percentToGrade(Math.round(midtermMO));
    const midtermGradeEquiv = percentToGrade(midtermGrade);
    
    const finalCSGrade = percentToGrade(Math.round(finalCS));
    const finalLabGrade = percentToGrade(Math.round(finalLab));
    const finalMOGrade = percentToGrade(Math.round(finalMO));
    const finalTermGradeEquiv = percentToGrade(finalTermGrade);

    // Build row data
    const row = [String(idx + 1), student.studid || '', student.fullName || ''];
    
    // Add midterm data (all as grade equivalents)
    if (subjectHasLab) {
      row.push(midtermCSGrade.toFixed(2), midtermLabGrade.toFixed(2), midtermMOGrade.toFixed(2), midtermGradeEquiv.toFixed(2));
    } else {
      row.push(midtermCSGrade.toFixed(2), midtermMOGrade.toFixed(2), midtermGradeEquiv.toFixed(2));
    }
    
    // Add final term data (all as grade equivalents)
    if (subjectHasLab) {
      row.push(finalCSGrade.toFixed(2), finalLabGrade.toFixed(2), finalMOGrade.toFixed(2), finalTermGradeEquiv.toFixed(2));
    } else {
      row.push(finalCSGrade.toFixed(2), finalMOGrade.toFixed(2), finalTermGradeEquiv.toFixed(2));
    }
    
    // Add final grade data (MTG(40%), FTG(60%), FG, Remarks)
    row.push(
      midtermGradeEquiv.toFixed(2), // MTG(40%) - show as grade equivalent
      finalTermGradeEquiv.toFixed(2), // FTG(60%) - show as grade equivalent
      finalGrade.toFixed(2), // FG
      remarks // Remarks
    );
    
    return row;
  });

  const tableHeaderRows = [categoryRow, completeHeaders];
  const allData = [...headerData, ...sectionInfo, ...tableHeaderRows, ...studentRows];

  return {
    allData,
    tableHeaderRows,
    headerColorRanges: [
      { start: 0, end: 3, color: { red: 0.82, green: 0.82, blue: 0.82 } },
      { start: 3, end: 3 + midtermHeaders.length, color: { red: 1, green: 0.93, blue: 0.47 } },
      { start: 3 + midtermHeaders.length, end: 3 + midtermHeaders.length + finalHeaders.length, color: { red: 0.68, green: 0.88, blue: 0.65 } },
      { start: 3 + midtermHeaders.length + finalHeaders.length, end: completeHeaders.length, color: { red: 0.86, green: 0.78, blue: 0.93 } },
    ],
    baseColumns: 3,
    totalColumns: completeHeaders.length,
    hasLaboratory: subjectHasLab
  };
};


export const buildSheetData = (section, activities, scoresByStudent, schedule, requestedTerm) => {
  const headerData = [
    ['', '', 'BUKIDNON STATE UNIVERSITY'],
    ['', '', 'Malaybalay City, Bukidnon 8700'],
    ['', '', '=HYPERLINK("http://www.buksu.edu.ph", "Tel (088) 813-5661 to 5663; Telefax (088) 813-2717; www.buksu.edu.ph")'],
    [],
    ['', '', 'CLASS RECORD'],
    [],
  ];

  const sectionInfo = [
    ['', '', 'Section Code:', '', section.sectionCode || section.sectionName || 'N/A', '', '', '', 'Day:', schedule.day],
    ['', '', 'Subject Code:', '', section.subject?.subjectCode || 'N/A', '', '', '', 'Time:', schedule.time],
    ['', '', 'Descriptive Title:', '', section.subject?.subjectName || 'N/A', '', '', '', 'Rm:', schedule.room],
    ['', '', 'Semester:', '', (section.term || '') + ' Sem', '', '', '', 'Units:', section.subject?.units || 'N/A'],
    ['', '', 'School Year:', '', section.schoolYear || 'N/A', '', '', '', 'Chair:', schedule.chairperson],
    ['', '', 'Instructor:', '', section.instructor?.fullName || 'N/A', '', '', '', 'Dean:', schedule.dean],
    [],
  ];

  const classStandingActivities = activities.filter((a) => a.category === 'classStanding');
  const laboratoryActivities = activities.filter((a) => a.category === 'laboratory');
  const majorOutputActivities = activities.filter((a) => a.category === 'majorOutput');

  const baseColumns = 5;
  const headerRows = {
    category: ['', '', '', '', ''],
    index: ['', '', 'Ctrl\nNo', 'ID Number', 'NAME'],
    title: ['', '', '', '', ''],
    maxScores: ['', '', '', '', ''],
  };
  
  // Determine what term we're exporting to add appropriate grade headers
  const terms = [...new Set(activities.map(a => a.term))];
  
  // Use requested term to determine export type, not just available activities
  let isMidtermOnly, isFinalTermOnly, isAllTerms;
  
  if (requestedTerm === 'Midterm') {
    isMidtermOnly = true;
    isFinalTermOnly = false;
    isAllTerms = false;
  } else if (requestedTerm === 'Finalterm') {
    isMidtermOnly = false;
    isFinalTermOnly = true;
    isAllTerms = false;
  } else if (!requestedTerm || requestedTerm === '' || requestedTerm === 'All Terms') {
    // For "All Terms", always use all terms format regardless of available data
    isMidtermOnly = false;
    isFinalTermOnly = false;
    isAllTerms = true;
  } else {
    // Fallback to activity-based detection
    isMidtermOnly = terms.length === 1 && terms[0] === 'Midterm';
    isFinalTermOnly = terms.length === 1 && terms[0] === 'Finalterm';
    isAllTerms = terms.length > 1;
  }
  
  console.log('[buildSheetData] Requested term:', requestedTerm);
  console.log('[buildSheetData] Terms found in activities:', terms);
  console.log('[buildSheetData] Export type - Midterm only:', isMidtermOnly, 'Final only:', isFinalTermOnly, 'All terms:', isAllTerms);

  // Get grading schema weights
  const gradingSchema = section.gradingSchema || {};
  const csWeight = gradingSchema.classStanding || 0;
  const labWeight = gradingSchema.laboratory || 0;
  const moWeight = gradingSchema.majorOutput || 0;
  const subjectHasLab = labWeight > 0;

  const headerColorRanges = [
    { start: 0, end: baseColumns, color: { red: 0.82, green: 0.82, blue: 0.82 } },
  ];

  const categoryConfigs = [
    { label: 'Class Standing', activities: classStandingActivities, color: { red: 1, green: 0.93, blue: 0.47 } },
    { label: 'Laboratory', activities: laboratoryActivities, color: { red: 0.68, green: 0.88, blue: 0.65 } },
    { label: 'Major Output', activities: majorOutputActivities, color: { red: 0.86, green: 0.78, blue: 0.93 } },
  ];

  let columnCursor = baseColumns;
  const allActs = [];

  for (const cfg of categoryConfigs) {
    if (!cfg.activities.length) continue;
    const start = columnCursor;
    cfg.activities.forEach((activity, idx) => {
      headerRows.category.push(idx === 0 ? cfg.label : '');
      headerRows.index.push(String(idx + 1));
      const activityLabel = activity.title || 'Activity ' + (idx + 1);
      headerRows.title.push(activityLabel);
      headerRows.maxScores.push(String(activity.maxScore ?? 100));
      allActs.push(activity);
      columnCursor += 1;
    });
    headerColorRanges.push({ start, end: columnCursor, color: cfg.color });
  }

  // Add grade columns to headers after activities
  if (isMidtermOnly) {
    if (subjectHasLab) {
      headerRows.category.push('Midterm', '', '', '');
      headerRows.index.push('CS', 'LAB', 'MO', 'FG');
      headerRows.title.push(`${csWeight}%`, `${labWeight}%`, `${moWeight}%`, '');
      headerRows.maxScores.push('', '', '', '');
      columnCursor += 4;
      headerColorRanges.push({ start: columnCursor - 4, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    } else {
      headerRows.category.push('Midterm', '', '');
      headerRows.index.push('CS', 'MO', 'FG');
      headerRows.title.push(`${csWeight}%`, `${moWeight}%`, '');
      headerRows.maxScores.push('', '', '');
      columnCursor += 3;
      headerColorRanges.push({ start: columnCursor - 3, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    }
  } else if (isFinalTermOnly) {
    if (subjectHasLab) {
      headerRows.category.push('Finalterm', '', '', '');
      headerRows.index.push('CS', 'LAB', 'MO', 'FG');
      headerRows.title.push(`${csWeight}%`, `${labWeight}%`, `${moWeight}%`, '');
      headerRows.maxScores.push('', '', '', '');
      columnCursor += 4;
      headerColorRanges.push({ start: columnCursor - 4, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    } else {
      headerRows.category.push('Finalterm', '', '');
      headerRows.index.push('CS', 'MO', 'FG');
      headerRows.title.push(`${csWeight}%`, `${moWeight}%`, '');
      headerRows.maxScores.push('', '', '');
      columnCursor += 3;
      headerColorRanges.push({ start: columnCursor - 3, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    }
  } else if (isAllTerms) {
    headerRows.category.push('Final Grade', '', '');
    headerRows.index.push('MTG', 'FTG', 'FG');
    headerRows.title.push('40%', '60%', '');
    headerRows.maxScores.push('', '', '');
    columnCursor += 3;
    headerColorRanges.push({ start: columnCursor - 3, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
  }

  const studentRows = section.students.map((student, idx) => {
    const row = ['', '', String(idx + 1), student.studid || '', student.fullName || ''];
    
    // Add activity scores
    for (const a of allActs) {
      const sMap = scoresByStudent[String(student._id)] || {};
      const score = sMap[String(a._id)];
      // Show blank for missing/undefined/null scores, not zero
      if (score === undefined || score === null || score === '' || score === 0) {
        row.push('');
      } else {
        row.push(String(Number(score)));
      }
    }
    
    // Add grade calculations based on term
    if (isMidtermOnly) {
      // Calculate midterm component averages (as percentages)
      const midtermCS = avgFor(classStandingActivities, student, scoresByStudent);
      const midtermLab = subjectHasLab ? avgFor(laboratoryActivities, student, scoresByStudent) : '';
      const midtermMO = avgFor(majorOutputActivities, student, scoresByStudent);
      
      // Calculate grades if we have at least CS and MO (required components)
      const hasMinimumComponents = midtermCS !== '' && midtermMO !== '';
      
      if (hasMinimumComponents) {
        // Convert component percentages to grade equivalents (round first)
        const csGrade = percentToGrade(Math.round(midtermCS));
        const labGrade = (subjectHasLab && midtermLab !== '') ? percentToGrade(Math.round(midtermLab)) : 0;
        const moGrade = percentToGrade(Math.round(midtermMO));
        
        // Calculate final midterm grade using custom grading schema (round result)
        let midtermGrade;
        if (subjectHasLab && midtermLab !== '') {
          // Has lab and lab score exists
          midtermGrade = Math.round((midtermCS * csWeight / 100) + (midtermLab * labWeight / 100) + (midtermMO * moWeight / 100));
          const finalGrade = percentToGrade(midtermGrade);
          row.push(csGrade.toFixed(2), labGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(2));
        } else if (subjectHasLab && midtermLab === '') {
          // Has lab but no lab score - redistribute lab weight proportionally
          const redistributedWeight = labWeight;
          const adjustedCSWeight = csWeight + (redistributedWeight * csWeight / (csWeight + moWeight));
          const adjustedMOWeight = moWeight + (redistributedWeight * moWeight / (csWeight + moWeight));
          midtermGrade = Math.round((midtermCS * adjustedCSWeight / 100) + (midtermMO * adjustedMOWeight / 100));
          const finalGrade = percentToGrade(midtermGrade);
          row.push(csGrade.toFixed(2), '', moGrade.toFixed(2), finalGrade.toFixed(2));
        } else {
          // No lab subject - use standard weights
          midtermGrade = Math.round((midtermCS * csWeight / 100) + (midtermMO * moWeight / 100));
          const finalGrade = percentToGrade(midtermGrade);
          row.push(csGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(2));
        }
      } else {
        // Show individual components but no final grade (round before converting)
        if (subjectHasLab) {
          row.push(
            midtermCS !== '' ? percentToGrade(Math.round(midtermCS)).toFixed(2) : '', 
            midtermLab !== '' ? percentToGrade(Math.round(midtermLab)).toFixed(2) : '', 
            midtermMO !== '' ? percentToGrade(Math.round(midtermMO)).toFixed(2) : '', 
            ''
          );
        } else {
          row.push(
            midtermCS !== '' ? percentToGrade(Math.round(midtermCS)).toFixed(2) : '', 
            midtermMO !== '' ? percentToGrade(Math.round(midtermMO)).toFixed(2) : '', 
            ''
          );
        }
      }
      
    } else if (isFinalTermOnly) {
      // Calculate final term component averages (as percentages)
      const finalCS = avgFor(classStandingActivities, student, scoresByStudent);
      const finalLab = subjectHasLab ? avgFor(laboratoryActivities, student, scoresByStudent) : '';
      const finalMO = avgFor(majorOutputActivities, student, scoresByStudent);
      
      // Calculate grades if we have at least CS and MO (required components)
      const hasMinimumComponents = finalCS !== '' && finalMO !== '';
      
      if (hasMinimumComponents) {
        // Convert component percentages to grade equivalents (round first)
        const csGrade = percentToGrade(Math.round(finalCS));
        const labGrade = (subjectHasLab && finalLab !== '') ? percentToGrade(Math.round(finalLab)) : 0;
        const moGrade = percentToGrade(Math.round(finalMO));
        
        // Calculate final term grade using custom grading schema (round result)
        let finalTermGrade;
        if (subjectHasLab && finalLab !== '') {
          // Has lab and lab score exists
          finalTermGrade = Math.round((finalCS * csWeight / 100) + (finalLab * labWeight / 100) + (finalMO * moWeight / 100));
          const finalGrade = percentToGrade(finalTermGrade);
          row.push(csGrade.toFixed(2), labGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(2));
        } else if (subjectHasLab && finalLab === '') {
          // Has lab but no lab score - redistribute lab weight proportionally
          const redistributedWeight = labWeight;
          const adjustedCSWeight = csWeight + (redistributedWeight * csWeight / (csWeight + moWeight));
          const adjustedMOWeight = moWeight + (redistributedWeight * moWeight / (csWeight + moWeight));
          finalTermGrade = Math.round((finalCS * adjustedCSWeight / 100) + (finalMO * adjustedMOWeight / 100));
          const finalGrade = percentToGrade(finalTermGrade);
          row.push(csGrade.toFixed(2), '', moGrade.toFixed(2), finalGrade.toFixed(2));
        } else {
          // No lab subject - use standard weights
          finalTermGrade = Math.round((finalCS * csWeight / 100) + (finalMO * moWeight / 100));
          const finalGrade = percentToGrade(finalTermGrade);
          row.push(csGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(2));
        }
      } else {
        // Show individual components but no final grade (round before converting)
        if (subjectHasLab) {
          row.push(
            finalCS !== '' ? percentToGrade(Math.round(finalCS)).toFixed(2) : '', 
            finalLab !== '' ? percentToGrade(Math.round(finalLab)).toFixed(2) : '', 
            finalMO !== '' ? percentToGrade(Math.round(finalMO)).toFixed(2) : '', 
            ''
          );
        } else {
          row.push(
            finalCS !== '' ? percentToGrade(Math.round(finalCS)).toFixed(2) : '', 
            finalMO !== '' ? percentToGrade(Math.round(finalMO)).toFixed(2) : '', 
            ''
          );
        }
      }
      
    } else if (isAllTerms) {
      // Calculate final grade (midterm + final term)
      const midtermActivities = activities.filter(a => a.term === 'Midterm');
      const finalTermActivities = activities.filter(a => a.term === 'Finalterm');
      
      const midtermCS = avgFor(midtermActivities.filter(a => a.category === 'classStanding'), student, scoresByStudent);
      const midtermLab = subjectHasLab ? avgFor(midtermActivities.filter(a => a.category === 'laboratory'), student, scoresByStudent) : 0;
      const midtermMO = avgFor(midtermActivities.filter(a => a.category === 'majorOutput'), student, scoresByStudent);
      
      const finalCS = avgFor(finalTermActivities.filter(a => a.category === 'classStanding'), student, scoresByStudent);
      const finalLab = subjectHasLab ? avgFor(finalTermActivities.filter(a => a.category === 'laboratory'), student, scoresByStudent) : 0;
      const finalMO = avgFor(finalTermActivities.filter(a => a.category === 'majorOutput'), student, scoresByStudent);
      
      let midtermGrade, finalTermGrade;
      if (subjectHasLab) {
        midtermGrade = Math.round((midtermCS * csWeight / 100) + (midtermLab * labWeight / 100) + (midtermMO * moWeight / 100));
        finalTermGrade = Math.round((finalCS * csWeight / 100) + (finalLab * labWeight / 100) + (finalMO * moWeight / 100));
      } else {
        midtermGrade = Math.round((midtermCS * csWeight / 100) + (midtermMO * moWeight / 100));
        finalTermGrade = Math.round((finalCS * csWeight / 100) + (finalMO * moWeight / 100));
      }
      
      // Calculate final grade using proper BukSU algorithm
      // Step 1: Convert term percentages to equivalent grades
      const midtermEquivalent = percentToGrade(midtermGrade);
      const finalEquivalent = percentToGrade(finalTermGrade);
      
      // Step 2: Calculate weighted average of equivalent grades (40%/60%)
      const finalGradeNumeric = (midtermEquivalent * 0.40) + (finalEquivalent * 0.60);
      
      // Step 3: Final grade is the weighted average
      const finalGrade = finalGradeNumeric;
      const remarks = finalGrade <= 3.00 ? 'Passed' : 'Failed';
      
      // Convert term grades to grade equivalents for display
      const mtgEquivalent = midtermEquivalent;
      const ftgEquivalent = finalEquivalent;
      
      // Show all as grade equivalents
      row.push(mtgEquivalent.toFixed(2), ftgEquivalent.toFixed(2), finalGrade.toFixed(2));
    }
    
    return row;
  });

  const tableHeaderRows = [headerRows.category, headerRows.index, headerRows.title, headerRows.maxScores];
  const allData = [...headerData, ...sectionInfo, ...tableHeaderRows, ...studentRows];

  return {
    allData,
    tableHeaderRows,
    headerColorRanges,
    baseColumns,
    totalColumns: headerRows.category.length,
    classStandingActivities,
    laboratoryActivities,
    majorOutputActivities,
    allActs,
  };
};

export const persistGrades = async (section, activities, scoresByStudent, instructorId) => {
  // Group activities by term and category
  const midtermActivities = activities.filter((a) => a.term === 'Midterm');
  const finalTermActivities = activities.filter((a) => a.term === 'Finalterm');
  
  const midtermCS = midtermActivities.filter((a) => a.category === 'classStanding');
  const midtermLab = midtermActivities.filter((a) => a.category === 'laboratory');
  const midtermMO = midtermActivities.filter((a) => a.category === 'majorOutput');
  
  const finalCS = finalTermActivities.filter((a) => a.category === 'classStanding');
  const finalLab = finalTermActivities.filter((a) => a.category === 'laboratory');
  const finalMO = finalTermActivities.filter((a) => a.category === 'majorOutput');

  const results = await Promise.allSettled(
    section.students.map(async (student) => {
      // Calculate midterm component averages
      const midtermClassStanding = avgFor(midtermCS, student, scoresByStudent);
      const midtermLaboratory = subjectHasLab ? avgFor(midtermLab, student, scoresByStudent) : '';
      const midtermMajorOutput = avgFor(midtermMO, student, scoresByStudent);
      
      // Calculate final term component averages
      const finalClassStanding = avgFor(finalCS, student, scoresByStudent);
      const finalLaboratory = subjectHasLab ? avgFor(finalLab, student, scoresByStudent) : '';
      const finalMajorOutput = avgFor(finalMO, student, scoresByStudent);
      
      // Check if we have sufficient components for term grade calculations (at least CS and MO)
      const hasMidtermComponents = midtermClassStanding !== '' && midtermMajorOutput !== '';
      const hasFinalComponents = finalClassStanding !== '' && finalMajorOutput !== '';
      
      // Calculate term grades if minimum components are available
      let midtermGrade = '', finalTermGrade = '', finalPercent = '', finalGradeNumeric = '';
      let equivalentGrade = '', remarks = '';
      
      if (hasMidtermComponents) {
        if (subjectHasLab && midtermLaboratory !== '') {
          // Has lab and lab score exists
          midtermGrade = (midtermClassStanding * csWeight / 100) + (midtermLaboratory * labWeight / 100) + (midtermMajorOutput * moWeight / 100);
        } else if (subjectHasLab && midtermLaboratory === '') {
          // Has lab but no lab score - redistribute lab weight proportionally
          const redistributedWeight = labWeight;
          const adjustedCSWeight = csWeight + (redistributedWeight * csWeight / (csWeight + moWeight));
          const adjustedMOWeight = moWeight + (redistributedWeight * moWeight / (csWeight + moWeight));
          midtermGrade = (midtermClassStanding * adjustedCSWeight / 100) + (midtermMajorOutput * adjustedMOWeight / 100);
        } else {
          // No lab subject - use standard weights
          midtermGrade = (midtermClassStanding * csWeight / 100) + (midtermMajorOutput * moWeight / 100);
        }
      }
      
      if (hasFinalComponents) {
        if (subjectHasLab && finalLaboratory !== '') {
          // Has lab and lab score exists
          finalTermGrade = (finalClassStanding * csWeight / 100) + (finalLaboratory * labWeight / 100) + (finalMajorOutput * moWeight / 100);
        } else if (subjectHasLab && finalLaboratory === '') {
          // Has lab but no lab score - redistribute lab weight proportionally
          const redistributedWeight = labWeight;
          const adjustedCSWeight = csWeight + (redistributedWeight * csWeight / (csWeight + moWeight));
          const adjustedMOWeight = moWeight + (redistributedWeight * moWeight / (csWeight + moWeight));
          finalTermGrade = (finalClassStanding * adjustedCSWeight / 100) + (finalMajorOutput * adjustedMOWeight / 100);
        } else {
          // No lab subject - use standard weights
          finalTermGrade = (finalClassStanding * csWeight / 100) + (finalMajorOutput * moWeight / 100);
        }
      }
      
      // Calculate final grade only if both terms have grades using proper BukSU algorithm
      if (midtermGrade !== '' && finalTermGrade !== '') {
        // Step 1: Convert term percentages to equivalent grades
        const midtermEquivalent = percentToGrade(midtermGrade);
        const finalEquivalent = percentToGrade(finalTermGrade);
        
        // Step 2: Calculate weighted average of equivalent grades (40%/60%)
        finalGradeNumeric = (midtermEquivalent * 0.40) + (finalEquivalent * 0.60);
        equivalentGrade = finalGradeNumeric;
        remarks = finalGradeNumeric <= 3.00 ? 'Passed' : 'Failed';
        
        // Keep finalPercent for reference (though not used in final calculation)
        finalPercent = (midtermGrade * 0.40) + (finalTermGrade * 0.60);
      }
      
      // Convert term grades to equivalent grades for student display
      const midtermEquivalentGrade = midtermGrade !== '' ? percentToGrade(midtermGrade) : '';
      const finalTermEquivalentGrade = finalTermGrade !== '' ? percentToGrade(finalTermGrade) : '';
      
      // Calculate overall averages only if components exist
      const classStandingAvg = (midtermClassStanding !== '' && finalClassStanding !== '') 
        ? (midtermClassStanding * 0.40) + (finalClassStanding * 0.60) : '';
      const laboratoryAvg = (subjectHasLab && midtermLaboratory !== '' && finalLaboratory !== '') 
        ? (midtermLaboratory * 0.40) + (finalLaboratory * 0.60) : '';
      const majorOutputAvg = (midtermMajorOutput !== '' && finalMajorOutput !== '') 
        ? (midtermMajorOutput * 0.40) + (finalMajorOutput * 0.60) : '';

      return Grade.findOneAndUpdate(
        { student: student._id, section: section._id },
        {
          // Term grades (percentages) - null if blank
          midtermGrade: midtermGrade === '' ? null : midtermGrade,
          finalTermGrade: finalTermGrade === '' ? null : finalTermGrade,
          
          // Equivalent grades for student display - empty string if blank
          midtermEquivalentGrade: midtermEquivalentGrade === '' ? '' : midtermEquivalentGrade,
          finalTermEquivalentGrade: finalTermEquivalentGrade === '' ? '' : finalTermEquivalentGrade,
          equivalentGrade: equivalentGrade === '' ? '' : equivalentGrade,
          
          // Term component averages - null if blank
          midtermClassStanding: midtermClassStanding === '' ? null : midtermClassStanding,
          midtermLaboratory: midtermLaboratory === '' ? null : midtermLaboratory,
          midtermMajorOutput: midtermMajorOutput === '' ? null : midtermMajorOutput,
          finalClassStanding: finalClassStanding === '' ? null : finalClassStanding,
          finalLaboratory: finalLaboratory === '' ? null : finalLaboratory,
          finalMajorOutput: finalMajorOutput === '' ? null : finalMajorOutput,
          
          // Overall averages (compatibility) - null if blank
          classStanding: classStandingAvg === '' ? null : classStandingAvg,
          laboratory: laboratoryAvg === '' ? null : laboratoryAvg,
          majorOutput: majorOutputAvg === '' ? null : majorOutputAvg,
          
          // Final results - null/empty if blank
          finalGrade: finalGradeNumeric === '' ? null : finalGradeNumeric,
          remarks: remarks === '' ? '' : remarks,
          hasLaboratory: subjectHasLab,
          encodedBy: instructorId,
          dateRecorded: new Date(),
        },
        { upsert: true, new: true }
      );
    })
  );

  const failed = results.filter((r) => r.status === 'rejected');
  return { success: true, failedCount: failed.length };
};

// Build final grade sheet data based on the exact HYBRID-FLEXIBLE LEARNING GRADE SHEET screenshot design
export const buildFinalGradeSheet = (section, activities, scoresByStudent, schedule) => {
  // Header section exactly as shown in screenshot
  const headerData = [
    ['', '', '', '', '', '', 'BUKIDNON STATE UNIVERSITY'],
    ['', '', '', '', '', '', 'Malaybalay City, Bukidnon 8700'],
    ['', '', '', '', '=HYPERLINK("http://www.buksu.edu.ph", "Tel (088) 813-5661 to 5663; Telefax (088) 813-2717; www.buksu.edu.ph")'],
    [],
    ['', '', '', '', '', '', 'HYBRID-FLEXIBLE LEARNING GRADE SHEET'],
    [],
  ];

  // Section information exactly as shown in screenshot with proper table layout and column positioning
  const sectionInfo = [
    ['Section Code:', '', '', '', section.sectionCode || section.sectionName, '', 'Unit(s):', (section.subject?.units).toString()],
    ['Subject Code:', '', '', '', section.subject?.subjectCode , '', 'Day/Time:', `${schedule.day}, ${schedule.time}`],
    ['Course Description:', '', '', '', section.subject?.subjectName , '', 'Room:', schedule.room || 'Lab 3'],
    ['Semester/School Year:', '', '', '', `${section.term} Semester/${section.schoolYear}`],
  ];

  // Get grading schema weights with proper defaults
  const gradingSchema = section.gradingSchema || {};
  
  // Determine if subject has laboratory based on schema
  const subjectHasLab = Boolean(gradingSchema.laboratory && Number(gradingSchema.laboratory) > 0);
  
  // Set defaults based on whether subject has laboratory
  let csWeight, labWeight, moWeight;
  if (subjectHasLab) {
    // Laboratory subject defaults: CS=30%, LAB=30%, MO=40%
    csWeight = gradingSchema.classStanding || 30;
    labWeight = gradingSchema.laboratory || 30;
    moWeight = gradingSchema.majorOutput || 40;
  } else {
    // Non-laboratory subject defaults: CS=60%, LAB=0%, MO=40%
    csWeight = gradingSchema.classStanding || 60;
    labWeight = 0;
    moWeight = gradingSchema.majorOutput || 40;
  }
  
  // Handle weights based on whether subject has lab

  // Group activities by term
  const midtermActivities = activities.filter(a => a.term === 'Midterm');
  const finalTermActivities = activities.filter(a => a.term === 'Finalterm');
  
  // Base student info columns  
  const baseHeaders = ['No.', 'Student No.', 'Name of Students'];
  
  // Midterm section headers - always include LAB column
  const midtermHeaders = [`CS (${csWeight}%)`, `LAB (${labWeight}%)`, `MO (${moWeight}%)`, 'MTG'];

  // Finalterm section headers - always include LAB column  
  const finaltermHeaders = [`CS (${csWeight}%)`, `LAB (${labWeight}%)`, `MO (${moWeight}%)`, 'FTG'];

  // Final Grade section headers
  const finalGradeHeaders = ['MTG(40%)', 'FTG(60%)', 'FG', 'Remarks'];

  // Build the category row (Midterm, Finalterm, Final Grade)
  const categoryRow = ['', '', ''];  // Empty cells for base columns
  
  // Add "Midterm" category
  categoryRow.push('Midterm');
  for (let i = 1; i < midtermHeaders.length; i++) {
    categoryRow.push('');
  }
  
  // Add "Finalterm" category  
  categoryRow.push('Finalterm');
  for (let i = 1; i < finaltermHeaders.length; i++) {
    categoryRow.push('');
  }
  
  // Add "Final Grade" category
  categoryRow.push('Final Grade');
  for (let i = 1; i < finalGradeHeaders.length; i++) {
    categoryRow.push('');
  }

  // Build the complete headers row
  const completeHeaders = [
    ...baseHeaders,
    ...midtermHeaders,
    ...finaltermHeaders, 
    ...finalGradeHeaders
  ];

  // Define color ranges for different sections
  const screenshotHeaderColorRanges2 = [
    { start: 0, end: 3, color: { red: 0.82, green: 0.82, blue: 0.82 } }, // Base columns
    { start: 3, end: 3 + midtermHeaders.length, color: { red: 1, green: 0.93, blue: 0.47 } }, // Midterm (yellow)
    { start: 3 + midtermHeaders.length, end: 3 + midtermHeaders.length + finaltermHeaders.length, color: { red: 0.68, green: 0.88, blue: 0.65 } }, // Finalterm (green)
    { start: 3 + midtermHeaders.length + finaltermHeaders.length, end: completeHeaders.length, color: { red: 0.86, green: 0.78, blue: 0.93 } }, // Final Grade (purple)
  ];

  // Student data rows matching HYBRID-FLEXIBLE LEARNING GRADE SHEET format
  const studentRows = section.students.map((student, idx) => {
    // Calculate midterm component averages
    const midtermCS = avgFor(midtermActivities.filter(a => a.category === 'classStanding'), student, scoresByStudent);
    const midtermLab = subjectHasLab ? avgFor(midtermActivities.filter(a => a.category === 'laboratory'), student, scoresByStudent) : 0;
    const midtermMO = avgFor(midtermActivities.filter(a => a.category === 'majorOutput'), student, scoresByStudent);
    
    // Calculate finalterm component averages
    const finaltermCS = avgFor(finalTermActivities.filter(a => a.category === 'classStanding'), student, scoresByStudent);
    const finaltermLab = subjectHasLab ? avgFor(finalTermActivities.filter(a => a.category === 'laboratory'), student, scoresByStudent) : 0;
    const finaltermMO = avgFor(finalTermActivities.filter(a => a.category === 'majorOutput'), student, scoresByStudent);
    
    // Debug logging
    console.log(`\n[Final Grade Debug] Student: ${student.fullName}`);
    console.log(`  Midterm Activities: ${midtermActivities.length} (CS:${midtermActivities.filter(a => a.category === 'classStanding').length}, LAB:${midtermActivities.filter(a => a.category === 'laboratory').length}, MO:${midtermActivities.filter(a => a.category === 'majorOutput').length})`);
    console.log(`  Finalterm Activities: ${finalTermActivities.length} (CS:${finalTermActivities.filter(a => a.category === 'classStanding').length}, LAB:${finalTermActivities.filter(a => a.category === 'laboratory').length}, MO:${finalTermActivities.filter(a => a.category === 'majorOutput').length})`);
    console.log(`  Midterm Scores: CS=${midtermCS}%, LAB=${midtermLab}%, MO=${midtermMO}%`);
    console.log(`  Finalterm Scores: CS=${finaltermCS}%, LAB=${finaltermLab}%, MO=${finaltermMO}%`);
    console.log(`  Subject Has Lab: ${subjectHasLab}, Weights: CS=${csWeight}%, LAB=${labWeight}%, MO=${moWeight}%`);
    
    // Enhanced debug for component conversion
    if (finaltermCS !== '') console.log(`  FT CS: ${finaltermCS}% → Grade: ${percentToGrade(finaltermCS)}`);
    if (finaltermLab !== '') console.log(`  FT LAB: ${finaltermLab}% → Grade: ${percentToGrade(finaltermLab)}`);
    if (finaltermMO !== '') console.log(`  FT MO: ${finaltermMO}% → Grade: ${percentToGrade(finaltermMO)}`);
    
    // More flexible calculation - require at least one component
    const hasMidtermData = midtermCS !== '' || (subjectHasLab && midtermLab !== '') || midtermMO !== '';
    const hasFinaltermData = finaltermCS !== '' || (subjectHasLab && finaltermLab !== '') || finaltermMO !== '';
    
    console.log(`  Has Midterm Data: ${hasMidtermData}, Has Finalterm Data: ${hasFinaltermData}`);
    
    let midtermGrade = '', finaltermGrade = '', finalPercent = '', finalGrade = '', remarks = '';
    
    // Calculate midterm grade with flexible component requirements
    if (hasMidtermData) {
      let totalWeight = 0;
      let weightedSum = 0;
      
      // Add CS score if available
      if (midtermCS !== '') {
        weightedSum += midtermCS * csWeight;
        totalWeight += csWeight;
      }
      
      // Add lab score if available (for lab subjects)
      if (subjectHasLab && midtermLab !== '') {
        weightedSum += midtermLab * labWeight;
        totalWeight += labWeight;
      }
      
      // Add MO score if available
      if (midtermMO !== '') {
        weightedSum += midtermMO * moWeight;
        totalWeight += moWeight;
      }
      
      // Calculate grade if we have any components
      if (totalWeight > 0) {
        midtermGrade = Math.round(weightedSum / totalWeight);
        console.log(`  → MTG Percentage (rounded): ${midtermGrade}%`);
      }
    }
    
    // Calculate finalterm grade with flexible component requirements
    if (hasFinaltermData) {
      let totalWeight = 0;
      let weightedSum = 0;
      
      console.log(`\n[FTG CALCULATION START] Student: ${student.fullName}`);
      
      // Add CS score if available
      if (finaltermCS !== '') {
        const contribution = finaltermCS * csWeight;
        weightedSum += contribution;
        totalWeight += csWeight;
        console.log(`  ✓ CS: ${finaltermCS}% × ${csWeight}% = ${contribution.toFixed(2)}`);
      } else {
        console.log(`  ✗ CS: Not available (skipping)`);
      }
      
      // Add lab score if available (for lab subjects)
      if (subjectHasLab && finaltermLab !== '') {
        const contribution = finaltermLab * labWeight;
        weightedSum += contribution;
        totalWeight += labWeight;
        console.log(`  ✓ LAB: ${finaltermLab}% × ${labWeight}% = ${contribution.toFixed(2)}`);
      } else if (subjectHasLab) {
        console.log(`  ✗ LAB: Not available (skipping)`);
      } else {
        console.log(`  ✗ LAB: Not a lab subject (skipping)`);
      }
      
      // Add MO score if available
      if (finaltermMO !== '') {
        const contribution = finaltermMO * moWeight;
        weightedSum += contribution;
        totalWeight += moWeight;
        console.log(`  ✓ MO: ${finaltermMO}% × ${moWeight}% = ${contribution.toFixed(2)}`);
      } else {
        console.log(`  ✗ MO: Not available (skipping)`);
      }
      
      // Calculate grade if we have any components
      if (totalWeight > 0) {
        finaltermGrade = Math.round(weightedSum / totalWeight);
        console.log(`  → Weighted Sum: ${weightedSum.toFixed(2)}`);
        console.log(`  → Total Weight: ${totalWeight}%`);
        console.log(`  → FTG Percentage (raw): ${(weightedSum / totalWeight).toFixed(2)}%`);
        console.log(`  → FTG Percentage (rounded): ${finaltermGrade}%`);
        console.log(`  → FTG Grade Equivalent: ${percentToGrade(finaltermGrade).toFixed(2)}`);
      } else {
        console.log(`  → No components available for FTG calculation`);
      }
    }
    
    // Calculate final grade with flexible requirements using proper BukSU algorithm
    if (midtermGrade !== '' && finaltermGrade !== '') {
      // Both terms available - use proper BukSU algorithm
      // Step 1: Convert term percentages to equivalent grades (Table 1)
      const midtermEquivalent = percentToGrade(midtermGrade);
      const finaltermEquivalent = percentToGrade(finaltermGrade);
      
      // Step 2: Calculate weighted average of equivalent grades (40%/60%)
      const finalGradeNumeric = (midtermEquivalent * 0.4) + (finaltermEquivalent * 0.6);
      
      // Step 3: Convert to final equivalent grade (Table 3) - for now use same conversion
      finalGrade = finalGradeNumeric; // Will be properly rounded when displayed
      finalPercent = midtermGrade * 0.4 + finaltermGrade * 0.6; 
      remarks = finalGrade <= 3.00 ? 'Passed' : 'Failed';
    } else if (midtermGrade !== '' && finaltermGrade === '') {
      // Only midterm available - use midterm grade equivalent as basis
      finalGrade = percentToGrade(midtermGrade);
      remarks = finalGrade <= 3.00 ? 'Incomplete' : 'Failed';
      finalPercent = midtermGrade;
      console.log(`[FINAL CALC] Midterm only - Grade: ${finalGrade}, Remarks: ${remarks}`);
    } else if (midtermGrade === '' && finaltermGrade !== '') {
      // Only finalterm available - use finalterm grade equivalent as basis
      finalGrade = percentToGrade(finaltermGrade);
      remarks = finalGrade <= 3.00 ? 'Incomplete' : 'Failed';
      finalPercent = finaltermGrade;
    } else {
      console.log(`[FINAL CALC] No grades available for final calculation`);
    }
    
    console.log(`\n[ROW BUILD] Building row for student: ${student.fullName}`);
    console.log(`[ROW BUILD] Final values - MTG: ${midtermGrade !== '' ? percentToGrade(midtermGrade).toFixed(2) : 'BLANK'}, FTG: ${finaltermGrade !== '' ? percentToGrade(finaltermGrade).toFixed(2) : 'BLANK'}, FG: ${finalGrade !== '' ? finalGrade.toFixed(2) : 'BLANK'}`);
    
    // Build row data exactly as shown in screenshot
    const row = [String(idx + 1), student.studid || '', student.fullName || ''];
    
    // Add midterm data - convert component scores to grade equivalents (round percentages first)
    row.push(
      midtermCS !== '' ? percentToGrade(Math.round(midtermCS)).toFixed(2) : '', // Round then convert to grade
      (subjectHasLab && midtermLab !== '') ? percentToGrade(Math.round(midtermLab)).toFixed(2) : '', // Round then convert to grade
      midtermMO !== '' ? percentToGrade(Math.round(midtermMO)).toFixed(2) : '', // Round then convert to grade
      midtermGrade !== '' ? percentToGrade(midtermGrade).toFixed(2) : '' // Already rounded in calculation
    );
    
    // Add finalterm data - convert component scores to grade equivalents (round percentages first)
    row.push(
      finaltermCS !== '' ? percentToGrade(Math.round(finaltermCS)).toFixed(2) : '', // Round then convert to grade
      (subjectHasLab && finaltermLab !== '') ? percentToGrade(Math.round(finaltermLab)).toFixed(2) : '', // Round then convert to grade
      finaltermMO !== '' ? percentToGrade(Math.round(finaltermMO)).toFixed(2) : '', // Round then convert to grade
      finaltermGrade !== '' ? percentToGrade(finaltermGrade).toFixed(2) : '' // Already rounded in calculation
    );
    
    // Add final grade data: MTG(40%), FTG(60%), FG, Remarks
    row.push(
      midtermGrade !== '' ? percentToGrade(midtermGrade).toFixed(2) : '', // MTG(40%)
      finaltermGrade !== '' ? percentToGrade(finaltermGrade).toFixed(2) : '', // FTG(60%) 
      finalGrade !== '' ? finalGrade.toFixed(2) : '', // FG
      remarks // Remarks
    );
    
    return row;
  });

  const tableHeaderRows = [categoryRow, completeHeaders];
  const allData = [...headerData, ...sectionInfo, ...tableHeaderRows, ...studentRows];

  return {
    allData,
    headerData,
    sectionInfo,
    tableHeaderRows,
    headerColorRanges: screenshotHeaderColorRanges2,
    baseColumns: 3,
    totalColumns: completeHeaders.length,
    hasLaboratory: subjectHasLab
  };
};

export const updateSectionMetadata = async (sectionId, schedule, spreadsheetMetadata, termKey = 'allterms') => {
  try {
    const metadataPrefix = 'exportMetadata_' + termKey;
    const updateSet = {
      'schedule.day': schedule.day,
      'schedule.time': schedule.time,
      'schedule.room': schedule.room,
      'chairperson': schedule.chairperson,
      'dean': schedule.dean,
    };
    
    updateSet[metadataPrefix + '.spreadsheetId'] = spreadsheetMetadata.spreadsheetId;
    updateSet[metadataPrefix + '.folderId'] = spreadsheetMetadata.folderId || null;
    updateSet[metadataPrefix + '.sheetId'] = spreadsheetMetadata.sheetId;
    updateSet[metadataPrefix + '.sheetTitle'] = spreadsheetMetadata.sheetTitle;
    updateSet[metadataPrefix + '.usedFallbackHub'] = spreadsheetMetadata.usedFallbackHub;
    updateSet[metadataPrefix + '.spreadsheetTitle'] = spreadsheetMetadata.spreadsheetTitle;
    updateSet[metadataPrefix + '.spreadsheetUrl'] = spreadsheetMetadata.spreadsheetUrl;
    updateSet[metadataPrefix + '.lastExportedAt'] = new Date();
    
    await Section.findByIdAndUpdate(
      sectionId,
      { $set: updateSet },
      { new: false }
    );
  } catch (err) {
    throw new HttpError(500, 'Failed to record export metadata', { cause: err?.message });
  }
};
