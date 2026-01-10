import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST (base .env first, then environment-specific)
dotenv.config(); // Load .env first
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : null;
if (envFile) {
  const envPath = path.resolve(process.cwd(), envFile);
  console.log(`Loading environment from: ${envPath}`);
  const result = dotenv.config({ path: envPath, override: true }); // Override with environment-specific
  if (result.error) {
    console.error(`Error loading ${envFile}:`, result.error);
  } else {
    console.log(`Successfully loaded ${envFile}`);
  }
}

// NOW import modules that depend on environment variables
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js';
import { db, initializeDatabase } from './modules/database';
import { ModuleLoader } from './utils/moduleLoader';

const GUILD_ID = process.env.GUILD_ID || ''; // Load the guild ID from the environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''; // Load the bot token from the environment variables
const MAIN_GENERAL_CHANNEL_ID = process.env.MAIN_GENERAL_CHANNEL_ID || '';
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
      console.log(`Logged in as ${client.user?.tag}!`);
      console.log(`Bot is ready and connected to guild: ${GUILD_ID}`);

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
      console.log(`Timezone: ${TIME_ZONE}`);
      console.log(`Current time: ${currentTime}`);

      console.log(
        `Loaded ${moduleLoader.getEnabledModules().length} module(s): ${moduleLoader
          .getEnabledModules()
          .map((m) => m.name)
          .join(', ')}`,
      );
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
            console.error(`[${module.name}] Error handling message:`, error);
          }
        }
      }
    });

    // Event listener for when a new user joins the server
    client.on('guildMemberAdd', async (member) => {
      const { id: discordID, username, discriminator } = member.user;
      const channel = (await client.channels.fetch(
        MAIN_GENERAL_CHANNEL_ID,
      )) as TextChannel;

      db.run(
        `INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)`,
        [discordID, member.nickname || username],
        async (err) => {
          if (err) {
            console.error('Error adding new user to Users table:', err.message);
            const embed = new EmbedBuilder()
              .setTitle('Error')
              .setDescription(
                `There was an error adding ${
                  member.nickname || username
                } to the database. Please get an admin to add you manually.`,
              )
              .setColor(0xff0000);
            await channel.send({ embeds: [embed] });
          } else {
            console.log(
              `New user added to Users table: ${username}#${discriminator}`,
            );
            const embed = new EmbedBuilder()
              .setTitle(`Welcome ${member.nickname || username}!`)
              .setDescription(
                `You have been added to the database. Use !birth YYYY-MM-DD to set your birthday!`,
              )
              .setColor(0xff0000);
            await channel.send({ embeds: [embed] });
          }
        },
      );
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down bot...');
      await moduleLoader.cleanup();
      client.destroy();
      process.exit(0);
    });

    // Log in to Discord
    client.login(BOT_TOKEN);
  })
  .catch((err) => {
    console.error('Failed to initialize the database:', err);
    process.exit(1);
  });
