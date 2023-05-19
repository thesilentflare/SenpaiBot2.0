import sqlite3
import random
import uuid
from .fakes import fake
from sqlite3 import Error

sql_insert_new_birthday = """INSERT OR IGNORE INTO models_birthday (discord_id, name, month, day) VALUES (?, ?, ?, ?);"""

def birthdays(conn):
  birthday_list = []
  for i in range(10):
    discord_id = str(uuid.uuid1().int)
    name = fake.name()
    month = random.randint(1,12)
    day = int(fake.day_of_month())
    birthday_list.append((discord_id, name, month, day))
    
  if conn is not None:
    try:
      c = conn.cursor()
      placeholders = {"discord_id": discord_id, "name": name, "month": month, "day": day}
      c.executemany(sql_insert_new_birthday, birthday_list)
      conn.commit()
    except Error as e:
        print(e)
    conn.close()
  return birthday_list