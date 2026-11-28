import Employee from './employee';
import { db } from '../database/initialize';



const writeToDB = (name, occupation) => {

    if (!db) throw new Error('Database not initialized');

    if(!name?.trim() || !occupation?.trim()){
        throw new Error('Name and occupation are required');
    }
    
    const employee = new Employee(name, occupation);

    //Send employee over to db with prepared statement
    const statement = db.prepare(`INSERT INTO employeesTable (employee_name, occupation) 
        VALUES (?, ?)`);
    
    //use run to add values from employee object into statement for it to run
    const result = statement.run(employee.getName(), employee.getOccupation());

    return result.lastInsertRowid;
}

const retrieveAllFromDB = () => {
    if (!db) throw new Error('Database not initialized');

    const retrieval = db.prepare(`SELECT id, employee_name, occupation FROM employeesTable ORDER BY employee_name`);

    return retrieval.all(); //return array of objects or empty array if no employees in table

    
}





export default {

    writeToDB,
    retrieveAllFromDB

};
