import os
import sqlite3
import models.birthday as birthdays
import models.channel as channels

from sqlite3 import Error
from dotenv import load_dotenv

load_dotenv()
GUILD = os.getenv("DISCORD_GUILD")
db = GUILD + ".db"

conn = sqlite3.connect(db)


# Seed Birthdays
print("Seeded birthdays: ", birthdays.birthdays(conn))
print("Seeded channels: ",channels.channels(conn))
conn.close()





