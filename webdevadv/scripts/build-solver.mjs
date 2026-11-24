// Builds the standalone solver (solver-dist/solver/) with PyInstaller.
// Run with: npm run build:solver
// Uses PYTHON_PATH if set, otherwise the project's .venv (Mac/Linux or Windows layout).

import { spawnSync } from 'child_process'
import { existsSync } from 'fs'

const venvPython = process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python'
const python = process.env.PYTHON_PATH || venvPython

if (!process.env.PYTHON_PATH && !existsSync(venvPython)) {
  console.error(
    `No Python found at ${venvPython}.\n` +
      'Set it up first:\n' +
      '  python3 -m venv .venv\n' +
      '  .venv/bin/pip install -r solver/requirements.txt -r solver/requirements-build.txt\n' +
      '(On Windows: py -m venv .venv, then .venv\\Scripts\\pip install ...)'
  )
  process.exit(1)
}

const result = spawnSync(
  python,
  [
    '-m',
    'PyInstaller',
    'solver/solver.spec',
    '--distpath',
    'solver-dist',
    '--workpath',
    'solver-dist/.work',
    '--noconfirm'
  ],
  { stdio: 'inherit' }
)

process.exit(result.status ?? 1)
