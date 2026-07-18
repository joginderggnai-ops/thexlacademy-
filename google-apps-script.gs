/**
 * The XL Academy — Demo Enquiry handler
 * Receives popup form submissions, appends a row to the Google Sheet,
 * and emails a notification.
 *
 * ─── SETUP (one time) ───────────────────────────────────────────────
 * 1. Open your sheet:
 *    https://docs.google.com/spreadsheets/d/1yUgv6gJDSsmav-eDvUfg7rzkRwi-hUE3NDpJc_ZF-Xw/edit
 * 2. Extensions ▸ Apps Script.
 * 3. Delete any sample code, paste EVERYTHING from this file, and Save.
 * 4. Deploy ▸ New deployment ▸ (gear) Web app.
 *      - Description: Demo form
 *      - Execute as:   Me (your Google account)
 *      - Who has access: Anyone
 *    Click Deploy, authorise when prompted, and COPY the Web app URL
 *    (it looks like https://script.google.com/macros/s/AKfyc…/exec).
 * 5. Paste that URL into components.js as the value of DEMO_ENDPOINT.
 *
 * To change the code later, edit here and Deploy ▸ Manage deployments ▸
 * (pencil) ▸ Version: New version ▸ Deploy. The URL stays the same.
 * ────────────────────────────────────────────────────────────────────
 */

var SHEET_ID     = '1yUgv6gJDSsmav-eDvUfg7rzkRwi-hUE3NDpJc_ZF-Xw';
var SHEET_NAME   = 'Leads';                 // tab name; created if missing
var NOTIFY_EMAIL = 'support@thexlacademy.com'; // primary recipient
var CC_EMAILS    = 'Analyticsproschool@gmail.com, masteranalytics.india@gmail.com'; // cc

function doPost(e) {
  try {
    var d = (e && e.parameter) ? e.parameter : {};

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Write header row once
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Full Name', 'Phone', 'Email', 'Preferred City', 'Source']);
    }

    var ts = new Date();
    sheet.appendRow([
      ts,
      d.name  || '',
      d.mobile || '',
      d.email || '',
      d.city  || '',
      d.source || ''
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      cc: CC_EMAILS,
      subject: 'New Demo Enquiry — ' + (d.name || 'Website'),
      body:
        'New free demo class enquiry from the website:\n\n' +
        'Name:           ' + (d.name || '') + '\n' +
        'Phone:          ' + (d.mobile || '') + '\n' +
        'Email:          ' + (d.email || '') + '\n' +
        'Preferred City: ' + (d.city || '') + '\n' +
        'Source:         ' + (d.source || '') + '\n' +
        'Time:           ' + ts + '\n'
    });

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment works.
function doGet() {
  return ContentService
    .createTextOutput('The XL Academy demo form endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
