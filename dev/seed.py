import os
import sqlite3
import models.birthday as birthdays

from sqlite3 import Error
from dotenv import load_dotenv

load_dotenv()
GUILD = os.getenv("DISCORD_GUILD")
db = GUILD + ".db"

conn = sqlite3.connect(db)


# Seed Birthdays
print(birthdays.birthdays(conn))






