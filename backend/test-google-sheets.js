/**
 * Google Sheets Export - Test Script
 * 
 * This script tests the Google Sheets API configuration
 * Run this to verify your setup is working correctly
 * 
 * Usage: node test-google-sheets.js
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Google Sheets & Drive Configuration...\n');

// Test 1: Check Environment Variables
console.log('✅ Test 1: Environment Variables');
const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
const hasProjectId = !!process.env.GOOGLE_PROJECT_ID;

console.log(`   Service Account Email: ${hasEmail ? '✓' : '✗'}`);
console.log(`   Private Key: ${hasKey ? '✓' : '✗'}`);
console.log(`   Project ID: ${hasProjectId ? '✓' : '✗'}`);

if (!hasEmail || !hasKey) {
  console.error('\n❌ Missing required environment variables!');
  console.error('   Please check your .env file');
  process.exit(1);
}

// Test 2: Initialize Auth
console.log('\n✅ Test 2: Google Authentication');
let auth;
try {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  
  // Normalize key
  rawKey = rawKey.trim();
  if ((rawKey.startsWith('"') && rawKey.endsWith('"')) ||
      (rawKey.startsWith("'") && rawKey.endsWith("'")) ||
      (rawKey.startsWith("`") && rawKey.endsWith("`"))) {
    rawKey = rawKey.slice(1, -1);
  }
  const privateKey = rawKey.replace(/\\n/g, "\n");

  auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  console.log('   JWT Client Created: ✓');
} catch (error) {
  console.error('   Failed to create auth client: ✗');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Test 3: Authorize
console.log('\n✅ Test 3: Authorization');
try {
  await auth.authorize();
  console.log('   Authorization Successful: ✓');
} catch (error) {
  console.error('   Authorization Failed: ✗');
  console.error('   Error:', error.message);
  process.exit(1);
}

// Test 4: Test Sheets API
console.log('\n✅ Test 4: Google Sheets API');
try {
  const sheets = google.sheets({ version: "v4", auth });
  
  // Try to get info about a spreadsheet (using the hub spreadsheet from .env)
  if (process.env.EXPORT_HUB_SPREADSHEET_ID) {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.EXPORT_HUB_SPREADSHEET_ID,
    });
    console.log('   Sheets API Access: ✓');
    console.log(`   Test Spreadsheet Title: "${response.data.properties.title}"`);
  } else {
    console.log('   Sheets API Client Created: ✓');
    console.log('   (Skipping actual API call - no test spreadsheet ID)');
  }
} catch (error) {
  console.error('   Sheets API Failed: ✗');
  console.error('   Error:', error.message);
  
  if (error.message.includes('not enabled')) {
    console.error('\n   💡 Solution: Enable Google Sheets API');
    console.error('   URL: https://console.cloud.google.com/apis/library/sheets.googleapis.com');
  } else if (error.message.includes('permission')) {
    console.error('\n   💡 Solution: Check service account permissions');
  }
  process.exit(1);
}

// Test 5: Test Drive API
console.log('\n✅ Test 5: Google Drive API');
try {
  const drive = google.drive({ version: "v3", auth });
  
  // List files (limited to 1)
  const response = await drive.files.list({
    pageSize: 1,
    fields: 'files(id, name)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  
  console.log('   Drive API Access: ✓');
  
  if (response.data.files && response.data.files.length > 0) {
    console.log(`   Sample File Found: "${response.data.files[0].name}"`);
  } else {
    console.log('   No files found (this is normal for new service accounts)');
  }
} catch (error) {
  console.error('   Drive API Failed: ✗');
  console.error('   Error:', error.message);
  
  if (error.message.includes('not enabled')) {
    console.error('\n   💡 Solution: Enable Google Drive API');
    console.error('   URL: https://console.cloud.google.com/apis/library/drive.googleapis.com');
  }
  process.exit(1);
}

// Test 6: Check Optional Configuration
console.log('\n✅ Test 6: Optional Configuration');
const parentFolder = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
const sharedDrive = process.env.GOOGLE_SHARED_DRIVE_ID;
const hubSpreadsheet = process.env.EXPORT_HUB_SPREADSHEET_ID;

console.log(`   Parent Folder ID: ${parentFolder ? '✓ Configured' : '○ Not set (optional)'}`);
console.log(`   Shared Drive ID: ${sharedDrive ? '✓ Configured' : '○ Not set (optional)'}`);
console.log(`   Hub Spreadsheet ID: ${hubSpreadsheet ? '✓ Configured' : '○ Not set (recommended)'}`);

// Test 7: Check Drive Quota
console.log('\n✅ Test 7: Storage Quota');
try {
  const drive = google.drive({ version: "v3", auth });
  const about = await drive.about.get({
    fields: 'storageQuota(limit,usage,usageInDrive)',
    supportsAllDrives: true,
  });
  
  const quota = about.data.storageQuota;
  if (quota.limit && quota.usage) {
    const used = parseInt(quota.usage);
    const limit = parseInt(quota.limit);
    const percent = ((used / limit) * 100).toFixed(1);
    const usedGB = (used / (1024 ** 3)).toFixed(2);
    const limitGB = (limit / (1024 ** 3)).toFixed(2);
    
    console.log(`   Storage Used: ${usedGB} GB / ${limitGB} GB (${percent}%)`);
    
    if (percent > 90) {
      console.warn('   ⚠️  Warning: Storage is almost full!');
    } else {
      console.log('   Storage Status: ✓');
    }
  } else {
    console.log('   Storage: Unlimited (Shared Drive or Workspace account)');
  }
} catch (error) {
  console.log('   Could not check quota (this is normal for some accounts)');
}

// Final Report
console.log('\n═══════════════════════════════════════════════');
console.log('🎉 All Tests Passed!');
console.log('═══════════════════════════════════════════════');
console.log('\nYour Google Sheets & Drive integration is working correctly!');
console.log('\n📝 Next Steps:');
console.log('   1. Start your backend server: npm run dev');
console.log('   2. Go to Grade Management in the frontend');
console.log('   3. Click "Export to Google Sheets"');
console.log('   4. Check your Google Drive for the exported file');
console.log('\n📚 For detailed setup: Read GOOGLE_SHEETS_SETUP.md');
console.log('🚀 Quick start guide: Read GOOGLE_DRIVE_QUICK_START.md\n');
