// controllers/exportFinalGradeController.js
import dotenv from 'dotenv';
import { HttpError, normalizeSheetTitleLength } from '../utils/googleSheetsHelpers.js';
import { getGoogleClients } from '../utils/googleSheetsHelpers.js';
import { computeScoresByStudent } from '../utils/gradeUtils.js';
import {
  createSpreadsheet,
  writeValues,
  resetSheet,
  resolveExistingSheet,
  setSheetTitle,
  moveFileToFolder,
  findOrCreateSectionFolder,
  tryShareWithInstructor,
  trySetPublicAccess,
  GOOGLE_DRIVE_FOLDER_ID,
} from '../services/googleSheetsService.js';
import { applyFinalGradeFormatting, addStudentDataBorders } from '../services/sheetFormattingService.js';
import {
  loadSection,
  authorizeInstructor,
  loadActivities,
  loadActivityScores,
  buildFinalGradeSheetData,
  buildFinalGradeSheetDataScreenshotDesign,
  persistGrades,
  updateSectionMetadata,
} from '../services/sheetDataService.js';

dotenv.config();

/* -------------------------------------------------------------------------- */
/* Final Grade Export Controller                                              */
/* -------------------------------------------------------------------------- */
export const exportFinalGrade = async (req, res) => {
  console.log('[exportFinalGrade] ========== Final Grade Export Started ==========');
  const warnings = [];

  // 1) Extract and validate request data
  const { sectionId } = req.params;
  const instructorId = req?.instructor?.id;
  const { schedule } = req.body || {};
  
  console.log('[exportFinalGrade] SectionId:', sectionId, 'InstructorId:', instructorId);
  
  if (!sectionId) {
    return res.status(400).json({ message: 'Missing sectionId' });
  }
  
  if (!schedule?.day || !schedule?.time || !schedule?.room) {
    return res.status(400).json({ 
      message: 'Missing required schedule information. Please provide day, time, and room.' 
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

  // 3) Load all activities and scores (Midterm + Finalterm)
  let activities = [];
  let activityScores = [];
  let scoresByStudent = {};
  
  try {
    // Load all activities regardless of term for final grade calculation
    activities = await loadActivities(section, ''); // Empty term = all terms
    const allActivityIds = activities.map((a) => a._id);
    activityScores = await loadActivityScores(allActivityIds);
    scoresByStudent = computeScoresByStudent(activityScores);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 4) Initialize Google clients
  console.log('[exportFinalGrade] Initializing Google clients...');
  let sheets, drive;
  let forceServiceAccount = false;
  try {
    ({ sheets, drive } = await getGoogleClients(forceServiceAccount));
    console.log('[exportFinalGrade] Google clients initialized successfully');
  } catch (err) {
    console.error('[exportFinalGrade] Failed to initialize Google clients');
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 5) Prepare spreadsheet titles
  const subjectCode = section.subject?.subjectCode || 'SUBJ';
  const sectionCodeForTitle = section.sectionCode || section.sectionName || '';
  const spreadsheetTitle = `${subjectCode}_${sectionCodeForTitle}_${section.schoolYear || ''}_${section.term || ''}_FinalGrade`;
  const desiredSheetTitleBase = `${subjectCode}_${section.sectionCode || section.sectionName || 'SECTION'}_${section.term || ''}_FinalGrade`;
  const desiredSheetTitleNormalized = normalizeSheetTitleLength(desiredSheetTitleBase);

  // 6) Handle spreadsheet creation or reuse
  const metadataKey = 'exportMetadata_finalgrade';
  const existingExport = section[metadataKey] || {};
  const expectedSpreadsheetId = existingExport?.spreadsheetId || null;
  const expectedSheetId = existingExport?.sheetId ?? null;
  const expectedSheetTitle = existingExport?.sheetTitle || null;

  let spreadsheetId;
  let sheetId;
  let sheetTitle;
  let reusedExisting = false;

  // Try to reuse existing spreadsheet
  if (expectedSpreadsheetId) {
    try {
      ({ sheetId, sheetTitle } = await resolveExistingSheet(sheets, expectedSpreadsheetId, expectedSheetId, expectedSheetTitle));
      spreadsheetId = expectedSpreadsheetId;
      reusedExisting = true;
      console.log('[exportFinalGrade] Reusing existing spreadsheet:', spreadsheetId, 'sheet:', sheetTitle);
    } catch (reuseErr) {
      console.warn('[exportFinalGrade] Unable to reuse previous spreadsheet:', reuseErr.message);
      warnings.push(`Previous export could not be reused: ${reuseErr.message}`);
    }
  }

  // Create new spreadsheet if needed
  if (!reusedExisting) {
    console.log('[exportFinalGrade] Creating a new spreadsheet...');
    try {
      ({ spreadsheetId, sheetId, sheetTitle } = await createSpreadsheet(sheets, spreadsheetTitle, false, drive));
      console.log('[exportFinalGrade] Spreadsheet created:', spreadsheetId);
      try {
        sheetTitle = await setSheetTitle(sheets, spreadsheetId, sheetId, desiredSheetTitleBase);
      } catch (renameErr) {
        warnings.push(`Unable to rename sheet to desired title: ${renameErr.message}`);
      }
    } catch (err) {
      console.error('[exportFinalGrade] Failed to create spreadsheet - attempting with service account');
      try {
        ({ sheets, drive } = await getGoogleClients(true));
        ({ spreadsheetId, sheetId, sheetTitle } = await createSpreadsheet(sheets, spreadsheetTitle, true, drive));
        console.log('[exportFinalGrade] Spreadsheet created with service account:', spreadsheetId);
        try {
          sheetTitle = await setSheetTitle(sheets, spreadsheetId, sheetId, desiredSheetTitleBase);
        } catch (renameErr) {
          warnings.push(`Unable to rename sheet to desired title: ${renameErr.message}`);
        }
      } catch (retryErr) {
        console.error('[exportFinalGrade] Failed to create spreadsheet with service account');
        const status = retryErr instanceof HttpError ? retryErr.status : 500;
        return res.status(status).json({ 
          message: `Failed to create final grade spreadsheet: ${retryErr.message}`,
          suggestion: 'Please check Google Drive storage quota and API permissions'
        });
      }
    }
  }

  if (reusedExisting) {
    const shouldAttemptRename = sheetTitle !== desiredSheetTitleNormalized;
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
      console.error('[exportFinalGrade] Failed resetting existing sheet before rewrite');
      const status = err instanceof HttpError ? err.status : 500;
      return res.status(status).json({ message: err.message });
    }
  }

  // 7) Move spreadsheet to folder
  if (!reusedExisting) {
    let createdFolderId = null;
    const sectionFolderName = desiredSheetTitleBase;
    const parentFolder = GOOGLE_DRIVE_FOLDER_ID;
    
    if (parentFolder) {
      const existingFolderRes = await findOrCreateSectionFolder(drive, sectionFolderName, parentFolder);
      
      if (existingFolderRes.ok && existingFolderRes.id) {
        createdFolderId = existingFolderRes.id;
        const moveRes = await moveFileToFolder(drive, spreadsheetId, createdFolderId);
        if (!moveRes.ok) {
          warnings.push(`Could not move spreadsheet to section folder: ${moveRes.message}`);
        }
      } else {
        warnings.push(`Could not create/find section folder: ${existingFolderRes.message}`);
      }
    }

    if (createdFolderId) {
      res.locals = res.locals || {};
      res.locals.createdFolderId = createdFolderId;
      res.locals.sectionFolderName = sectionFolderName;
    }
  }

  // 8) Build final grade sheet data using the new screenshot design
  const scheduleInfo = { day: schedule.day, time: schedule.time, room: schedule.room };
  const sheetDataResult = buildFinalGradeSheetDataScreenshotDesign(section, activities, scoresByStudent, scheduleInfo);
  
  const {
    allData,
    tableHeaderRows,
    headerColorRanges,
    baseColumns,
    totalColumns,
  } = sheetDataResult;

  // 9) Write values to sheet
  try {
    await writeValues(sheets, spreadsheetId, sheetTitle, allData);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 10) Apply final grade specific formatting
  const headerDataLength = sheetDataResult.headerData?.length || 0;
  const sectionInfoLength = sheetDataResult.sectionInfo?.length || 5;
  const tableHeaderStartRow = headerDataLength + sectionInfoLength;
  const headerRowCount = tableHeaderRows.length;
  
  try {
    await applyFinalGradeFormatting(
      sheets,
      spreadsheetId,
      sheetId,
      totalColumns,
      headerDataLength,
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

  // 12) Share with instructor and set public access
  const instructorEmail = section?.instructor?.email || null;
  const shareRes = await tryShareWithInstructor(drive, spreadsheetId, instructorEmail);
  if (!shareRes.ok) warnings.push(`Could not share with instructor: ${shareRes.message || 'unknown error'}`);

  const publicRes = await trySetPublicAccess(drive, spreadsheetId);
  if (!publicRes.ok) warnings.push(`Could not set public access: ${publicRes.message || 'unknown error'}`);

  // 13) Build spreadsheet URL
  const spreadsheetUrl =
    sheetId != null
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  console.log(`[exportFinalGrade] Spreadsheet ready: ${spreadsheetUrl}`);

  // 14) Persist grades
  try {
    const gradeResult = await persistGrades(section, activities, scoresByStudent, instructorId);
    if (gradeResult.failedCount > 0) {
      warnings.push(`Grades persisted with ${gradeResult.failedCount} upsert error(s). Check server logs.`);
    }
  } catch (err) {
    warnings.push(`Grade persistence failed: ${err?.message || err}`);
  }

  // 15) Update section metadata
  try {
    await updateSectionMetadata(sectionId, scheduleInfo, {
      spreadsheetId,
      sheetId,
      sheetTitle,
      spreadsheetTitle,
      spreadsheetUrl,
      folderId: res.locals?.createdFolderId || null,
      sectionFolderName: res.locals?.sectionFolderName || null,
    }, 'finalgrade');
  } catch (err) {
    warnings.push(`Failed to record export metadata: ${err?.message || err}`);
  }

  // 16) Send success response
  return res.json({
    success: true,
    message: 'Final grades exported successfully',
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    sheetTitle,
    reusedExisting,
    sectionFolderName: res.locals?.sectionFolderName || null,
    folderUrl: res.locals?.createdFolderId ? `https://drive.google.com/drive/folders/${res.locals.createdFolderId}` : null,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    warnings,
  });
};
