// services/sheetFormattingService.js
import { HttpError, createHeaderStyle } from '../utils/googleSheetsHelpers.js';

export const applyFormatting = async (
  sheets,
  spreadsheetId,
  sheetId,
  columnCount,
  titleRowCount,
  headerStartRow,
  headerRowCount,
  colorRanges = [],
  staticColumnCount = 0,
  finalGradeColumnStart = columnCount
) => {
  const frozenRowCount = headerStartRow + headerRowCount;
  const requests = [
    // Merge logo cell vertically (rows 0-2, columns A-B)
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
        mergeType: 'MERGE_ALL',
      },
    },
    // Style logo cell - center alignment
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
        cell: { 
          userEnteredFormat: { 
            horizontalAlignment: 'CENTER', 
            verticalAlignment: 'MIDDLE'
          } 
        },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)',
      },
    },
    // Merge top title rows - text starts at column C
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 2, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 2, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 2, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    // Title region styles
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 2, endColumnIndex: columnCount },
        cell: { userEnteredFormat: {  horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: true, fontSize: 12, fontFamily: 'Book Antiqua' } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 2, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: false, fontSize: 10, fontFamily: 'Book Antiqua' } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 2, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: false, fontSize: 9, fontFamily: 'Book Antiqua', foregroundColor: { red: 0.06, green: 0.33, blue: 0.8 } } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    // CLASS RECORD title
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 2, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', textFormat: { bold: true, fontSize: 12, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat(horizontalAlignment,textFormat)',
      },
    },
    // Section info labels - make them bold (column C, rows 6-11)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 12, startColumnIndex: 2, endColumnIndex: 3 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    // Section info values (column E, rows 6-11)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 12, startColumnIndex: 4, endColumnIndex: 5 },
        cell: { userEnteredFormat: { textFormat: { fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    // Right side labels - Day, Time, Rm, Units, Chair, Dean (column I, rows 6-11)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 12, startColumnIndex: 8, endColumnIndex: 9 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    // Right side values (column J, rows 6-11)
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 12, startColumnIndex: 9, endColumnIndex: 10 },
        cell: { userEnteredFormat: { textFormat: { fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat.textFormat',
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
    // Remove frozen rows
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 0 } },
        fields: 'gridProperties.frozenRowCount',
      },
    },
  ];

  // Apply category colors and merge headers
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
    
    if (range.start >= staticColumnCount) {
      requests.push({
        mergeCells: {
          range: {
            sheetId,
            startRowIndex: headerStartRow,
            endRowIndex: headerStartRow + 1,
            startColumnIndex: range.start,
            endColumnIndex: range.end,
          },
          mergeType: 'MERGE_ALL',
        },
      });
    }
  }

  // Merge base column headers vertically
  requests.push(
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: headerStartRow + 1,
          endRowIndex: headerStartRow + 3,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: headerStartRow + 1,
          endRowIndex: headerStartRow + 3,
          startColumnIndex: 3,
          endColumnIndex: 4,
        },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: headerStartRow + 1,
          endRowIndex: headerStartRow + 3,
          startColumnIndex: 4,
          endColumnIndex: 5,
        },
        mergeType: 'MERGE_ALL',
      },
    }
  );

  // Center-align and border base columns
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: headerStartRow + 1,
        endRowIndex: headerStartRow + 3,
        startColumnIndex: 2,
        endColumnIndex: 5,
      },
      cell: { 
        userEnteredFormat: { 
          horizontalAlignment: 'CENTER', 
          verticalAlignment: 'MIDDLE',
          borders: {
            top: { style: 'SOLID' },
            bottom: { style: 'SOLID' },
            left: { style: 'SOLID' },
            right: { style: 'SOLID' },
          }
        } 
      },
      fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,borders)',
    },
  });

  // Apply text rotation to activity titles
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
        cell: { userEnteredFormat: { textRotation: { angle: -90 }, textFormat: { bold: false, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat(textRotation,textFormat)',
      },
    });
  }

  // Column sizing
  requests.push(
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 80 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
        properties: { pixelSize: 10 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
        properties: { pixelSize: 50 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
        properties: { pixelSize: 100 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
        properties: { pixelSize: 180 },
        fields: 'pixelSize',
      },
    }
  );

  if (finalGradeColumnStart > staticColumnCount) {
    requests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: staticColumnCount, endIndex: finalGradeColumnStart },
        properties: { pixelSize: 50 },
        fields: 'pixelSize',
      },
    });
  }

  // Row heights
  requests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 3 },
      properties: { pixelSize: 30 },
      fields: 'pixelSize',
    },
  });

  try {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  } catch (err) {
    throw new HttpError(500, 'Failed applying formatting to sheet', { cause: err?.message });
  }
};

export const addStudentDataBorders = async (sheets, spreadsheetId, sheetId, tableHeaderStartRow, headerRowCount, studentRowCount, totalColumns) => {
  try {
    const dataStartRow = tableHeaderStartRow + headerRowCount;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: dataStartRow,
                endRowIndex: dataStartRow + studentRowCount,
                startColumnIndex: 2,
                endColumnIndex: totalColumns,
              },
              cell: {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              fields: 'userEnteredFormat.borders',
            },
          },
        ],
      },
    });
  } catch (err) {
    throw new HttpError(500, 'Failed adding borders to student data', { cause: err?.message });
  }
};

/* -------------------------------------------------------------------------- */
/* Final Grade Formatting                                                     */
/* -------------------------------------------------------------------------- */
export const applyFinalGradeFormatting = async (
  sheets,
  spreadsheetId,
  sheetId,
  columnCount,
  titleRowCount,
  headerStartRow,
  headerRowCount,
  colorRanges = [],
  staticColumnCount = 0,
  finalGradeColumnStart = columnCount
) => {
  const frozenRowCount = headerStartRow + headerRowCount;
  const requests = [
    // Merge top title rows - university name and contact info
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    // Title region styles
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: true, fontSize: 12, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: false, fontSize: 10, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: false, fontSize: 9, fontFamily: 'Arial', foregroundColor: { red: 0.06, green: 0.33, blue: 0.8 } } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    // HYBRID-FLEXIBLE LEARNING GRADE SHEET title
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', textFormat: { bold: true, fontSize: 12, fontFamily: 'Arial' } } },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,textFormat)',
      },
    },
    // Section info row merges - merge value cells across columns to match image layout
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 1, endColumnIndex: 6 },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 7, endRowIndex: 8, startColumnIndex: 1, endColumnIndex: 6 },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 8, endRowIndex: 9, startColumnIndex: 1, endColumnIndex: 6 },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: { sheetId, startRowIndex: 9, endRowIndex: 10, startColumnIndex: 1, endColumnIndex: columnCount },
        mergeType: 'MERGE_ALL',
      },
    },
    // Section info labels bold with borders and font size
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 10, startColumnIndex: 0, endColumnIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontFamily: 'Arial', fontSize: 10 }, borders: { top: { style: 'SOLID' }, bottom: { style: 'SOLID' }, left: { style: 'SOLID' }, right: { style: 'SOLID' } } } },
        fields: 'userEnteredFormat',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 9, startColumnIndex: 6, endColumnIndex: 7 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontFamily: 'Arial', fontSize: 10 }, borders: { top: { style: 'SOLID' }, bottom: { style: 'SOLID' }, left: { style: 'SOLID' }, right: { style: 'SOLID' } } } },
        fields: 'userEnteredFormat',
      },
    },
    // Section info values with borders and font size
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 9, startColumnIndex: 1, endColumnIndex: 6 },
        cell: { userEnteredFormat: { textFormat: { fontFamily: 'Arial', fontSize: 10 }, borders: { top: { style: 'SOLID' }, bottom: { style: 'SOLID' }, left: { style: 'SOLID' }, right: { style: 'SOLID' } } } },
        fields: 'userEnteredFormat',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 6, endRowIndex: 9, startColumnIndex: 7, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { textFormat: { fontFamily: 'Arial', fontSize: 10 }, borders: { top: { style: 'SOLID' }, bottom: { style: 'SOLID' }, left: { style: 'SOLID' }, right: { style: 'SOLID' } } } },
        fields: 'userEnteredFormat',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 9, endRowIndex: 10, startColumnIndex: 1, endColumnIndex: columnCount },
        cell: { userEnteredFormat: { textFormat: { fontFamily: 'Arial', fontSize: 10 }, borders: { top: { style: 'SOLID' }, bottom: { style: 'SOLID' }, left: { style: 'SOLID' }, right: { style: 'SOLID' } } } },
        fields: 'userEnteredFormat',
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
  ];

  // Apply category colors and merge headers with font styling
  for (const range of colorRanges) {
    if (range.start == null || range.end == null || !range.color) continue;
    
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: headerStartRow,
          endRowIndex: headerStartRow + 1,
          startColumnIndex: range.start,
          endColumnIndex: range.end,
        },
        cell: { userEnteredFormat: { backgroundColor: range.color, textFormat: { bold: true, fontFamily: 'Arial', fontSize: 10 } } },
        fields: 'userEnteredFormat',
      },
    });
    
    // Merge category headers (first row)
    if (range.start >= staticColumnCount) {
      requests.push({
        mergeCells: {
          range: {
            sheetId,
            startRowIndex: headerStartRow,
            endRowIndex: headerStartRow + 1,
            startColumnIndex: range.start,
            endColumnIndex: range.end,
          },
          mergeType: 'MERGE_ALL',
        },
      });
    }
  }

  // Merge base column headers vertically (No., Student No., Name of Students)
  requests.push(
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: headerStartRow,
          endRowIndex: headerStartRow + 2,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: headerStartRow,
          endRowIndex: headerStartRow + 2,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        mergeType: 'MERGE_ALL',
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: headerStartRow,
          endRowIndex: headerStartRow + 2,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        mergeType: 'MERGE_ALL',
      },
    }
  );

  // Center-align and border all headers
  requests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: headerStartRow,
        endRowIndex: headerStartRow + 2,
        startColumnIndex: 0,
        endColumnIndex: columnCount,
      },
      cell: { 
        userEnteredFormat: { 
          horizontalAlignment: 'CENTER', 
          verticalAlignment: 'MIDDLE',
          borders: {
            top: { style: 'SOLID' },
            bottom: { style: 'SOLID' },
            left: { style: 'SOLID' },
            right: { style: 'SOLID' },
          }
        } 
      },
      fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment,borders)',
    },
  });

  // Column sizing for final grade sheet
  requests.push(
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 150 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
        properties: { pixelSize: 130 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
        properties: { pixelSize: 250 },
        fields: 'pixelSize',
      },
    }
  );

  // Set column widths for grade columns (uniform width)
  if (columnCount > 3) {
    requests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: columnCount },
        properties: { pixelSize: 85 },
        fields: 'pixelSize',
      },
    });
  }

  try {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  } catch (err) {
    throw new HttpError(500, 'Failed applying final grade formatting to sheet', { cause: err?.message });
  }
};

export const addFinalGradeStudentDataBorders = async (sheets, spreadsheetId, sheetId, tableHeaderStartRow, headerRowCount, studentRowCount, totalColumns) => {
  try {
    const dataStartRow = tableHeaderStartRow + headerRowCount;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: dataStartRow,
                endRowIndex: dataStartRow + studentRowCount,
                startColumnIndex: 0,
                endColumnIndex: totalColumns,
              },
              cell: {
                userEnteredFormat: {
                  borders: {
                    top: { style: 'SOLID' },
                    bottom: { style: 'SOLID' },
                    left: { style: 'SOLID' },
                    right: { style: 'SOLID' },
                  },
                },
              },
              fields: 'userEnteredFormat.borders',
            },
          },
          // Center align No. and Student No. columns
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: dataStartRow,
                endRowIndex: dataStartRow + studentRowCount,
                startColumnIndex: 0,
                endColumnIndex: 2,
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)',
            },
          },
        ],
      },
    });
  } catch (err) {
    throw new HttpError(500, 'Failed adding borders to final grade student data', { cause: err?.message });
  }
};

