/**
 * UEQ-S Class Survey: Google Apps Script backend
 * ------------------------------------------------
 * 1. Create a new Google Sheet (any name).
 * 2. Extensions > Apps Script. Delete the sample code and paste this whole file.
 * 3. Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the Web App URL (ends in /exec) into js/config.js (APPS_SCRIPT_URL).
 * After editing this script later, use Deploy > Manage deployments > Edit > New version.
 */
var SHEET_NAME = 'Responses';
var HEADERS = ['participant', 'timestamp', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function rows_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return values.map(function (v) {
    var o = {};
    HEADERS.forEach(function (h, i) {
      o[h] = (v[i] instanceof Date) ? v[i].toISOString() : v[i];
    });
    return o;
  });
}

function doGet(e) {
  try {
    return json_({ status: 'ok', rows: rows_() });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // up to 20 students may submit at once
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var sh = sheet_();

    if (body.action === 'submit') {
      var r = body.record || {};
      var p = Number(r.participant);
      if (!(p >= 1)) return json_({ status: 'error', message: 'Invalid participant number' });
      var row = [p, r.timestamp || new Date().toISOString()];
      for (var i = 1; i <= 8; i++) {
        var q = Number(r['q' + i]);
        if (!(q >= 1 && q <= 7)) return json_({ status: 'error', message: 'Missing answer for item ' + i });
        row.push(q);
      }
      var last = sh.getLastRow();
      var existing = -1;
      if (last >= 2) {
        var ids = sh.getRange(2, 1, last - 1, 1).getValues();
        for (var j = 0; j < ids.length; j++) if (Number(ids[j][0]) === p) { existing = j + 2; break; }
      }
      if (existing > 0 && !body.overwrite) return json_({ status: 'exists' });
      if (existing > 0) sh.getRange(existing, 1, 1, row.length).setValues([row]);
      else sh.appendRow(row);
      return json_({ status: 'ok' });
    }

    if (body.action === 'deleteAll') {
      var n = sh.getLastRow();
      if (n >= 2) sh.deleteRows(2, n - 1);
      return json_({ status: 'ok' });
    }

    return json_({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}
