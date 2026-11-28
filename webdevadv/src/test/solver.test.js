import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, test, expect } from 'vitest'
import { runSolver } from '../main/solver'

/**
 * Solver tests
 *
 * These check the scheduling RULES, not exact assignments. Several schedules can tie
 * for the best score, so the solver may return a different (equally valid) one after
 * any change. Checking rules keeps the tests passing for every valid schedule and
 * failing for every invalid one.
 *
 * SET-UP (local)
 *   cd webdevadv/solver
 *   python3 -m venv .venv
 *   .venv/bin/pip install -r requirements.txt
 *   cd .. && npm test
 *
 * The tests use solver/.venv if it exists, otherwise PYTHON_PATH or python3 (CI).
 */

const SCRIPT = join('solver', 'solver.py')
const VENV_PYTHON =
  process.platform === 'win32'
    ? join('solver', '.venv', 'Scripts', 'python.exe')
    : join('solver', '.venv', 'bin', 'python')

function solverOptions() {
  const options = { script: SCRIPT }
  if (!process.env.PYTHON_PATH && existsSync(VENV_PYTHON)) options.python = VENV_PYTHON
  return options
}

async function loadInput(file) {
  return JSON.parse(await readFile(join('solver', file), 'utf8'))
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Checks every hard rule against a finished schedule.
 * Returns a list of problems; an empty list means the schedule is valid.
 */
function findRuleViolations(input, schedule) {
  const { rules, servers, shows } = input
  const problems = []
  const serversById = new Map(servers.map((s) => [s.id, s]))
  const showsById = new Map(shows.map((m) => [m.id, m]))
  const serversPerShow = new Map(shows.map((m) => [m.id, 0]))

  for (const assignment of schedule.assignments) {
    const server = serversById.get(assignment.server_id)
    if (!server) {
      problems.push(`Unknown server in output: ${assignment.server_id}`)
      continue
    }
    const earliest = toMinutes(server.shift_start) + rules.first_show_after_shift_start
    const latest = toMinutes(server.shift_end) - rules.no_show_before_shift_end
    const starts = []

    for (const { show_id } of assignment.shows) {
      const show = showsById.get(show_id)
      if (!show) {
        problems.push(`Unknown show in output: ${show_id}`)
        continue
      }
      const start = toMinutes(show.start)
      if (start < earliest || start > latest) {
        problems.push(`${server.name} has ${show.start}, outside their window`)
      }
      serversPerShow.set(show_id, serversPerShow.get(show_id) + 1)
      starts.push({ start, label: show.start })
    }

    starts.sort((a, b) => a.start - b.start)
    for (let i = 1; i < starts.length; i++) {
      if (starts[i].start - starts[i - 1].start < rules.min_minutes_between_show_starts) {
        problems.push(`${server.name} has ${starts[i - 1].label} and ${starts[i].label}, too close`)
      }
    }
  }

  for (const [showId, count] of serversPerShow) {
    if (count > rules.max_servers_per_show) {
      problems.push(`Show ${showId} has ${count} servers (max ${rules.max_servers_per_show})`)
    }
  }
  return problems
}

describe('solver', () => {
  test('normal day: valid schedule, every show covered, everyone at minimum', { timeout: 30_000 }, async () => {
    const input = await loadInput('sample_input.json')
    const res = await runSolver(input, solverOptions())

    expect(res.ok, `Solver failed: ${res.error}`).toBe(true)
    const schedule = res.schedule

    expect(['OPTIMAL', 'FEASIBLE']).toContain(schedule.status)
    expect(schedule.date).toBe(input.date)
    expect(schedule.assignments).toHaveLength(input.servers.length)
    expect(findRuleViolations(input, schedule)).toEqual([])

    // A fully staffed day should need no warnings
    expect(schedule.warnings).toEqual([])

    // Every show has at least the minimum number of servers
    for (const show of input.shows) {
      const count = schedule.assignments.filter((a) =>
        a.shows.some((s) => s.show_id === show.id)
      ).length
      expect(count, `Show ${show.id} (${show.start}) is uncovered`).toBeGreaterThanOrEqual(
        input.rules.min_servers_per_show
      )
    }

    // Every server meets the minimum number of shows
    for (const a of schedule.assignments) {
      expect(a.shows.length, `${a.name} is below minimum`).toBeGreaterThanOrEqual(
        input.rules.min_shows_per_server
      )
    }
  })

  test('understaffed day: still returns a valid schedule and flags uncovered shows', { timeout: 30_000 }, async () => {
    const input = await loadInput('test_understaffed.json')
    const res = await runSolver(input, solverOptions())

    expect(res.ok, `Solver failed: ${res.error}`).toBe(true)
    const schedule = res.schedule

    // It must not fail just because some shows can't be covered
    expect(['OPTIMAL', 'FEASIBLE']).toContain(schedule.status)
    expect(schedule.assignments.length).toBeGreaterThan(0)
    expect(findRuleViolations(input, schedule)).toEqual([])

    // Every uncovered show must be reported, and every reported show must really be uncovered
    const covered = new Set(schedule.assignments.flatMap((a) => a.shows.map((s) => s.show_id)))
    const uncovered = input.shows.filter((m) => !covered.has(m.id)).map((m) => m.id)
    const warned = schedule.warnings
      .filter((w) => w.type === 'uncovered_show')
      .map((w) => w.show_id)

    expect(uncovered.length).toBeGreaterThan(0)
    expect(warned.sort()).toEqual(uncovered.sort())
  })
})
