import sqlite3
from sqlite3 import Error
import math

def create_table(conn, create_table_sql):
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)




# def initialize(conn):
  # 

