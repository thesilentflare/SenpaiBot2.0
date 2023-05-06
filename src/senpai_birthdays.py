import os
import discord
import asyncio
import datetime
import pytz
import time
import database_helper
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv()
ADMIN_IDS = os.getenv("ADMIN_ID_LIST")
DISPLAY_CHANNEL = os.getenv("EVENTS_CHANNEL_ID")
TIME_ZONE = os.getenv("TIME_ZONE")


class SenpaiBirthdays(commands.Cog):
    __slots__ = "messages"

    def __init__(self, bot):
        self.bot = bot
        self.messages = set()
        self.background_birthdays.start()

    # @commands.Cog.listener()
    # async def on_ready(self):
    #     # self.bot.loop.create_task(self.background_birthdays())
    #     self.background_birthdays.start()
    #     print("birthday task created")

    def cog_unload(self):
        self.background_birthdays.cancel()

    @tasks.loop(minutes=60)
    async def background_birthdays(self):
        if datetime.datetime.now(pytz.timezone(TIME_ZONE)).hour != 15:
            return
        channel = self.bot.get_channel(int(DISPLAY_CHANNEL))
        if channel is None:
            return
        mm = datetime.datetime.now(pytz.timezone(TIME_ZONE)).month
        dd = datetime.datetime.now(pytz.timezone(TIME_ZONE)).day
        list = database_helper.get_today_birthdays(mm, dd)
        if list:
            title = "🎊HAPPY BIRTHDAY TO🎊"

            description = ""
            for entry in list:
                # username = self.bot.get_user(entry[0]).name
                #                         try:
                #                             username = self.bot.get_user(entry[0]).name
                #                         except:
                #                             username = entry[0]
                username = entry[1]
                description += "{}".format(username)
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
            msg = await channel.send(embed=embed)
            if msg:
                self.messages.add(msg)
            # await asyncio.sleep(3600)

    @background_birthdays.before_loop
    async def before_background_birthdays(self):
        print("waiting...")
        await self.bot.wait_until_ready()

    async def get_birthdays():
        return None

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
                if str(context.message.author.id) in ADMIN_IDS:
                    database_helper.add_birthday(arg[1], arg[2], arg[3], arg[4])
                    await context.send("Birthday Created")
                else:
                    await context.send("Y'all'th'st'd've'ish ain't Snoopy or Sflare")
            else:
                await context.send('Usage: !birthday add "user_id" "name" "mm" "dd"')
        elif arg[0] == "del":
            if len(arg) == 2:
                if str(context.message.author.id) in ADMIN_IDS:
                    database_helper.delete_birthday(arg[1])
                    await context.send("Birthday Deleted")
                else:
                    await context.send("Y'all'th'st'd've'ish ain't Snoopy or Sflare")
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
                name = entry[1]
                description += "{}: {}/{}\n".format(name, entry[2], entry[3])
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
        else:
            description = "No Birthdays in Database"
            embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
        # channel = self.bot.get_channel(TEST_CHANNEL_ID)
        await context.send(embed=embed)
        # else:
        #     await context.send("Command not found!")

    # async def format_list(self, arr):
    #     title = "Birthdays"
    #     # for entry in arr:
    #     #     description += "{}".format(entry)
    #     description = "this1\n"
    #     description += "this"
    #     embed = discord.Embed(title=title, description=description, color=0xffffff)
    #     return embed


async def setup(bot):
    await bot.add_cog(SenpaiBirthdays(bot))
