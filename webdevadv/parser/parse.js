const XLSX = require('xlsx');

/* 
 * HashMap of potential header names
 *
 * The file should be typically structured as 'Start', 'End', 'Movie', 'Rating', 'Auditorium',
 * But incase the file is formatted with 'Beginning', 'Finish', 'Title', 'Score', 'Aud',
 * This hashmap catches that different format and maps it to match the typical structure
 */
const headers = new Map([
  // start
  ['start', 'start'], ['begin', 'start'], ['beginning', 'start'], ['showtime', 'start'],
  // end
  ['end', 'end'], ['ending', 'end'], ['finish', 'end'],
  // auditorium
  ['auditorium', 'auditorium'], ['aud', 'auditorium'], ['screen', 'auditorium'], ['room', 'auditorium'], ['theater', 'auditorium'],
  // movie
  ['movie', 'movie'], ['title', 'movie'], ['film', 'movie'],
  // rating
  ['rating', 'rating'], ['rate', 'rating'], ['score', 'rating'],
]);


function parseSheet(workbook) {
  // Fetch the first sheet (in Excel on the bottom-left, it shows 'Sheet1' and allows you to add other sheets)
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // get the area that we parse
  let range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`start row: ${range.s.r}, start column: ${range.s.c}`);
  console.log(`end row: ${range.e.r}, `, `end column: ${range.e.c}\n\n`)

  const spreadsheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // 2D array of entire spreadsheet
  console.log("spreadsheet: ");
  console.log(spreadsheet);
  const { startRow, header } = findHeaderRow(spreadsheet, range); // find row to start parsing from

  
  console.log('\n\nrow to start parsing from: ' + startRow);
  console.log("header", header, "\n\n"); // only contains the columns needed for the solver

  return buildJson(spreadsheet, range, startRow, header);
}


function buildJson(data, range, startRow, header) {
  if (startRow + 1 >= data.length) throw new Error('header is final row, so there is nothing to parse');

  const solverFormat = { shows: [] };

  for (let i = startRow + 1; i <= range.e.r; i++) {
    solverFormat.shows.push({ 
      id: "m" + (i - startRow),
      title: data[i][header.movie],
      start: militaryTime(data[i][header.start]),
      auditorium: data[i][header.auditorium],
    });
  }
  return solverFormat;
}


function findHeaderRow(data, range) {
  for (let i = range.s.r; i <= range.e.r; i++) {
    let exclusions = new Set();
    let header = {};
    for (let j = range.s.c; j <= range.e.c; j++) {
      const normalized = normalizeData(data[i][j]);
      if (!headers.get(normalized) || exclusions.has(normalized)) break;

      exclusions.add(headers.get(normalized));

      // header ignores 'end' and 'rating' and only stores column indexes of 'start', 'movie', and 'auditorium'
      if(!['end', 'rating'].includes(headers.get(normalized))) {
        header[headers.get(normalized)] = j; 
      }
      if (j === range.e.c - 1) return { startRow: i, header };
    }
  }
  throw new Error('Header row not found');
}


function normalizeData(str) {
  if (!String(str)) return null;
  return String(str).trim().toLowerCase();
}


function militaryTime(str) {
  let time = normalizeData(str);
  if (!['p', 'a'].includes(time[time.length - 1])) return time;
  if (time[time.length - 1] === 'a' || time.slice(0, 3) === '12:') return time.substring(0, time.length - 1);
  if (!time.includes(":")) return time;

  time = time.substring(0, time.length - 1);
  const [hour, minute] = time.split(':');
  return String(Number(hour) + 12) + ':' + minute;
}


function main() {
  const workbook = XLSX.readFile('MovieData.xlsx', { cellDates: true });
  // const workbook = XLSX.readfile('c:/Users/.../MovieData.xlsx', { cellDates: true });
  const jsonData = parseSheet(workbook);
  console.log('JSON:\n', jsonData);
}

main();



/*
 * NOTES:
 * worksheet['!ref'] -- a special property that stores 
 * the A1-style range of the worksheet (e.g., "A1:G50")
 *
 * If you look at an Excel spreadsheet:
 * The rows go like '1, 2, 3, ...' 
 * The columns go 'A, B, C, D, ...' up to Z
 * 
 * If `worksheet['!ref'] = "A1:F18"`,
 * then you can read rows '1, 2, 3, ..., 18',  
 * and columns 'A, B, C, D, E, F' of the Excel file
 * 
 * 
 * By default, worksheet['!ref'] is undefined,
 * but when XLSX.readFile loads the spreadsheet, it sets '!ref' to contain the entire spreadsheet data
*/