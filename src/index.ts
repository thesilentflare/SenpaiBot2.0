import { Client, EmbedBuilder, GatewayIntentBits, TextChannel } from 'discord.js';
import senpai8ball from './modules/senpai8ball';
import fortune from './modules/fortune';
import dotenv from 'dotenv';
import { db, initializeDatabase } from './modules/database';
import {
  handleBirthCommand,
  handleBlistCommand,
  scheduleBirthdayNotifications,
} from './modules/birthdays';

// Load .env.local if it exists, otherwise fallback to .env
dotenv.config({
  path: `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`,
});

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

// Wait for the database to initialize before starting the bot
initializeDatabase()
  .then(() => {
    client.once('clientReady', () => {
      console.log(`Logged in as ${client.user?.tag}!`);
      console.log(`Bot is ready and connected to guild: ${GUILD_ID}`); // Log the guild ID when the bot is ready

      // Start the birthday reminder feature
      // checkBirthdays();
      scheduleBirthdayNotifications(client);
    });

    // Event listener for messages
    client.on('messageCreate', (message) => {
      if (message.author.bot) return; // Ignore bot messages

      // Delegate to Senpai8ball
      if (message.content.startsWith('!8ball')) {
        senpai8ball.emit('messageCreate', message);
      }

      // Delegate to Fortune
      if (message.content.startsWith('!fortune')) {
        fortune.emit('messageCreate', message);
      }

      // Delegate the !birth command to the birthdayReminder.ts file
      if (message.content.startsWith('!birth')) {
        handleBirthCommand(message);
      }

      // Delegate the !blist command to the birthdayReminder.ts file
      if (message.content.startsWith('!blist')) {
        handleBlistCommand(message);
      }
    });

    // Event listener for when a new user joins the server
    client.on('guildMemberAdd', async (member) => {
      const { id: discordID, username, discriminator } = member.user;
      const channel = (await client.channels.fetch(MAIN_GENERAL_CHANNEL_ID)) as TextChannel; // Replace with your channel ID

      db.run(
        `INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)`,
        [
          discordID,
          member.nickname || username, // Combine nickname or username into a single name field
        ],
        async (err) => {
          if (err) {
            console.error('Error adding new user to Users table:', err.message);
            // bot send message in chat about error
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
            console.log(`New user added to Users table: ${username}#${discriminator}`);
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

    // Log in to Discord
    client.login(BOT_TOKEN); // Use the loaded bot token
  })
  .catch((err) => {
    console.error('Failed to initialize the database:', err);
    process.exit(1);
  });
