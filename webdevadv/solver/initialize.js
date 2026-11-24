// import sqlite3 from 'sqlite3'
const Database = require('better-sqlite3')

const DATABASE_NAME = 'MovieTheater.db'
const TABLE_NAME = 'schedulesTable'
const TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id       INTEGER PRIMARY KEY,
    date     TEXT NOT NULL,
    schedule TEXT NOT NULL
  )
`

// TODO: Create a function that takes in a name and makes it lowercase letters with no spaces and numbers?

// Connect to the database (implicitly creates the file if it doesn't exist)
function dbConnection(dbName = DATABASE_NAME) {
  let db
  try {
    db = new Database(dbName);
    console.log(`Database ${dbName} connected/created successfully.`)
  } catch (err) {
    console.error(`Failed to open/create ${dbName}. Please try again.`, err)
    throw err
  } finally {
    if (db) db.close()
  }
}

//TODO: check if there's a difference between the const db and let db.

// Create table with schema without breaking if it already exists
function createTable(tableSchema, dbCon = DATABASE_NAME) {
  const db = new Database(dbCon);
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
  } finally {
    db.close()
  }
}

function readAllTables(dbCon = DATABASE_NAME) {
  const db = new Database(dbCon);
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
  } finally {
    db.close()
  }
}

function readTable(dbCon = DATABASE_NAME, tableName = TABLE_NAME) {
  const db = new Database(dbCon);
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all()

    console.log(`Items in the table ${tableName}:`)
    for (const row of rows) {
      console.log(row)
    }
  } catch (err) {
    console.error(`Failed to read values from table ${tableName}. Please try again.`, err)
    throw err
  } finally {
    db.close()
  }
}

function readTableSchema(dbCon = DATABASE_NAME, tableName = TABLE_NAME) {
  const db = new Database(dbCon);
  try {
    const result = db
      .prepare('SELECT sql FROM sqlite_schema WHERE type="table" AND name=?')
      .get(tableName)

    if (result) {
      console.log(result.sql)
    } else {
      console.log(`Table '${tableName}' not found.`)
    }
  } finally {
    db.close()
  }
}

function addToTable(scheduleJson, dbCon = DATABASE_NAME, tableName = TABLE_NAME) {
  const db = new Database(dbCon);
  try {
    const stmt = db.prepare(`INSERT INTO ${tableName} (date, schedule) VALUES (?, ?)`)

    // Format current date as YYYY-MM-DD (matches Python's datetime.date.today())
    const currentDate = new Date().toISOString().split('T')[0]

    stmt.run(currentDate, scheduleJson)
  } finally {
    db.close()
  }
}

// ============================================================================
dbConnection()
createTable(TABLE_SCHEMA)
// readTableSchema()
readAllTables()
addToTable('test')
readTable()
