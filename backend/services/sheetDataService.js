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
    if (!section) throw new HttpError(404, 'Section not found');
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

export const loadActivities = async (section) => {
  try {
    if (!section?.subject?._id) return [];
    const query = {
      subject: section.subject._id,
      schoolYear: section.schoolYear,
      term: toActivityTerm(section.term),
      isActive: true,
    };
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
    ['', '', 'Semester:', '', `${section.term || ''} Sem`, '', '', '', 'Units:', section.subject?.units ?? 3],
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

  const studentRows = section.students.map((student, idx) => {
    const row = ['', '', String(idx + 1), student.studid || '', student.fullName || ''];
    for (const a of allActs) {
      const sMap = scoresByStudent[String(student._id)] || {};
      row.push(String(Number(sMap[String(a._id)] || 0)));
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
  const { classStanding: csWeight = 0, laboratory: labWeight = 0, majorOutput: moWeight = 0 } = section.gradingSchema || {};
  
  const classStandingActivities = activities.filter((a) => a.category === 'classStanding');
  const laboratoryActivities = activities.filter((a) => a.category === 'laboratory');
  const majorOutputActivities = activities.filter((a) => a.category === 'majorOutput');

  const results = await Promise.allSettled(
    section.students.map(async (student) => {
      const csAvg = avgFor(classStandingActivities, student, scoresByStudent);
      const labAvg = avgFor(laboratoryActivities, student, scoresByStudent);
      const moAvg = avgFor(majorOutputActivities, student, scoresByStudent);
      const finalPercent = (csAvg * csWeight) / 100 + (labAvg * labWeight) / 100 + (moAvg * moWeight) / 100;
      const finalGrade = percentToGrade(finalPercent);
      const remarks = finalPercent >= 50 ? 'Passed' : 'Failed';

      return Grade.findOneAndUpdate(
        { student: student._id, section: section._id },
        {
          classStanding: csAvg,
          laboratory: labAvg,
          majorOutput: moAvg,
          finalGrade,
          remarks,
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

export const updateSectionMetadata = async (sectionId, schedule, spreadsheetMetadata) => {
  try {
    await Section.findByIdAndUpdate(
      sectionId,
      {
        $set: {
          'schedule.day': schedule.day,
          'schedule.time': schedule.time,
          'schedule.room': schedule.room,
          'chairperson': schedule.chairperson,
          'dean': schedule.dean,
          'exportMetadata.spreadsheetId': spreadsheetMetadata.spreadsheetId,
          'exportMetadata.folderId': spreadsheetMetadata.folderId || null,
          'exportMetadata.sheetId': spreadsheetMetadata.sheetId,
          'exportMetadata.sheetTitle': spreadsheetMetadata.sheetTitle,
          'exportMetadata.usedFallbackHub': spreadsheetMetadata.usedFallbackHub,
          'exportMetadata.spreadsheetTitle': spreadsheetMetadata.spreadsheetTitle,
          'exportMetadata.spreadsheetUrl': spreadsheetMetadata.spreadsheetUrl,
          'exportMetadata.lastExportedAt': new Date(),
        },
      },
      { new: false }
    );
  } catch (err) {
    throw new HttpError(500, 'Failed to record export metadata', { cause: err?.message });
  }
};
