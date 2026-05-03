import { Client, EmbedBuilder, Message, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import { isAdmin } from '../adminManager/helpers';
import {
  getAllBirthdays,
  getMonthlyBirthdays,
  getTodayBirthdays,
  setBirthday,
  BirthdayEntry,
} from './helpers';
import { format, toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

dotenv.config();

const BIRTHDAY_REMINDER_CHANNEL_ID =
  process.env.BIRTHDAY_REMINDER_CHANNEL_ID || '';
const TIME_ZONE = process.env.TIME_ZONE || 'UTC';
const BIRTHDAY_REMINDER_HOUR = parseInt(
  process.env.BIRTHDAY_REMINDER_HOUR || '0',
  10,
);
const BIRTHDAY_REMINDER_DAY_OF_MONTH = parseInt(
  process.env.BIRTHDAY_REMINDER_DAY_OF_MONTH || '1',
  10,
);
const BIRTHDAY_MIN_BIRTH_YEAR = parseInt(
  process.env.BIRTHDAY_MIN_BIRTH_YEAR || '1990',
  10,
);

class BirthdaysModule implements BotModule {
  name = 'birthdays';
  description = 'Birthday tracking and reminders';
  enabled = true;
  private client: Client | null = null;
  private logger = Logger.forModule('birthdays');
  private failedAttempts = new Map<string, number>();

  async initialize(client: Client): Promise<void> {
    this.client = client;
    this.scheduleBirthdayNotifications();
    this.logger.debug('Module initialized');
  }

  handleMessage(message: Message): boolean {
    const content = message.content.trim();

    if (content.startsWith('!birth ')) {
      const args = content.split(' ').slice(1);
      if (args[0]?.toLowerCase() === 'trigger') {
        this.handleTriggerReminder(message, args.slice(1));
        return true;
      }
      this.handleBirthCommand(message);
      return true;
    }

    if (content.startsWith('!blist')) {
      this.handleBlistCommand(message);
      return true;
    }

    // Check for birth command without space/args
    if (content === '!birth') {
      message.reply(
        '🎂 Please provide your birthday! Usage: `!birth YYYY-MM-DD`\nExample: `!birth 1990-05-15`',
      );
      return true;
    }

    // Check for common misspellings of birth commands
    if (content.match(/^!(?:brith|borth|birrth|birthday)/)) {
      message.reply(
        '🎂 Did you mean `!birth YYYY-MM-DD` or `!blist`?\n\n**Birthday Commands:**\n`!birth YYYY-MM-DD` - Set your birthday\n`!blist` - List all birthdays',
      );
      return true;
    }

    return false;
  }

  private scheduleBirthdayNotifications(): void {
    if (!this.client) return;

    const scheduleNextCheck = () => {
      const now = new Date();
      const nextNotificationTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        BIRTHDAY_REMINDER_HOUR,
        0,
        0,
      );
      let zonedNextNotificationTime = toZonedTime(
        nextNotificationTime,
        TIME_ZONE,
      );

      if (zonedNextNotificationTime <= now) {
        zonedNextNotificationTime = new Date(
          zonedNextNotificationTime.getTime() + 24 * 60 * 60 * 1000,
        );
      }

      const timeToNextRun = zonedNextNotificationTime.getTime() - now.getTime();
      const minutesToNextRun = Math.ceil(timeToNextRun / (1000 * 60));
      this.logger.info(`Next birthday check in: ${minutesToNextRun} minutes`);

      setTimeout(() => {
        this.sendMonthlyBirthdays();
        // Reschedule the next check instead of using setInterval
        // This ensures DST transitions are handled correctly
        scheduleNextCheck();
      }, timeToNextRun);
    };

    // Start the scheduling
    scheduleNextCheck();
  }

  private async sendMonthlyBirthdays(): Promise<void> {
    if (!this.client) return;

    const channelId = BIRTHDAY_REMINDER_CHANNEL_ID;
    const channel = (await this.client.channels.fetch(
      channelId,
    )) as TextChannel;

    if (!channel || !channel.isTextBased()) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();

    if (currentDate === BIRTHDAY_REMINDER_DAY_OF_MONTH) {
      await this.postMonthlyReminder(channel, currentMonth);
    }

    const todayBirthdays = await getTodayBirthdays(currentMonth, currentDate);

    if (todayBirthdays.length > 0) {
      const title = '🎊 HAPPY BIRTHDAY TO 🎊';
      const description = todayBirthdays
        .map((entry: BirthdayEntry) => {
          return `${entry.name}: <@${entry.discordID}>`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0xff0000);
      await channel.send({ embeds: [embed] });
    }
  }

  /** Posts the monthly birthday list for the given month to the reminder channel. */
  private async postMonthlyReminder(
    channel: TextChannel,
    month: number,
  ): Promise<boolean> {
    const birthdayList = await getMonthlyBirthdays(month);
    if (birthdayList.length === 0) return false;

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' })
      .format(new Date(2000, month - 1, 1))
      .toUpperCase();
    const title = `🎊 ${monthName} BIRTHDAYS 🎊`;
    const description = birthdayList
      .map((entry: BirthdayEntry) => {
        const birthdayDate = parseISO(entry.dateISOString);
        const zonedBirthdayDate = toZonedTime(birthdayDate, TIME_ZONE);
        const formattedDate = format(zonedBirthdayDate, 'MM/dd', {
          timeZone: TIME_ZONE,
        });
        return `${entry.name}: ${formattedDate}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff0000);
    await channel.send({ embeds: [embed] });
    return true;
  }

  private async handleTriggerReminder(
    message: Message,
    args: string[],
  ): Promise<void> {
    if (!(await isAdmin(message.author.id, message.guild))) {
      await message.reply({
        embeds: [
          {
            title: '❌ Access Denied',
            description: 'This command is admin-only!',
            color: 0xff0000,
          },
        ],
      });
      return;
    }

    if (!this.client) return;

    const channelId = BIRTHDAY_REMINDER_CHANNEL_ID;
    if (!channelId) {
      await message.reply({
        embeds: [
          {
            title: '❌ Not Configured',
            description:
              'No birthday reminder channel is configured (`BIRTHDAY_REMINDER_CHANNEL_ID`).',
            color: 0xff0000,
          },
        ],
      });
      return;
    }

    // Parse optional month argument; default to current month
    const now = new Date();
    let month = now.getMonth() + 1;
    if (args.length > 0) {
      const parsed = parseInt(args[0], 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 12) {
        await message.reply({
          embeds: [
            {
              title: '❌ Invalid Month',
              description:
                'Please provide a month number between 1 and 12.\n\n' +
                '**Usage:** `!birth trigger [month]`\n' +
                '**Example:** `!birth trigger 5` (May)',
              color: 0xff0000,
            },
          ],
        });
        return;
      }
      month = parsed;
    }

    try {
      const channel = (await this.client.channels.fetch(
        channelId,
      )) as TextChannel;

      if (!channel || !channel.isTextBased()) {
        await message.reply({
          embeds: [
            {
              title: '❌ Channel Not Found',
              description:
                'The configured birthday reminder channel could not be found.',
              color: 0xff0000,
            },
          ],
        });
        return;
      }

      const monthName = new Intl.DateTimeFormat('en-US', {
        month: 'long',
      }).format(new Date(2000, month - 1, 1));
      const sent = await this.postMonthlyReminder(channel, month);

      if (sent) {
        await message.reply({
          embeds: [
            {
              title: '✅ Reminder Sent',
              description: `Monthly birthday reminder for **${monthName}** has been posted to <#${channelId}>.`,
              color: 0x00cc44,
            },
          ],
        });
        this.logger.info(
          `Admin ${message.author.tag} manually triggered birthday reminder for month ${month}`,
        );
      } else {
        await message.reply({
          embeds: [
            {
              title: '📭 No Birthdays',
              description: `There are no registered birthdays in **${monthName}**.`,
              color: 0xffcc00,
            },
          ],
        });
      }
    } catch (error) {
      this.logger.error('Error triggering birthday reminder', error);
      await message.reply({
        embeds: [
          {
            title: '❌ Error',
            description:
              'An error occurred while sending the birthday reminder.',
            color: 0xff0000,
          },
        ],
      });
    }
  }

  private replyInvalidDate(message: Message, description: string): void {
    const userId = message.author.id;
    const attempts = (this.failedAttempts.get(userId) ?? 0) + 1;
    this.failedAttempts.set(userId, attempts);

    if (attempts >= 3) {
      message.reply({
        embeds: [
          {
            title: 'Birthday Error',
            description:
              'You have entered an invalid date too many times. Please ask the server owner to set your birthday for you.',
            color: 0xff0000,
          },
        ],
      });
      return;
    }

    message.reply({
      embeds: [
        {
          title: 'Birthday Error',
          description,
          color: 0xff0000,
        },
      ],
    });
  }

  private async handleBirthCommand(message: Message): Promise<void> {
    if (message.author.bot) return;

    const userId = message.author.id;

    if ((this.failedAttempts.get(userId) ?? 0) >= 3) {
      message.reply({
        embeds: [
          {
            title: 'Birthday Error',
            description:
              'You have entered an invalid date too many times. Please ask the server owner to set your birthday for you.',
            color: 0xff0000,
          },
        ],
      });
      return;
    }

    const args = message.content.split(' ');
    if (args.length !== 2) {
      this.replyInvalidDate(
        message,
        'Invalid command format. Use: !birth YYYY-MM-DD',
      );
      return;
    }

    const date = args[1];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      this.replyInvalidDate(
        message,
        'Invalid date format. Please use YYYY-MM-DD.',
      );
      return;
    }

    const parsedDate = new Date(`${date}T12:00:00Z`);
    if (isNaN(parsedDate.getTime())) {
      this.replyInvalidDate(
        message,
        'Invalid date. Please enter a real calendar date.',
      );
      return;
    }

    const now = new Date();
    if (parsedDate > now) {
      this.replyInvalidDate(message, 'Your birthday cannot be in the future.');
      return;
    }

    if (parsedDate.getUTCFullYear() < BIRTHDAY_MIN_BIRTH_YEAR) {
      this.replyInvalidDate(
        message,
        `Birthdays before ${BIRTHDAY_MIN_BIRTH_YEAR} are not accepted. Please enter a valid birthday.`,
      );
      return;
    }

    const eighteenYearsAgo = new Date(
      now.getFullYear() - 18,
      now.getMonth(),
      now.getDate(),
    );
    if (parsedDate > eighteenYearsAgo) {
      this.replyInvalidDate(
        message,
        'You must be at least 18 years old to use this command.',
      );
      return;
    }

    const { id: discordID } = message.author;
    this.failedAttempts.delete(discordID);
    // Store birthday at noon UTC to preserve the date across all timezones
    const isoDateString = `${date}T12:00:00Z`;

    const res = await setBirthday(discordID, isoDateString);
    if (res.success) {
      message.reply({
        embeds: [
          {
            title: 'Birthday Set',
            description: `Your birthday has been set to ${date}. 🎉`,
            color: 0x93acff,
          },
        ],
      });
    } else {
      message.reply({
        embeds: [
          {
            title: 'Birthday Error',
            description:
              'An error occurred while setting your birthday. Please try again later.',
            color: 0xff0000,
          },
        ],
      });
    }
  }

  private async handleBlistCommand(message: Message): Promise<void> {
    if (message.author.bot) return;

    const allBirthdays = await getAllBirthdays();

    let title = 'All Birthdays';
    let description = 'Person | Month | Day\n\n';
    if (allBirthdays.length > 0) {
      allBirthdays.forEach((entry: BirthdayEntry) => {
        const birthdayDate = parseISO(entry.dateISOString);
        const zonedBirthdayDate = toZonedTime(birthdayDate, TIME_ZONE);
        const formattedDate = format(zonedBirthdayDate, 'MM/dd', {
          timeZone: TIME_ZONE,
        });
        description += `${entry.name}: ${formattedDate}\n`;
      });
    } else {
      description = 'No Birthdays in Database';
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

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!birth',
        description: 'Set your birthday',
        usage: '!birth YYYY-MM-DD (e.g., !birth 1990-05-15)',
      },
      {
        command: '!blist',
        description: 'List all birthdays in the database',
        usage: '!blist',
      },
      {
        command: '!birth trigger',
        description: 'Manually trigger the monthly birthday reminder',
        usage: '!birth trigger [month]',
        adminOnly: true,
      },
    ];
  }
}

export default new BirthdaysModule();
