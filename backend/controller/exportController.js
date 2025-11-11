// controllers/exportController.js (refactored)
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
  createDriveFolder,
  findOrCreateSectionFolder,
  tryShareWithInstructor,
  trySetPublicAccess,
  insertLogo,
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

/* -------------------------------------------------------------------------- */
/* main controller                                                             */
/* -------------------------------------------------------------------------- */
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
  let forceServiceAccount = false;
  try {
    ({ sheets, drive } = await getGoogleClients(forceServiceAccount));
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
  // Prefer a sheetName provided by the client (frontend) if available
  const requestedSheetNameFromBody = req.body?.sheetName || null;
  const desiredSheetTitleBase =
    requestedSheetNameFromBody || `${subjectCode}_${section.sectionCode || section.sectionName || 'SECTION'}_${section.term || ''}`;
  const desiredSheetTitleNormalized = normalizeSheetTitleLength(desiredSheetTitleBase);

  // 6) Handle spreadsheet creation or reuse
  const existingExport = section.exportMetadata || {};
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
      console.log('[exportController] Reusing existing dedicated spreadsheet:', spreadsheetId, 'sheet:', sheetTitle);
    } catch (reuseErr) {
      console.warn('[exportController] Unable to reuse previous spreadsheet:', reuseErr.message);
      warnings.push(`Previous export could not be reused: ${reuseErr.message}`);
    }
  }

  // Create new spreadsheet if needed
  if (!reusedExisting) {
    console.log('[exportController] Creating a new spreadsheet...');
    try {
      ({ spreadsheetId, sheetId, sheetTitle } = await createSpreadsheet(sheets, spreadsheetTitle, false, drive));
      console.log('[exportController] Spreadsheet created:', spreadsheetId);
      try {
        sheetTitle = await setSheetTitle(sheets, spreadsheetId, sheetId, desiredSheetTitleBase);
      } catch (renameErr) {
        warnings.push(`Unable to rename sheet to desired title: ${renameErr.message}`);
      }
    } catch (err) {
      console.error('[exportController] Failed to create spreadsheet - attempting with service account');
      // Retry with service account
      try {
        ({ sheets, drive } = await getGoogleClients(true));
        ({ spreadsheetId, sheetId, sheetTitle } = await createSpreadsheet(sheets, spreadsheetTitle, true, drive));
        console.log('[exportController] Spreadsheet created with service account:', spreadsheetId);
        try {
          sheetTitle = await setSheetTitle(sheets, spreadsheetId, sheetId, desiredSheetTitleBase);
        } catch (renameErr) {
          warnings.push(`Unable to rename sheet to desired title: ${renameErr.message}`);
        }
      } catch (retryErr) {
        console.error('[exportController] Failed to create spreadsheet with service account');
        // Each section must have its own separate spreadsheet - no fallback to shared hub
        console.error('[exportController] Unable to create dedicated spreadsheet for section - returning error');
        const status = retryErr instanceof HttpError ? retryErr.status : 500;
        return res.status(status).json({ 
          message: `Failed to create dedicated spreadsheet for section: ${retryErr.message}`,
          suggestion: 'Please check Google Drive storage quota and API permissions'
        });
      }
    }
  }

  // Handle reused existing spreadsheets - each section has its own dedicated spreadsheet
  if (reusedExisting) {
    console.log('[exportController] Reusing existing dedicated spreadsheet for this section');
    // No need to check for hub conflicts since each section has its own spreadsheet
  }

  if (reusedExisting) {
    // Always attempt to align sheet title with current section format
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
      console.error('[exportController] Failed resetting existing sheet before rewrite');
      const status = err instanceof HttpError ? err.status : 500;
      return res.status(status).json({ message: err.message });
    }
  }

  // 7) Move spreadsheet to folder with enhanced section-specific organization
  // Create separate folders for each section automatically
  const { parentFolderId: requestedParentFolderId, sheetName: requestedSheetName } = req.body || {};

  if (!reusedExisting) {
    let createdFolderId = null;
    
    // Generate section folder name following the pattern: "IT101_T101_1st"
    const sectionFolderName = requestedSheetName || desiredSheetTitleBase;
    
    // Determine the parent folder (requested folder or default from env)
    const parentFolder = requestedParentFolderId || GOOGLE_DRIVE_FOLDER_ID;
    
    if (parentFolder) {
      // Step 1: Check if section folder already exists
      console.log('[exportController] 🔍 FOLDER CREATION DEBUG:');
      console.log('[exportController] - Section folder name:', sectionFolderName);
      console.log('[exportController] - Parent folder ID:', parentFolder);
      console.log('[exportController] - Spreadsheet ID:', spreadsheetId);
      console.log('[exportController] - Reused existing:', reusedExisting);
      
      const existingFolderRes = await findOrCreateSectionFolder(drive, sectionFolderName, parentFolder);
      console.log('[exportController] 📁 Section folder result:', existingFolderRes);
      
      if (existingFolderRes.ok && existingFolderRes.id) {
        createdFolderId = existingFolderRes.id;
        
        // Step 2: Move the spreadsheet to the section folder
        console.log(`[exportController] Moving spreadsheet to section folder: ${sectionFolderName}`);
        const moveRes = await moveFileToFolder(drive, spreadsheetId, createdFolderId);
        if (!moveRes.ok) {
          warnings.push(`Could not move spreadsheet to section folder (${createdFolderId}): ${moveRes.message}`);
        } else {
          console.log(`[exportController] Successfully moved spreadsheet to section folder: ${sectionFolderName}`);
        }
      } else {
        warnings.push(`Could not create/find section folder "${sectionFolderName}": ${existingFolderRes.message}`);
        
        // Fallback: move directly to parent folder
        const moveRes = await moveFileToFolder(drive, spreadsheetId, parentFolder);
        if (!moveRes.ok) {
          warnings.push(`Could not move spreadsheet to parent folder (${parentFolder}): ${moveRes.message}`);
        } else {
          createdFolderId = parentFolder;
          warnings.push('Moved to parent folder as fallback since section folder creation failed.');
        }
      }
    } else {
      console.warn('[exportController] No parent folder configured; spreadsheet left in Drive root');
      warnings.push('No target folder configured; spreadsheet remains in Drive root.');
    }

    // Store the folder ID for metadata persistence
    if (createdFolderId) {
      res.locals = res.locals || {};
      res.locals.createdFolderId = createdFolderId;
      res.locals.sectionFolderName = sectionFolderName;
    }
  }

  // Each section now gets its own dedicated spreadsheet - no fallback hub used

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
      spreadsheetTitle,
      spreadsheetUrl,
      folderId: res.locals?.createdFolderId || null,
      sectionFolderName: res.locals?.sectionFolderName || null,
    });
  } catch (err) {
    warnings.push(`Failed to record export metadata: ${err?.message || err}`);
  }

  // 17) Send success response
  return res.json({
    success: true,
    message: 'Grades exported successfully to dedicated section folder',
    spreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    sheetTitle,
    reusedExisting,
    sectionFolderName: res.locals?.sectionFolderName || null,
    folderUrl: res.locals?.createdFolderId ? `https://drive.google.com/drive/folders/${res.locals.createdFolderId}` : null,
    note: 'Each section has its own dedicated spreadsheet in its own folder.',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    warnings,
  });
};