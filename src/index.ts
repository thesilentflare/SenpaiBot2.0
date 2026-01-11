import dotenv from 'dotenv';
import path from 'path';
import Logger from './utils/logger';

// Load environment variables FIRST (base .env first, then environment-specific)
dotenv.config(); // Load .env first
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : null;
if (envFile) {
  const envPath = path.resolve(process.cwd(), envFile);
  Logger.debug(`Loading environment from: ${envPath}`);
  const result = dotenv.config({ path: envPath, override: true }); // Override with environment-specific
  if (result.error) {
    Logger.error(`Error loading ${envFile}`, result.error);
  } else {
    Logger.debug(`Successfully loaded ${envFile}`);
  }
}

// NOW import modules that depend on environment variables
import { Client, GatewayIntentBits } from 'discord.js';
import { initializeDatabase } from './modules/database';
import { ModuleLoader } from './utils/moduleLoader';

const GUILD_ID = process.env.GUILD_ID || ''; // Load the guild ID from the environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''; // Load the bot token from the environment variables
const TIME_ZONE = process.env.TIME_ZONE || 'UTC'; // Default to UTC if not set

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize the module loader
const moduleLoader = new ModuleLoader(client);

// Wait for the database to initialize before starting the bot
initializeDatabase()
  .then(async () => {
    // Discover and load all modules
    await moduleLoader.discoverModules();
    await moduleLoader.initializeModules();

    client.once('clientReady', () => {
      // Keep these critical startup messages in console for visibility
      Logger.console(`Logged in as ${client.user?.tag}!`);
      Logger.console(`Bot is ready and connected to guild: ${GUILD_ID}`);

      // Set bot presence/status
      client.user?.setPresence({
        activities: [{ name: 'The senpai of the server' }],
        status: 'online',
      });

      // Display timezone information
      const now = new Date();
      const currentTime = now.toLocaleString('en-US', {
        timeZone: TIME_ZONE,
        dateStyle: 'full',
        timeStyle: 'long',
      });
      Logger.console(`Timezone: ${TIME_ZONE}`);
      Logger.console(`Current time: ${currentTime}`);

      const enabledModules = moduleLoader.getEnabledModules();
      Logger.console(
        `Loaded ${enabledModules.length} module(s): ${enabledModules
          .map((m) => m.name)
          .join(', ')}`,
      );
      
      // Also log to file for record keeping
      Logger.info('Bot started successfully', {
        user: client.user?.tag,
        guildId: GUILD_ID,
        timezone: TIME_ZONE,
        moduleCount: enabledModules.length,
        modules: enabledModules.map((m) => m.name),
      });
    });

    // Event listener for messages - delegate to modules
    client.on('messageCreate', async (message) => {
      if (message.author.bot) return; // Ignore bot messages

      // Let each enabled module handle the message
      for (const module of moduleLoader.getEnabledModules()) {
        if (module.handleMessage) {
          try {
            const handled = await module.handleMessage(message);
            if (handled) break; // Stop processing if a module handled the message
          } catch (error) {
            Logger.forModule(module.name).error('Error handling message', error);
          }
        }
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      Logger.console('\nShutting down bot...');
      Logger.info('Bot shutdown initiated');
      await moduleLoader.cleanup();
      client.destroy();
      process.exit(0);
    });

    // Log in to Discord
    client.login(BOT_TOKEN);
  })
  .catch((err) => {
    Logger.critical('Failed to initialize the database', err);
    process.exit(1);
  });
