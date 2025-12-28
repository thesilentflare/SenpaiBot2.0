import { Client, GatewayIntentBits } from "discord.js";
import senpai8ball from "./senpai8ball";
import fortune from "./fortune";
import dotenv from "dotenv";
import db from "./database";
import { checkBirthdays, handleBirthCommand } from "./birthdays";

// Load .env.local if it exists, otherwise fallback to .env
dotenv.config({
  path: `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`,
});

const GUILD_ID = process.env.GUILD_ID || ""; // Load the guild ID from the environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ""; // Load the bot token from the environment variables

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize the database before the bot is ready
function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("Initializing database...");
      db.run(
        `CREATE TABLE IF NOT EXISTS Users (
        discordID TEXT PRIMARY KEY,
        name TEXT
      )`,
        (err) => {
          if (err) {
            console.error("Error creating Users table:", err.message);
            reject(err);
          } else {
            console.log("Users table ready.");
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS Birthdays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discordID TEXT,
        dateISOString TEXT,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error("Error creating Birthdays table:", err.message);
            reject(err);
          } else {
            console.log("Birthdays table ready.");
          }
        }
      );

      db.run(
        `CREATE TABLE IF NOT EXISTS Admins (
        discordID TEXT,
        active BOOLEAN,
        FOREIGN KEY (discordID) REFERENCES Users (discordID)
      )`,
        (err) => {
          if (err) {
            console.error("Error creating Admins table:", err.message);
            reject(err);
          } else {
            console.log("Admins table ready.");
            resolve();
          }
        }
      );
    });
  });
}

// Wait for the database to initialize before starting the bot
initializeDatabase()
  .then(() => {
    client.once("clientReady", () => {
      console.log(`Logged in as ${client.user?.tag}!`);
      console.log(`Bot is ready and connected to guild: ${GUILD_ID}`); // Log the guild ID when the bot is ready

      // Start the birthday reminder feature
      checkBirthdays();
    });

    // Event listener for messages
    client.on("messageCreate", (message) => {
      if (message.author.bot) return; // Ignore bot messages

      // Delegate to Senpai8ball
      if (message.content.startsWith("!8ball")) {
        senpai8ball.emit("messageCreate", message);
      }

      // Delegate to Fortune
      if (message.content.startsWith("!fortune")) {
        fortune.emit("messageCreate", message);
      }

      // Delegate the !birth command to the birthdayReminder.ts file
      if (message.content.startsWith("!birth")) {
        handleBirthCommand(message);
      }
    });

    // Event listener for when a new user joins the server
    client.on("guildMemberAdd", (member) => {
      const { id: discordID, username, discriminator } = member.user;

      db.run(
        `INSERT OR IGNORE INTO Users (discordID, name) VALUES (?, ?)`,
        [
          discordID,
          member.nickname || username, // Combine nickname or username into a single name field
        ],
        (err) => {
          if (err) {
            console.error("Error adding new user to Users table:", err.message);
          } else {
            console.log(
              `New user added to Users table: ${username}#${discriminator}`
            );
          }
        }
      );
    });

    // Log in to Discord
    client.login(BOT_TOKEN); // Use the loaded bot token
  })
  .catch((err) => {
    console.error("Failed to initialize the database:", err);
    process.exit(1);
  });
