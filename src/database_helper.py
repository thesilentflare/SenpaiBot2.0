import database
import sqlite3


def initialize(server_name):
    global db
    db = server_name + ".db"
    conn = sqlite3.connect(db)
    # database.initialize(conn)
    conn.close()

def get_admins(id):
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.get_admins(conn, id)
        conn.close()
        return result


def add_birthday(user_id, name, month, day):
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.add_birthday(conn, user_id, name, month, day)
        conn.close()
        return result


def delete_birthday(user_id):
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.delete_birthday(conn, user_id)
        conn.close()
        return result


def get_today_birthdays(month, day):
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.get_today_birthdays(conn, month, day)
        conn.close()
        return result


def list_birthdays():
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.list_birthdays(conn)
        conn.close()
        return result


def get_next_birthdays(month, day):
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.get_next_birthdays(conn, month, day)
        conn.close()
        return result
    
def get_birthday_channel():
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.get_birthday_channel(conn)
        conn.close()
        return result


def set_birthday_channel(id):
    conn = sqlite3.connect(db)
    if conn is not None:
        result = database.set_birthday_channel(conn, id)
        conn.close()
        return result
