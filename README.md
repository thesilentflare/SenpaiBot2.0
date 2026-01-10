# SenpaiBot 2.0

Our bot for our Discord server, version 2.0.

Link to the original version: [Senpaibot](https://github.com/SnoopySnipe/SenpaiBot)

<p>
<img src="./docs/senpai_bot.png" width="350">
</p>

Credits: art by [Sen_Yomi](https://www.instagram.com/sen_yomi/?hl=en)

---

## 🚨 Upgrading from v0.2.0-alpha?

If you're upgrading from the Python-based v0.2.0-alpha to this TypeScript v0.3.0 version, **you need to migrate your database**.

**Quick Start:**

```bash
node migrations/scripts/migrate_v0.2_to_v0.3.js YOUR_GUILD_ID YOUR_TIMEZONE [YEAR]
```

**Example:**

```bash
node migrations/scripts/migrate_v0.2_to_v0.3.js 578082133646639126 America/Toronto 2000
```

**Full Documentation:**

- [Quick Start Guide](./migrations/QUICKSTART.md)
- [Detailed Migration Guide](./migrations/README.md)

---

## Requirements

- Node.js v16 or higher
- npm (comes with Node.js)
- A Discord bot token ([How to create a bot](https://discord.com/developers/applications))
- Your Discord server (guild) ID

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
TIME_ZONE=America/Toronto

BIRTHDAY_REMINDER_HOUR=0
BIRTHDAY_REMINDER_DAY_OF_MONTH=1

MAIN_GENERAL_CHANNEL_ID=channel_id_here
BIRTHDAY_REMINDER_CHANNEL_ID=channel_id_here
LOGS_CHANNEL_ID=channel_id_here
```

### 3. Run the Bot

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm run build
npm start
```

## Features

SenpaiBot v0.3.0 includes the following modules:

- **8ball** - Magic 8-ball fortune telling with misspelling detection
- **Fortune** - Random fortune cookie messages
- **Birthdays** - Birthday tracking with timezone support and automatic reminders
- **Admin Manager** - Role-based admin system with database-backed permissions
- **Help** - Dynamic command discovery and organized help display
- **Message Logger** - Logs deleted/edited messages with user exemption support
- **Yu-Gi-Oh!** - Card lookup from Fandom wiki with rich embeds
- **Warframe** - Codex wiki lookup
- **Image Boards** - Random images from Yandere and Safebooru

### Module System

The bot uses a dynamic, plugin-based module architecture. Modules can be enabled/disabled via `modules.config.json` without code changes.

See [Module System Documentation](./docs/MODULE_SYSTEM.md) for details on creating new modules.

## Commands

Use `!help` or `!commands` in Discord to see all available commands.

### Core Commands

- `!8ball <question>` - Ask the magic 8-ball a question
- `!fortune` - Get a random fortune cookie message
- `!birth YYYY-MM-DD` - Set your birthday
- `!blist` - List all birthdays

### Lookup Commands

- `!yugioh <card name>` - Look up a Yu-Gi-Oh! card
- `!codex <entry>` - Look up Warframe codex entry
- `!daily` - Get a random image from imageboards

### Admin Commands

- `!addadmin @user` - Add a user as bot admin
- `!removeadmin @user` - Remove admin privileges

For a complete list with usage examples, use `!help` in your Discord server.

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

See [Testing Guide](./docs/TESTING.md) for more information.

## Development

### Project Structure

```
src/
├── index.ts              # Bot entry point
├── modules/
│   ├── database.ts       # Database initialization
│   ├── 8ball/           # Magic 8-ball module
│   ├── fortune/         # Fortune module
│   ├── birthdays/       # Birthday tracking
│   ├── adminManager/    # Admin management
│   ├── help/            # Help system
│   ├── messageLogger/   # Message logging
│   ├── yugioh/          # Yu-Gi-Oh! lookup
│   ├── warframe/        # Warframe lookup
│   └── imageBoards/     # Imageboard integration
├── types/
│   └── module.ts        # Module interfaces
└── utils/
    └── moduleLoader.ts  # Dynamic module loader
```

### Available Scripts

- `npm run dev` - Start bot in development mode
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled bot
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Documentation

- [Module System](./docs/MODULE_SYSTEM.md) - Guide to creating modules
- [Testing Guide](./docs/TESTING.md) - Testing best practices
- [Migration Guide](./migrations/README.md) - Migrating from v0.2.0

## License

GNU GPLv3
