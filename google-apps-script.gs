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

/* ---- Shared email template helpers ---- */
function esc_(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function row_(label,value){
  return '<tr><td style="padding:9px 0;border-bottom:1px solid #eef1f7;color:#5b6478;width:150px;vertical-align:top;font-size:13px">'+esc_(label)+'</td>'
       + '<td style="padding:9px 0;border-bottom:1px solid #eef1f7;color:#1c2236;font-weight:600;font-size:14px">'+esc_(value)+'</td></tr>';
}
function shell_(title,intro,rows,note){
  return '<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px">'
   + '<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e7eaf1;border-radius:10px;overflow:hidden">'
   + '<div style="background:#1B2B6B;padding:20px 28px"><div style="font-size:18px;font-weight:bold;color:#ffffff">The XL Academy</div>'
   + '<div style="font-size:13px;color:#c4cdec;margin-top:3px">'+esc_(title)+'</div></div>'
   + '<div style="padding:24px 28px"><p style="margin:0 0 14px;font-size:14px;color:#333333">'+esc_(intro)+'</p>'
   + '<table style="width:100%;border-collapse:collapse">'+rows+'</table>'+(note||'')+'</div>'
   + '<div style="background:#f4f6fb;padding:14px 28px;font-size:12px;color:#5b6478;text-align:center">Submitted via thexlacademy.com</div>'
   + '</div></div>';
}

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

    var rows = row_('Name', d.name) + row_('Phone', d.mobile) + row_('Email', d.email)
             + row_('Preferred City', d.city) + row_('Source', d.source) + row_('Time', ts);
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      cc: CC_EMAILS,
      replyTo: d.email || NOTIFY_EMAIL,
      subject: 'Website New Enquiry — Popup',
      body:
        'New free demo class enquiry from the website:\n\n' +
        'Name: ' + (d.name || '') + '\nPhone: ' + (d.mobile || '') + '\nEmail: ' + (d.email || '') +
        '\nPreferred City: ' + (d.city || '') + '\nSource: ' + (d.source || '') + '\nTime: ' + ts + '\n',
      htmlBody: shell_('New Demo Class Enquiry', 'A new free demo class enquiry was submitted from the website.', rows, '')
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
