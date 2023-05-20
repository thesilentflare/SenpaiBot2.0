import uuid
from sqlite3 import Error

sql_set_birthday_channel = """INSERT OR IGNORE INTO models_channel (channel_name, channel_id) VALUES (?, ?);"""
channel_name_list = ['BIRTHDAY_CHANNEL']

def channels(conn):
  channel_list = []
  for channel in channel_name_list:
    channel_list.append((channel, str(uuid.uuid1().int)))
    
  if conn is not None:
    try:
      c = conn.cursor()
      c.executemany(sql_set_birthday_channel, channel_list)
      conn.commit()
    except Error as e:
        print(e)
    conn.close()
  return channel_list
  
