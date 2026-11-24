import { join } from 'path'
import { test, expect } from 'vitest'
import { runSolver } from '../main/solver'
import { readFile } from 'node:fs/promises'

/*
*
 * SET-UP
 * 1: Create virtual environment in webdevadv/solver
 * 2: Install dependencies
 * 3: run "npm test"
 *
 *  This test uses "sample_input.json" from the solver folder
 */

const expected = {
  s1: ['m1', 'm3', 'm5', 'm7'],

  s2: ['m2', 'm4', 'm6', 'm9'],

  s3: ['m8', 'm10', 'm12', 'm14'],

  s4: ['m9', 'm11', 'm13', 'm15']
}

test('solver run', { timeout: 30_000 }, async () => {
  const numOfServer = 4
  const sampleFileInput = await readFile('solver/sample_input.json', 'utf8')
  const data = JSON.parse(sampleFileInput)
  const res = await runSolver(data, { script: join('./', 'solver', 'solver.py') })

  try {
    expect(res['ok']).toBe(true)
  } catch (err) {
    throw new Error('Connection failed: ' + res['error'])
  }

  const assignments = res['schedule']['assignments']

  try {
    expect(assignments.length == numOfServer).toBe(true)
  } catch (error) {
    throw new Error('Unexpected length of array - Expected: 4 | Actual: ' + assignments.length)
  }

  assignments.forEach((element) => {
    const server_id = element['server_id']

    const expectedShows = expected[server_id]

    const actualShows = element['shows']

    for (var i = 0; i < 4; i++) {
      const show_id = actualShows[i]['show_id']

      const expectedShow = expectedShows[i]

      try {
        expect(show_id).toBe(expectedShow)
      } catch (error) {
        throw new Error('Show mismatch - Expected: ' + expectedShow + ' | Actual: ' + show_id)
      }
    }
  })
})
