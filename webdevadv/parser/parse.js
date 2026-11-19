const XLSX = require('xlsx');
const { normalizeData, militaryTime } = require('./util.js')

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

const requiredHeaderFormat = ['start', 'auditorium', 'movie']


function parseSheet(workbook) {
  // Fetch the first sheet (in Excel on the bottom-left, it shows 'Sheet1' and allows you to add other sheets)
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const spreadsheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // 2D array of entire spreadsheet
  console.log("spreadsheet: ");
  console.log(spreadsheet);
  const { startRow, header } = findHeaderRow(spreadsheet); // find row to start parsing from

  
  console.log('\n\nrow to start parsing from: ' + startRow);
  console.log("header", header, "\n\n"); // only contains the columns needed for the solver

  return buildJson(spreadsheet, startRow, header);
}


function buildJson(data, startRow, header) {
  if (startRow + 1 >= data.length) throw new Error('header is final row, so there is nothing to parse');

  const solverFormat = { shows: [] };

  for (let i = startRow + 1; i < data.length; i++) {
    const row = data[i];
    // skip completely empty rows
    if (!row || row.every(col =>
      col === null || col === undefined || (typeof col === 'string' && col.trim() === '')
    )) continue;

    solverFormat.shows.push({ 
      id: "m" + (solverFormat.shows.length + 1),
      title: row[header.movie],
      start: militaryTime(row[header.start]),
      auditorium: row[header.auditorium],
    });
  }
  if (!solverFormat.shows.length) throw new Error('nothing to parse after header row');
  return solverFormat;
}


function findHeaderRow(data) {
  for (let i = 0; i < data.length; i++) {
    let exclusions = new Set();
    let header = {};
    for (let j = 0; j < data[i].length; j++) {
      const normalized = normalizeData(data[i][j]);
      if (!headers.get(normalized) || exclusions.has(headers.get(normalized))) break;

      exclusions.add(headers.get(normalized));

      // header ignores 'end' and 'rating' and only stores column indexes of 'start', 'movie', and 'auditorium'
      if(!['end', 'rating'].includes(headers.get(normalized))) {
        header[headers.get(normalized)] = j; 
      }
      if (requiredHeaderFormat.every(val => exclusions.has(val))) return { startRow: i, header };
    }
  }
  throw new Error('Header row not found');
}


function main() {
  const workbook = XLSX.readFile('MovieData.xlsx', { cellDates: true });
  // const workbook = XLSX.readfile('c:/Users/.../MovieData.xlsx', { cellDates: true });
  const jsonData = parseSheet(workbook);
  console.log('JSON:\n', jsonData);
}

main();
