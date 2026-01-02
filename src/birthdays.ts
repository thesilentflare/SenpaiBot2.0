import db from "./database";
import { Client, TextChannel } from "discord.js";
import dotenv from "dotenv";
import { DateTime } from "luxon";

dotenv.config();

const client = new Client({ intents: [] });
const BIRTHDAY_REMINDER_CHANNEL_ID =
  process.env.BIRTHDAY_REMINDER_CHANNEL_ID || "";
const TIME_ZONE = process.env.TIME_ZONE || "UTC"; // Default to UTC if not specified
const BIRTHDAY_REMINDER_HOUR = parseInt(
  process.env.BIRTHDAY_REMINDER_HOUR || "9",
  10
); // Default to 9 AM
const BIRTHDAY_REMINDER_DAY_OF_MONTH = parseInt(
  process.env.BIRTHDAY_REMINDER_DAY_OF_MONTH || "1",
  10
); // Default to 1st of the month

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
          BIRTHDAY_REMINDER_CHANNEL_ID
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
          BIRTHDAY_REMINDER_CHANNEL_ID
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

// Helper to safely schedule timeouts
function safeSetTimeout(fn: () => void, ms: number) {
  const MAX_TIMEOUT = 2147483647; // Max for 32-bit signed int
  if (ms > MAX_TIMEOUT) {
    return setTimeout(() => safeSetTimeout(fn, ms - MAX_TIMEOUT), MAX_TIMEOUT);
  } else {
    return setTimeout(fn, ms);
  }
}

// Schedule the birthday check at the specified hour
safeSetTimeout(() => {
  checkBirthdays();
  setInterval(checkBirthdays, 24 * 60 * 60 * 1000); // Repeat every 24 hours
}, getNextReminderTime());

// Recursive monthly reminder scheduling to avoid overflow
function scheduleMonthlyReminder() {
  const now = new Date();
  let nextReminder = new Date(
    now.getFullYear(),
    now.getMonth(),
    BIRTHDAY_REMINDER_DAY_OF_MONTH,
    0,
    0,
    0,
    0
  );
  if (now >= nextReminder) {
    // If today is past the reminder day, schedule for next month
    nextReminder = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      BIRTHDAY_REMINDER_DAY_OF_MONTH,
      0,
      0,
      0,
      0
    );
  }
  const msToNextRun = nextReminder.getTime() - now.getTime();
  safeSetTimeout(() => {
    sendMonthlyBirthdayReminders();
    scheduleMonthlyReminder();
  }, msToNextRun);
}
scheduleMonthlyReminder();

// Function to handle the !birth command
function handleBirthCommand(message: import("discord.js").Message) {
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

  db.run(
    `INSERT OR REPLACE INTO Birthdays (discordID, dateISOString) VALUES (?, ?)`,
    [discordID, date],
    (err) => {
      if (err) {
        message.reply({
          embeds: [
            {
              title: "Birthday Error",
              description:
                "An error occurred while updating your birthday. Please try again later.",
              color: 0xff0000,
            },
          ],
        });
      } else {
        message.reply({
          embeds: [
            {
              title: "Birthday Updated",
              description: `Your birthday has been updated to ${date}. 🎉`,
              color: 0x93acff,
            },
          ],
        });
      }
    }
  );
}

// List all birthdays
function handleBlistCommand(message: import("discord.js").Message) {
  db.all(
    `SELECT Users.name, strftime('%m', Birthdays.dateISOString) as month, strftime('%d', Birthdays.dateISOString) as day FROM Birthdays JOIN Users ON Birthdays.discordID = Users.discordID ORDER BY month, day`,
    [],
    (err, rows: Array<{ name: string; month: string; day: string }>) => {
      if (err) {
        message.reply({
          embeds: [
            {
              title: "Birthday Error",
              description: "An error occurred while fetching birthdays.",
              color: 0xff0000,
            },
          ],
        });
        return;
      }
      let title = "All Birthdays";
      let description = "Person | Month | Day\n\n";
      if (rows.length > 0) {
        rows.forEach((row) => {
          description += `${row.name || "User"}: ${row.month}/${row.day}\n`;
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
    }
  );
}

// Edit user's own birthday date
// function handleBirthdayEditDateCommand(
//   message: import("discord.js").Message,
//   date: string
// ) {
//   const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
//   if (!dateRegex.test(date)) {
//     message.reply({
//       embeds: [
//         {
//           title: "Birthday Error",
//           description: "Invalid date format. Please use YYYY-MM-DD.",
//           color: 0xff0000,
//         },
//       ],
//     });
//     return;
//   }
//   const { id: discordID } = message.author;
//   db.run(
//     `UPDATE Birthdays SET dateISOString = ? WHERE discordID = ?`,
//     [date, discordID],
//     function (err) {
//       if (err) {
//         message.reply({
//           embeds: [
//             {
//               title: "Birthday Error",
//               description:
//                 "An error occurred while updating your birthday. Please try again later.",
//               color: 0xff0000,
//             },
//           ],
//         });
//       } else if (this.changes === 0) {
//         message.reply({
//           embeds: [
//             {
//               title: "Birthday Error",
//               description:
//                 "No birthday found to update. Please set your birthday first with !birth YYYY-MM-DD.",
//               color: 0xff0000,
//             },
//           ],
//         });
//       } else {
//         message.reply({
//           embeds: [
//             {
//               title: "Birthday Updated",
//               description: `Your birthday has been updated to ${date}. 🎉`,
//               color: 0x93acff,
//             },
//           ],
//         });
//       }
//     }
//   );
// }

// Edit user's own display name for birthdays
// function handleBirthdayEditNameCommand(
//   message: import("discord.js").Message,
//   newName: string
// ) {
//   if (!newName || newName.length < 2) {
//     message.reply({
//       embeds: [
//         {
//           title: "Birthday Error",
//           description: "Please provide a valid name (at least 2 characters).",
//           color: 0xff0000,
//         },
//       ],
//     });
//     return;
//   }
//   const { id: discordID } = message.author;
//   db.run(
//     `UPDATE Users SET name = ? WHERE discordID = ?`,
//     [newName, discordID],
//     function (err) {
//       if (err) {
//         message.reply({
//           embeds: [
//             {
//               title: "Birthday Error",
//               description:
//                 "An error occurred while updating your name. Please try again later.",
//               color: 0xff0000,
//             },
//           ],
//         });
//       } else if (this.changes === 0) {
//         message.reply({
//           embeds: [
//             {
//               title: "Birthday Error",
//               description:
//                 "No user found to update. Please use !birth first to register.",
//               color: 0xff0000,
//             },
//           ],
//         });
//       } else {
//         message.reply({
//           embeds: [
//             {
//               title: "Birthday Name Updated",
//               description: `Your birthday display name has been updated to ${newName}.`,
//               color: 0x93acff,
//             },
//           ],
//         });
//       }
//     }
//   );
// }

export {
  checkBirthdays,
  handleBirthCommand,
  handleBlistCommand,
  // handleBirthdayEditDateCommand,
  // handleBirthdayEditNameCommand,
};
