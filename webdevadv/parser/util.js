const XLSX = require('xlsx');


function normalizeData(str) {
  if (!String(str)) return null;
  return String(str).trim().toLowerCase();
}


/*
 * Excel can store times as either 'Date' objects, numbers, or strings
 * For strings, the Regex captures the hour (HH), the the minute (mm), 
 * and the meridiem (case insensitive -- am, pm, a, p, a.m., p.m.) 
 * and then, if a meridiem exists, converts it to military time
 */
function militaryTime(value) {
  let hour;
  let minute;

  // Excel dates from SheetJS use local time.
  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (Number.isNaN(value.getTime())) throw new Error('Invalid showtime');
    hour = value.getHours();
    minute = value.getMinutes();
  } else if (typeof value === 'number') {
    // Excel stores dates as days, with the fractional part representing time.
    const time = Number.isFinite(value) && XLSX.SSF.parse_date_code(value);
    if (!time) throw new Error('Invalid showtime');
    hour = time.H;
    minute = time.M;
  } else if (typeof value === 'string') {
    // Accept H:mm or HH:mm, optional seconds, and A/P, AM/PM, or a.m./p.m.
    const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\s*([ap](?:\.?m\.?)?)?$/i);
    if (!match) throw new Error('Invalid showtime');

    hour = Number(match[1]);
    minute = Number(match[2]);
    const meridiem = match[3];
    if (meridiem) {
      if (hour < 1 || hour > 12) throw new Error('Invalid showtime');
      hour = hour % 12 + (meridiem[0].toLowerCase() === 'p' ? 12 : 0);
    } else if (hour > 23) {
      throw new Error('Invalid showtime');
    }
  } else {
    throw new Error('Invalid showtime');
  }
  // concatenates 0 to the start of each hour and minute if their lengths are less than 2 (1:45 -> 01:45)
  return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

module.exports = { normalizeData, militaryTime };