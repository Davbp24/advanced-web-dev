import { Employee } from './employee';
import { db } from '../database/initialize';



const writeToDB = (name, occupation) => {
    if(!name.trim() || !occupation.trim()){
        throw new Error('Name and occupation are required');
    }
    
    const employee = new Employee(name, occupation);

    //Send employee over to db with prepared statement
    const statement = db.prepare(f`INSERT INTO employeesTable (employee_name, occupation) 
        VALUES (?, ?)`);
    
    //use run to add values from employee object into statement for it to run
    const result = statement.run(employee.getName(), employee.getOccupation());


}

const retrieveFromDB = (id, employee_name) => {
    
    

}





export default empDBLogic;
