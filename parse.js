const XLSX = require('xlsx');

// 1. Read the local file directly from the directory
const workbook = XLSX.readFile('c:/Users/ggren/Desktop/MovieData.xlsx', { cellDates: true });

parseSheet(workbook);


/*
 * worksheet['!ref'] -- a special property that stores the A1-style range of the worksheet (e.g., "A1:G50")
 *
 * Okay, an example is `worksheet['!ref'] = "A1:G50"`
 * If you look at an Excel spreadsheet:
 * The rows go like '1, 2, 3, ...' 
 * The columns go 'A, B, C, D, ...' up to Z
 * 
 * You can use 'A1:F18' to read columns A, B, C, D, E, F, and read rows '1, 2, 3, ..., 18'
 * 
 * 
 * Then you can use worksheet['!ref'] to read a certain rows and columns, rather than the whole file
 * 
 * By default, worksheet['!ref'] is undefined -- not used at all
*/







function parseSheet(workbook) {
  // Fetch the first sheet (in Excel on the bottom-left, it shows 'Sheet1' and allows you to add other sheets)
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  worksheet['!ref'] = "A1:Z10";


  // decode current range
  let range = XLSX.utils.decode_range(worksheet['!ref']);

  console.log(range);



  

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1});

  console.log(rows);

  

  // skip first row
  range.s.r = 1;

  console.log(range);

  worksheet['!ref'] = XLSX.utils.encode_range(range);

  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  // console.log(jsonData);
}