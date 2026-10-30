import { spawn } from 'child_process'

const DEFAULT_TIMEOUT_MS = 30000

function pythonCommand() {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH
  return process.platform === 'win32' ? 'python' : 'python3'
}

export function runSolver(
  data,
  { script, python = pythonCommand(), timeoutMs = DEFAULT_TIMEOUT_MS }
) {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let finished = false

    const child = spawn(python, [script])

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
      if (err.code === 'ENOENT') {
        finish({ ok: false, error: `Python not found (tried "${python}")` })
      } else {
        finish({ ok: false, error: `Could not start solver: ${err.message}` })
      }
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
