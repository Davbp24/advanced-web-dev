import { DatabaseSync } from 'node:sqlite';
import { test, expect } from 'vitest';

const DB_PATH = "../../../../employee.db"


test('database connection', () => {
    let engine = null;
    try {
        engine = new DatabaseSync(DB_PATH);
    } catch (error) {
        throw new Error("Failed to connect to database: " + error);
    }

    try {
        expect(engine.isOpen).toBe(true);
    } catch (error) {
        throw new Error("Failed to connect to database")
    }
})