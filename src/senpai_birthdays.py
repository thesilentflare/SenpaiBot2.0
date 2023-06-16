import os
import discord
import asyncio
import datetime
import pytz
import time
import calendar
import database_helper
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv()

TIME_ZONE = pytz.timezone(os.getenv("TIME_ZONE"))
utc = pytz.utc
BIRTHDAY_NOTIF_HOUR = int(os.getenv("BIRTHDAY_NOTIF_HOUR"))
# time = datetime.time(BIRTHDAY_NOTIF_HOUR,0,0,0)
time4 = datetime.datetime.strptime("{}:0:0".format(BIRTHDAY_NOTIF_HOUR), "%H:%M:%S")
time3 = TIME_ZONE.localize(time4)
time = time3.astimezone(utc).replace(minute=0).time()

class SenpaiBirthdays(commands.Cog):
    __slots__ = "messages"

    def __init__(self, bot):
        self.bot = bot
        self.messages = set()
        self.background_birthdays.start()

    def cog_unload(self):
        self.background_birthdays.cancel()

    @tasks.loop(time=time)
    async def background_birthdays(self):
        # using channel id from db instead of .env
        channel = self.bot.get_channel(int(database_helper.get_birthday_channel()))
        # channel = self.bot.get_channel(int(DISPLAY_CHANNEL))
        if channel is None:
            return
        
        mm = datetime.datetime.now(TIME_ZONE).month
        dd = datetime.datetime.now(TIME_ZONE).day
        
        # Monthly birthdays
        if (dd == 1):
            m_list = database_helper.get_monthly_birthdays(mm)
            if m_list:
                title = "🎊 {} BIRTHDAYS 🎊".format((calendar.month_name[mm]).upper())

                description = ""
                for entry in m_list:
                    username = entry[2]
                    description += "{}: {}/{}\n".format(username, entry[3], entry[4])
                embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
                msg = await channel.send(embed=embed)
                if msg:
                    self.messages.add(msg)
        
        list = database_helper.get_today_birthdays(mm, dd)
        if list:
            title = "🎊 HAPPY BIRTHDAY TO 🎊"
            description = ""
            for entry in list:
                username = entry[2]
                description += "{}: <@{}>\n".format(username, entry[1])
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
            msg = await channel.send(embed=embed)
            if msg:
                self.messages.add(msg)

    @background_birthdays.before_loop
    async def before_background_birthdays(self):
        print("waiting...")
        await self.bot.wait_until_ready()
    
    @commands.command(name="bset")
    async def bset(self, context):
        ADMIN_IDS = database_helper.get_admins(context.message.author.id)
        if len(ADMIN_IDS) == 0:
            await context.send("Y'all'th'st'd've'ish ain't an Admin")
            return
        # get context id
        channel_id = context.message.channel.id
        # send to db
        database_helper.set_birthday_channel(channel_id)
        # confirmation message
        await context.send("Birthday Channel Set")


    @commands.group(invoke_without_command=True)
    async def birthday(self, context, *arg):
        offset = len("!birthday")
        question = context.message.content[offset + 1 :]
        # check for action arguments
        if len(question) == 0:
            await context.send(
                "`Usage:\n"
                + "!blist\n"
                + "!birthday add [user_id] [name] [mm] [dd]\n"
                + "!birthday del [user_id]\n`"
            )
            return
        if arg[0] == "add":
            if len(arg) == 5:
                ADMIN_IDS = database_helper.get_admins(context.message.author.id)
                if len(ADMIN_IDS) == 0:
                    database_helper.add_birthday(arg[1], arg[2], arg[3], arg[4])
                    await context.send("Birthday Created")
                else:
                    await context.send("Y'all'th'st'd've'ish ain't an Admin")
            else:
                await context.send('Usage: !birthday add "user_id" "name" "mm" "dd"')
        elif arg[0] == "del":
            if len(arg) == 2:
                ADMIN_IDS = database_helper.get_admins(context.message.author.id)
                if len(ADMIN_IDS) == 0:
                    database_helper.delete_birthday(arg[1])
                    await context.send("Birthday Deleted")
                else:
                    await context.send("Y'all'th'st'd've'ish ain't an Admin")
            else:
                await context.send('Usage: !birthday del "user_id"')
        # elif (arg[0] == "list"):
        #     list = database_helper.list_birthday()
        #     # clean up the formatting here
        #
        #     channel = self.bot.get_channel(TEST_CHANNEL_ID)
        #     msg = await channel.send(list)
        #     if msg:
        #         self.messages.add(msg)
        # else:
        #     await context.send("Command not found!")

    @commands.command(name="blist")
    async def blist(self, context):
        list = database_helper.list_birthdays()
        # clean up the formatting here
        # embed = self.format_list(list)
        title = "Birthdays"
        # description = "this1\n"
        # description += "this"
        description = "Person | Month | Day\n\n"
        if len(list) > 0:
            for entry in list:
                # username = self.bot.get_user(entry[0]).name
                #             try:
                #                 username = self.bot.get_user(entry[0]).name
                #             except:
                #                 username = entry[0]
                name = entry[2]
                description += "{}: {}/{}\n".format(name, entry[3], entry[4])
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
        else:
            description = "No Birthdays in Database"
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
        # channel = self.bot.get_channel(TEST_CHANNEL_ID)
        await context.send(embed=embed)
        # else:
        #     await context.send("Command not found!")

    @commands.command()
    async def bnext(self, context):
        list = database_helper.get_next_birthdays(
            datetime.datetime.now(TIME_ZONE).month,
            datetime.datetime.now(TIME_ZONE).day,
        )
        title = "Upcoming 3 Birthdays"
        description = "Person | Month | Day\n\n"
        if len(list) > 0:
            for entry in list:
                name = entry[2]
                description += "{}: {}/{}\n".format(name, entry[3], entry[4])
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
        else:
            description = "No Birthdays in Database"
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
        await context.send(embed=embed)


async def setup(bot):
    await bot.add_cog(SenpaiBirthdays(bot))
