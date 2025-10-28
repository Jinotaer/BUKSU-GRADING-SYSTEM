import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Google Sheets API...\n');

// Initialize auth
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
rawKey = rawKey.trim();
if (rawKey.startsWith('"') || rawKey.startsWith("'") || rawKey.startsWith('`')) {
  rawKey = rawKey.slice(1, -1);
}
const privateKey = rawKey.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email,
  key: privateKey,
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

try {
  console.log('1. Authorizing...');
  await auth.authorize();
  console.log('✅ Authorization successful\n');

  console.log('2. Testing Sheets API - Creating test spreadsheet...');
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'TEST_EXPORT_' + Date.now()
      }
    }
  });
  
  const spreadsheetId = response.data.spreadsheetId;
  console.log('✅ Spreadsheet created successfully!');
  console.log('   Spreadsheet ID:', spreadsheetId);
  console.log('   URL: https://docs.google.com/spreadsheets/d/' + spreadsheetId);
  
  console.log('\n✅ All tests passed! Your Google Sheets integration is working.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('   Code:', error.code);
  
  if (error.code === 403) {
    console.error('\n🔧 SOLUTION:');
    console.error('   1. Go to: https://console.cloud.google.com/apis/dashboard?project=grading-system-472908');
    console.error('   2. Make sure Google Sheets API shows "Enabled"');
    console.error('   3. Wait 5-10 minutes after enabling');
    console.error('   4. If still failing, try creating a NEW service account');
  }
}
