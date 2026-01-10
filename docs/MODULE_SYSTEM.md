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
└── database.ts
```

### Creating a New Module

1. Create a new folder in `src/modules/` with your feature name
2. Create an `index.ts` file that exports a class implementing the `BotModule` interface
3. Add your module to the `modules.config.json` file

Example module structure:

```typescript
import { Client, Message } from 'discord.js';
import { BotModule } from '../../types/module';

class MyFeatureModule implements BotModule {
  name = 'myfeature';
  description = 'Description of what this module does';
  enabled = true;

  initialize(client: Client): void {
    console.log(`[${this.name}] Module initialized`);
    // Set up any listeners, timers, etc.
  }

  handleMessage(message: Message): boolean {
    if (message.content.startsWith('!mycommand')) {
      // Handle the command
      message.reply('Response');
      return true; // Return true to indicate the message was handled
    }
    return false; // Return false if not handled
  }

  cleanup(): void {
    console.log(`[${this.name}] Module cleaned up`);
    // Clean up any resources
  }
}

export default new MyFeatureModule();
```

### Module Configuration

Modules are configured in `modules.config.json` at the root of the project:

```json
{
  "8ball": {
    "enabled": true
  },
  "fortune": {
    "enabled": true
  },
  "birthdays": {
    "enabled": true
  },
  "myfeature": {
    "enabled": false
  }
}
```

Set `enabled: false` to disable a module without deleting its code.

### Module Interface

All modules must implement the `BotModule` interface:

```typescript
interface BotModule {
  name: string; // Unique identifier
  description: string; // What the module does
  enabled: boolean; // Whether it's active
  initialize(client: Client): void | Promise<void>; // Setup on bot start
  handleMessage?(message: Message): boolean | Promise<boolean>; // Optional message handler
  cleanup?(): void | Promise<void>; // Optional cleanup on shutdown
}
```

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
- **Reusable**: Module interface can be used for any feature type
- **Type-safe**: Full TypeScript support with interfaces

### Runtime Control

The `ModuleLoader` also supports runtime enable/disable:

```typescript
await moduleLoader.enableModule('myfeature'); // Enable a disabled module
await moduleLoader.disableModule('8ball'); // Disable an enabled module
```

This allows for future admin commands to toggle features on the fly.
