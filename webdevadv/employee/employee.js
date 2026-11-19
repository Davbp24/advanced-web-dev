class Employee {

    #name;
    #occupation;

    constructor(name, occupation) {
        this.#name = name;
        this.#occupation = occupation;
    }

    setName(newName){
        this.#name = newName; 
    }

    setOccupation(newOccupation){
        this.#occupation = newOccupation;
    }

    getName(){
        return this.#name;
    }

}


export default Employee;