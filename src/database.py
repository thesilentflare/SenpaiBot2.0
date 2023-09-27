import sqlite3
from sqlite3 import Error
import math


def create_table(conn, create_table_sql):
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)


################################################################
# Users
################################################################
def get_admins(conn, id):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_get_admins = """SELECT * FROM models_discordadmin WHERE discord_id=$id;"""
            placeholders = {"id": id}
            c.execute(sql_get_admins, placeholders)
            return c.fetchall()
        except Error as e:
            print(e)
        conn.close()



################################################################
# Birthdays
################################################################
def add_birthday(conn, discord_id, name, month, day):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_insert_new_birthday = """INSERT OR IGNORE INTO models_birthday (discord_id, name, month, day) VALUES ($discord_id, $name, $month, $day);"""
            placeholders = {"discord_id": discord_id, "name": name, "month": month, "day": day}
            c.execute(sql_insert_new_birthday, placeholders)
            conn.commit()
        except Error as e:
            print(e)
        conn.close()


def delete_birthday(conn, discord_id):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_del_birthday = """DELETE FROM models_birthday WHERE discord_id=$discord_id;"""
            placeholders = {"discord_id": discord_id}
            c.execute(sql_del_birthday, placeholders)
            conn.commit()
        except Error as e:
            print(e)
        conn.close()


def list_birthdays(conn):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_all_birthday = """SELECT * FROM models_birthday ORDER BY month, day;"""
            c.execute(sql_all_birthday)
            return c.fetchall()
        except Error as e:
            print(e)
        conn.close()


def get_today_birthdays(conn, month, day):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_today_birthdays = """SELECT * FROM models_birthday WHERE month=$month AND day=$day;"""
            placeholders = {"month": month, "day": day}
            c.execute(sql_today_birthdays, placeholders)
            return c.fetchall()
        except Error as e:
            print(e)
        conn.close()

def get_monthly_birthdays(conn, month):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_today_birthdays = """SELECT * FROM models_birthday WHERE month=$month;"""
            placeholders = {"month": month}
            c.execute(sql_today_birthdays, placeholders)
            return c.fetchall()
        except Error as e:
            print(e)
        conn.close()

def get_next_birthdays(conn, month, day):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_next_birthdays = """SELECT * FROM models_birthday WHERE (month>=$month AND day>=$day) OR (month>$month AND day<=$day);"""
            placeholders = {"month": month, "day": day}
            c.execute(sql_next_birthdays, placeholders)
            result = c.fetchmany(3)
            # account for end of year
            if len(result) < 3:
                all_birthdays = list_birthdays(conn)
                result += all_birthdays[: 3 - len(result)]
            return result
        except Error as e:
            print(e)
        conn.close()
        
def get_birthday_channel(conn):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_get_birthday_channel = """SELECT channel_id FROM models_channel WHERE channel_name=$name;"""
            placeholders = {"name": 'BIRTHDAY_CHANNEL'}
            c.execute(sql_get_birthday_channel, placeholders)
            return c.fetchone()[0]
        except Error as e:
            print(e)
        conn.close()


def set_birthday_channel(conn, id):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_set_birthday_channel = """INSERT OR IGNORE INTO models_channel (channel_name, channel_id) VALUES ($channel_name, $channel_id);"""
            sql_update_birthday_channel = """UPDATE models_channel SET channel_id=$channel_id WHERE channel_name=$channel_name;"""
            placeholders = {"channel_name": 'BIRTHDAY_CHANNEL', 'channel_id': id}
            c.execute(sql_set_birthday_channel, placeholders)
            c.execute(sql_update_birthday_channel, placeholders)
            conn.commit()
        except Error as e:
            print(e)
        conn.close()
        
# #########################################################################
def get_logs_channel(conn):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_get_logs_channel = """SELECT channel_id FROM models_channel WHERE channel_name=$name;"""
            placeholders = {"name": 'LOGS_CHANNEL'}
            c.execute(sql_get_logs_channel, placeholders)
            return c.fetchone()[0]
        except Error as e:
            print(e)
        conn.close()

# TODO: use django models instead
# sql_create_birthday_table = """CREATE TABLE IF NOT EXISTS birthdays (
#                                             id CHAR(50) PRIMARY KEY,
#                                             name CHAR(50),
#                                             mm integer DEFAULT 0,
#                                             dd integer DEFAULT 0)"""
################################################################
################################################################

# PIKAGACHA_TABLE_LIST = []
# OTHER_TABLE_LIST = [sql_create_birthday_table]


# def initialize(conn):
#     for table in OTHER_TABLE_LIST:
#         create_table(conn, table)

#     for table in PIKAGACHA_TABLE_LIST:
#         create_table(conn, table)
    # TODO: remove below when implemented above
    # create_table(conn, sql_create_pikapoints_table)
    # create_table(conn, sql_create_pikagacha_table)
    # create_table(conn, sql_create_pikapity_table)
    # create_table(conn, sql_create_inventory)
    # create_table(conn, sql_create_jackpot)
    # create_table(conn, sql_create_bag)
    # create_table(conn, sql_create_bank)
    # create_table(conn, sql_create_fav)
    # create_table(conn, sql_create_stadium)
    # create_table(conn, sql_create_trainer)
    # create_table(conn, sql_create_ranks)
    # create_table(conn, sql_create_team)

    # pokemon = load_pikadata('pokedata.csv')
    # for key in pokemon:
    #     setup_pikagacha(conn, key, pokemon[key][0], pokemon[key][1], pokemon[key][2], pokemon[key][3])

    # teams = ['Team Electrocution', 'Team Lensflare', 'Team Hyperjoy']
    # initialize_teams(conn, teams)

    # ranks = [('Recruit', 0), ('Crook', 250), ('Grunt', 500), ('Thug', 750), ('Associate', 1000), ('Hitman', 1250),
    #          ('Officer', 1500), ('Sergeant', 1750), ('Captain', 2000), ('Lieutenant', 2250), ('Admin', 2500),
    #          ('Comonthander', 2750), ('Boss', 3500)]
    # initialize_ranks(conn, ranks)
