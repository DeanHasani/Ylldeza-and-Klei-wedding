/**
 * Ylldëza & Klei — RSVP receiver.
 * Paste this into the Google Sheet's Extensions → Apps Script, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Put the web-app URL into RSVP_URL in config.js.
 * For the /download page: Project Settings → Script properties → add ADMIN_KEY = <the password>.
 */
const HEADERS = ['Data', 'Emri', 'Vjen?', 'Shoqëruesi', 'Nr. personash'];

// Guests' answers arrive here
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // two guests submitting at the same moment must not overwrite each other's row
  try {
    const sheet = getSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    const p = e.parameter;
    const yes = p.attending === 'yes';
    const guest = yes ? clean(p.guest) : '';
    sheet.appendRow([
      new Date(),
      clean(p.name),
      yes ? 'Po' : 'Jo',
      guest,
      yes ? (guest ? 2 : 1) : 0
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

// The /download page reads the answers here, only with the right password
function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key || e.parameter.key !== key) return json({ error: 'key' });
  const sheet = getSheet();
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  return json({
    rows: rows.map(r => ({
      date: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]).replace(/^'/, ''),
      attending: r[2],
      guest: String(r[3]).replace(/^'/, ''),
      count: Number(r[4]) || 0
    }))
  });
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Trim, cap the length, and stop text like "=SUM(...)" being run as a spreadsheet formula
function clean(v) {
  const s = String(v || '').trim().slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
