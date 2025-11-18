// services/sheetDataService.js
import Section from '../models/sections.js';
import Activity from '../models/activity.js';
import ActivityScore from '../models/activityScore.js';
import Grade from '../models/grades.js';
import { HttpError } from '../utils/googleSheetsHelpers.js';
import { percentToGrade, computeScoresByStudent, avgFor } from '../utils/gradeUtils.js';

export const toActivityTerm = (sectionTerm) => {
  const mapping = { '1st': 'First', '2nd': 'Second', Summer: 'Summer' };
  return mapping[sectionTerm] || sectionTerm;
};

export const loadSection = async (sectionId) => {
  try {
    const section = await Section.findById(sectionId)
      .populate('subject')
      .populate('instructor')
      .populate('students');
    if (!section) throw new HttpError(402, 'Section not found');
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
    
    // If a specific term is requested, filter by it
    // termFilter comes from frontend (Midterm, Finalterm, Summer, or empty for All Terms)
    if (termFilter && termFilter !== '') {
      query.term = termFilter;
    } else {
      // If no term filter or "All Terms", load activities from all terms (Midterm, Finalterm, Summer)
      // Do not set query.term - this will get all activities regardless of term
      // Optionally, you can explicitly specify: query.term = { $in: ['Midterm', 'Finalterm', 'Summer'] };
    }
    
    const activities = await Activity.find(query).sort({ createdAt: 1 });
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
    ['', '', 'BUKIDNON STATE UNIVERSITY'],
    ['', '', 'Malaybalay City, Bukidnon 8700'],
    ['', '', '=HYPERLINK("http://www.buksu.edu.ph", "Tel (088) 813-5661 to 5663; Telefax (088) 813-2717; www.buksu.edu.ph")'],
    [],
    ['', '', 'HYBRID-FLEXIBLE LEARNING GRADE SHEET'],
    [],
  ];

  const sectionInfo = [
    ['Section Code:', '', section.sectionCode || section.sectionName || 'N/A', 'Unit(s):', section.subject?.units ?? 3],
    ['Subject Code:', '', section.subject?.subjectCode || 'N/A', 'Day/Time:', `${schedule.day || 'TBA'}, ${schedule.time || 'TBA'}`],
    ['Course Description:', '', section.subject?.subjectName || 'N/A', 'Room:', schedule.room || 'TBA'],
    ['Semester/School Year:', '', (section.term || '') + ' Sem/' + (section.schoolYear || 'N/A')],
    [],
  ];

  // Detect if subject has laboratory
  const { laboratory: labWeight = 0 } = section.gradingSchema || {};
  const subjectHasLab = labWeight > 0;

  // Group activities by term
  const midtermActivities = activities.filter(a => a.term === 'Midterm');
  const finalTermActivities = activities.filter(a => a.term === 'Finalterm');

  // Build header structure for comprehensive grade sheet
  const baseHeaders = ['', 'No.', 'Student No.', 'Name of Students'];
  
  // Midterm section headers based on grading schema
  const midtermHeaders = [];
  if (subjectHasLab) {
    midtermHeaders.push('CS (30%)', 'LAB (30%)', 'MO (40%)', 'MTG');
  } else {
    midtermHeaders.push('CS (60%)', 'MO (40%)', 'MTG');
  }

  // Final term section headers based on grading schema
  const finalHeaders = [];
  if (subjectHasLab) {
    finalHeaders.push('CS (30%)', 'LAB (30%)', 'MO (40%)', 'FTG');
  } else {
    finalHeaders.push('CS (60%)', 'MO (40%)', 'FTG');
  }

  // Final grade section headers
  const finalGradeHeaders = ['MTG(40%)', 'FTG(60%)', 'FG'];

  // Combine all headers
  const completeHeaders = [
    ...baseHeaders,
    ...midtermHeaders,
    ...finalHeaders, 
    ...finalGradeHeaders
  ];

  // Create category row (showing Midterm, Finalterm, Final Grade sections)
  const categoryRow = ['', '', '', ''];
  
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
    
    // Calculate term grades
    let midtermGrade, finalTermGrade;
    if (subjectHasLab) {
      midtermGrade = (midtermCS * 0.30) + (midtermLab * 0.30) + (midtermMO * 0.40);
      finalTermGrade = (finalCS * 0.30) + (finalLab * 0.30) + (finalMO * 0.40);
    } else {
      midtermGrade = (midtermCS * 0.60) + (midtermMO * 0.40);
      finalTermGrade = (finalCS * 0.60) + (finalMO * 0.40);
    }
    
    // Calculate final grade
    const finalPercent = (midtermGrade * 0.40) + (finalTermGrade * 0.60);
    const finalGrade = percentToGrade(finalPercent);
    const remarks = finalPercent >= 75 ? 'Passed' : 'Failed';

    // Build row data
    const row = ['', String(idx + 1), student.studid || '', student.fullName || ''];
    
    // Add midterm data
    if (subjectHasLab) {
      row.push(midtermCS.toFixed(2), midtermLab.toFixed(2), midtermMO.toFixed(2), midtermGrade.toFixed(2));
    } else {
      row.push(midtermCS.toFixed(2), midtermMO.toFixed(2), midtermGrade.toFixed(2));
    }
    
    // Add final term data
    if (subjectHasLab) {
      row.push(finalCS.toFixed(2), finalLab.toFixed(2), finalMO.toFixed(2), finalTermGrade.toFixed(2));
    } else {
      row.push(finalCS.toFixed(2), finalMO.toFixed(2), finalTermGrade.toFixed(2));
    }
    
    // Add final grade data
    row.push(
      (midtermGrade * 0.40).toFixed(2), // MTG(40%) 
      (finalTermGrade * 0.60).toFixed(2), // FTG(60%)
      finalGrade.toFixed(2) // FG
    );
    
    return row;
  });

  const tableHeaderRows = [categoryRow, completeHeaders];
  const allData = [...headerData, ...sectionInfo, ...tableHeaderRows, ...studentRows];

  return {
    allData,
    tableHeaderRows,
    headerColorRanges: [
      { start: 0, end: 4, color: { red: 0.82, green: 0.82, blue: 0.82 } },
      { start: 4, end: 4 + midtermHeaders.length, color: { red: 1, green: 0.93, blue: 0.47 } },
      { start: 4 + midtermHeaders.length, end: 4 + midtermHeaders.length + finalHeaders.length, color: { red: 0.68, green: 0.88, blue: 0.65 } },
      { start: 4 + midtermHeaders.length + finalHeaders.length, end: completeHeaders.length, color: { red: 0.86, green: 0.78, blue: 0.93 } },
    ],
    baseColumns: 4,
    totalColumns: completeHeaders.length,
    hasLaboratory: subjectHasLab
  };
};


export const buildSheetData = (section, activities, scoresByStudent, schedule) => {
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
    ['', '', 'Semester:', '', (section.term || '') + ' Sem', '', '', '', 'Units:', section.subject?.units ?? 3],
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
  const isMidtermOnly = terms.length === 1 && terms[0] === 'Midterm';
  const isFinalTermOnly = terms.length === 1 && terms[0] === 'Finalterm';
  const isAllTerms = terms.length > 1;

  // Detect if subject has laboratory (move this earlier)
  const { laboratory: labWeight = 0 } = section.gradingSchema || {};
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
      headerRows.title.push('30%', '30%', '40%', '');
      headerRows.maxScores.push('', '', '', '');
      columnCursor += 4;
      headerColorRanges.push({ start: columnCursor - 4, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    } else {
      headerRows.category.push('Midterm', '', '');
      headerRows.index.push('CS', 'MO', 'FG');
      headerRows.title.push('60%', '40%', '');
      headerRows.maxScores.push('', '', '');
      columnCursor += 3;
      headerColorRanges.push({ start: columnCursor - 3, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    }
  } else if (isFinalTermOnly) {
    if (subjectHasLab) {
      headerRows.category.push('Finalterm', '', '', '');
      headerRows.index.push('CS', 'LAB', 'MO', 'FG');
      headerRows.title.push('30%', '30%', '40%', '');
      headerRows.maxScores.push('', '', '', '');
      columnCursor += 4;
      headerColorRanges.push({ start: columnCursor - 4, end: columnCursor, color: { red: 0.9, green: 0.9, blue: 1 } });
    } else {
      headerRows.category.push('Finalterm', '', '');
      headerRows.index.push('CS', 'MO', 'FG');
      headerRows.title.push('60%', '40%', '');
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
      row.push(String(Number(sMap[String(a._id)] || 0)));
    }
    
    // Add grade calculations based on term
    if (isMidtermOnly) {
      // Calculate midterm component averages and convert to grades
      const midtermCS = avgFor(classStandingActivities, student, scoresByStudent);
      const midtermLab = subjectHasLab ? avgFor(laboratoryActivities, student, scoresByStudent) : 0;
      const midtermMO = avgFor(majorOutputActivities, student, scoresByStudent);
      
      // Convert component percentages to grades
      const csGrade = percentToGrade(midtermCS);
      const labGrade = percentToGrade(midtermLab);
      const moGrade = percentToGrade(midtermMO);
      
      // Calculate final midterm grade
      let midtermGrade;
      if (subjectHasLab) {
        midtermGrade = (midtermCS * 0.30) + (midtermLab * 0.30) + (midtermMO * 0.40);
        const finalGrade = percentToGrade(midtermGrade);
        row.push(csGrade.toFixed(2), labGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(0));
      } else {
        midtermGrade = (midtermCS * 0.60) + (midtermMO * 0.40);
        const finalGrade = percentToGrade(midtermGrade);
        row.push(csGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(0));
      }
      
    } else if (isFinalTermOnly) {
      // Calculate final term component averages and convert to grades
      const finalCS = avgFor(classStandingActivities, student, scoresByStudent);
      const finalLab = subjectHasLab ? avgFor(laboratoryActivities, student, scoresByStudent) : 0;
      const finalMO = avgFor(majorOutputActivities, student, scoresByStudent);
      
      // Convert component percentages to grades
      const csGrade = percentToGrade(finalCS);
      const labGrade = percentToGrade(finalLab);
      const moGrade = percentToGrade(finalMO);
      
      // Calculate final term grade
      let finalTermGrade;
      if (subjectHasLab) {
        finalTermGrade = (finalCS * 0.30) + (finalLab * 0.30) + (finalMO * 0.40);
        const finalGrade = percentToGrade(finalTermGrade);
        row.push(csGrade.toFixed(2), labGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(0));
      } else {
        finalTermGrade = (finalCS * 0.60) + (finalMO * 0.40);
        const finalGrade = percentToGrade(finalTermGrade);
        row.push(csGrade.toFixed(2), moGrade.toFixed(2), finalGrade.toFixed(0));
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
        midtermGrade = (midtermCS * 0.30) + (midtermLab * 0.30) + (midtermMO * 0.40);
        finalTermGrade = (finalCS * 0.30) + (finalLab * 0.30) + (finalMO * 0.40);
      } else {
        midtermGrade = (midtermCS * 0.60) + (midtermMO * 0.40);
        finalTermGrade = (finalCS * 0.60) + (finalMO * 0.40);
      }
      
      const finalPercent = (midtermGrade * 0.40) + (finalTermGrade * 0.60);
      const finalGrade = percentToGrade(finalPercent);
      const remarks = finalPercent >= 75 ? 'Passed' : 'Failed';
      
      // Show weighted contributions as grades
      const mtgContribution = percentToGrade(midtermGrade * 0.40);
      const ftgContribution = percentToGrade(finalTermGrade * 0.60);
      
      row.push(mtgContribution.toFixed(2), ftgContribution.toFixed(2), finalGrade.toFixed(0));
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
  // Detect if subject has laboratory
  const { laboratory: labWeight = 0 } = section.gradingSchema || {};
  const subjectHasLab = labWeight > 0;
  
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
      const midtermLaboratory = subjectHasLab ? avgFor(midtermLab, student, scoresByStudent) : 0;
      const midtermMajorOutput = avgFor(midtermMO, student, scoresByStudent);
      
      // Calculate final term component averages
      const finalClassStanding = avgFor(finalCS, student, scoresByStudent);
      const finalLaboratory = subjectHasLab ? avgFor(finalLab, student, scoresByStudent) : 0;
      const finalMajorOutput = avgFor(finalMO, student, scoresByStudent);
      
      // Calculate term grades based on whether subject has laboratory
      let midtermGrade, finalTermGrade;
      
      if (subjectHasLab) {
        // With Laboratory: CS=30%, Lab=30%, MO=40%
        midtermGrade = (midtermClassStanding * 0.30) + (midtermLaboratory * 0.30) + (midtermMajorOutput * 0.40);
        finalTermGrade = (finalClassStanding * 0.30) + (finalLaboratory * 0.30) + (finalMajorOutput * 0.40);
      } else {
        // No Laboratory: CS=60%, MO=40%
        midtermGrade = (midtermClassStanding * 0.60) + (midtermMajorOutput * 0.40);
        finalTermGrade = (finalClassStanding * 0.60) + (finalMajorOutput * 0.40);
      }
      
      // Calculate final grade: Midterm=40%, FinalTerm=60%
      const finalPercent = (midtermGrade * 0.40) + (finalTermGrade * 0.60);
      const finalGrade = percentToGrade(finalPercent);
      const remarks = finalPercent >= 75 ? 'Passed' : 'Failed';
      
      // Calculate overall averages for compatibility
      const classStandingAvg = (midtermClassStanding * 0.40) + (finalClassStanding * 0.60);
      const laboratoryAvg = subjectHasLab ? (midtermLaboratory * 0.40) + (finalLaboratory * 0.60) : 0;
      const majorOutputAvg = (midtermMajorOutput * 0.40) + (finalMajorOutput * 0.60);

      return Grade.findOneAndUpdate(
        { student: student._id, section: section._id },
        {
          // Term grades
          midtermGrade,
          finalTermGrade,
          
          // Term component averages
          midtermClassStanding,
          midtermLaboratory,
          midtermMajorOutput,
          finalClassStanding,
          finalLaboratory,
          finalMajorOutput,
          
          // Overall averages (compatibility)
          classStanding: classStandingAvg,
          laboratory: laboratoryAvg,
          majorOutput: majorOutputAvg,
          
          // Final results
          finalGrade,
          remarks,
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
