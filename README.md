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
  - discord.py
  - [webpreview](https://github.com/ludbek/webpreview)

## Setup

```
~ $ make setup
```

_Note: if python is not found, open the makefile and edit the python alias_.

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

WIP

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

To run the bot:

```
~ $ make dev-bot
```

To run the portal:

```
~ $ make dev-portal
```
