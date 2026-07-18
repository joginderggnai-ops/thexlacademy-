/**
 * The XL Academy — Enroll Now (Admission) handler
 * Emails every enrolment (with Photo, ID Proof, Address Proof attached)
 * to the address below. It does NOT use Google Drive or Google Sheets.
 *
 * This is a SEPARATE Apps Script / deployment from the popup and loan forms.
 *
 * ─── SETUP (one time) ───────────────────────────────────────────────
 * 1. Go to https://script.google.com ▸ New project.
 * 2. Delete any sample code, paste EVERYTHING from this file, Save.
 * 3. Deploy ▸ New deployment ▸ (gear) Web app.
 *      - Execute as:     Me
 *      - Who has access: Anyone
 *    Deploy, authorise (asks for permission to send email),
 *    and COPY the Web app URL (ends in /exec).
 * 4. Paste that URL into enroll.html as the value of ENROLL_ENDPOINT.
 * ────────────────────────────────────────────────────────────────────
 */

var NOTIFY_EMAIL = 'support@thexlacademy.com'; // primary recipient
var CC_EMAILS    = 'Analyticsproschool@gmail.com, masteranalytics.india@gmail.com'; // cc

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ts = new Date();

    // Base name for attachments, e.g. 260716-142530_FullName
    var base = ((d.studentId || 'NOID') + '_' + (d.fullName || ''))
                 .replace(/[^A-Za-z0-9_\-]/g, '');

    // Course value ("Other" falls back to the typed course name)
    var course = (d.course === 'Other' && d.otherCourse) ? d.otherCourse : (d.course || '');

    // Turn each uploaded file into an email attachment (skip missing ones)
    var docKeys = [
      ['photo',        'Photo'],
      ['idProof',      'IDProof'],
      ['addressProof', 'AddressProof']
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
      subject: 'New Enrolment — ' + (d.fullName || 'Website') + ' (' + course + ')',
      body:
        'New enrolment from the website:\n\n' +
        'Student ID:      ' + (d.studentId || '') + '\n' +
        'Full Name:       ' + (d.fullName || '') + '\n' +
        'Mobile:          ' + (d.mobile || '') + '\n' +
        'Alternate No:    ' + (d.altMobile || '') + '\n' +
        'Email:           ' + (d.email || '') + '\n' +
        'Total Experience:' + (d.experience || '') + '\n' +
        'Course:          ' + course + '\n' +
        'Address:         ' + (d.address || '') + '\n' +
        'Source:          ' + (d.source || '') + '\n' +
        'Time:            ' + ts + '\n\n' +
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
    .createTextOutput('The XL Academy enrolment endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
