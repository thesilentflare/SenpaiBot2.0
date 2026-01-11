import { Client, Message, TextChannel } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import { isAdmin } from '../adminManager/helpers';
import { isExempt, addExemption, removeExemption } from './helpers';

class MessageLoggerModule implements BotModule {
  name = 'messageLogger';
  description = 'Logs deleted and edited messages to a specified channel';
  enabled = true;
  private logsChannelId: string = '';
  private logger = Logger.forModule('messageLogger');

  initialize(client: Client): void {
    this.logsChannelId = process.env.LOGS_CHANNEL_ID || '';

    if (!this.logsChannelId) {
      this.logger.warn('LOGS_CHANNEL_ID not set');
      return;
    }

    // Listen for message deletions
    client.on('messageDelete', async (message) => {
      if (message.partial) {
        try {
          await message.fetch();
        } catch (error) {
          this.logger.error('Error fetching deleted message:', error);
          return;
        }
      }
      await this.handleMessageDelete(message as Message);
    });

    // Listen for message edits
    client.on('messageUpdate', async (oldMessage, newMessage) => {
      if (oldMessage.partial) {
        try {
          await oldMessage.fetch();
        } catch (error) {
          this.logger.error('Error fetching old message:', error);
          return;
        }
      }
      if (newMessage.partial) {
        try {
          await newMessage.fetch();
        } catch (error) {
          this.logger.error('Error fetching new message:', error);
          return;
        }
      }
      await this.handleMessageEdit(
        oldMessage as Message,
        newMessage as Message,
      );
    });

    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    const content = message.content.trim();

    // Handle !logexempt command
    if (content.startsWith('!logexempt')) {
      await this.handleLogExemptCommand(message);
      return true;
    }

    return false;
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!logexempt',
        description: 'Toggle your message log exemption status',
        usage: '!logexempt',
        adminOnly: false,
        hidden: true,
      },
      {
        command: '!logexempt <@user>',
        description:
          'Toggle message log exemption for another user (admin only)',
        usage: '!logexempt @username',
        adminOnly: true,
        hidden: true,
      },
    ];
  }

  private async handleLogExemptCommand(message: Message): Promise<void> {
    const args = message.content.trim().split(/\s+/);

    // Check if user is targeting someone else
    const targetUserId =
      args.length > 1 && args[1].match(/^<@!?(\d+)>$/)
        ? args[1].match(/^<@!?(\d+)>$/)![1]
        : null;

    // If targeting someone else, must be admin
    if (targetUserId && targetUserId !== message.author.id) {
      const userIsAdmin = await isAdmin(message.author.id, message.guild);
      if (!userIsAdmin) {
        await message.reply(
          'Only admins can manage exemptions for other users.',
        );
        return;
      }
    }

    const userId = targetUserId || message.author.id;
    const currentlyExempt = await isExempt(userId);

    try {
      if (currentlyExempt) {
        await removeExemption(userId);
        const targetMention = targetUserId ? `<@${userId}>` : 'You';
        await message.reply(
          `${targetMention} ${targetUserId ? 'is' : 'are'} no longer exempt from message logging.`,
        );
      } else {
        await addExemption(userId);
        const targetMention = targetUserId ? `<@${userId}>` : 'You';
        await message.reply(
          `${targetMention} ${targetUserId ? 'is' : 'are'} now exempt from message logging.`,
        );
      }
    } catch (error) {
      this.logger.error('Error toggling exemption:', error);
      await message.reply('Failed to update exemption status.');
    }
  }

  private async handleMessageDelete(message: Message): Promise<void> {
    // Check if user is exempt from logging
    if (await isExempt(message.author.id)) {
      return;
    }

    // Ignore bot's own messages
    if (message.author?.bot) {
      return;
    }

    // Ignore if no logs channel configured
    if (!this.logsChannelId) {
      return;
    }

    try {
      const logsChannel = await message.client.channels.fetch(
        this.logsChannelId,
      );

      if (!logsChannel || !logsChannel.isTextBased()) {
        return;
      }

      // Don't log deletions from the logs channel itself
      if (message.channel.id === this.logsChannelId) {
        return;
      }

      let msg = `\`In ${message.channel instanceof TextChannel ? message.channel.name : 'DM'}, ${message.author?.tag || 'Unknown'} deleted: \``;

      if (message.content) {
        msg += `||${message.content}||`;
      }

      if (message.attachments.size > 0) {
        message.attachments.forEach((attachment) => {
          msg += `\n\`proxy url: \`||${attachment.proxyURL}||`;
        });
      }

      await (logsChannel as TextChannel).send(msg);
    } catch (error) {
      this.logger.error('Error logging deleted message:', error);
    }
  }

  private async handleMessageEdit(
    oldMessage: Message,
    newMessage: Message,
  ): Promise<void> {
    // Check if user is exempt from logging
    if (await isExempt(oldMessage.author.id)) {
      return;
    }

    // Ignore bot's own messages
    if (oldMessage.author?.bot) {
      return;
    }

    // Ignore if no logs channel configured
    if (!this.logsChannelId) {
      return;
    }

    // Ignore if content hasn't changed (e.g., embed updates)
    if (oldMessage.content === newMessage.content) {
      return;
    }

    try {
      const logsChannel = await oldMessage.client.channels.fetch(
        this.logsChannelId,
      );

      if (!logsChannel || !logsChannel.isTextBased()) {
        return;
      }

      // Don't log edits from the logs channel itself
      if (oldMessage.channel.id === this.logsChannelId) {
        return;
      }

      let msg = `\`In ${oldMessage.channel instanceof TextChannel ? oldMessage.channel.name : 'DM'}, ${oldMessage.author?.tag || 'Unknown'} edited: \``;

      if (oldMessage.content) {
        msg += `||${oldMessage.content}||`;
      }

      if (oldMessage.attachments.size > 0) {
        oldMessage.attachments.forEach((attachment) => {
          msg += `\n\`proxy url: \`||${attachment.proxyURL}||`;
        });
      }

      msg += `\n\`to: \``;

      if (newMessage.content) {
        msg += `||${newMessage.content}||`;
      }

      if (newMessage.attachments.size > 0) {
        newMessage.attachments.forEach((attachment) => {
          msg += `\n\`proxy url: \`||${attachment.proxyURL}||`;
        });
      }

      await (logsChannel as TextChannel).send(msg);
    } catch (error) {
      this.logger.error('Error logging edited message:', error);
    }
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }
}

export default new MessageLoggerModule();
