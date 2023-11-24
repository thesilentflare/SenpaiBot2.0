# SenpaiBot 2.0

Our bot for our Discord server, version 2.0.

Link to the original version: [Senpaibot](https://github.com/SnoopySnipe/SenpaiBot)

<p>
<img src="./senpai_bot.png" width="350">
</p>

Credits: art by [Sen_Yomi](https://www.instagram.com/sen_yomi/?hl=en)

## Requirements

See makefile for more details.

- python3.10 or higher
- pip
  - [discord.py](https://discordpy.readthedocs.io/en/stable/)
  - [venv](https://docs.python.org/3/library/venv.html)
  - [webpreview](https://github.com/ludbek/webpreview)

## Setup

For first time setups (dev/prod), run the below command:

```
~ $ make setup
```

_Note: if python is not found, open the makefile and edit the python and/or pip alias_.

_Note2: if venv cannot be started, make sure prereqs are met_.

Edit newly generate `.env` file with your `DISCORD_GUILD` and `DISCORD_TOKEN`.

## Running

Makefile:

To run the bot:

```
~ $ make run-bot
```

To run the portal:

```
~ $ make run-portal
```

Manually:

To run the bot:

```
~ $ cd SenpaiBot2.0/src
~ $ python3 senpaibot.py
```

To run the portal:

```
~ $ python3 manage.py runserver
```

## Features

- Birthdays reminders
- Random anime imageboard
- Chat logs
- Magic 8ball fortune
- Warframe items lookup
- Yu-gi-oh card lookup

## Commands

WIP

## DEV

Makefile:

To setup:

```
~ $ make dev-setup
```

To seed database:

```
~ $ make dev-seed
```

To reset database:

```
~ $ make dev-reset
```

To create database migration:

```
~ $ make dev-create-migration
```

To migrate-up database:

```
~ $ make dev-migrate-up
```

To undo database migration:

```
~ $ dev-undo-migrate
```

To run the bot:

```
~ $ make dev-bot
```

To run the portal:

```
~ $ make dev-portal
```
