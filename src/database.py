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
# Birthdays
################################################################
def add(conn, id, name, mm, dd):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_insert_new_birthday = """INSERT OR IGNORE INTO birthdays (id, name, mm, dd) VALUES ($id, $name, $mm, $dd);"""
            placeholders = {"id": id, "name": name, "mm": mm, "dd": dd}
            c.execute(sql_insert_new_birthday, placeholders)
            conn.commit()
        except Error as e:
            print(e)
        conn.close()


def delete(conn, id):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_del_birthday = """DELETE FROM birthdays WHERE id=$id;"""
            placeholders = {"id": id}
            c.execute(sql_del_birthday, placeholders)
            conn.commit()
        except Error as e:
            print(e)
        conn.close()


def list(conn):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_all_birthday = """SELECT * FROM birthdays ORDER BY mm, dd;"""
            c.execute(sql_all_birthday)
            return c.fetchall()
        except Error as e:
            print(e)
        conn.close()


def get_today_birthdays(conn, mm, dd):
    if conn is not None:
        try:
            c = conn.cursor()
            sql_today_birthday = """SELECT * FROM birthdays WHERE mm=$mm AND dd=$dd;"""
            placeholders = {"mm": mm, "dd": dd}
            c.execute(sql_today_birthday, placeholders)
            return c.fetchall()
        except Error as e:
            print(e)
        conn.close()


sql_create_birthday_table = """CREATE TABLE IF NOT EXISTS birthdays (
                                            id CHAR(50) PRIMARY KEY,
                                            name CHAR(50),
                                            mm integer DEFAULT 0,
                                            dd integer DEFAULT 0)"""
################################################################
################################################################

PIKAGACHA_TABLE_LIST = []
OTHER_TABLE_LIST = [sql_create_birthday_table]


def initialize(conn):
    for table in OTHER_TABLE_LIST:
        create_table(conn, table)

    for table in PIKAGACHA_TABLE_LIST:
        create_table(conn, table)
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
    #          ('Commander', 2750), ('Boss', 3500)]
    # initialize_ranks(conn, ranks)
