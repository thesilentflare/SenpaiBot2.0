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
  
async def send_embed_nh_list(context, search_query, res_list):
    embed_msg = discord.Embed(title=f"Searched: {search_query}", color=0xFF93AC)
    # print("here")
    for res in res_list[:10]:
      # print(res)
      title = res.title(Format.Pretty)
      id = hash(res)
      msg_name = f"[{id}: {title}]({res.url})"
      
      msg_value = f"Favs: {res.num_favorites} | Pages: {res.num_pages}"
      
      embed_msg.add_field(name=msg_name, value="`{}`".format(msg_value), inline=False)
    
    
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


  @commands.group(invoke_without_command=True)
  async def nhs(self, context, *arg):
    offset = len("!nhs")
    question = context.message.content[offset + 1 :]
    res = []
    
    if len(question) == 0:
      await context.send(
          "`Usage:\n"
          + "!nhs tag [tag_name]\n"
          + "!nhs key [keyword]\n`"
      )
      return
    await context.send(
          "`SEARCHING...`\n"
          + "`Please wait a moment while I search for the doujins.`\n"
      )
    search_criteria = arg[1]
    if arg[0] == "tag":
      # get random doujin by tag
      query = f"tag:{search_criteria}"
      res = await listSearchBy(query)
    elif arg[0] == "key":
      res = await listSearchBy(search_criteria)
    # print(res)
    if len(res) == 0:
      await context.send("No doujins found.")
      return
    await send_embed_nh_list(context, search_criteria, res)

async def listSearchBy(query_search):
  result_list = []
  search_query_with_time = f"{query_search} uploaded:30d"
  for doujin in Utils.search_all_by_query(query=search_query_with_time, sort=Sort.PopularWeek):
    result_list.append(doujin)
  return result_list

async def setup(bot):
    await bot.add_cog(SenpaiNh(bot))