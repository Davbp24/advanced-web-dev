import { expect, test } from 'vitest';
import Employee from '../../employee/employee.js';


test("Employee can be imported and stores employee details", () => {
    const employee = new Employee('Alex', 'Usher');

    expect(employee.getName()).toBe('Alex');
    expect(employee.getOccupation()).toBe('Usher');
})

