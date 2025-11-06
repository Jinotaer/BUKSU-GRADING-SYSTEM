// services/googleSheetsService.js
import { google } from 'googleapis';
import { 
  HttpError, 
  getGoogleClients, 
  buildTitleCandidates, 
  isDuplicateSheetError,
  toA1Notation 
} from '../utils/googleSheetsHelpers.js';

const EXPORT_HUB_SPREADSHEET_ID = process.env.EXPORT_HUB_SPREADSHEET_ID?.trim() || null;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;

export const createSpreadsheet = async (sheets, title) => {
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
    console.error('[googleSheetsService] Failed creating spreadsheet:', {
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

export const addSheetToFallback = async (sheets, hubSpreadsheetId, desiredTitle) => {
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

export const writeValues = async (sheets, spreadsheetId, sheetTitle, values) => {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: toA1Notation(sheetTitle, 'A1'),
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (err) {
    throw new HttpError(500, 'Failed writing values to sheet', { cause: err?.message });
  }
};

export const clearSheetContents = async (sheets, spreadsheetId, sheetTitle) => {
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: toA1Notation(sheetTitle, ''),
    });
  } catch (err) {
    throw new HttpError(500, 'Failed clearing existing sheet contents', { cause: err?.message });
  }
};

export const resetSheet = async (sheets, spreadsheetId, sheetId, sheetTitle) => {
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

export const resolveExistingSheet = async (sheets, spreadsheetId, preferredSheetId, preferredTitle) => {
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

export const setSheetTitle = async (sheets, spreadsheetId, sheetId, desiredTitle) => {
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

export const moveFileToFolder = async (drive, spreadsheetId, targetFolderId) => {
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

export const tryShareWithInstructor = async (drive, spreadsheetId, email) => {
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

export const trySetPublicAccess = async (drive, spreadsheetId) => {
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

export const insertLogo = async (sheets, spreadsheetId, sheetId, logoUrl) => {
  try {
    if (!logoUrl) return { ok: false, message: 'No logo URL provided' };
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateCells: {
              rows: [
                {
                  values: [
                    {
                      userEnteredValue: {
                        formulaValue: `=IMAGE("${logoUrl}", 1)`,
                      },
                    },
                  ],
                },
              ],
              fields: 'userEnteredValue',
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 1,
              },
            },
          },
        ],
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.message || 'Failed to insert logo' };
  }
};

export { EXPORT_HUB_SPREADSHEET_ID, GOOGLE_DRIVE_FOLDER_ID };
