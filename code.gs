/**
 * Thanusha & Divine — Wedding RSVP + Wishes (Google Apps Script Web App)
 *
 * Spreadsheet:
 * https://docs.google.com/spreadsheets/d/1K3Ud3IvIqtfrg7UyXvMAlR7wFFfsSir_PVJd3s7VreE/edit
 *
 * Sheets "RSVP" and "Wishes" are created automatically (with headers) on the
 * first request, or run setup() once from the editor to create them now.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then copy the /exec URL into VITE_GOOGLE_SCRIPT_URL.
 */

const SPREADSHEET_ID = "1K3Ud3IvIqtfrg7UyXvMAlR7wFFfsSir_PVJd3s7VreE";

const SHEETS = {
  rsvp: {
    name: "RSVP",
    headers: ["Timestamp", "Name", "Attendance", "Invited As", "Invited To"],
    widths: [170, 200, 110, 220, 260],
  },
  wish: {
    name: "Wishes",
    headers: ["Timestamp", "Name", "Message"],
    widths: [170, 200, 500],
  },
};

const HEADER_BG = "#1A1A1A";
const HEADER_FG = "#D4AF37";

/* ------------------------------ Entry points ------------------------------ */

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return handleRequest_(e);
}

/** Run once from the Apps Script editor to create both sheets immediately. */
function setup() {
  getSheet_(SHEETS.rsvp);
  getSheet_(SHEETS.wish);
}

/* -------------------------------- Routing --------------------------------- */

function handleRequest_(e) {
  try {
    const params = parseParams_(e);
    const action = String(params.action || "").trim().toLowerCase();

    if (!action) {
      return jsonResponse_({ ok: true, message: "Wedding RSVP API is running" });
    }
    if (action === "rsvp") {
      return jsonResponse_(withLock_(function () { return saveRsvp_(params); }));
    }
    if (action === "wish") {
      return jsonResponse_(withLock_(function () { return saveWish_(params); }));
    }
    return jsonResponse_({ ok: false, message: "Invalid action" });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : "Unexpected error",
    });
  }
}

/* -------------------------------- Handlers -------------------------------- */

function saveRsvp_(params) {
  const name = clean_(params.name, 200);
  if (!name) {
    return { ok: false, message: "Name is required" };
  }

  // The website sends guests = "1" for attending, "0" for declining.
  const attendance = String(params.guests || "").trim() === "0" ? "Not Attending" : "Attending";
  const invitedAs = clean_(params.invitedAs, 200);
  const invitedTo = clean_(params.events, 200);

  const sheet = getSheet_(SHEETS.rsvp);
  sheet.appendRow([new Date(), name, attendance, invitedAs, invitedTo]);

  // Colour the attendance cell for quick scanning.
  const row = sheet.getLastRow();
  sheet
    .getRange(row, 3)
    .setBackground(attendance === "Attending" ? "#D9EAD3" : "#F4CCCC")
    .setFontWeight("bold");

  return { ok: true, message: "RSVP saved" };
}

function saveWish_(params) {
  const name = clean_(params.name, 200);
  const message = clean_(params.message, 2000);

  if (!name || !message) {
    return { ok: false, message: "Name and message are required" };
  }

  const sheet = getSheet_(SHEETS.wish);
  sheet.appendRow([new Date(), name, message]);
  sheet.getRange(sheet.getLastRow(), 3).setWrap(true);

  return { ok: true, message: "Wish saved" };
}

/* --------------------------------- Sheets --------------------------------- */

/** Returns the sheet, creating it and writing/repairing the header row. */
function getSheet_(config) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(config.name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(config.name);
  }

  ensureHeader_(sheet, config);
  return sheet;
}

function ensureHeader_(sheet, config) {
  const headers = config.headers;
  const width = headers.length;
  const current =
    sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];

  const matches = headers.every(function (h, i) {
    return String(current[i] || "") === h;
  });
  if (matches) return;

  // Sheet has data but no proper header: insert a header row above it.
  if (sheet.getLastRow() > 0 && String(current[0] || "") !== headers[0]) {
    sheet.insertRowBefore(1);
  }

  sheet
    .getRange(1, 1, 1, width)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground(HEADER_BG)
    .setFontColor(HEADER_FG)
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  if (sheet.getMaxRows() > 1) {
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  }

  config.widths.forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
}

/* --------------------------------- Helpers -------------------------------- */

/** Prevents two simultaneous submissions from clashing. */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Trims, limits length and blocks spreadsheet formula injection
 * (values starting with = + - @ are stored as plain text).
 */
function clean_(value, maxLength) {
  let text = String(value == null ? "" : value).trim();
  if (maxLength && text.length > maxLength) text = text.slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function parseParams_(e) {
  const params = Object.assign({}, (e && e.parameter) || {});

  if (!(e && e.postData && e.postData.contents)) {
    return params;
  }

  const contents = String(e.postData.contents || "").trim();
  if (!contents) {
    return params;
  }

  if (contents.charAt(0) === "{") {
    return Object.assign(params, JSON.parse(contents));
  }

  return Object.assign(params, parseFormEncoded_(contents));
}

function parseFormEncoded_(raw) {
  const result = {};
  const pairs = String(raw || "").split("&");

  for (var i = 0; i < pairs.length; i++) {
    if (!pairs[i]) continue;
    var parts = pairs[i].split("=");
    var key = decodeURIComponent((parts[0] || "").replace(/\+/g, " "));
    var value = decodeURIComponent((parts.slice(1).join("=") || "").replace(/\+/g, " "));
    if (key) result[key] = value;
  }

  return result;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
