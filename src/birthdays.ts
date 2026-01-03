import { Client, EmbedBuilder, Message, TextChannel } from "discord.js";
import dotenv from "dotenv";
import {
  BirthdayEntry,
  getAllBirthdays,
  getMonthlyBirthdays,
  getTodayBirthdays,
  setBirthday,
} from "./birthdayDbHelpers";
import { format, toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";
dotenv.config();

// const client = new Client({ intents: [] });
const BIRTHDAY_REMINDER_CHANNEL_ID =
  process.env.BIRTHDAY_REMINDER_CHANNEL_ID || "";
const TIME_ZONE = process.env.TIME_ZONE || "UTC"; // Default to UTC if not specified
const BIRTHDAY_REMINDER_HOUR = parseInt(
  process.env.BIRTHDAY_REMINDER_HOUR || "0",
  10
); // Default to 12 AM
const BIRTHDAY_REMINDER_DAY_OF_MONTH = parseInt(
  process.env.BIRTHDAY_REMINDER_DAY_OF_MONTH || "1",
  10
); // Default to 1st of the month

export const scheduleBirthdayNotifications = (client: Client): void => {
  const now = new Date();

  // Create the next notification time based on the specified time zone
  const nextNotificationTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    BIRTHDAY_REMINDER_HOUR,
    35,
    0
  );
  let zonedNextNotificationTime = toZonedTime(nextNotificationTime, TIME_ZONE);

  // If the scheduled time has already passed for today, move it to tomorrow
  if (zonedNextNotificationTime <= now) {
    zonedNextNotificationTime.setUTCDate(
      zonedNextNotificationTime.getUTCDate() + 1
    );
  }

  // Calculate the delay until the next notification
  const timeToNextRun = zonedNextNotificationTime.getTime() - now.getTime();

  // Log the time to the next run in minutes
  const minutesToNextRun = Math.ceil(timeToNextRun / (1000 * 60)); // Convert milliseconds to minutes
  console.log(`Next run in: ${minutesToNextRun} minutes`);

  // Schedule the task
  setTimeout(() => {
    sendMonthlyBirthdays(client); // Run immediately at the scheduled time

    // Set interval to repeat the task daily
    setInterval(() => {
      sendMonthlyBirthdays(client);
    }, 24 * 60 * 60 * 1000); // Repeat every 24 hours
  }, timeToNextRun);
};

const sendMonthlyBirthdays = async (client: Client): Promise<void> => {
  const channelId = BIRTHDAY_REMINDER_CHANNEL_ID;
  const channel = (await client.channels.fetch(channelId)) as TextChannel;

  if (!channel || !channel.isTextBased()) return; // Ensure it's a text channel

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // Months are 0-indexed
  const currentDate = now.getDate();

  if (currentDate === BIRTHDAY_REMINDER_DAY_OF_MONTH) {
    const birthdayList = await getMonthlyBirthdays(currentMonth);
    if (birthdayList.length > 0) {
      const title = `🎊 ${new Intl.DateTimeFormat("en-US", { month: "long" })
        .format(now)
        .toUpperCase()} BIRTHDAYS 🎊`;
      const description = birthdayList
        .map((entry: BirthdayEntry) => {
          const username = entry.name; // User's name
          const isoDateString = entry.dateISOString; // Assuming entry[2] contains the ISO string for the birthday
          // Convert the ISO string to a Date object and format it
          const birthdayDate = new Date(isoDateString);
          // Convert to the desired time zone
          const zonedBirthdayDate = toZonedTime(birthdayDate, TIME_ZONE);
          // Format the date as MM/DD
          const formattedDate = format(zonedBirthdayDate, "MM/dd", {
            timeZone: TIME_ZONE,
          });
          return `${username}: ${formattedDate}`;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0xff0000);
      await channel.send({ embeds: [embed] });
    }
  }

  const todayBirthdays = await getTodayBirthdays(currentMonth, currentDate);

  if (todayBirthdays.length > 0) {
    const title = "🎊 HAPPY BIRTHDAY TO 🎊";
    const description = todayBirthdays
      .map((entry: BirthdayEntry) => {
        const username = entry.name; // User's name
        const userId = entry.discordID; // User's ID to mention
        return `${username}: <@${userId}>`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff0000);
    await channel.send({ embeds: [embed] });
  }
};

// Function to handle the !birth command
export const handleBirthCommand = async (message: Message) => {
  if (message.author.bot) return; // Ignore bot messages

  const args = message.content.split(" ");
  if (args.length !== 2) {
    message.reply({
      embeds: [
        {
          title: "Birthday Error",
          description: "Invalid command format. Use: !birth YYYY-MM-DD",
          color: 0xff0000,
        },
      ],
    });
    return;
  }

  const date = args[1];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    message.reply({
      embeds: [
        {
          title: "Birthday Error",
          description: "Invalid date format. Please use YYYY-MM-DD.",
          color: 0xff0000,
        },
      ],
    });
    return;
  }

  const { id: discordID } = message.author;

  const parsedDate = parseISO(date);

  // Convert it to UTC
  const utcDate = toZonedTime(parsedDate, TIME_ZONE);

  // Format to ISO string
  const isoDateString = format(utcDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

  const res = await setBirthday(discordID, isoDateString);
  if (res.success) {
    message.reply({
      embeds: [
        {
          title: "Birthday Set",
          description: `Your birthday has been set to ${date}. 🎉`,
          color: 0x93acff,
        },
      ],
    });
  } else {
    message.reply({
      embeds: [
        {
          title: "Birthday Error",
          description:
            "An error occurred while setting your birthday. Please try again later.",
          color: 0xff0000,
        },
      ],
    });
  }
};

// List all birthdays
export const handleBlistCommand = async (message: Message) => {
  if (message.author.bot) return; // Ignore bot messages

  const allBirthdays = await getAllBirthdays();

  let title = "All Birthdays";
  let description = "Person | Month | Day\n\n";
  if (allBirthdays.length > 0) {
    allBirthdays.forEach((entry: BirthdayEntry) => {
      const username = entry.name; // User's name
      const isoDateString = entry.dateISOString; // Assuming entry.dateISOString contains the ISO string for the birthday
      // Convert the ISO string to a Date object and format it
      const birthdayDate = new Date(isoDateString);
      // Convert to the desired time zone
      const zonedBirthdayDate = toZonedTime(birthdayDate, TIME_ZONE);
      // Format the date as MM/DD
      const formattedDate = format(zonedBirthdayDate, "MM/dd", {
        timeZone: TIME_ZONE,
      });
      description += `${username}: ${formattedDate}\n`;
    });
  } else {
    description = "No Birthdays in Database";
  }
  message.reply({
    embeds: [
      {
        title,
        description,
        color: 0x93acff,
      },
    ],
  });
};
