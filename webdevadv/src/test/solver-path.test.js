import { join } from 'path'
import { test, expect, afterEach } from 'vitest'
import { solverCommand } from '../main/solver'

const savedPythonPath = process.env.PYTHON_PATH
afterEach(() => {
  if (savedPythonPath === undefined) delete process.env.PYTHON_PATH
  else process.env.PYTHON_PATH = savedPythonPath
})

test('dev mode runs Python with solver.py', () => {
  delete process.env.PYTHON_PATH
  const cmd = solverCommand({
    isPackaged: false,
    resourcesPath: '/res',
    appPath: '/app',
    platform: 'darwin'
  })
  expect(cmd).toEqual({ command: 'python3', args: [join('/app', 'solver', 'solver.py')] })
})

test('dev mode on Windows uses "python"', () => {
  delete process.env.PYTHON_PATH
  const cmd = solverCommand({
    isPackaged: false,
    resourcesPath: '/res',
    appPath: '/app',
    platform: 'win32'
  })
  expect(cmd.command).toBe('python')
})

test('dev mode respects PYTHON_PATH', () => {
  process.env.PYTHON_PATH = '/my/venv/python'
  const cmd = solverCommand({
    isPackaged: false,
    resourcesPath: '/res',
    appPath: '/app',
    platform: 'darwin'
  })
  expect(cmd.command).toBe('/my/venv/python')
})

test('installed app runs the bundled solver with no args', () => {
  const cmd = solverCommand({
    isPackaged: true,
    resourcesPath: '/res',
    appPath: '/app',
    platform: 'darwin'
  })
  expect(cmd).toEqual({ command: join('/res', 'solver', 'solver'), args: [] })
})

test('installed app on Windows runs solver.exe', () => {
  const cmd = solverCommand({
    isPackaged: true,
    resourcesPath: '/res',
    appPath: '/app',
    platform: 'win32'
  })
  expect(cmd).toEqual({ command: join('/res', 'solver', 'solver.exe'), args: [] })
})
