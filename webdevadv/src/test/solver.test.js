import { join } from 'path';
import { test, expect } from 'vitest';
import { runSolver } from '../main/solver';
import { readFile } from 'node:fs/promises';

test('solver run', async () => {    
    const sampleFileInput = await readFile("solver/sample_input.json", "utf8");
    const data = JSON.parse(sampleFileInput);
    const res = await runSolver(data, { script: join('./', 'solver', 'solver.py')});

    console.log(res);

    expect(res['ok']).toBe(true);
});