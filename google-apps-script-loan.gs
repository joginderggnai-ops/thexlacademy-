/**
 * The XL Academy — Education Loan Application handler
 * Emails every submission (with the uploaded documents attached) to the
 * address below. It does NOT use Google Drive or Google Sheets.
 *
 * This is a SEPARATE Apps Script / deployment from the popup demo form.
 *
 * ─── SETUP (one time) ───────────────────────────────────────────────
 * 1. Go to https://script.google.com ▸ New project
 *    (no sheet needed — this only sends email).
 * 2. Delete any sample code, paste EVERYTHING from this file, Save.
 * 3. Deploy ▸ New deployment ▸ (gear) Web app.
 *      - Execute as:     Me
 *      - Who has access: Anyone
 *    Deploy, authorise (it will ask for permission to send email),
 *    and COPY the Web app URL (ends in /exec).
 * 4. Paste that URL into education-loan.html as the value of LOAN_ENDPOINT.
 * ────────────────────────────────────────────────────────────────────
 */

var NOTIFY_EMAIL = 'support@thexlacademy.com'; // primary recipient
var CC_EMAILS    = 'Analyticsproschool@gmail.com, masteranalytics.india@gmail.com'; // cc

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ts = new Date();

    // Base name for attachments, e.g. APS123_First_Last
    var base = ((d.studentId || 'NOID') + '_' + (d.fname || '') + '_' + (d.lname || ''))
                 .replace(/[^A-Za-z0-9_\-]/g, '');

    // Turn each uploaded file into an email attachment (skip missing ones)
    var docKeys = [
      ['aadhaarFront', 'AadhaarFront'],
      ['aadhaarBack',  'AadhaarBack'],
      ['panCard',      'PAN'],
      ['photo',        'Photo'],
      ['bankStatement','BankStatement']
    ];

    var attachments = [];
    var f = d.files || {};
    docKeys.forEach(function (k) {
      var doc = f[k[0]];
      if (doc && doc.data) {
        var name = base + '_' + k[1] + extFor(doc.type, doc.name);
        attachments.push(
          Utilities.newBlob(Utilities.base64Decode(doc.data),
                            doc.type || 'application/octet-stream', name)
        );
      }
    });

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      cc: CC_EMAILS,
      subject: 'New Loan Application — ' + (d.fname || '') + ' ' + (d.lname || ''),
      body:
        'New education loan application:\n\n' +
        'Student ID:     ' + (d.studentId || '') + '\n' +
        'Name:           ' + (d.fname || '') + ' ' + (d.lname || '') + '\n' +
        'Mobile:         ' + (d.mobile || '') + '\n' +
        'Alternate No:   ' + (d.altMobile || '') + '\n' +
        'Email:          ' + (d.email || '') + '\n' +
        'Course Opted:   ' + (d.course || '') + '\n' +
        'Loan Amount:    ' + (d.loanAmount || '') + '\n' +
        'Address:        ' + (d.address || '') + '\n' +
        'Bank Stmt Pwd:  ' + (d.bankPassword || '') + '\n' +
        'Source:         ' + (d.source || '') + '\n' +
        'Time:           ' + ts + '\n\n' +
        'Documents are attached to this email (' + attachments.length + ' file(s)).',
      attachments: attachments
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

// Pick a file extension from the MIME type (falls back to the original name).
function extFor(type, name) {
  if (name && name.lastIndexOf('.') > -1) return name.substring(name.lastIndexOf('.'));
  if (type === 'application/pdf') return '.pdf';
  if (type === 'image/png')  return '.png';
  if (type === 'image/jpeg') return '.jpg';
  if (type === 'image/webp') return '.webp';
  return '';
}

function doGet() {
  return ContentService
    .createTextOutput('The XL Academy loan application endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
