import random
import requests
import time

import discord
import aiohttp
from io import BytesIO

from discord.ext import commands
from hentai import Hentai, Format, Utils, Sort, Option, Tag


async def send_embed_nh_msg(context, title, post_url, cover_url, doujin_id, doujin_tags, doujin_num_pages, doujin_num_favs):
  embed_msg = discord.Embed(title=title, url=post_url, color=0xFF93AC)
  # message details
  embed_msg.add_field(name="ID: ", value="`{}`".format(doujin_id), inline=True)
  embed_msg.add_field(name="Pages: ", value="`{}`".format(doujin_num_pages), inline=True)
  embed_msg.add_field(name="Favourites: ", value="`{}`".format(doujin_num_favs), inline=True)
  embed_msg.add_field(name="Tags: ", value="{}".format(doujin_tags), inline=False)
  embed_msg.set_image(url=cover_url)
  # send message
  await context.send(embed=embed_msg)

def parse_tags(tags_list):
  formatted_tags = ""
  
  for tag in tags_list:
    formatted_tags += f"`{tag.name}` "
  return formatted_tags

class SenpaiNh(commands.Cog):
  __slots__ = "messages"

  def __init__(self, bot):
      self.bot = bot
      self.messages = set()
      
  @commands.command(name="nhr")
  async def nhr(self, context):
      # get random doujin
      doujin_id = Utils.get_random_id()
      random_doujin = Hentai(doujin_id)
      doujin_title = random_doujin.title(Format.Pretty)
      doujin_cover = random_doujin.thumbnail
      doujin_tags = parse_tags(random_doujin.tag)
      doujin_num_pages = random_doujin.num_pages
      doujin_num_favs = random_doujin.num_favorites
      
      await send_embed_nh_msg(context, doujin_title, random_doujin.url, doujin_cover, doujin_id, doujin_tags, doujin_num_pages, doujin_num_favs)


async def setup(bot):
    await bot.add_cog(SenpaiNh(bot))