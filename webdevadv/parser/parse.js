const XLSX = require('xlsx');

function parseSheet(workbook) {
  // Fetch the first sheet (in Excel on the bottom-left, it shows 'Sheet1' and allows you to add other sheets)
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  worksheet['!ref'] = "A1:F18"; // covers entire sample spreadsheet

  // decode current range
  let range = XLSX.utils.decode_range(worksheet['!ref']);

  // skip first row (the one with "ROCKET SHEET COMPANY WITH LOCATION ETC")
  range.s.r = 1;
  console.log(range);

  worksheet['!ref'] = XLSX.utils.encode_range(range); // get entire sample spreadsheet

  return jsonData = XLSX.utils.sheet_to_json(worksheet); // convert sample spreadsheet to JSON
}


function transformJson(json){
  const newObj = { shows: [] };

  for (let i = 0; i < json.length; i++) {
    newObj.shows.push({ 
      id: "m" + (i+1),
      title: json[i].MOVIE,
      start: json[i].START.replace(/[a-zA-Z]/g, ''),
      auditorium: json[i].AUD,
    });
  }
  return newObj;
}



function main() {
  // 1. Read the local file directly from the directory
  const workbook = XLSX.readFile('c:/Users/ggren/Desktop/MovieData.xlsx', { cellDates: true });
  const jsonData = parseSheet(workbook);
  const formattedOutput = transformJson(jsonData);
  console.log(formattedOutput);
}

main();




/*
 * worksheet['!ref'] -- a special property that stores 
 * the A1-style range of the worksheet (e.g., "A1:G50")
 *
 * If you look at an Excel spreadsheet:
 * The rows go like '1, 2, 3, ...' 
 * The columns go 'A, B, C, D, ...' up to Z
 * 
 * If `worksheet['!ref'] = "A1:F18"`,
 * then you can read columns A, B, C, D, E, F, 
 * and rows '1, 2, 3, ..., 18' of the Excel file
 * 
 * 
 * By default, worksheet['!ref'] is undefined
*/