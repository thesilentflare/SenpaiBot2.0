import db from "./database";
import { Client, TextChannel } from "discord.js";
import dotenv from "dotenv";
import { DateTime } from "luxon";

dotenv.config();

const client = new Client({ intents: [] });
const BIRTHDAY_CHANNEL_ID = process.env.BIRTHDAY_CHANNEL_ID || "";
const TIME_ZONE = process.env.TIME_ZONE || "UTC"; // Default to UTC if not specified
const BIRTHDAY_REMINDER_HOUR = parseInt(
  process.env.BIRTHDAY_REMINDER_HOUR || "9",
  10
); // Default to 9 AM

// Function to check and send birthday reminders
function checkBirthdays(): void {
  const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format

  db.all(
    `SELECT Users.name, Users.discordID FROM Birthdays 
            JOIN Users ON Birthdays.discordID = Users.discordID
            WHERE dateISOString = ?`,
    [today],
    (err, rows: Array<{ name: string; discordID: string }>) => {
      if (err) {
        console.error("Error fetching birthdays:", err.message);
        return;
      }

      rows.forEach((user) => {
        const channel = client.channels.cache.get(
          BIRTHDAY_CHANNEL_ID
        ) as TextChannel; // Use environment variable for channel ID
        if (channel) {
          channel.send(`🎉 Happy Birthday, ${user.name || "User"}! 🎂`);
        }
      });
    }
  );
}

// Function to send monthly birthday reminders
function sendMonthlyBirthdayReminders(): void {
  db.all(
    `SELECT Users.name, strftime('%m', Birthdays.dateISOString) as month, strftime('%d', Birthdays.dateISOString) as day FROM Birthdays 
            JOIN Users ON Birthdays.discordID = Users.discordID
            WHERE month = ?`,
    [new Date().getMonth() + 1],
    (err, rows: Array<{ name: string; month: string; day: string }>) => {
      if (err) {
        console.error("Error fetching monthly birthdays:", err.message);
        return;
      }

      if (rows.length > 0) {
        let message = `🎊 Birthdays for ${new Date().toLocaleString("default", {
          month: "long",
        })} 🎊\n`;
        rows.forEach((user) => {
          message += `${user.name || "User"}: ${user.month}/${user.day}\n`;
        });

        const channel = client.channels.cache.get(
          BIRTHDAY_CHANNEL_ID
        ) as TextChannel; // Use environment variable for channel ID
        if (channel) {
          channel.send(message);
        }
      }
    }
  );
}

// Function to calculate the next reminder time
function getNextReminderTime(): number {
  const now = DateTime.now().setZone(TIME_ZONE);
  let nextReminder = now.set({
    hour: BIRTHDAY_REMINDER_HOUR,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  if (now >= nextReminder) {
    nextReminder = nextReminder.plus({ days: 1 }); // Schedule for the next day
  }

  return nextReminder.toMillis() - now.toMillis();
}

// Schedule the birthday check at the specified hour
setTimeout(() => {
  checkBirthdays();
  setInterval(checkBirthdays, 24 * 60 * 60 * 1000); // Repeat every 24 hours
}, getNextReminderTime());

// Send monthly birthday reminders on the 1st of every month
const firstDayOfMonth = new Date();
firstDayOfMonth.setDate(1);
firstDayOfMonth.setHours(0, 0, 0, 0);

const now = new Date();
const timeToFirstRun = firstDayOfMonth.getTime() - now.getTime();

// Schedule the monthly reminder
setTimeout(() => {
  sendMonthlyBirthdayReminders();

  // Schedule the next run dynamically based on the first day of the next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const timeToNextRun = nextMonth.getTime() - now.getTime();

  setInterval(() => {
    sendMonthlyBirthdayReminders();

    // Dynamically calculate the next interval
    const nextRun = new Date();
    const followingMonth = new Date(
      nextRun.getFullYear(),
      nextRun.getMonth() + 1,
      1
    );
    const timeToFollowingRun = followingMonth.getTime() - nextRun.getTime();
    setTimeout(sendMonthlyBirthdayReminders, timeToFollowingRun);
  }, timeToNextRun);
}, timeToFirstRun);

// Function to handle the !birth command
function handleBirthCommand(message: import("discord.js").Message) {
  if (message.author.bot) return; // Ignore bot messages

  const args = message.content.split(" ");
  if (args.length !== 2) {
    message.reply("Invalid command format. Use: !birth YYYY-MM-DD");
    return;
  }

  const date = args[1];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    message.reply("Invalid date format. Please use YYYY-MM-DD.");
    return;
  }

  const { id: discordID } = message.author;

  db.run(
    `INSERT OR REPLACE INTO Birthdays (discordID, dateISOString) VALUES (?, ?)`,
    [discordID, date],
    (err) => {
      if (err) {
        console.error("Error updating birthday:", err.message);
        message.reply(
          "An error occurred while updating your birthday. Please try again later."
        );
      } else {
        message.reply(`Your birthday has been updated to ${date}. 🎉`);
      }
    }
  );
}

export { checkBirthdays, handleBirthCommand };
