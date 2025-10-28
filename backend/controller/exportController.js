// controllers/exportController.js (refactored)
import { google } from 'googleapis';
import dotenv from 'dotenv';
import Section from '../models/sections.js';
import Activity from '../models/activity.js';
import ActivityScore from '../models/activityScore.js';
import Grade from '../models/grades.js';

dotenv.config();

/* -------------------------------------------------------------------------- */
/* utils                                                                      */
/* -------------------------------------------------------------------------- */
const requiredEnv = ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
for (const k of requiredEnv) {
  if (!process.env[k]) {
    console.error(`[exportController] Missing env: ${k}`); // fail fast visibility
  }
}

const EXPORT_HUB_SPREADSHEET_ID = process.env.EXPORT_HUB_SPREADSHEET_ID?.trim() || null;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;

class HttpError extends Error {
  /** @param {number} status */
  constructor(status, message, meta = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.meta = meta;
  }
}

/** Normalize and create a JWT client for Google APIs */
const initializeGoogleAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

  if (!email || !rawKey) {
    throw new HttpError(500, 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY');
  }

  rawKey = rawKey.trim();
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'")) ||
    (rawKey.startsWith('`') && rawKey.endsWith('`'))
  ) {
    rawKey = rawKey.slice(1, -1);
  }
  const privateKey = rawKey.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
};

const percentToGrade = (percent) => {
  if (percent >= 97) return 1.0;
  if (percent >= 94) return 1.25;
  if (percent >= 91) return 1.5;
  if (percent >= 88) return 1.75;
  if (percent >= 85) return 2.0;
  if (percent >= 82) return 2.25;
  if (percent >= 79) return 2.5;
  if (percent >= 76) return 2.75;
  if (percent >= 75) return 3.0;
  return 5.0;
};

const createHeaderStyle = () => ({
  backgroundColor: { red: 1, green: 0.95, blue: 0.8 },
  horizontalAlignment: 'CENTER',
  verticalAlignment: 'MIDDLE',
  textFormat: { bold: true, fontSize: 10 },
  borders: {
    top: { style: 'SOLID' },
    bottom: { style: 'SOLID' },
    left: { style: 'SOLID' },
    right: { style: 'SOLID' },
  },
});

/* -------------------------------------------------------------------------- */
/* data access                                                                */
/* -------------------------------------------------------------------------- */
const loadSection = async (sectionId) => {
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

const authorizeInstructor = (section, instructorId) => {
  if (String(section.instructor?._id) !== String(instructorId)) {
    throw new HttpError(403, 'Unauthorized');
  }
};

const toActivityTerm = (sectionTerm) => {
  const mapping = { '1st': 'First', '2nd': 'Second', Summer: 'Summer' };
  return mapping[sectionTerm] || sectionTerm;
};

const loadActivities = async (section) => {
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

const loadActivityScores = async (activityIds) => {
  try {
    const scores = await ActivityScore.find({ activity: { $in: activityIds } }).populate('student');
    return scores;
  } catch (err) {
    throw new HttpError(500, 'Failed loading activity scores', { cause: err?.message });
  }
};

const computeScoresByStudent = (activityScores) => {
  const map = {};
  for (const s of activityScores) {
    const sid = s?.student?._id ? String(s.student._id) : null;
    if (!sid) continue;
    const aid = String(s.activity);
    map[sid] ||= {};
    map[sid][aid] = Number(s.score || 0);
  }
  return map;
};

const avgFor = (acts, student, scoresByStudent) => {
  if (!acts.length) return 0;
  const sMap = scoresByStudent[String(student._id)] || {};
  const percents = acts.map((a) => {
    const score = Number(sMap[String(a._id)] || 0);
    const max = Number(a.maxScore ?? 100) || 0;
    return max > 0 ? (score / max) * 100 : 0;
  });
  return percents.reduce((a, b) => a + b, 0) / percents.length;
};

/* -------------------------------------------------------------------------- */
/* google api helpers                                                          */
/* -------------------------------------------------------------------------- */
const getGoogleClients = async () => {
  const auth = initializeGoogleAuth();
  try {
    await auth.authorize();
  } catch (err) {
    console.error('[exportController] Google auth failed:', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });
    throw new HttpError(500, 'Google auth failed', { cause: err?.message });
  }
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  return { sheets, drive };
};

const createSpreadsheet = async (sheets, title) => {
  try {
    const resp = await sheets.spreadsheets.create({ requestBody: { properties: { title } } });
    const spreadsheetId = resp?.data?.spreadsheetId;
    const sheetId = resp?.data?.sheets?.[0]?.properties?.sheetId;
    const sheetTitle = resp?.data?.sheets?.[0]?.properties?.title || 'Sheet1';
    if (!spreadsheetId || sheetId == null) {
      throw new HttpError(500, 'Sheets API did not return spreadsheetId/sheetId');
    }
    return { spreadsheetId, sheetId, sheetTitle };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // Log detailed error information
    console.error('[exportController] Failed creating spreadsheet:', {
      message: err?.message,
      code: err?.code,
      errors: err?.errors,
      response: err?.response?.data,
      stack: err?.stack
    });
    const isPermissionDenied =
      err?.code === 403 ||
      err?.status === 403 ||
      err?.response?.data?.error?.status === 'PERMISSION_DENIED' ||
      err?.message?.toLowerCase()?.includes('permission');
    const meta = {
      cause: err?.message,
      code: err?.code ?? err?.status,
      status: err?.response?.data?.error?.status,
    };
    if (isPermissionDenied) {
      throw new HttpError(403, 'Failed creating spreadsheet: permission denied', meta);
    }
    throw new HttpError(500, 'Failed creating spreadsheet', meta);
  }
};

const invalidSheetChars = /[\\/?*[\]:'"]/g;
const sanitizeSheetTitle = (rawTitle) => {
  const fallback = 'Export';
  if (!rawTitle) return fallback;
  const cleaned = rawTitle.replace(invalidSheetChars, '-').trim();
  return cleaned.length ? cleaned : fallback;
};

const toA1Notation = (sheetTitle, targetRange = 'A1') => {
  const escaped = sheetTitle.replace(/'/g, "''");
  if (!targetRange) return `'${escaped}'`;
  return `'${escaped}'!${targetRange}`;
};

const normalizeSheetTitleLength = (title) => {
  const normalized = sanitizeSheetTitle(title);
  return normalized.length > 99 ? normalized.slice(0, 99) : normalized;
};

const buildTitleCandidates = (baseTitle) => {
  const normalized = normalizeSheetTitleLength(baseTitle);
  const suffix = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 8);
  const truncatedBase = normalized.length > 90 ? normalized.slice(0, 90) : normalized;
  const secondCandidate = `${truncatedBase}_${suffix}`.slice(0, 99);
  return [normalized, secondCandidate];
};

const isDuplicateSheetError = (err) => {
  const message = err?.response?.data?.error?.message || err?.message || '';
  const lower = message.toLowerCase();
  return lower.includes('already exist') || lower.includes('duplicate sheet name');
};

const addSheetToFallback = async (sheets, hubSpreadsheetId, desiredTitle) => {
  if (!hubSpreadsheetId) {
    throw new HttpError(403, 'Fallback spreadsheet not configured');
  }

  const candidates = buildTitleCandidates(desiredTitle);

  for (const candidate of candidates) {
    try {
      const resp = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: hubSpreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: candidate },
              },
            },
          ],
        },
      });

      const sheetId = resp?.data?.replies?.[0]?.addSheet?.properties?.sheetId;
      if (sheetId == null) {
        throw new HttpError(500, 'Sheets API did not return sheetId for fallback tab');
      }
      return { spreadsheetId: hubSpreadsheetId, sheetId, sheetTitle: candidate, fallbackUsed: true };
    } catch (err) {
      if (err instanceof HttpError) throw err;
      if (isDuplicateSheetError(err)) continue;
      const meta = {
        cause: err?.message,
        code: err?.code ?? err?.status,
        status: err?.response?.data?.error?.status,
      };
      throw new HttpError(500, 'Failed creating fallback sheet', meta);
    }
  }

  throw new HttpError(500, 'Could not create unique fallback sheet tab');
};

const writeValues = async (sheets, spreadsheetId, sheetTitle, values) => {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: toA1Notation(sheetTitle, 'A1'),
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } catch (err) {
    throw new HttpError(500, 'Failed writing values to sheet', { cause: err?.message });
  }
};

const clearSheetContents = async (sheets, spreadsheetId, sheetTitle) => {
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: toA1Notation(sheetTitle, ''),
    });
  } catch (err) {
    throw new HttpError(500, 'Failed clearing existing sheet contents', { cause: err?.message });
  }
};

const resetSheet = async (sheets, spreadsheetId, sheetId, sheetTitle) => {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          { unmergeCells: { range: { sheetId } } },
          {
            repeatCell: {
              range: { sheetId },
              cell: { userEnteredFormat: {} },
              fields: 'userEnteredFormat',
            },
          },
        ],
      },
    });
  } catch (err) {
    throw new HttpError(500, 'Failed resetting sheet formatting', { cause: err?.message });
  }

  await clearSheetContents(sheets, spreadsheetId, sheetTitle);
};

const moveFileToFolder = async (drive, spreadsheetId, targetFolderId) => {
  if (!targetFolderId) return { ok: false, message: 'No drive folder configured' };

  try {
    const file = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'parents',
      supportsAllDrives: true,
    });
    const previousParents = file?.data?.parents?.join(',') || null;
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: targetFolderId,
      removeParents: previousParents || undefined,
      fields: 'id, parents',
      supportsAllDrives: true,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.message || 'Failed moving file to folder' };
  }
};

const resolveExistingSheet = async (sheets, spreadsheetId, preferredSheetId, preferredTitle) => {
  try {
    const resp = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    });
    const sheetsList = resp?.data?.sheets || [];
    if (!sheetsList.length) throw new HttpError(404, 'Spreadsheet contains no sheets');

    let target = null;
    if (preferredSheetId != null) {
      target = sheetsList.find((s) => s?.properties?.sheetId === preferredSheetId) || null;
    }
    if (!target && preferredTitle) {
      target = sheetsList.find((s) => s?.properties?.title === preferredTitle) || null;
    }
    if (!target) {
      if (preferredSheetId != null || preferredTitle) {
        throw new HttpError(404, 'Expected sheet not found in spreadsheet');
      }
      target = sheetsList[0];
    }

    const props = target?.properties || {};
    if (props.sheetId == null) {
      throw new HttpError(500, 'Sheet metadata missing sheetId');
    }

    return { sheetId: props.sheetId, sheetTitle: props.title || 'Sheet1' };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(
      err?.code === 404 ? 404 : err?.code === 403 ? 403 : 500,
      err?.code === 404
        ? 'Spreadsheet not found'
        : err?.code === 403
          ? 'Unauthorized to access existing spreadsheet'
          : 'Failed loading existing spreadsheet',
      { cause: err?.message }
    );
  }
};

const setSheetTitle = async (sheets, spreadsheetId, sheetId, desiredTitle) => {
  const candidates = buildTitleCandidates(desiredTitle);
  for (const candidate of candidates) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: { sheetId, title: candidate },
                fields: 'title',
              },
            },
          ],
        },
      });
      return candidate;
    } catch (err) {
      if (isDuplicateSheetError(err)) continue;
      const meta = {
        cause: err?.message,
        code: err?.code ?? err?.status,
        status: err?.response?.data?.error?.status,
      };
      throw new HttpError(500, 'Failed renaming sheet', meta);
    }
  }
  throw new HttpError(500, 'Could not assign unique sheet title');
};

const applyFormatting = async (
  sheets,
  spreadsheetId,
  sheetId,
  columnCount,
  titleRowCount,
  headerStartRow,
  headerRowCount,
  colorRanges = [],
  staticColumnCount = 0,
  finalGradeColumnStart = columnCount - 1
) => {
  const frozenRowCount = headerStartRow + headerRowCount;
  const requests = [
    // Merge top title row
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    // Title region styles
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: titleRowCount, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', textFormat: { bold: true, fontSize: 11 } } },
        fields: 'userEnteredFormat(horizontalAlignment,textFormat)',
      },
    },
    // Header block styles
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: headerStartRow,
          endRowIndex: headerStartRow + headerRowCount,
          startColumnIndex: 0,
          endColumnIndex: columnCount,
        },
        cell: { userEnteredFormat: createHeaderStyle() },
        fields: 'userEnteredFormat',
      },
    },
    // Freeze header rows
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount } },
        fields: 'gridProperties.frozenRowCount',
      },
    },
  ];

  for (const range of colorRanges) {
    if (range.start == null || range.end == null || !range.color) continue;
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: headerStartRow,
          endRowIndex: headerStartRow + headerRowCount,
          startColumnIndex: range.start,
          endColumnIndex: range.end,
        },
        cell: { userEnteredFormat: { backgroundColor: range.color } },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  }

  if (finalGradeColumnStart > staticColumnCount) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: headerStartRow + 2,
          endRowIndex: headerStartRow + 3,
          startColumnIndex: staticColumnCount,
          endColumnIndex: finalGradeColumnStart,
        },
        cell: { userEnteredFormat: { textRotation: { angle: -90 } } },
        fields: 'userEnteredFormat.textRotation',
      },
    });
  }

  try {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  } catch (err) {
    throw new HttpError(500, 'Failed applying formatting to sheet', { cause: err?.message });
  }
};

const tryShareWithInstructor = async (drive, spreadsheetId, email) => {
  if (!email) return { ok: false, message: 'No instructor email provided' };
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: { type: 'user', role: 'writer', emailAddress: email },
      fields: 'id',
      sendNotificationEmail: false,
      supportsAllDrives: true,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.response?.data?.error?.message || err?.message };
  }
};

const trySetPublicAccess = async (drive, spreadsheetId) => {
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: { type: 'anyone', role: 'writer', allowFileDiscovery: false },
      fields: 'id',
      supportsAllDrives: true,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.response?.data?.error?.message || err?.message };
  }
};

/* -------------------------------------------------------------------------- */
/* main controller                                                             */
/* -------------------------------------------------------------------------- */
export const exportToGoogleSheets = async (req, res) => {
  console.log('[exportController] ========== Export Request Started ==========');
  const warnings = [];

  // 1) Params & base section data
  const { sectionId } = req.params;
  const instructorId = req?.instructor?.id;
  console.log('[exportController] SectionId:', sectionId, 'InstructorId:', instructorId);
  if (!sectionId) return res.status(400).json({ message: 'Missing sectionId' });

  let section;
  try {
    section = await loadSection(sectionId);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 2) Authz
  try {
    authorizeInstructor(section, instructorId);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 403;
    return res.status(status).json({ message: err.message });
  }

  // 3) Activities + Scores
  let activities = [];
  try {
    activities = await loadActivities(section);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  const classStandingActivities = activities.filter((a) => a.category === 'classStanding');
  const laboratoryActivities = activities.filter((a) => a.category === 'laboratory');
  const majorOutputActivities = activities.filter((a) => a.category === 'majorOutput');

  const { classStanding: csWeight = 0, laboratory: labWeight = 0, majorOutput: moWeight = 0 } = section.gradingSchema || {};

  const allActivityIds = activities.map((a) => a._id);
  let activityScores = [];
  try {
    activityScores = await loadActivityScores(allActivityIds);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  const scoresByStudent = computeScoresByStudent(activityScores);

  // 4) Google clients
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

  // 5) Create spreadsheet
  const subjectCode = section.subject?.subjectCode || 'SUBJ';
  const sectionCodeForTitle = section.sectionCode || section.sectionName || '';
  const spreadsheetTitle = `${subjectCode}_${sectionCodeForTitle}_${section.schoolYear || ''}_${section.term || ''}`;
  console.log('[exportController] Preparing spreadsheet with title:', spreadsheetTitle);

  const desiredSheetTitleBase = `${subjectCode}_${section.sectionCode || section.sectionName || 'SECTION'}_${section.term || ''}`;
  const desiredSheetTitleNormalized = normalizeSheetTitleLength(desiredSheetTitleBase);

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

  // 6) Ensure spreadsheet is stored in configured Drive folder (new files only)
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

  // 7) Compose values for the sheet
  const headerData = [
    ['BUKIDNON STATE UNIVERSITY'],
    ['Malaybalay City, Bukidnon 8700'],
    ['Tel (088) 813-5661 to 5663; Telefax (088) 813-2717, www.buksu.edu.ph'],
    [],
    ['CLASS RECORD'],
  ];

  const sectionInfo = [
    ['Section Code:', section.sectionCode || 'N/A', '', 'Day:', section.schedule?.day || 'TF'],
    ['Subject Code:', section.subject?.subjectCode || 'N/A', '', 'Time:', section.schedule?.time || '7:30AM - 10:00AM'],
    ['Descriptive Title:', section.subject?.subjectName || 'N/A', '', 'Rm:', section.schedule?.room || 'Lab 3'],
    ['Semester:', `${section.term || ''} Sem`, '', 'Units:', section.subject?.units ?? 3],
    ['School Year:', section.schoolYear || 'N/A', '', 'Chair:', section.subject?.chair || 'Dr. Sales G. Aribe, Jr.'],
    ['Instructor:', section.instructor?.fullName || 'N/A', '', 'Dean:', section.subject?.dean || 'Dr. Marilou O. Espina'],
  ];

  const baseColumns = 3;
  const headerRows = {
    category: ['', '', ''],
    index: ['Ctrl No', 'ID Number', 'NAME'],
    title: ['', '', ''],
    maxScore: ['', '', ''],
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
  let activityCounter = 1;
  const allActs = [];

  for (const cfg of categoryConfigs) {
    if (!cfg.activities.length) continue;
    const start = columnCursor;
    cfg.activities.forEach((activity, idx) => {
      headerRows.category.push(idx === 0 ? cfg.label : '');
      headerRows.index.push(String(activityCounter++));
      headerRows.title.push(activity.title || `Activity ${activityCounter - 1}`);
      headerRows.maxScore.push(String(activity.maxScore ?? 100));
      allActs.push(activity);
      columnCursor += 1;
    });
    headerColorRanges.push({ start, end: columnCursor, color: cfg.color });
  }

  const finalGradeStart = columnCursor;
  // headerRows.category.push('Final Grade');
  // headerRows.index.push('FG');
  // headerRows.title.push('Final Grade');
  headerRows.maxScore.push('');
  // headerColorRanges.push({ start: finalGradeStart, end: finalGradeStart + 1, color: { red: 0.75, green: 0.75, blue: 0.75 } });
  columnCursor += 1;

  const totalColumns = headerRows.category.length;

  const studentRows = section.students.map((student, idx) => {
    const row = [String(idx + 1), student.studid || '', student.fullName || ''];

    for (const a of allActs) {
      const sMap = scoresByStudent[String(student._id)] || {};
      row.push(String(Number(sMap[String(a._id)] || 0)));
    }

    const csAvg = avgFor(classStandingActivities, student, scoresByStudent);
    const labAvg = avgFor(laboratoryActivities, student, scoresByStudent);
    const moAvg = avgFor(majorOutputActivities, student, scoresByStudent);

    // const finalPercent = (csAvg * csWeight) / 100 + (labAvg * labWeight) / 100 + (moAvg * moWeight) / 100;
    // row.push(percentToGrade(finalPercent).toFixed(2));
    return row;
  });

  const tableHeaderRows = [headerRows.category, headerRows.index, headerRows.title, headerRows.maxScore];

  const allData = [
    ...headerData,
    [],
    ...sectionInfo,
    [],
    ...tableHeaderRows,
    ...studentRows,
  ];

  // 8) Write values
  try {
    await writeValues(sheets, spreadsheetId, sheetTitle, allData);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({ message: err.message });
  }

  // 9) Apply formatting
  const headerRowCount = tableHeaderRows.length;
  const tableHeaderStartRow = headerData.length + 1 + sectionInfo.length + 1;
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
      finalGradeStart
    );
  } catch (err) {
    warnings.push(`Formatting failed: ${err.message}`);
  }

  // 10) Sharing (non-fatal)
  const instructorEmail = section?.instructor?.email || null;
  const shareRes = await tryShareWithInstructor(drive, spreadsheetId, instructorEmail);
  if (!shareRes.ok) warnings.push(`Could not share with instructor${instructorEmail ? ` (${instructorEmail})` : ''}: ${shareRes.message || 'unknown error'}`);

  const publicRes = await trySetPublicAccess(drive, spreadsheetId);
  if (!publicRes.ok) warnings.push(`Could not set public access: ${publicRes.message || 'unknown error'}`);

  const spreadsheetUrl =
    sheetId != null
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  console.log(`[exportController] Spreadsheet ready: ${spreadsheetUrl}`);

  // 11) Persist computed grades (non-fatal if some upserts fail)
  try {
    const results = await Promise.allSettled(
      section.students.map(async (student) => {
        const csAvg = avgFor(classStandingActivities, student, scoresByStudent);
        const labAvg = avgFor(laboratoryActivities, student, scoresByStudent);
        const moAvg = avgFor(majorOutputActivities, student, scoresByStudent);
        const finalPercent = (csAvg * csWeight) / 100 + (labAvg * labWeight) / 100 + (moAvg * moWeight) / 100;
        const finalGrade = percentToGrade(finalPercent);
        const remarks = finalPercent >= 75 ? 'Passed' : 'Failed';

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
    if (failed.length) warnings.push(`Grades persisted with ${failed.length} upsert error(s). Check server logs.`);
  } catch (err) {
    warnings.push(`Grade persistence failed: ${err?.message || err}`);
  }

  try {
    await Section.findByIdAndUpdate(
      section._id,
      {
        $set: {
          'exportMetadata.spreadsheetId': spreadsheetId,
          'exportMetadata.sheetId': sheetId,
          'exportMetadata.sheetTitle': sheetTitle,
          'exportMetadata.usedFallbackHub': usedFallbackHub,
          'exportMetadata.spreadsheetTitle': spreadsheetTitle,
          'exportMetadata.spreadsheetUrl': spreadsheetUrl,
          'exportMetadata.lastExportedAt': new Date(),
        },
      },
      { new: false }
    );
  } catch (err) {
    warnings.push(`Failed to record export metadata: ${err?.message || err}`);
  }

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
