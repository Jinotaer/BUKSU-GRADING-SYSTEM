// controllers/exportController.refactored.js
import dotenv from 'dotenv';
import { HttpError, normalizeSheetTitleLength } from '../utils/googleSheetsHelpers.js';
import { getGoogleClients } from '../utils/googleSheetsHelpers.js';
import { computeScoresByStudent } from '../utils/gradeUtils.js';
import {
  createSpreadsheet,
  addSheetToFallback,
  writeValues,
  resetSheet,
  resolveExistingSheet,
  setSheetTitle,
  moveFileToFolder,
  tryShareWithInstructor,
  trySetPublicAccess,
  insertLogo,
  EXPORT_HUB_SPREADSHEET_ID,
  GOOGLE_DRIVE_FOLDER_ID,
} from '../services/googleSheetsService.js';
import { applyFormatting, addStudentDataBorders } from '../services/sheetFormattingService.js';
import {
  loadSection,
  authorizeInstructor,
  loadActivities,
  loadActivityScores,
  buildSheetData,
  persistGrades,
  updateSectionMetadata,
} from '../services/sheetDataService.js';

dotenv.config();

const requiredEnv = ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
for (const k of requiredEnv) {
  if (!process.env[k]) {
    console.error(`[exportController] Missing env: ${k}`);
  }
}

export const exportToGoogleSheets = async (req, res) => {
  console.log('[exportController] ========== Export Request Started ==========');
  const warnings = [];

  // 1) Extract and validate request data
  const { sectionId } = req.params;
  const instructorId = req?.instructor?.id;
  const { schedule, chairperson, dean } = req.body || {};
  
  console.log('[exportController] SectionId:', sectionId, 'InstructorId:', instructorId);
  
  if (!sectionId) {
    return res.status(400).json({ message: 'Missing sectionId' });
  }
  
  if (!schedule?.day || !schedule?.time || !schedule?.room || !chairperson || !dean) {
    return res.status(400).json({ 
      message: 'Missing required schedule information. Please provide day, time, room, chairperson, and dean.' 
    });
  }

  // 2) Load and authorize section
  let section;
  try {
    section = await loadSection(sectionId);
    authorizeInstructor(section, instructorId);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 3) Load activities and scores
  let activities = [];
  let activityScores = [];
  let scoresByStudent = {};
  
  try {
    activities = await loadActivities(section);
    const allActivityIds = activities.map((a) => a._id);
    activityScores = await loadActivityScores(allActivityIds);
    scoresByStudent = computeScoresByStudent(activityScores);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 4) Initialize Google clients
  console.log('[exportController] Initializing Google clients...');
  let sheets, drive;
  try {
    ({ sheets, drive } = await getGoogleClients());
    console.log('[exportController] Google clients initialized successfully');
  } catch (err) {
    console.error('[exportController] Failed to initialize Google clients');
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 5) Prepare spreadsheet titles
  const subjectCode = section.subject?.subjectCode || 'SUBJ';
  const sectionCodeForTitle = section.sectionCode || section.sectionName || '';
  const spreadsheetTitle = `${subjectCode}_${sectionCodeForTitle}_${section.schoolYear || ''}_${section.term || ''}`;
  const desiredSheetTitleBase = `${subjectCode}_${section.sectionCode || section.sectionName || 'SECTION'}_${section.term || ''}`;
  const desiredSheetTitleNormalized = normalizeSheetTitleLength(desiredSheetTitleBase);

  // 6) Handle spreadsheet creation or reuse
  const existingExport = section.exportMetadata || {};
  const expectedSpreadsheetId = existingExport?.spreadsheetId || null;
  const expectedSheetId = existingExport?.sheetId ?? null;
  const expectedSheetTitle = existingExport?.sheetTitle || null;
  const existingUsedFallback = existingExport?.usedFallbackHub || false;

  let spreadsheetId;
  let sheetId;
  let sheetTitle;
  let usedFallbackHub = false;
  let reusedExisting = false;

  // Try to reuse existing spreadsheet
  if (expectedSpreadsheetId) {
    try {
      ({ sheetId, sheetTitle } = await resolveExistingSheet(sheets, expectedSpreadsheetId, expectedSheetId, expectedSheetTitle));
      spreadsheetId = expectedSpreadsheetId;
      usedFallbackHub = existingUsedFallback || expectedSpreadsheetId === EXPORT_HUB_SPREADSHEET_ID;
      reusedExisting = true;
      console.log('[exportController] Reusing existing spreadsheet:', spreadsheetId, 'sheet:', sheetTitle);
    } catch (reuseErr) {
      console.warn('[exportController] Unable to reuse previous spreadsheet:', reuseErr.message);
      warnings.push(`Previous export could not be reused: ${reuseErr.message}`);
    }
  }

  // Create new spreadsheet if needed
  if (!reusedExisting) {
    console.log('[exportController] Creating a new spreadsheet...');
    try {
      ({ spreadsheetId, sheetId, sheetTitle } = await createSpreadsheet(sheets, spreadsheetTitle));
      console.log('[exportController] Spreadsheet created:', spreadsheetId);
      try {
        sheetTitle = await setSheetTitle(sheets, spreadsheetId, sheetId, desiredSheetTitleBase);
      } catch (renameErr) {
        warnings.push(`Unable to rename sheet to desired title: ${renameErr.message}`);
      }
    } catch (err) {
      const canFallback = err instanceof HttpError && err.status === 403 && EXPORT_HUB_SPREADSHEET_ID;
      if (!canFallback) {
        console.error('[exportController] Failed to create spreadsheet - returning error to client');
        const status = err instanceof HttpError ? err.status : 500;
        return res.status(status).json({ message: err.message });
      }

      console.warn('[exportController] Permission denied creating spreadsheet - attempting to use fallback hub');
      try {
        ({ spreadsheetId, sheetId, sheetTitle } = await addSheetToFallback(sheets, EXPORT_HUB_SPREADSHEET_ID, desiredSheetTitleBase));
        usedFallbackHub = true;
        console.log('[exportController] Fallback sheet created inside hub spreadsheet:', spreadsheetId, 'sheet:', sheetTitle);
      } catch (fallbackErr) {
        console.error('[exportController] Failed to use fallback hub spreadsheet');
        const status = fallbackErr instanceof HttpError ? fallbackErr.status : 500;
        return res.status(status).json({ message: fallbackErr.message });
      }
    }
  }

  // Handle reused existing spreadsheets
  if (reusedExisting) {
    const matchesDesiredTitle =
      sheetTitle === desiredSheetTitleNormalized ||
      (desiredSheetTitleNormalized && sheetTitle?.startsWith(`${desiredSheetTitleNormalized}_`));

    if (spreadsheetId === EXPORT_HUB_SPREADSHEET_ID && !matchesDesiredTitle) {
      console.warn('[exportController] Existing fallback sheet belongs to another section; creating a dedicated tab');
      try {
        const fallbackSheet = await addSheetToFallback(sheets, EXPORT_HUB_SPREADSHEET_ID, desiredSheetTitleBase);
        ({ spreadsheetId, sheetId, sheetTitle } = fallbackSheet);
        usedFallbackHub = true;
        reusedExisting = false;
        warnings.push('Created a new fallback tab to avoid overwriting another section.');
      } catch (fallbackErr) {
        const status = fallbackErr instanceof HttpError ? fallbackErr.status : 500;
        return res.status(status).json({ message: fallbackErr.message });
      }
    }
  }

  if (reusedExisting) {
    const shouldAttemptRename =
      sheetTitle !== desiredSheetTitleNormalized && spreadsheetId !== EXPORT_HUB_SPREADSHEET_ID;
    if (shouldAttemptRename) {
      try {
        sheetTitle = await setSheetTitle(sheets, spreadsheetId, sheetId, desiredSheetTitleBase);
      } catch (renameErr) {
        warnings.push(`Could not align sheet title with desired format: ${renameErr.message}`);
      }
    }
    try {
      await resetSheet(sheets, spreadsheetId, sheetId, sheetTitle);
    } catch (err) {
      console.error('[exportController] Failed resetting existing sheet before rewrite');
      const status = err instanceof HttpError ? err.status : 500;
      return res.status(status).json({ message: err.message });
    }
  }

  // 7) Move spreadsheet to folder (new files only)
  if (!reusedExisting && !usedFallbackHub) {
    const moveRes = await moveFileToFolder(drive, spreadsheetId, GOOGLE_DRIVE_FOLDER_ID);
    if (!moveRes.ok) {
      if (GOOGLE_DRIVE_FOLDER_ID) {
        warnings.push(`Could not move spreadsheet to target folder: ${moveRes.message}`);
      } else {
        console.warn('[exportController] GOOGLE_DRIVE_FOLDER_ID not configured; spreadsheet left in Drive root');
      }
    }
  }

  if (usedFallbackHub) {
    warnings.push(`Used fallback hub spreadsheet (${spreadsheetId}); tab "${sheetTitle}" ${reusedExisting ? 'updated' : 'added'}.`);
  }

  // 8) Build sheet data
  const scheduleInfo = { day: schedule.day, time: schedule.time, room: schedule.room, chairperson, dean };
  const {
    allData,
    tableHeaderRows,
    headerColorRanges,
    baseColumns,
    totalColumns,
  } = buildSheetData(section, activities, scoresByStudent, scheduleInfo);

  // 9) Write values to sheet
  try {
    await writeValues(sheets, spreadsheetId, sheetTitle, allData);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 10) Apply formatting
  const headerData = allData.slice(0, 6);
  const sectionInfo = allData.slice(6, 13);
  const tableHeaderStartRow = headerData.length + sectionInfo.length;
  const headerRowCount = tableHeaderRows.length;
  
  try {
    await applyFormatting(
      sheets,
      spreadsheetId,
      sheetId,
      totalColumns,
      headerData.length,
      tableHeaderStartRow,
      headerRowCount,
      headerColorRanges,
      baseColumns,
      totalColumns
    );
  } catch (err) {
    warnings.push(`Formatting failed: ${err.message}`);
  }

  // 11) Add borders to student data
  const studentRowCount = section.students.length;
  try {
    await addStudentDataBorders(sheets, spreadsheetId, sheetId, tableHeaderStartRow, headerRowCount, studentRowCount, totalColumns);
  } catch (err) {
    warnings.push(`Failed adding borders to student data: ${err.message}`);
  }

  // 12) Insert logo
  const logoUrl = 'https://drive.google.com/uc?export=view&id=1xstqF1mB98ZjOCt4nmeLJQBFb9g1u0be';
  const logoRes = await insertLogo(sheets, spreadsheetId, sheetId, logoUrl);
  if (!logoRes.ok) warnings.push(`Could not insert logo: ${logoRes.message}`);

  // 13) Share with instructor and set public access
  const instructorEmail = section?.instructor?.email || null;
  const shareRes = await tryShareWithInstructor(drive, spreadsheetId, instructorEmail);
  if (!shareRes.ok) warnings.push(`Could not share with instructor${instructorEmail ? ` (${instructorEmail})` : ''}: ${shareRes.message || 'unknown error'}`);

  const publicRes = await trySetPublicAccess(drive, spreadsheetId);
  if (!publicRes.ok) warnings.push(`Could not set public access: ${publicRes.message || 'unknown error'}`);

  // 14) Build spreadsheet URL
  const spreadsheetUrl =
    sheetId != null
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  console.log(`[exportController] Spreadsheet ready: ${spreadsheetUrl}`);

  // 15) Persist grades
  try {
    const gradeResult = await persistGrades(section, activities, scoresByStudent, instructorId);
    if (gradeResult.failedCount > 0) {
      warnings.push(`Grades persisted with ${gradeResult.failedCount} upsert error(s). Check server logs.`);
    }
  } catch (err) {
    warnings.push(`Grade persistence failed: ${err?.message || err}`);
  }

  // 16) Update section metadata
  try {
    await updateSectionMetadata(sectionId, scheduleInfo, {
      spreadsheetId,
      sheetId,
      sheetTitle,
      usedFallbackHub,
      spreadsheetTitle,
      spreadsheetUrl,
    });
  } catch (err) {
    warnings.push(`Failed to record export metadata: ${err?.message || err}`);
  }

  // 17) Send success response
  return res.json({
    success: true,
    message: 'Grades exported successfully',
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    sheetTitle,
    usedFallbackHub,
    reusedExisting,
    note: 'If you cannot access the spreadsheet, share it manually with your email from the service account.',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    warnings,
  });
};
