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
const { parseSheet } = runInNewContext(`${parserSource}\n;({ parseSheet });`, {
  require: createRequire(parserUrl),
  console: { log() {} }
})

const header = ['Movie', 'Start', 'Auditorium', 'End', 'Rating']
const firstRow = ['Movie 1', '12:30', 1, '14:00', 'PG']
const secondRow = ['Movie 2', '13:00', 2, '14:30', 'PG-13']
const firstShow = { id: 'm1', title: 'Movie 1', start: '12:30', auditorium: 1 }
const secondShow = { id: 'm2', title: 'Movie 2', start: '13:00', auditorium: 2 }

function workbookFromRows(rows) {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Schedule')
  return workbook
}

describe('parseSheet header location', () => {
  test('reports no data when the header is the final row', () => {
    const workbook = workbookFromRows([['Cinema schedule'], header])
    console.log(workbook)

    expect(() => parseSheet(workbook)).toThrow('header is final row, so there is nothing to parse')
  })

  test('parses the single data row between the header and end of file', () => {
    const workbook = workbookFromRows([['Cinema schedule'], header, firstRow])

    expect(parseSheet(workbook)).toEqual({ shows: [firstShow] })
  })

  test('reports a missing header', () => {
    const workbook = workbookFromRows([
      ['Cinema schedule'],
      firstRow,
      secondRow
    ])

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
