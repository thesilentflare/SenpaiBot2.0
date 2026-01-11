import {
  Client,
  EmbedBuilder,
  GuildMember,
  Message,
  TextChannel,
} from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import { addUser, updateUserName, getUserByDiscordID } from './helpers';
import { isAdmin } from '../adminManager/helpers';

const MAIN_GENERAL_CHANNEL_ID = process.env.MAIN_GENERAL_CHANNEL_ID || '';

class UserManagerModule implements BotModule {
  name = 'userManager';
  description = 'Manage user registration and information';
  enabled = true;
  private client: Client | null = null;
  private guildMemberAddHandler:
    | ((member: GuildMember) => Promise<void>)
    | null = null;
  private logger = Logger.forModule('userManager');

  async initialize(client: Client): Promise<void> {
    this.client = client;

    // Register event listener for new guild members
    this.guildMemberAddHandler = async (member: GuildMember) => {
      await this.handleGuildMemberAdd(member);
    };
    client.on('guildMemberAdd', this.guildMemberAddHandler);

    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    const content = message.content.trim();

    // !user rename command - admin only
    if (content.startsWith('!user rename ')) {
      await this.handleUserRename(message);
      return true;
    }

    // !user info command
    if (content.startsWith('!user info')) {
      await this.handleUserInfo(message);
      return true;
    }

    // Handle !user without arguments
    if (content === '!user') {
      await this.sendUsageMessage(message);
      return true;
    }

    return false;
  }

  /**
   * Handle when a new user joins the server
   */
  private async handleGuildMemberAdd(member: GuildMember): Promise<void> {
    const { id: discordID, username } = member.user;
    const displayName = member.nickname || username;

    // Check if MAIN_GENERAL_CHANNEL_ID is configured
    if (!MAIN_GENERAL_CHANNEL_ID) {
      this.logger.warn(
        'MAIN_GENERAL_CHANNEL_ID not configured, skipping welcome message',
      );
      // Still add user to database even if channel is not configured
      try {
        await addUser(discordID, displayName);
        this.logger.info(
          `New user added to Users table: ${username} (ID: ${discordID})`,
        );
      } catch (error) {
        this.logger.error('Error adding new user to Users table:', error);
      }
      return;
    }

    // Fetch channel once
    let channel: TextChannel;
    try {
      channel = (await this.client?.channels.fetch(
        MAIN_GENERAL_CHANNEL_ID,
      )) as TextChannel;
    } catch (channelError) {
      this.logger.error('Error fetching welcome channel', channelError);
      // Still try to add user to database
      try {
        await addUser(discordID, displayName);
        this.logger.info(
          `New user added to Users table: ${username} (ID: ${discordID})`,
        );
      } catch (error) {
        this.logger.error('Error adding new user to Users table', error);
      }
      return;
    }

    try {
      await addUser(discordID, displayName);

      this.logger.info(
        `New user added to Users table: ${username} (ID: ${discordID})`,
      );

      const embed = new EmbedBuilder()
        .setTitle(`Welcome ${displayName}!`)
        .setDescription(
          `You have been added to the database. Use !birth YYYY-MM-DD to set your birthday!`,
        )
        .setColor(0xff0000);

      await channel.send({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error adding new user to Users table', error);

      try {
        const embed = new EmbedBuilder()
          .setTitle('Error')
          .setDescription(
            `There was an error adding ${displayName} to the database. Please get an admin to add you manually.`,
          )
          .setColor(0xff0000);

        await channel.send({ embeds: [embed] });
      } catch (sendError) {
        this.logger.error('Error sending error message to channel', sendError);
      }
    }
  }

  /**
   * Handle the !user rename command
   */
  private async handleUserRename(message: Message): Promise<void> {
    // Check if user is an admin
    const hasPermission = await isAdmin(
      message.author.id,
      message.guild || null,
    );

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to use this command.')
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
      return;
    }

    const content = message.content.trim();
    const args = content.substring('!user rename '.length).trim();

    // Parse the arguments - expecting: @mention newName or discordID newName
    const parts = args.split(/\s+/);

    if (parts.length < 2) {
      const embed = new EmbedBuilder()
        .setTitle('Invalid Usage')
        .setDescription(
          'Usage: `!user rename @user NewName` or `!user rename discordID NewName`',
        )
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
      return;
    }

    // Extract user ID from mention or use directly
    let targetUserID: string;
    let newName: string;

    if (message.mentions.users.size > 0) {
      // User was mentioned
      targetUserID = message.mentions.users.first()!.id;
      newName = parts.slice(1).join(' ');
    } else {
      // Assume first part is Discord ID
      targetUserID = parts[0];
      newName = parts.slice(1).join(' ');
    }

    try {
      // Check if user exists
      const user = await getUserByDiscordID(targetUserID);

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle('User Not Found')
          .setDescription(
            `User with ID ${targetUserID} was not found in the database.`,
          )
          .setColor(0xff0000);

        await message.reply({ embeds: [embed] });
        return;
      }

      // Update the user's name
      const updated = await updateUserName(targetUserID, newName);

      if (updated) {
        const embed = new EmbedBuilder()
          .setTitle('User Renamed')
          .setDescription(
            `Successfully renamed user from **${user.name}** to **${newName}**`,
          )
          .setColor(0x00ff00);

        await message.reply({ embeds: [embed] });
        this.logger.info(
          `Admin ${message.author.tag} renamed user ${targetUserID} from "${user.name}" to "${newName}"`,
        );
      } else {
        const embed = new EmbedBuilder()
          .setTitle('Error')
          .setDescription('Failed to update user name. Please try again.')
          .setColor(0xff0000);

        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      this.logger.error('Error renaming user', error);

      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(
          'An error occurred while renaming the user. Please try again later.',
        )
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
    }
  }

  /**
   * Handle the !user info command
   */
  private async handleUserInfo(message: Message): Promise<void> {
    const content = message.content.trim();
    const args = content.substring('!user info'.length).trim();

    let targetUserID: string;

    if (message.mentions.users.size > 0) {
      // User was mentioned
      targetUserID = message.mentions.users.first()!.id;
    } else if (args.length > 0) {
      // Assume args is a Discord ID
      targetUserID = args;
    } else {
      // Show info for the message author
      targetUserID = message.author.id;
    }

    try {
      const user = await getUserByDiscordID(targetUserID);

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle('User Not Found')
          .setDescription(
            `User with ID ${targetUserID} was not found in the database.`,
          )
          .setColor(0xff0000);

        await message.reply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('User Information')
        .addFields(
          { name: 'Name', value: user.name, inline: true },
          { name: 'Discord ID', value: user.discordID, inline: true },
        )
        .setColor(0x0099ff);

      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error fetching user info', error);

      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(
          'An error occurred while fetching user information. Please try again later.',
        )
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
    }
  }

  /**
   * Send usage message for the !user command
   */
  private async sendUsageMessage(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('User Management Commands')
      .setDescription('Manage user information in the database')
      .addFields(
        {
          name: '!user info [@user|discordID]',
          value: 'Display user information (defaults to yourself)',
          inline: false,
        },
        {
          name: '!user rename @user NewName',
          value: 'Rename a user in the database (admin only)',
          inline: false,
        },
      )
      .setColor(0x0099ff);

    await message.reply({ embeds: [embed] });
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!user info [@user]',
        description: 'Display user information from the database',
        usage: '!user info [@user|discordID]',
        adminOnly: false,
      },
      {
        command: '!user rename',
        description: 'Rename a user in the database',
        usage: '!user rename @user NewName',
        adminOnly: true,
      },
    ];
  }

  async cleanup(): Promise<void> {
    // Remove event listener to prevent memory leaks
    if (this.client && this.guildMemberAddHandler) {
      this.client.off('guildMemberAdd', this.guildMemberAddHandler);
    }
    this.logger.debug('Module cleaned up');
  }
}

export default new UserManagerModule();
