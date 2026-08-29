/**
 * Docks Overseas — enquiry endpoint  (Google Apps Script)
 *
 * Saved as .js because that is what it is — Apps Script is JavaScript. The
 * editor will call it Code.gs on Google's side; the extension here is only so
 * the file opens cleanly in any editor or previewer.
 * ---------------------------------------------------------------------------
 * Receives submissions from the website contact form, appends them to this
 * spreadsheet, and emails a copy so nothing depends on you remembering to
 * check the sheet.
 *
 * Setup is in the project README under "The enquiry form". In short:
 *   Google Sheet → Extensions → Apps Script → paste this → Deploy as Web app
 *   (Execute as: Me · Who has access: Anyone) → copy the /exec URL.
 *
 * NOTE: after editing this file you must deploy a NEW VERSION for the change
 * to take effect. Saving alone does nothing to the live endpoint.
 * ---------------------------------------------------------------------------
 */

/* Leave SHEET_ID blank if this script lives inside the sheet
   (Extensions → Apps Script). If you made a STANDALONE script at
   script.google.com instead, paste the sheet's id here — it is the long
   string in the sheet URL between /d/ and /edit:
   docs.google.com/spreadsheets/d/THIS_PART_HERE/edit                        */
/* Bumped whenever this file changes, and reported by doGet. Open the /exec
   URL in a browser: if the version shown is not the one here, the editor has
   your changes but the live endpoint does not — deploy a new version. */
var VERSION    = 3;

var SHEET_ID   = '';

var SHEET_NAME = 'Enquiries';
var NOTIFY_TO  = 'docksoverseas@gmail.com';   // set to '' to turn email off

/* Column order. Add a field here and to the form, and it flows through. */
var FIELDS = [
  'name', 'company', 'email', 'phone',
  'country', 'produce', 'volume', 'incoterm', 'message'
];

var LABELS = {
  name:     'Name',
  company:  'Company',
  email:    'Email',
  phone:    'Phone',
  country:  'Destination market',
  produce:  'Produce',
  volume:   'Volume',
  incoterm: 'Incoterm',
  message:  'Message'
};

function doPost(e) {
  try {
    var data = readSubmission_(e);

    /* The form carries a hidden "website" field that only bots fill in.
       Answer normally so they learn nothing, but record nothing. */
    if (data.website) return reply_({ success: true });

    appendRow_(data);
    notify_(data);
    return reply_({ success: true });

  } catch (err) {
    /* Logged to Apps Script → Executions, so a failure is diagnosable. */
    console.error(err);
    return reply_({ success: false, message: String(err) });
  }
}

/* Visiting the URL in a browser should say something useful rather than error. */
function doGet() {
  return reply_({
    success: true,
    version: VERSION,
    message: 'Docks Overseas enquiry endpoint is live.'
  });
}

/* --- helpers ------------------------------------------------------------- */

function readSubmission_(e) {
  if (e && e.parameter && Object.keys(e.parameter).length) return e.parameter;
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (ignore) {}
  }
  return {};
}

function appendRow_(data) {
  var sheet = getSheet_();

  var row = [new Date()];
  for (var i = 0; i < FIELDS.length; i++) row.push(String(data[FIELDS[i]] || ''));

  var line = sheet.getLastRow() + 1;

  /* Force every column except the timestamp to plain text BEFORE writing.
     Sheets treats a leading +, =, - or @ as the start of a formula, so a
     phone number like "+91 97404 22337" would otherwise land as #ERROR!
     and the number would be lost. */
  sheet.getRange(line, 2, 1, FIELDS.length).setNumberFormat('@');
  /* and keep the time on the timestamp — writing a formatted range defaults
     it to date-only, which loses the hour an enquiry arrived */
  sheet.getRange(line, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(line, 1, 1, row.length).setValues([row]);
}

function getSheet_() {
  var ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    var header = ['Received'];
    for (var i = 0; i < FIELDS.length; i++) header.push(LABELS[FIELDS[i]] || FIELDS[i]);
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
  }
  return sheet;
}

function notify_(data) {
  if (!NOTIFY_TO) return;

  var lines = [];
  for (var i = 0; i < FIELDS.length; i++) {
    var key = FIELDS[i];
    lines.push((LABELS[key] || key) + ': ' + (data[key] || '—'));
  }

  var subject = 'Enquiry — ' + (data.produce || 'Fresh produce');
  if (data.company) subject += ' — ' + data.company;

  var options = {
    to: NOTIFY_TO,
    subject: subject,
    body: lines.join('\n') + '\n\n— sent from the Docks Overseas website'
  };

  /* Reply goes straight back to the buyer instead of to yourself. */
  if (data.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    options.replyTo = data.email;
  }

  MailApp.sendEmail(options);
}

function reply_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
