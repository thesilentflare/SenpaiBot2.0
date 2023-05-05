import database
import sqlite3
def initialize(server_name):
    global db
    db = server_name + '.db'
    conn = sqlite3.connect(db)
    database.initialize(conn)
    conn.close()