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
const GOOGLE_SHARED_DRIVE_ID = process.env.GOOGLE_SHARED_DRIVE_ID?.trim() || null;

export const createSpreadsheet = async (sheets, title, forceServiceAccount = false, drive = null) => {
  // Try creating directly in shared drive first to bypass storage quota
  if (forceServiceAccount && drive && GOOGLE_SHARED_DRIVE_ID) {
    console.log('[googleSheetsService] Attempting to create spreadsheet directly in shared drive');
    try {
      const fileResp = await drive.files.create({
        requestBody: {
          name: title,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: [GOOGLE_SHARED_DRIVE_ID],
        },
        fields: 'id',
        supportsAllDrives: true
      });

      const spreadsheetId = fileResp?.data?.id;
      if (!spreadsheetId) throw new Error('Drive API did not return file id');

      // Get spreadsheet metadata
      const metaResp = await sheets.spreadsheets.get({ 
        spreadsheetId, 
        fields: 'sheets(properties(sheetId,title))' 
      });
      const sheetId = metaResp?.data?.sheets?.[0]?.properties?.sheetId;
      const sheetTitle = metaResp?.data?.sheets?.[0]?.properties?.title || 'Sheet1';
      
      console.log('[googleSheetsService] Successfully created spreadsheet in shared drive:', spreadsheetId);
      return { spreadsheetId, sheetId, sheetTitle };
    } catch (sharedDriveErr) {
      console.log('[googleSheetsService] Shared drive creation failed, falling back to regular creation:', sharedDriveErr.message);
    }
  }

  // Regular spreadsheet creation
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
    // If permission denied and we have been asked to force use of the service account,
    // try a Drive API fallback when a drive client is available and a target folder/shared drive
    // is configured. This helps when the service account can create files inside a specific
    // folder/shared drive but cannot create standalone files in its own Drive.
    if (isPermissionDenied && forceServiceAccount && drive) {
      try {
        const parents = [];
        if (GOOGLE_DRIVE_FOLDER_ID) parents.push(GOOGLE_DRIVE_FOLDER_ID);
        // If a shared drive id is configured and no explicit folder configured, prefer the shared drive root
        if (!parents.length && GOOGLE_SHARED_DRIVE_ID) parents.push(GOOGLE_SHARED_DRIVE_ID);

        const createParams = {
          requestBody: {
            name: title,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            ...(parents.length ? { parents } : {}),
          },
          fields: 'id',
          supportsAllDrives: true,
        };

        // If creating directly in a shared drive root, include driveId to be explicit
        if (parents.length === 1 && parents[0] === GOOGLE_SHARED_DRIVE_ID) {
          createParams.driveId = GOOGLE_SHARED_DRIVE_ID;
          createParams.corpora = 'drive';
        }

        const fileResp = await drive.files.create(createParams);
        const spreadsheetId = fileResp?.data?.id;
        if (!spreadsheetId) throw new Error('Drive API did not return file id');

        // Fetch spreadsheet metadata via Sheets API to obtain sheetId/title
        const metaResp = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets(properties(sheetId,title))' });
        const sheetId = metaResp?.data?.sheets?.[0]?.properties?.sheetId;
        const sheetTitle = metaResp?.data?.sheets?.[0]?.properties?.title || 'Sheet1';
        if (!spreadsheetId || sheetId == null) throw new Error('Sheets API did not return spreadsheet metadata');
        return { spreadsheetId, sheetId, sheetTitle };
      } catch (fallbackErr) {
        // Log full error response when available to aid debugging (API error bodies are often here)
        console.error('[googleSheetsService] Drive fallback failed creating spreadsheet:', {
          message: fallbackErr?.message,
          code: fallbackErr?.code || fallbackErr?.status,
          response: fallbackErr?.response?.data || fallbackErr?.response,
          errors: fallbackErr?.errors || fallbackErr?.response?.data?.error?.errors,
          stack: fallbackErr?.stack,
        });
        const friendly = fallbackErr?.response?.data?.error?.message || fallbackErr?.message || 'Unknown drive fallback error';
        throw new HttpError(403, `Failed creating spreadsheet with service account (drive fallback): ${friendly}`, { cause: fallbackErr?.message, details: fallbackErr?.response?.data });
      }
    }

    if (isPermissionDenied && !forceServiceAccount) {
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

/* -------------------------------------------------------------------------- */
/* RESTORED HELPERS                                                           */
/* -------------------------------------------------------------------------- */

/*
 * Delete a range of columns (COLUMNS dimension) on a sheet.
 * startIndex and endIndexExclusive use zero-based indexes and follow Sheets API semantics.
 * Example: to remove columns A+B, call deleteColumnsRange(sheets, ssId, sheetId, 0, 2)
 */
export const deleteColumnsRange = async (sheets, spreadsheetId, sheetId, startIndex, endIndexExclusive) => {
  try {
    if (startIndex == null || endIndexExclusive == null || endIndexExclusive <= startIndex) {
      return { ok: false, message: 'Invalid start/end indexes' };
    }
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex,
                endIndex: endIndexExclusive
              }
            }
          }
        ]
      }
    });
    return { ok: true };
  } catch (err) {
    console.error('[googleSheetsService] deleteColumnsRange error:', err);
    return { ok: false, message: err?.response?.data?.error?.message || err?.message || 'Failed deleting columns' };
  }
};

/*
 * Convenience wrapper to remove the first `numColumns` columns (left-most).
 * Example: removeLeadingColumns(sheets, ssId, sheetId, 2) removes columns A and B.
 */
export const removeLeadingColumns = async (sheets, spreadsheetId, sheetId, numColumns = 1) => {
  if (!Number.isInteger(numColumns) || numColumns <= 0) {
    return { ok: false, message: 'numColumns must be a positive integer' };
  }
  return await deleteColumnsRange(sheets, spreadsheetId, sheetId, 0, numColumns);
};

/*
 * Check the left-most column (A) for data across the first `checkRows` rows.
 * If all cells are blank, remove the left-most column (index 0).
 */
export const removeLeftmostColumnIfBlank = async (sheets, spreadsheetId, sheetId, checkRows = 40) => {
  try {
    // 1) Resolve sheet title from sheetId
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    });
    const sheetsList = meta?.data?.sheets || [];
    const target = sheetsList.find((s) => s?.properties?.sheetId === sheetId);
    if (!target) return { ok: false, message: 'Sheet not found by sheetId' };
    const title = target.properties.title || 'Sheet1';

    // 2) Read first column values up to checkRows
    const range = `${title}!A1:A${Math.max(1, Math.floor(checkRows))}`;
    const valuesResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      majorDimension: 'COLUMNS',
    });
    const col = valuesResp?.data?.values?.[0] || [];

    // 3) If any non-empty cell exists, don't delete
    const hasData = col.some((v) => v != null && String(v).trim() !== '');
    if (hasData) return { ok: true, message: 'Left column contains data; not removed' };

    // 4) Delete the left-most column (A)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 1,
              },
            },
          },
        ],
      },
    });

    return { ok: true, deleted: true, message: 'Left-most column removed' };
  } catch (err) {
    console.error('[googleSheetsService] removeLeftmostColumnIfBlank error:', err);
    return { ok: false, message: err?.response?.data?.error?.message || err?.message || 'Failed checking/removing left column' };
  }
};

/* -------------------------------------------------------------------------- */
/* KEEP existing robust helper that removes any leading empty columns         */
/* -------------------------------------------------------------------------- */

export const removeLeadingEmptyColumns = async (sheets, spreadsheetId, sheetId, checkRows = 40) => {
  try {
    // 1) Resolve sheet title from sheetId
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    });
    const sheetsList = meta?.data?.sheets || [];
    const target = sheetsList.find((s) => s?.properties?.sheetId === sheetId);
    if (!target) return { ok: false, message: 'Sheet not found by sheetId' };
    const title = target.properties.title || 'Sheet1';

    // 2) Read a wide range of top rows to detect first non-empty column
    const range = `${title}!A1:ZZ${Math.max(1, Math.floor(checkRows))}`;
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      majorDimension: 'ROWS',
    });
    const rows = resp?.data?.values || [];
    if (!rows.length) return { ok: true, deleted: false, message: 'No data found in top rows' };

    // Determine number of columns present in returned rows
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    if (maxCols === 0) {
      // Nothing present in range; delete entire A..ZZ? but safer: delete first column only
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ deleteDimension: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 } } }],
        },
      });
      return { ok: true, deleted: true, message: 'Deleted one leading column (no data detected)' };
    }

    // 3) Find first column index with any non-empty value in the sampled rows
    let firstNonEmptyCol = -1;
    for (let c = 0; c < maxCols; c++) {
      for (let r = 0; r < rows.length; r++) {
        const cell = (rows[r] && rows[r][c]) ?? '';
        if (cell != null && String(cell).trim() !== '') {
          firstNonEmptyCol = c;
          break;
        }
      }
      if (firstNonEmptyCol !== -1) break;
    }

    // If first non-empty column is at index 0, nothing to remove
    if (firstNonEmptyCol <= 0) {
      return { ok: true, deleted: false, message: 'No leading empty columns to remove' };
    }

    // 4) Delete all columns before firstNonEmptyCol
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: firstNonEmptyCol,
              },
            },
          },
        ],
      },
    });

    return { ok: true, deleted: true, removedCount: firstNonEmptyCol, message: `Removed ${firstNonEmptyCol} leading empty column(s)` };
  } catch (err) {
    console.error('[googleSheetsService] removeLeadingEmptyColumns error:', err);
    return { ok: false, message: err?.response?.data?.error?.message || err?.message || 'Failed checking/removing leading columns' };
  }
};

export const formatClassRecordLayout = async (sheets, spreadsheetId, sheetId, options = {}) => {
  const {
    // remove first N left-most columns to eliminate extra blank area (A, B, ...)
    // default 0 to avoid removing column A automatically; controller will call
    // removeLeadingColumnIfBlank when appropriate.
    removeLeadingColumns = 0,
    // column widths in pixels for columns starting at A (indexes 0,1,2,...).
    // Adjust array to match number of columns you want to size. Any missing columns will remain unchanged.
    columnWidths = [40, 120, 320, 60, 60, 60, 60, 60, 60, 80, 80, 80],
    // freeze top N rows (header/title area)
    freezeRows = 8,
    // optional merges to apply. Each merge is { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex }
    // indexes are zero-based and end indexes are exclusive (Sheets API semantics).
    merges = [
      // example: merge title row across many columns (adjust as needed)
      { startRowIndex: 0, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 12 },
      // example: merge main "CLASS RECORD" header
      { startRowIndex: 3, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 12 }
    ],
  } = options;

  try {
    const requests = [];

    // 1) Optionally delete leading columns (A..)
    if (Number.isInteger(removeLeadingColumns) && removeLeadingColumns > 0) {
      requests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: removeLeadingColumns
          }
        }
      });
      // After deleting columns, subsequent columnIndex based requests should still work (they reference current sheet state)
    }

    // 2) Set column widths
    for (let i = 0; i < columnWidths.length; i++) {
      const width = columnWidths[i];
      if (!Number.isFinite(width) || width <= 0) continue;
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: i,
            endIndex: i + 1
          },
          properties: {
            pixelSize: Math.round(width)
          },
          fields: 'pixelSize'
        }
      });
    }

    // 3) Freeze header rows
    if (Number.isInteger(freezeRows) && freezeRows >= 0) {
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: freezeRows }
          },
          fields: 'gridProperties.frozenRowCount'
        }
      });
    }

    // 4) Apply merges
    if (Array.isArray(merges) && merges.length) {
      for (const m of merges) {
        if (
          m == null ||
          m.startRowIndex == null ||
          m.endRowIndex == null ||
          m.startColumnIndex == null ||
          m.endColumnIndex == null
        ) continue;
        requests.push({
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: m.startRowIndex,
              endRowIndex: m.endRowIndex,
              startColumnIndex: m.startColumnIndex,
              endColumnIndex: m.endColumnIndex
            },
            mergeType: 'MERGE_ALL'
          }
        });
      }
    }

    if (!requests.length) return { ok: true, message: 'No layout changes requested' };

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });

    return { ok: true };
  } catch (err) {
    console.error('[googleSheetsService] formatClassRecordLayout error:', err);
    return { ok: false, message: err?.response?.data?.error?.message || err?.message || 'Failed applying layout' };
  }
};

export const createDriveFolder = async (drive, folderName, parentFolderId) => {
  if (!folderName) return { ok: false, message: 'Folder name required' };
  try {
    const requestBody = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) requestBody.parents = [parentFolderId];

    // If the parentFolderId equals the configured shared drive id, use drive-specific params
    const createParams = {
      requestBody,
      fields: 'id, name',
      supportsAllDrives: true,
    };

    if (parentFolderId && GOOGLE_SHARED_DRIVE_ID && parentFolderId === GOOGLE_SHARED_DRIVE_ID) {
      // create in the shared drive root
      createParams.driveId = GOOGLE_SHARED_DRIVE_ID;
      createParams.corpora = 'drive';
      // it's fine to keep parents set to the shared drive id in case a folder id is required
    }

    const resp = await drive.files.create(createParams);
    const folderId = resp?.data?.id;
    if (!folderId) return { ok: false, message: 'Drive API did not return folder id' };
    return { ok: true, id: folderId, name: resp.data.name };
  } catch (err) {
    return { ok: false, message: err?.response?.data?.error?.message || err?.message };
  }
};

export const findOrCreateSectionFolder = async (drive, sectionFolderName, parentFolderId) => {
  if (!sectionFolderName) return { ok: false, message: 'Section folder name required' };
  if (!parentFolderId) return { ok: false, message: 'Parent folder ID required' };

  try {
    // Step 1: Search for existing folder with the section name
    console.log('[googleSheetsService] Searching for existing folder:', sectionFolderName, 'in parent:', parentFolderId);
    
    const searchParams = {
      q: `name='${sectionFolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
    };

    // Handle shared drive search if applicable
    if (GOOGLE_SHARED_DRIVE_ID && (parentFolderId === GOOGLE_SHARED_DRIVE_ID || parentFolderId.startsWith('0'))) {
      searchParams.driveId = GOOGLE_SHARED_DRIVE_ID;
      searchParams.corpora = 'drive';
      // When specifying a driveId or corpora=drive, Drive API requires includeItemsFromAllDrives=true
      // to allow listing items across shared drives.
      searchParams.includeItemsFromAllDrives = true;
    }

    const searchResp = await drive.files.list(searchParams);
    const existingFolders = searchResp?.data?.files || [];

    if (existingFolders.length > 0) {
      // Found existing folder - return it
      const existingFolder = existingFolders[0];
      console.log('[googleSheetsService] Found existing section folder:', existingFolder.name, 'ID:', existingFolder.id);
      return { ok: true, id: existingFolder.id, name: existingFolder.name, wasExisting: true };
    }

    // Step 2: No existing folder found, create a new one
    console.log('[googleSheetsService] No existing section folder found, creating new folder:', sectionFolderName);
    const createResult = await createDriveFolder(drive, sectionFolderName, parentFolderId);
    
    if (createResult.ok) {
      console.log('[googleSheetsService] Successfully created section folder:', sectionFolderName, 'ID:', createResult.id);
      return { ok: true, id: createResult.id, name: createResult.name, wasExisting: false };
    } else {
      return createResult; // Pass through the error from createDriveFolder
    }

  } catch (err) {
    console.error('[googleSheetsService] Error in findOrCreateSectionFolder:', err);
    return { 
      ok: false, 
      message: err?.response?.data?.error?.message || err?.message || 'Failed to find or create section folder'
    };
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


// Export only the constants here (functions are exported where declared)
export { EXPORT_HUB_SPREADSHEET_ID, GOOGLE_DRIVE_FOLDER_ID };

