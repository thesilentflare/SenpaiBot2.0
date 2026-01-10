import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js';
import dotenv from 'dotenv';
import { db, initializeDatabase } from './modules/database';
import { ModuleLoader } from './utils/moduleLoader';

// Load environment variables (base .env first, then environment-specific)
dotenv.config(); // Load .env first
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : null;
if (envFile) {
  dotenv.config({ path: envFile, override: true }); // Override with environment-specific
}

const GUILD_ID = process.env.GUILD_ID || ''; // Load the guild ID from the environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''; // Load the bot token from the environment variables
const MAIN_GENERAL_CHANNEL_ID = process.env.MAIN_GENERAL_CHANNEL_ID || '';

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
