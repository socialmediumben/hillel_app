/**
 * HILLEL APP & KIOSK - Google Apps Script Backend (v1.0)
 * Central Cloud Database Connector for Hillel Check-In Kiosk & Student App
 * 
 * SPREADSHEET ID: 1vRSAacNlDyCs7Fs0gEXiTtkO8vzcoXmZbWvHFqm1zm0
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1vRSAacNlDyCs7Fs0gEXiTtkO8vzcoXmZbWvHFqm1zm0/edit
 * 2. Go to Extensions > Apps Script.
 * 3. Replace any code in Code.gs with this entire file.
 * 4. In the top toolbar dropdown next to "Debug", select "initializeSheets".
 * 5. Click "Run" ▶️ and grant Google permissions ("Review permissions" > your account > "Advanced" > "Go to Untitled project" > "Allow").
 * 6. Click Deploy > New deployment > Select type: "Web app".
 * 7. Set:
 *    - Description: "Hillel App API v1"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (allows kiosk & phone app to communicate without sign-in prompts)
 * 8. Click "Deploy" and copy the Web App URL (starts with https://script.google.com/macros/s/...)
 * 9. Paste this Web App URL into the Developer Module of the Hillel App!
 */

var SPREADSHEET_ID = '1vRSAacNlDyCs7Fs0gEXiTtkO8vzcoXmZbWvHFqm1zm0';

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (_) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

/**
 * Ensures all required tabs exist with standardized headers
 */
function initializeSheets() {
  var ss = getSpreadsheet();
  
  // 1. App Events Tab
  var eventsSheet = ss.getSheetByName('App Events');
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet('App Events');
    eventsSheet.appendRow(['Event_ID', 'Title', 'Date', 'Start_Time', 'End_Time', 'Location', 'Description', 'Category', 'Active']);
    eventsSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
  }

  // 2. Students Directory Tab
  var studentsSheet = ss.getSheetByName('Students_Directory');
  if (!studentsSheet) {
    studentsSheet = ss.insertSheet('Students_Directory');
    studentsSheet.appendRow([
      'Contact_ID', 'Tap_Card_ID', 'First_Name', 'Last_Name', 'Preferred_Name',
      'Pronouns', 'Email', 'Phone', 'Class_Year', 'Major',
      'Dietary_Restrictions', 'Interests', 'Created_At'
    ]);
    studentsSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
  }

  // 3. Attendance CheckIns Tab
  var checkInsSheet = ss.getSheetByName('Attendance_CheckIns');
  if (!checkInsSheet) {
    checkInsSheet = ss.insertSheet('Attendance_CheckIns');
    checkInsSheet.appendRow([
      'CheckIn_ID', 'Timestamp', 'Date', 'Contact_ID', 'Student_Name',
      'Tap_Card_ID', 'Event_ID', 'Event_Name', 'Station_ID'
    ]);
    checkInsSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
  }

  // 4. Event RSVPs Tab
  var rsvpsSheet = ss.getSheetByName('Event_RSVPs');
  if (!rsvpsSheet) {
    rsvpsSheet = ss.insertSheet('Event_RSVPs');
    rsvpsSheet.appendRow([
      'RSVP_ID', 'Timestamp', 'Contact_ID', 'Student_Name', 'Email',
      'Event_ID', 'Event_Name', 'Status'
    ]);
    rsvpsSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
  }

  // 5. App Config Tab
  var configSheet = ss.getSheetByName('App_Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('App_Config');
    configSheet.appendRow(['Key', 'Value']);
    configSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
    configSheet.appendRow(['orgName', 'Hillel']);
    configSheet.appendRow(['campusName', 'Campus Hillel']);
    configSheet.appendRow(['primaryColor', '#1d4ed8']);
  }

  return { status: 'success', message: 'All Hillel database sheets initialized successfully!' };
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || 'ping';

    if (action === 'ping') {
      var ss = getSpreadsheet();
      return jsonResponse({
        status: 'success',
        message: 'Hillel Apps Script API is online',
        sheetName: ss.getName(),
        time: new Date().toISOString()
      });
    }

    if (action === 'init') {
      var initResult = initializeSheets();
      return jsonResponse(initResult);
    }

    if (action === 'get_events') {
      return jsonResponse({
        status: 'success',
        events: fetchEventsFromSheet()
      });
    }

    if (action === 'get_students') {
      return jsonResponse({
        status: 'success',
        students: fetchStudentsFromSheet(p.query)
      });
    }

    if (action === 'get_rsvps') {
      return jsonResponse({
        status: 'success',
        rsvps: fetchRsvpsFromSheet(p.contactId)
      });
    }

    if (action === 'get_config') {
      return jsonResponse({
        status: 'success',
        config: fetchConfigFromSheet()
      });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var action = data.action;

    // 1. Check-In to Event (from Check-In Options)
    if (action === 'checkin') {
      var res = recordCheckIn(data);
      return jsonResponse(res);
    }

    // 2. RSVP for Event (from App Events)
    if (action === 'rsvp') {
      var res = recordRsvp(data);
      return jsonResponse(res);
    }

    // 3. First-time Student Sign Up
    if (action === 'create_student') {
      var res = createStudent(data);
      return jsonResponse(res);
    }

    // 4. Update Student Profile
    if (action === 'update_student') {
      var res = updateStudent(data);
      return jsonResponse(res);
    }

    // 5. Link / Update Tap Card
    if (action === 'link_card') {
      var res = linkCardToStudent(data.contactId, data.tapCard);
      return jsonResponse(res);
    }

    // 6. Save Config
    if (action === 'save_config') {
      var res = saveConfig(data.config);
      return jsonResponse(res);
    }

    return jsonResponse({ status: 'error', message: 'Unknown post action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// =========================================================================
// =========================================================================
// DATA ACCESS HELPERS
// =========================================================================

function findEventsSheet(ss) {
  var direct = ss.getSheetByName('App Events') || ss.getSheetByName('Events') || ss.getSheetByName('App_Events');
  if (direct) return direct;
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    var name = allSheets[i].getName().toLowerCase();
    if (name.indexOf('event') !== -1) return allSheets[i];
  }
  return null;
}

function normalizeDateValue(raw) {
  if (!raw) return '';
  if (raw instanceof Date) {
    return Utilities.formatDate(raw, Session.getScriptTimeZone() || 'America/Los_Angeles', 'yyyy-MM-dd');
  }
  var str = String(raw).trim();
  // Match MM/DD/YYYY or M/D/YYYY
  var m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    var mm = ('0' + m[1]).slice(-2);
    var dd = ('0' + m[2]).slice(-2);
    return m[3] + '-' + mm + '-' + dd;
  }
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Fallback to JS Date parse
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    var yyyy = parsed.getFullYear();
    var month = ('0' + (parsed.getMonth() + 1)).slice(-2);
    var day = ('0' + parsed.getDate()).slice(-2);
    return yyyy + '-' + month + '-' + day;
  }
  return str;
}

function fetchEventsFromSheet() {
  var ss = getSpreadsheet();
  var sheet = findEventsSheet(ss);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // Inspect headers in row 0
  var headerRow = data[0];
  var colMap = {};
  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (colMap['title'] === undefined && (h === 'title' || h === 'event' || h === 'eventname' || h === 'eventtitle' || h === 'name')) {
      colMap['title'] = c;
    } else if (colMap['date'] === undefined && (h === 'date' || h === 'eventdate' || h === 'day')) {
      colMap['date'] = c;
    } else if (colMap['startTime'] === undefined && (h === 'starttime' || h === 'start' || h === 'time' || h === 'starts')) {
      colMap['startTime'] = c;
    } else if (colMap['endTime'] === undefined && (h === 'endtime' || h === 'end' || h === 'ends')) {
      colMap['endTime'] = c;
    } else if (colMap['location'] === undefined && (h === 'location' || h === 'room' || h === 'place' || h === 'venue')) {
      colMap['location'] = c;
    } else if (colMap['description'] === undefined && (h === 'description' || h === 'desc' || h === 'details' || h === 'notes')) {
      colMap['description'] = c;
    } else if (colMap['category'] === undefined && (h === 'category' || h === 'type' || h === 'tag' || h === 'tags')) {
      colMap['category'] = c;
    } else if (colMap['id'] === undefined && (h === 'id' || h === 'eventid')) {
      colMap['id'] = c;
    } else if (colMap['active'] === undefined && (h === 'active' || h === 'status' || h === 'isactive')) {
      colMap['active'] = c;
    }
  }

  // Fallbacks if headers weren't named with recognizable labels:
  if (colMap['title'] === undefined) {
    var row1Col1 = String(data[1] ? data[1][1] : '');
    if (row1Col1.indexOf('/') !== -1 || row1Col1.indexOf('-') !== -1 || (data[1] && data[1][1] instanceof Date)) {
      colMap['title'] = 0;
      colMap['date'] = 1;
    } else {
      colMap['id'] = 0;
      colMap['title'] = 1;
      colMap['date'] = 2;
    }
  }
  if (colMap['date'] === undefined) colMap['date'] = 2;
  if (colMap['startTime'] === undefined) colMap['startTime'] = 3;
  if (colMap['endTime'] === undefined) colMap['endTime'] = 4;
  if (colMap['location'] === undefined) colMap['location'] = 5;
  if (colMap['description'] === undefined) colMap['description'] = 6;
  if (colMap['category'] === undefined) colMap['category'] = 7;
  if (colMap['id'] === undefined) colMap['id'] = 0;

  var events = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var titleVal = String(row[colMap['title']] || '').trim();
    if (!titleVal) continue; // Skip blank rows

    // Active status: default to TRUE unless explicitly false, no, inactive, 0
    var isActive = true;
    if (colMap['active'] !== undefined && row[colMap['active']] !== undefined && row[colMap['active']] !== '') {
      var activeVal = String(row[colMap['active']]).toLowerCase().trim();
      if (activeVal === 'false' || activeVal === 'no' || activeVal === 'inactive' || activeVal === '0') {
        isActive = false;
      }
    }

    var rawDate = row[colMap['date']];
    var formattedDate = normalizeDateValue(rawDate);

    var formatTime = function(val) {
      if (!val) return '';
      if (val instanceof Date) {
        return Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Los_Angeles', 'hh:mm a');
      }
      return String(val).trim();
    };

    var idVal = colMap['id'] !== undefined && row[colMap['id']] ? String(row[colMap['id']]).trim() : ('evt-' + i);

    events.push({
      id: idVal,
      title: titleVal,
      date: formattedDate,
      startTime: formatTime(row[colMap['startTime']]),
      endTime: formatTime(row[colMap['endTime']]),
      location: String(row[colMap['location']] || '').trim(),
      description: String(row[colMap['description']] || '').trim(),
      category: String(row[colMap['category']] || '').trim(),
      active: isActive
    });
  }

  return events;
}

function fetchStudentsFromSheet(query) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Students_Directory');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var q = (query || '').trim().toLowerCase();
  var students = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0] || '');
    var tapCard = String(row[1] || '');
    var firstName = String(row[2] || '');
    var lastName = String(row[3] || '');
    var preferredName = String(row[4] || '');
    var pronouns = String(row[5] || '');
    var email = String(row[6] || '');
    var phone = String(row[7] || '');
    var classYear = String(row[8] || '');
    var major = String(row[9] || '');
    var dietary = String(row[10] || '');
    var interests = String(row[11] || '');
    var createdAt = String(row[12] || '');

    var match = true;
    if (q) {
      match = id.toLowerCase().includes(q) ||
              tapCard.toLowerCase() === q ||
              firstName.toLowerCase().includes(q) ||
              lastName.toLowerCase().includes(q) ||
              preferredName.toLowerCase().includes(q) ||
              email.toLowerCase().includes(q);
    }

    if (match) {
      students.push({
        id: id,
        tapCard: tapCard,
        firstName: firstName,
        lastName: lastName,
        preferredName: preferredName,
        pronouns: pronouns,
        email: email,
        phone: phone,
        classYear: classYear,
        major: major,
        dietaryRestrictions: dietary ? dietary.split(',').map(function(s){ return s.trim(); }) : [],
        interests: interests ? interests.split(',').map(function(s){ return s.trim(); }) : [],
        createdAt: createdAt
      });
    }
  }

  return students;
}

function recordCheckIn(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Attendance_CheckIns');
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName('Attendance_CheckIns');
  }

  var checkInId = 'chk_' + Date.now();
  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'America/Los_Angeles', 'yyyy-MM-dd');

  sheet.appendRow([
    checkInId,
    now.toISOString(),
    dateStr,
    data.studentId || data.contactId || '',
    data.studentName || '',
    data.tapCard || '',
    data.eventId || 'general_visit',
    data.eventName || 'Hillel Visit',
    data.stationId || 'kiosk-01'
  ]);

  return { status: 'success', checkInId: checkInId };
}

function recordRsvp(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Event_RSVPs');
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName('Event_RSVPs');
  }

  var rsvpId = 'rsvp_' + Date.now();
  var now = new Date();

  sheet.appendRow([
    rsvpId,
    now.toISOString(),
    data.studentId || data.contactId || '',
    data.studentName || '',
    data.email || '',
    data.eventId || '',
    data.eventName || '',
    data.status || 'Confirmed'
  ]);

  return { status: 'success', rsvpId: rsvpId };
}

function createStudent(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Students_Directory');
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName('Students_Directory');
  }

  var newId = 'HIL-' + (1000 + sheet.getLastRow());
  var dietaryStr = Array.isArray(data.dietaryRestrictions) ? data.dietaryRestrictions.join(', ') : (data.dietaryRestrictions || '');
  var interestsStr = Array.isArray(data.interests) ? data.interests.join(', ') : (data.interests || '');
  var createdAt = new Date().toISOString();

  sheet.appendRow([
    newId,
    data.tapCard || '',
    data.firstName || '',
    data.lastName || '',
    data.preferredName || data.firstName || '',
    data.pronouns || '',
    data.email || '',
    data.phone || '',
    data.classYear || '',
    data.major || '',
    dietaryStr,
    interestsStr,
    createdAt
  ]);

  return {
    status: 'success',
    student: {
      id: newId,
      tapCard: data.tapCard || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      preferredName: data.preferredName || data.firstName || '',
      pronouns: data.pronouns || '',
      email: data.email || '',
      phone: data.phone || '',
      classYear: data.classYear || '',
      major: data.major || '',
      dietaryRestrictions: dietaryStr ? dietaryStr.split(',').map(function(s){ return s.trim(); }) : [],
      interests: interestsStr ? interestsStr.split(',').map(function(s){ return s.trim(); }) : [],
      createdAt: createdAt
    }
  };
}

function updateStudent(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Students_Directory');
  if (!sheet) return { status: 'error', message: 'Students sheet missing' };

  var rows = sheet.getDataRange().getValues();
  var studentId = data.id || data.contactId;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(studentId)) {
      var rowNum = i + 1;
      if (data.firstName !== undefined) sheet.getRange(rowNum, 3).setValue(data.firstName);
      if (data.lastName !== undefined) sheet.getRange(rowNum, 4).setValue(data.lastName);
      if (data.preferredName !== undefined) sheet.getRange(rowNum, 5).setValue(data.preferredName);
      if (data.pronouns !== undefined) sheet.getRange(rowNum, 6).setValue(data.pronouns);
      if (data.email !== undefined) sheet.getRange(rowNum, 7).setValue(data.email);
      if (data.phone !== undefined) sheet.getRange(rowNum, 8).setValue(data.phone);
      if (data.classYear !== undefined) sheet.getRange(rowNum, 9).setValue(data.classYear);
      if (data.major !== undefined) sheet.getRange(rowNum, 10).setValue(data.major);
      if (data.dietaryRestrictions !== undefined) {
        var dStr = Array.isArray(data.dietaryRestrictions) ? data.dietaryRestrictions.join(', ') : data.dietaryRestrictions;
        sheet.getRange(rowNum, 11).setValue(dStr);
      }
      if (data.interests !== undefined) {
        var iStr = Array.isArray(data.interests) ? data.interests.join(', ') : data.interests;
        sheet.getRange(rowNum, 12).setValue(iStr);
      }
      return { status: 'success', message: 'Student profile updated successfully' };
    }
  }

  return { status: 'error', message: 'Student not found with ID: ' + studentId };
}

function linkCardToStudent(studentId, tapCard) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Students_Directory');
  if (!sheet) return { status: 'error', message: 'Students sheet missing' };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(studentId)) {
      sheet.getRange(i + 1, 2).setValue(tapCard);
      return { status: 'success', message: 'Card ' + tapCard + ' linked to student ' + studentId };
    }
  }

  return { status: 'error', message: 'Student not found: ' + studentId };
}

function fetchRsvpsFromSheet(contactId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Event_RSVPs');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var rsvps = [];
  for (var i = 1; i < data.length; i++) {
    if (!contactId || String(data[i][2]) === String(contactId)) {
      rsvps.push({
        id: String(data[i][0]),
        timestamp: String(data[i][1]),
        studentId: String(data[i][2]),
        studentName: String(data[i][3]),
        email: String(data[i][4]),
        eventId: String(data[i][5]),
        eventName: String(data[i][6]),
        status: String(data[i][7])
      });
    }
  }
  return rsvps;
}

function fetchConfigFromSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('App_Config');
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    var val = String(data[i][1]).trim();
    if (key) config[key] = val;
  }
  return config;
}

function saveConfig(config) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('App_Config');
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName('App_Config');
  }

  for (var k in config) {
    var key = k;
    var val = config[k];
    var found = false;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === key) {
        sheet.getRange(i + 1, 2).setValue(val);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, val]);
    }
  }

  return { status: 'success', message: 'Config saved' };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
