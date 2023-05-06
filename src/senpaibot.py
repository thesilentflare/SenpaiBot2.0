# bot.py
import os
import random
import sys
import signal
import asyncio
import discord
import database_helper

from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")
GUILD = os.getenv("DISCORD_GUILD")

DESCRIPTION = """The senpai of the server."""
bot = commands.Bot(
    command_prefix="!", intents=discord.Intents.all(), description=DESCRIPTION
)


@bot.event
async def on_ready():
    print("Logged in as")
    print(bot.user.name)
    print(bot.user.id)
    print("------")
    await bot.change_presence(activity=discord.Game(name="Ara-ara~~❤ Kouhai-kun"))
    database_helper.initialize(str(bot.guilds[0].id))


# @bot.command()
# async def leave():
#     leave_all_voice_channels(bot)
#     print("Left all voice channels")


# test command
@bot.command(name="99")
async def nine_nine(ctx):
    brooklyn_99_quotes = [
        "I'm the human form of the 💯 emoji.",
        "Bingpot!",
        (
            "Cool. Cool cool cool cool cool cool cool, "
            "no doubt no doubt no doubt no doubt."
        ),
    ]

    response = random.choice(brooklyn_99_quotes)
    await ctx.send(response)


# def signal_handler(signal, frame):
# 	'''(Signal, Frame) -> null
# 	Upon signal, stop the bot and exit the program
# 	'''

# 	print("\nLogging out bot...")
# 	leave_all_voice_channels(bot)
# 	# log out bot and close connection
# 	bot.logout()
# 	bot.close()
# 	print("Bot has logged out.")
# 	# exit program
# 	sys.exit(0)


def leave_all_voice_channels(bot):
    """(Client) -> null
    makes the Client leave all connected voice channels
    """

    connected_voices = []
    # get a list of all voice channels the bot is connected to
    for voice in bot.voice_clients:
        # if bot is connected to the channel, add it to the list
        if voice.is_connected():
            connected_voices.append(voice)
    # if bot is not connected to any voice channel, print error message
    if connected_voices:
        # disconnect bot from all connected voice channels
        for voice in connected_voices:
            voice.disconnect()


# class MyBot(commands.Bot):
#     async def setup_hook(self):
#         for module in modules:
#             await self.load_extension(module)


async def main():
    async with bot:
        for module in modules:
            await bot.load_extension(module)
        await bot.start(TOKEN)


modules = ["senpai_birthdays"]


if __name__ == "__main__":
    if TOKEN is None:
        print("Error: no token given")
        sys.exit(1)

    try:
        #     loop.run_until_complete(bot.start(TOKEN))
        #     # asyncio.new_event_loop().run_until_complete(bot.start(TOKEN))
        asyncio.run(main())
    except KeyboardInterrupt:
        print("INTERRUPTED...")
        #     # asyncio.get_event_loop().run_until_complete(tally_before_exit())
        #     loop.run_until_complete(bot.close())
        #     # cancel all tasks lingering

        # finally:
        #     loop.run_until_complete(bot.close())
        #     # TODO: unsure to keep below or not
        #     loop.run_until_complete(asyncio.gather(*asyncio.all_tasks()))
