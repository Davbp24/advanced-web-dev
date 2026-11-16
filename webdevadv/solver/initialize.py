import sqlite3
import datetime

DATABASE_NAME = "MovieTheater.db"
TABLE_NAME = "schedulesTable"
TABLE_SCHEMA = f"""CREATE TABLE {TABLE_NAME} (
                    id      INTEGER PRIMARY KEY,
                    date    TEXT NOT NULL,
                    schedule TEXT NOT NULL
                );"""


#TODO: Create a function that takes in a name and makes it lowercase letters with no spaces and numbers?

# connecting to the database and implicity creating it if it doesn't exist - will throw error if trying to create it twice
def db_connection(db_name=f"{DATABASE_NAME}"):
    con = None
    try:
        con = sqlite3.connect(db_name)
        print(f"Table {db_name} created successfully. " )
    except Exception as e:
        print(f"Failed to create {db_name} file. There may already be a Database with this name. Please try again. {e}" )
        raise e

# Creating table with schema 
def create_table(table_schema, db_con=DATABASE_NAME):
    conn = sqlite3.connect(db_con)
    try:
        cur = conn.cursor()
        cur.execute(table_schema)
    except Exception as e:
        error_msg = str(e).lower()
        if "table schedulesTable already exists" in error_msg:
            print("Table schedulesTable already exists. Continuing...")
        else:
            print(f"Failed to create table with schema: {table_schema}. \nPlease try again. {e}" )
            raise e
        

def read_all_tables(db_con=DATABASE_NAME):
    try:
        # path to db
        conn = sqlite3.connect(db_con)

        # cursor objects let you execute SQL queries
        cursor = conn.cursor()

        # Query the sqlite_master internal table for names of user-defined tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")

        tables = cursor.fetchall()

        print("Tables in the database:")
        for table in tables:
            print(table[0])  # table is fetched as a tuple, e.g., ('table_name',)

        conn.close()

    except Exception as e:
            print(f"Failed to read all tables from database {db_con}. Please try again. {e}")
            raise e
    

def read_table(db_con=DATABASE_NAME,table_name=TABLE_NAME):
    try:
        conn = sqlite3.connect(db_con)

        cursor = conn.cursor()

        query = f"SELECT * FROM {table_name};"
        cursor.execute(query)

        rows = cursor.fetchall()

        print(f"Items in the table {table_name}:")
        for row in rows:
            print(row)

        conn.close()

    except Exception as e:
                print(f"Failed to read values from table {table_name}. Please try again. {e}")
                raise e

def read_table_schema(db_con=DATABASE_NAME,table_name=TABLE_NAME):
    conn = sqlite3.connect(db_con)
    cursor = conn.cursor()

    # Query the database schema table
    cursor.execute("SELECT sql FROM sqlite_schema WHERE type='table' AND name=?;", (table_name,))
    result = cursor.fetchone()

    if result:
        print(result[0])
    else:
        print(f"Table '{table_name}' not found.")

    conn.close()

def add_to_table(schedule_json ,db_con=DATABASE_NAME,table_name=TABLE_NAME):
    conn = sqlite3.connect(db_con)
    cursor = conn.cursor()

    # Use '?' placeholders for values to prevent SQL injection and formatting errors
    query = f"INSERT INTO {table_name} (date, schedule) VALUES (?, ?);"
    
    # Get the current date as a string
    current_date = str(datetime.date.today())
    
    # Pass the variables as a tuple in the second argument of execute()
    cursor.execute(query, (current_date, schedule_json))
    
    # Save the changes before closing
    conn.commit()
    conn.close()

################################################################################
db_connection() #Creating the DB

#TODO: make sure the below function works even if the table exists already
# create_table(TABLE_SCHEMA) #Creating said table.

# add_to_table()
read_table_schema()
read_all_tables()
add_to_table("test")
read_table()
