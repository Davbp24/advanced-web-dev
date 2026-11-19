import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { describe, expect, test } from 'vitest'
import XLSX from 'xlsx'


/*
 * loads parse.js, removes the 'main()' function call
 * then runs parse.js with its 'require' functions and silences console.log output
 */
const parserUrl = new URL('../../parser/parse.js', import.meta.url)
const parserSource = readFileSync(parserUrl, 'utf8').replace(/^main\(\);\s*$/m, '')
const { parseSheet, militaryTime } = runInNewContext(`${parserSource}\n;({ parseSheet, militaryTime });`, {
  require: createRequire(parserUrl),
  console: { log() {} }
})

const header = ['Movie', 'Start', 'Auditorium', 'End', 'Rating']
const firstRow = ['Movie 1', '12:30', 1, '14:00', 'PG']
const secondRow = ['Movie 2', '13:00', 2, '14:30', 'PG-13']
const firstShow = { id: 'm1', title: 'Movie 1', start: '12:30', auditorium: 1 }
const secondShow = { id: 'm2', title: 'Movie 2', start: '13:00', auditorium: 2 }

// each element in `rows` represents a real row in an Excel file, sequentially
function workbookFromRows(rows) {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Schedule')
  return workbook
}

describe('militaryTime', () => {
  test.each([
    ['1:00P', '13:00'],
    ['1:05p', '13:05'],
    [' 1:05 PM ', '13:05'],
    ['1:05 p.m.', '13:05'],
    ['9:05A', '09:05'],
    ['9:05 AM', '09:05'],
    ['12:00A', '00:00'],
    ['12:30 am', '00:30'],
    ['12:00P', '12:00'],
    ['12:30 PM', '12:30'],
    ['00:00', '00:00'],
    ['9:05', '09:05'],
    ['23:59', '23:59'],
    ['13:05:30', '13:05'],
    [0, '00:00'],
    [0.5, '12:00'],
    [13.5 / 24, '13:30'],
    [46000 + 13.5 / 24, '13:30'],
    [new Date(2026, 10, 14, 13, 5), '13:05'],
    [new Date(2026, 10, 14, 0, 0), '00:00']
  ])('converts %s to %s', (input, expected) => {
    expect(militaryTime(input)).toBe(expected)
  })

  test.each([
    '', 'not a time', '24:00', '12:60', '00:30 PM', '13:00P',
    '1:30 PM extra', null, undefined, true, NaN, Infinity, -1, new Date(NaN)
  ])('rejects invalid time %s', (input) => {
    expect(() => militaryTime(input)).toThrow('Invalid showtime')
  })

  /*
   * This checks that the same Excel time parses correctly whether Excel supplies it as a `Date` or a number
   * `cellDates = true` -- Excel supplies it as a Date. `cellDates = false` -- Excel supplies it as a number
   */
  test.each([true, false])('parses Excel time cells with cellDates=%s', (cellDates) => {
    const workbook = workbookFromRows([
      header,
      ['Movie 1', new Date(2026, 10, 14, 13, 30), 1, '15:00', 'PG']
    ])
    // convert the workbook into Excel file bytes (basically make a .xlsx file)
    const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const loaded = XLSX.read(bytes, { type: 'buffer', cellDates })

    // from that Excel file, get the time (from cell B2 from the workbook)
    const time = loaded.Sheets.Schedule.B2.v

    // when cellDates = true, time should be an instance of date. Otherwise, it should be a number.
    expect(time instanceof Date).toBe(cellDates)
    expect(parseSheet(loaded)).toEqual({
      shows: [{ id: 'm1', title: 'Movie 1', start: '13:30', auditorium: 1 }]
    })
  })
})

describe('parseSheet header location', () => {
  test('reports no data when the header is the final row', () => {
    const workbook = workbookFromRows([['Cinema schedule'], header])

    expect(() => parseSheet(workbook)).toThrow('header is final row, so there is nothing to parse')
  })

  test('parses the single data row between the header and end of file', () => {
    const workbook = workbookFromRows([['Cinema schedule'], header, firstRow])

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow] })
  })

  test('reports a missing header', () => {
    const workbook = workbookFromRows([['Cinema schedule'], firstRow, secondRow])

    expect(() => parseSheet(workbook)).toThrow('Header row not found')
  })

  test('finds a header in the middle and parses all following rows', () => {
    const workbook = workbookFromRows([
      ['Cinema schedule'],
      ['Prepared for the weekend'],
      header,
      firstRow,
      secondRow
    ])

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow, secondShow] })
  })

  test('finds a header at the start and parses all following rows', () => {
    const workbook = workbookFromRows([header, firstRow, secondRow])

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow, secondShow] })
  })
})

describe('parseSheet blank rows', () => {
  test('skips two trailing empty rows included in the worksheet range', () => {
    const workbook = workbookFromRows([header, firstRow])
    workbook.Sheets.Schedule['!ref'] = 'A1:E4'

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow] })
  })

  test('skips internal empty rows and keeps show IDs consecutive', () => {
    const workbook = workbookFromRows([header, firstRow, [], secondRow])

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow, secondShow] })
  })

  test('skips rows containing only empty cells or whitespace', () => {
    const workbook = workbookFromRows([
      header,
      firstRow,
      [null, '', '   ', undefined, '\t'],
      secondRow
    ])

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow, secondShow] })
  })

  test('reports no data when only blank rows follow the header', () => {
    const workbook = workbookFromRows([header])
    workbook.Sheets.Schedule['!ref'] = 'A1:E3'

    expect(() => parseSheet(workbook)).toThrow('nothing to parse after header row')
  })

  // tests that a '0' in a cell is not considered blank
  test('keeps numeric midnight as a valid showtime', () => {
    const workbook = workbookFromRows([header, ['Movie 1', 0, 1]])
    // the '0' represents a start time at midnight (00:00)

    expect(parseSheet(workbook)).toEqual({
      shows: [{ id: 'm1', title: 'Movie 1', start: '00:00', auditorium: 1 }]
    })
  })

  test('does not silently skip a populated row with a missing showtime', () => {
    const workbook = workbookFromRows([header, ['Movie 1', null, 1]])

    expect(() => parseSheet(workbook)).toThrow('Invalid showtime')
  })
})

describe('parseSheet JSON output', () => {
  test('returns the complete shows object with the expected fields, types, and IDs', () => {
    const workbook = workbookFromRows([
      header,
      ['Movie 1', '12:30', 1, '14:00', 'PG'],
      ['Movie 2', '13:00', 2, '14:30', 'PG-13'],
      ['Movie 3', '13:45', 3, '15:15', 'PG'],
      ['Movie 4', '14:15', 4, '15:45', 'R'],
      ['Movie 1', '15:30', 1, '17:00', 'PG'],
      ['Movie 2', '16:00', 2, '17:30', 'PG-13'],
      ['Movie 3', '16:45', 3, '18:15', 'PG'],
      ['Movie 4', '17:15', 4, '18:45', 'R'],
      ['Movie 1', '18:30', 1, '20:00', 'PG'],
      ['Movie 2', '19:00', 2, '20:30', 'PG-13'],
      ['Movie 3', '19:45', 3, '21:15', 'PG'],
      ['Movie 4', '20:15', 4, '21:45', 'R'],
      ['Movie 1', '21:30', 1, '23:00', 'PG'],
      ['Movie 2', '22:00', 2, '23:30', 'PG-13'],
      ['Movie 3', '22:30', 3, '00:00', 'PG']
    ])

    const result = parseSheet(workbook)

    expect(result).toEqual({
      shows: [
        { id: 'm1', title: 'Movie 1', start: '12:30', auditorium: 1 },
        { id: 'm2', title: 'Movie 2', start: '13:00', auditorium: 2 },
        { id: 'm3', title: 'Movie 3', start: '13:45', auditorium: 3 },
        { id: 'm4', title: 'Movie 4', start: '14:15', auditorium: 4 },
        { id: 'm5', title: 'Movie 1', start: '15:30', auditorium: 1 },
        { id: 'm6', title: 'Movie 2', start: '16:00', auditorium: 2 },
        { id: 'm7', title: 'Movie 3', start: '16:45', auditorium: 3 },
        { id: 'm8', title: 'Movie 4', start: '17:15', auditorium: 4 },
        { id: 'm9', title: 'Movie 1', start: '18:30', auditorium: 1 },
        { id: 'm10', title: 'Movie 2', start: '19:00', auditorium: 2 },
        { id: 'm11', title: 'Movie 3', start: '19:45', auditorium: 3 },
        { id: 'm12', title: 'Movie 4', start: '20:15', auditorium: 4 },
        { id: 'm13', title: 'Movie 1', start: '21:30', auditorium: 1 },
        { id: 'm14', title: 'Movie 2', start: '22:00', auditorium: 2 },
        { id: 'm15', title: 'Movie 3', start: '22:30', auditorium: 3 }
      ]
    })
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })
})
