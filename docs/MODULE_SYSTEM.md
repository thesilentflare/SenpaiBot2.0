# Module System

This bot now uses a dynamic, plugin-based module architecture that allows features to be easily added, removed, and toggled without modifying the core bot code.

## How It Works

### Module Structure

Each module is self-contained in its own folder under `src/modules/`:

```
src/modules/
├── 8ball/
│   └── index.ts
├── fortune/
│   └── index.ts
├── birthdays/
│   ├── index.ts
│   └── helpers.ts
├── adminManager/
│   ├── index.ts
│   └── helpers.ts
├── help/
│   └── index.ts
├── yugioh/
│   ├── index.ts
│   └── helpers.ts
├── warframe/
│   ├── index.ts
│   └── helpers.ts
├── imageBoards/
│   ├── index.ts
│   └── helpers.ts
└── database.ts
```

### Creating a New Module

1. Create a new folder in `src/modules/` with your feature name
2. Create an `index.ts` file that exports an instance implementing the `BotModule` interface
3. Add your module to the `modules.config.json` file

Example module structure:

```typescript
import { Client, Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';

class MyFeatureModule implements BotModule {
  name = 'myfeature';
  description = 'Description of what this module does';
  enabled = true;

  initialize(client: Client): void {
    console.log(`[${this.name}] Module initialized`);
    // Set up any listeners, timers, etc.
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (message.content.startsWith('!mycommand')) {
      await message.reply('Response');
      return true;
    }
    return false;
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!mycommand',
        description: 'Does something cool',
        usage: '!mycommand [options]',
        adminOnly: false,
      },
    ];
  }

  cleanup(): void {
    console.log(`[${this.name}] Module cleaned up`);
  }
}

export default new MyFeatureModule();
```

### Module Configuration

Modules are configured in `modules.config.json` at the root of the project.
Set `enabled: false` to disable a module without deleting its code.

### Dynamic Loading

The `ModuleLoader` class automatically:

- Discovers all modules in the `src/modules/` directory
- Loads the configuration from `modules.config.json`
- Initializes only enabled modules
- Routes messages to module handlers
- Handles graceful shutdown and cleanup

### Benefits

- **No manual imports**: New modules are automatically discovered
- **Easy toggling**: Enable/disable features via config file
- **Clean separation**: Each feature is isolated in its own folder
- **Type-safe**: Full TypeScript support with interfaces
- **Auto-documentation**: Modules provide command info for the help system
- **Admin controls**: Built-in permission system via adminManager module

## Current Modules

### Core Features

- **8ball** - Magic 8-ball fortune telling
- **fortune** - Fortune cookie messages
- **birthdays** - Birthday tracking and reminders with timezone support
- **adminManager** - Admin user management with permission checks
- **help** - Automatic command discovery and help display

### External API Features

- **yugioh** - Yu-Gi-Oh! card lookup from Fandom wiki
- **warframe** - Warframe codex wiki lookup
- **imageBoards** - Random images from Yandere and Safebooru
