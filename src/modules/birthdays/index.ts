import { Client, EmbedBuilder, Message, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { BotModule, CommandInfo } from '../../types/module';
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

class BirthdaysModule implements BotModule {
  name = 'birthdays';
  description = 'Birthday tracking and reminders';
  enabled = true;
  private client: Client | null = null;

  async initialize(client: Client): Promise<void> {
    this.client = client;
    this.scheduleBirthdayNotifications();
    console.log(`[${this.name}] Module initialized`);
  }

  handleMessage(message: Message): boolean {
    const content = message.content.trim();

    if (content.startsWith('!birth ')) {
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
        zonedNextNotificationTime.setUTCDate(
          zonedNextNotificationTime.getUTCDate() + 1,
        );
      }

      const timeToNextRun = zonedNextNotificationTime.getTime() - now.getTime();
      const minutesToNextRun = Math.ceil(timeToNextRun / (1000 * 60));
      console.log(
        `[${this.name}] Next birthday check in: ${minutesToNextRun} minutes`,
      );

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
      const birthdayList = await getMonthlyBirthdays(currentMonth);
      if (birthdayList.length > 0) {
        const title = `🎊 ${new Intl.DateTimeFormat('en-US', { month: 'long' })
          .format(now)
          .toUpperCase()} BIRTHDAYS 🎊`;
        const description = birthdayList
          .map((entry: BirthdayEntry) => {
            const birthdayDate = new Date(entry.dateISOString);
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
      }
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

  private async handleBirthCommand(message: Message): Promise<void> {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    if (args.length !== 2) {
      message.reply({
        embeds: [
          {
            title: 'Birthday Error',
            description: 'Invalid command format. Use: !birth YYYY-MM-DD',
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
            title: 'Birthday Error',
            description: 'Invalid date format. Please use YYYY-MM-DD.',
            color: 0xff0000,
          },
        ],
      });
      return;
    }

    const { id: discordID } = message.author;
    const parsedDate = parseISO(date);
    const utcDate = toZonedTime(parsedDate, TIME_ZONE);
    const isoDateString = format(utcDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

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
        const birthdayDate = new Date(entry.dateISOString);
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
    console.log(`[${this.name}] Module cleaned up`);
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
    ];
  }
}

export default new BirthdaysModule();
