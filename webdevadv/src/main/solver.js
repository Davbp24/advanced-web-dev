import { spawn } from 'child_process'
import { join } from 'path'

const DEFAULT_TIMEOUT_MS = 30000

const START_FAILED_MESSAGE = "The scheduling engine couldn't start. Try reinstalling the app."

function pythonCommand(platform = process.platform) {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH
  return platform === 'win32' ? 'python' : 'python3'
}

// Picks which solver to run. Takes plain values (not Electron's `app`) so it can be tested without Electron.
//   Installed app -> the bundled solver program in <resourcesPath>/solver/ (no Python needed)
//   Dev mode      -> Python running <appPath>/solver/solver.py
export function solverCommand({ isPackaged, resourcesPath, appPath, platform = process.platform }) {
  if (isPackaged) {
    const exe = platform === 'win32' ? 'solver.exe' : 'solver'
    return { command: join(resourcesPath, 'solver', exe), args: [] }
  }
  return { command: pythonCommand(platform), args: [join(appPath, 'solver', 'solver.py')] }
}

// Two ways to start the solver:
//   { script }          -> run Python with that script (dev mode, tests)
//   { command, args }   -> run a program directly (the bundled solver in the installed app)
export function runSolver(
  data,
  { script, python = pythonCommand(), command, args = [], timeoutMs = DEFAULT_TIMEOUT_MS }
) {
  const program = command ?? python
  const programArgs = command ? args : [script]

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let finished = false

    const child = spawn(program, programArgs)

    // Several events can fire for one run (e.g. 'error' then 'close'); only the first one counts.
    const finish = (result) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      child.kill()
      finish({ ok: false, error: `Solver took longer than ${timeoutMs / 1000} seconds` })
    }, timeoutMs)

    child.on('error', (err) => {
      // Plain words for the user; the technical reason goes to the log.
      console.error(`Solver could not start ("${program}"): ${err.message}`)
      finish({ ok: false, error: START_FAILED_MESSAGE })
    })

    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))

    child.on('close', (code) => {
      if (code !== 0) {
        finish({ ok: false, error: stderr.trim() || `Solver exited with code ${code}` })
        return
      }
      try {
        finish({ ok: true, schedule: JSON.parse(stdout) })
      } catch {
        finish({ ok: false, error: 'Solver returned output that is not valid JSON' })
      }
    })

    // If Python exits before reading its input, writing to stdin fails; 'close' reports the real cause.
    child.stdin.on('error', () => {})
    child.stdin.end(JSON.stringify(data))
  })
}
