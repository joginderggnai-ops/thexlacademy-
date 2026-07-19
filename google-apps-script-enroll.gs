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

/* ---- Shared email template helpers ---- */
function esc_(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function row_(label,value){
  return '<tr><td style="padding:9px 0;border-bottom:1px solid #eef1f7;color:#5b6478;width:150px;vertical-align:top;font-size:13px">'+esc_(label)+'</td>'
       + '<td style="padding:9px 0;border-bottom:1px solid #eef1f7;color:#1c2236;font-weight:600;font-size:14px">'+esc_(value)+'</td></tr>';
}
function note_(n){
  return '<p style="margin:18px 0 0;font-size:13px;color:#157a3c;background:#e6f9ee;border:1px solid #b2e8c9;border-radius:8px;padding:11px 14px">📎 '+n+' document(s) attached to this email.</p>';
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

    var rows = row_('Student ID', d.studentId) + row_('Full Name', d.fullName) + row_('Mobile', d.mobile)
             + row_('Alternate No', d.altMobile) + row_('Email', d.email) + row_('Total Experience', d.experience)
             + row_('Course', course) + row_('Address', d.address) + row_('Source', d.source) + row_('Time', ts);
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      cc: CC_EMAILS,
      replyTo: d.email || NOTIFY_EMAIL,
      subject: 'Website New Enquiry — Enroll Now',
      body:
        'New enrolment from the website:\n\n' +
        'Student ID: ' + (d.studentId || '') + '\nFull Name: ' + (d.fullName || '') + '\nMobile: ' + (d.mobile || '') +
        '\nAlternate No: ' + (d.altMobile || '') + '\nEmail: ' + (d.email || '') + '\nTotal Experience: ' + (d.experience || '') +
        '\nCourse: ' + course + '\nAddress: ' + (d.address || '') + '\nSource: ' + (d.source || '') + '\nTime: ' + ts +
        '\n\nDocuments attached: ' + attachments.length,
      htmlBody: shell_('New Enrolment (Enroll Now)', 'A new enrolment application was submitted from the website.', rows, note_(attachments.length)),
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
