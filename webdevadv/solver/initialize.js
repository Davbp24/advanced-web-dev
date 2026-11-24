// import sqlite3 from 'sqlite3'
import Database from 'better-sqlite3';

const DATABASE_NAME = 'MovieTheater.db'
const TABLE_NAME = 'schedulesTable'
const TABLE_EMP_NAME = 'employeesTable'
const TABLE_SCHEDULE = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id       INTEGER PRIMARY KEY,
    date     TEXT NOT NULL,
    schedule TEXT NOT NULL
  ) 
`

const TABLE_EMP = `
  CREATE TABLE IF NOT EXISTS ${TABLE_EMP_NAME} (
    id       INTEGER PRIMARY KEY,
    occupation     TEXT NOT NULL,
    employee_name TEXT NOT NULL
  )
`
const db = new Database(DATABASE_NAME);


//TODO: check if there's a difference between the const db and let db.

// Create table with schema without breaking if it already exists
function createTable(db, tableSchema, dbCon = DATABASE_NAME) {
  try {
    db.exec(tableSchema)
    console.log('Table ' + dbCon + ' created successfully.')
  } catch (err) {
    const errorMsg = err.message.toLowerCase()
    // Fallback safeguard in case a schema is passed without 'IF NOT EXISTS'
    if (errorMsg.includes('already exists')) {
      console.log(`Table already exists. Continuing...`)
    } else {
      console.error(`Failed to create table with schema: ${tableSchema}\nPlease try again.`, err)
      throw err
    }
  } 
}

function readAllTables(db) {
  try {
    const tables = db
      .prepare(
        `
      SELECT name 
      FROM sqlite_schema 
      WHERE type = 'table' 
        AND name NOT LIKE 'sqlite_%'
    `
      )
      .all()

    const tableNames = tables.map((t) => t.name)
    console.log(tableNames)
  } catch (err) {
    console.error(`Failed to read all tables from database ${dbCon}. Please try again.`, err)
    throw err
  } 
}

function readTable(db, tableName = TABLE_NAME) {
  
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all()

    console.log(`Items in the table ${tableName}:`)
    for (const row of rows) {
      console.log(row)
    }
  } catch (err) {
    console.error(`Failed to read values from table ${tableName}. Please try again.`, err)
    throw err
  } 
}

function readTableSchema(db, tableName = TABLE_NAME) {

  try {
    const result = db
      .prepare('SELECT sql FROM sqlite_schema WHERE type="table" AND name=?')
      .get(tableName)

    if (result) {
      console.log(result.sql)
    } else {
      console.log(`Table '${tableName}' not found.`)
    }
  } catch (err) {
    console.error(`Failed to read table schema from ${tableName}. Please try again.`, err)
    throw err
  } 
  
}

function addToTable(scheduleJson, db, tableName = TABLE_NAME) {

  try {
    const stmt = db.prepare(`INSERT INTO ${tableName} (date, schedule) VALUES (?, ?)`)

    // Format current date as YYYY-MM-DD (matches Python's datetime.date.today())
    const currentDate = new Date().toISOString().split('T')[0]

    stmt.run(currentDate, scheduleJson)
  } catch (err) {
    console.error(`Failed to add to ${tableName}. Please try again.`, err)
    throw err
  } 
}

function initializeDatabase(){
  createTable(db, TABLE_SCHEDULE)
  createTable(db, TABLE_EMP)
}

// ============================================================================

// readTableSchema()



export {
  initializeDatabase,
  addToTable,
  db
}