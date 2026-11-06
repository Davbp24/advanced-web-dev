import sqlite3
default_connection = sqlite3.connect("employee.db")

# connecting to the database and implicity creating it if it doesn't exist - will throw error if trying to create it twice
def db_connection(db_name="employee.db"):
    con = None
    try:
        con = sqlite3.connect(db_name)
        print(f"Table {db_name} created successfully. " )
    except Exception as e:
        print(f"Failed to create {db_name} file. There may already be a Database with this name. Please try again. {e}" )
        raise e

# Creating table with schema 
def create_table(db_con, table_schema):
    try:
        cur = db_con.cursor()
        cur.execute(table_schema)
    except Exception as e:
        print(f"Failed to create table with schema: {table_schema}. Please try again. {e}" )
        raise e

def read_all_tables( db_con):
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
            print(f"Failed to read values from database {db_con}. Please try again. {e}")
            raise e
    

def read_table(db_con, table_name):
    try:
        conn = sqlite3.connect(db_con)

        cursor = conn.cursor()

        query = f"SELECT * FROM {table_name} WHERE type='table';"
        cursor.execute(query)

        tables = cursor.fetchall()

        print("Tables in the database:")
        for table in tables:
            print(table[0])  # table is fetched as a tuple, e.g., ('table_name',)

        conn.close()

    except Exception as e:
                print(f"Failed to read values from table {table_name}. Please try again. {e}")
                raise e

def read_table_schema(db_con,table_name):
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

################################################################################
DATABASE_NAME = "MovieTheater"

TABLE_SCHEMA = ""

read_table_schema("employee.db", "employees")
read_all_tables("employee.db")

