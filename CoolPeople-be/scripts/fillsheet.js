const fs = require('fs');
const path = require('path');
const { google } = require('googleapis'); // ✅ Import Google API

// Load mergedCandidates.json from same directory
const filePath = path.join(__dirname, 'mergedCandidates.json');
const mergedCandidates = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
console.log(`Loaded ${mergedCandidates.length} candidates`);

// Load service account credentials
const KEYFILEPATH = path.join(__dirname, 'google-service-account.json');
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Set Google Sheet details
const SPREADSHEET_ID = '1sco98COvn3x35wTZUg64TwBq6NNO1DWEPnDmfhSHUJw'; // ✅ JUST the ID
const SHEET_NAME = 'Sheet1';

async function writeToSheet() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const headers = ['name', 'office', 'totalRaised'];

  const rows = [
    headers,
    ...mergedCandidates.map(candidate => headers.map(h => candidate[h] ?? ''))
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });

  console.log(`✅ Successfully wrote ${mergedCandidates.length} candidates to Google Sheet.`);
}

writeToSheet().catch(console.error);
