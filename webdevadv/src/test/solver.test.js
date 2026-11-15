import { join } from 'path';
import { test, expect } from 'vitest';
import { runSolver } from '../main/solver';
import { readFile } from 'node:fs/promises';

/**
 * SET-UP
 * 1: Create virtual environment in webdevadv/solver
 * 2: Install dependencies
 * 3: run "npm test"
 * 
 *  This test uses "sample_input.json" from the solver folder
 */

test('solver run', { timeout: 30_000 }, async () => {    
    const numOfServer = 4;

    const sampleFileInput = await readFile("solver/sample_input.json", "utf8");
    const data = JSON.parse(sampleFileInput);
    const res = await runSolver(data, { script: join('./', 'solver', 'solver.py')});

    console.log(res);

    expect(res['ok']).toBe(true);

    const assignments = res['schedule']['assignments']

    expect(assignments.length == numOfServer).toBe(true);

    console.log(assignments);
});