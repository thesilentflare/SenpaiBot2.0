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

    // !user add command - admin only
    if (content.startsWith('!user add')) {
      await this.handleUserAdd(message);
      return true;
    }

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

    // !register or !user register command - user self-registration
    if (content === '!register' || content === '!user register') {
      await this.handleSelfRegister(message);
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
   * Handle the !user add command (admin only)
   */
  private async handleUserAdd(message: Message): Promise<void> {
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
    const args = content.substring('!user add'.length).trim();

    let targetUserID: string;
    let targetUser: any;

    // Check if a user was mentioned
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first()!;
      targetUserID = targetUser.id;
    } else if (args.length > 0) {
      // Assume args is a Discord ID
      targetUserID = args;
      try {
        targetUser = await this.client?.users.fetch(targetUserID);
      } catch (error) {
        const embed = new EmbedBuilder()
          .setTitle('User Not Found')
          .setDescription(
            `Could not find user with ID ${targetUserID} on Discord.`,
          )
          .setColor(0xff0000);

        await message.reply({ embeds: [embed] });
        return;
      }
    } else {
      const embed = new EmbedBuilder()
        .setTitle('Invalid Usage')
        .setDescription('Usage: `!user add @user` or `!user add discordID`')
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await getUserByDiscordID(targetUserID);

      if (existingUser) {
        const embed = new EmbedBuilder()
          .setTitle('User Already Exists')
          .setDescription(
            `${existingUser.name} is already in the database. Use \`!user rename\` to change their name.`,
          )
          .setColor(0xff0000);

        await message.reply({ embeds: [embed] });
        return;
      }

      // Prompt for name
      const promptEmbed = new EmbedBuilder()
        .setTitle('Adding User to Database')
        .setDescription(
          `Please provide a name for ${targetUser.username}:\n\nReply with the name within 60 seconds.`,
        )
        .setColor(0x0099ff);

      await message.reply({ embeds: [promptEmbed] });

      // Wait for name response
      if (!message.channel.isTextBased()) return;
      const nameFilter = (m: Message) => m.author.id === message.author.id;
      const nameCollected = await (message.channel as any)
        .awaitMessages({
          filter: nameFilter,
          max: 1,
          time: 60000,
          errors: ['time'],
        })
        .catch(() => null);

      if (!nameCollected) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('Timeout')
          .setDescription('Registration cancelled - no response received.')
          .setColor(0xff0000);

        await message.reply({ embeds: [timeoutEmbed] });
        return;
      }

      const userName = nameCollected.first()!.content.trim();

      if (!userName || userName.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('Invalid Name')
          .setDescription('Name cannot be empty. Registration cancelled.')
          .setColor(0xff0000);

        await message.reply({ embeds: [errorEmbed] });
        return;
      }

      // Add user to database
      await addUser(targetUserID, userName);

      // Prompt for birthday
      const birthdayPromptEmbed = new EmbedBuilder()
        .setTitle('User Added!')
        .setDescription(
          `${userName} has been added to the database.\n\nWould you like to set their birthday now?\n\nReply with a date in format \`YYYY-MM-DD\` or \`skip\` to skip.`,
        )
        .setColor(0x00ff00);

      await message.reply({ embeds: [birthdayPromptEmbed] });

      // Wait for birthday response
      if (!message.channel.isTextBased()) return;
      const birthdayCollected = await (message.channel as any)
        .awaitMessages({
          filter: nameFilter,
          max: 1,
          time: 60000,
          errors: ['time'],
        })
        .catch(() => null);

      if (!birthdayCollected) {
        const finalEmbed = new EmbedBuilder()
          .setTitle('Complete')
          .setDescription(
            `${userName} has been added to the database. Birthday was not set.`,
          )
          .setColor(0x0099ff);

        await message.reply({ embeds: [finalEmbed] });
        return;
      }

      const birthdayInput = birthdayCollected.first()!.content.trim();

      if (birthdayInput.toLowerCase() === 'skip') {
        const finalEmbed = new EmbedBuilder()
          .setTitle('Complete')
          .setDescription(
            `${userName} has been added to the database. Birthday was not set.`,
          )
          .setColor(0x0099ff);

        await message.reply({ embeds: [finalEmbed] });
        return;
      }

      // Validate birthday format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birthdayInput)) {
        const finalEmbed = new EmbedBuilder()
          .setTitle('Complete')
          .setDescription(
            `${userName} has been added to the database.\n\nInvalid birthday format. Birthday was not set. Use \`!birth YYYY-MM-DD\` to set it later.`,
          )
          .setColor(0x0099ff);

        await message.reply({ embeds: [finalEmbed] });
        return;
      }

      // Import setBirthday dynamically to avoid circular dependencies
      const { setBirthday } = await import('../birthdays/helpers');
      const isoDateString = `${birthdayInput}T12:00:00Z`;
      const res = await setBirthday(targetUserID, isoDateString);

      if (res.success) {
        const successEmbed = new EmbedBuilder()
          .setTitle('Complete!')
          .setDescription(
            `${userName} has been added to the database with birthday set to ${birthdayInput}. 🎉`,
          )
          .setColor(0x00ff00);

        await message.reply({ embeds: [successEmbed] });
        this.logger.info(
          `Admin ${message.author.tag} added user ${targetUserID} (${userName}) with birthday ${birthdayInput}`,
        );
      } else {
        const partialEmbed = new EmbedBuilder()
          .setTitle('Partial Success')
          .setDescription(
            `${userName} has been added to the database, but there was an error setting the birthday.`,
          )
          .setColor(0xffaa00);

        await message.reply({ embeds: [partialEmbed] });
      }
    } catch (error) {
      this.logger.error('Error adding user', error);

      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(
          'An error occurred while adding the user. Please try again later.',
        )
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
    }
  }

  /**
   * Handle the !register command (user self-registration)
   */
  private async handleSelfRegister(message: Message): Promise<void> {
    if (message.author.bot) return;

    const userID = message.author.id;

    try {
      // Check if user already exists
      const existingUser = await getUserByDiscordID(userID);

      if (existingUser) {
        const embed = new EmbedBuilder()
          .setTitle('Already Registered')
          .setDescription(
            `You are already registered as **${existingUser.name}** in the database.`,
          )
          .setColor(0xff0000);

        await message.reply({ embeds: [embed] });
        return;
      }

      // Prompt for name
      const promptEmbed = new EmbedBuilder()
        .setTitle('Register to Database')
        .setDescription(
          `Please provide your preferred name:\n\nReply with your name within 60 seconds.`,
        )
        .setColor(0x0099ff);

      await message.reply({ embeds: [promptEmbed] });

      // Wait for name response
      if (!message.channel.isTextBased()) return;
      const nameFilter = (m: Message) => m.author.id === message.author.id;
      const nameCollected = await (message.channel as any)
        .awaitMessages({
          filter: nameFilter,
          max: 1,
          time: 60000,
          errors: ['time'],
        })
        .catch(() => null);

      if (!nameCollected) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('Timeout')
          .setDescription('Registration cancelled - no response received.')
          .setColor(0xff0000);

        await message.reply({ embeds: [timeoutEmbed] });
        return;
      }

      const userName = nameCollected.first()!.content.trim();

      if (!userName || userName.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('Invalid Name')
          .setDescription('Name cannot be empty. Registration cancelled.')
          .setColor(0xff0000);

        await message.reply({ embeds: [errorEmbed] });
        return;
      }

      // Add user to database
      await addUser(userID, userName);

      // Prompt for birthday
      const birthdayPromptEmbed = new EmbedBuilder()
        .setTitle('Registration Successful!')
        .setDescription(
          `Welcome, ${userName}! 🎉\n\nWould you like to set your birthday now?\n\nReply with a date in format \`YYYY-MM-DD\` or \`skip\` to skip.`,
        )
        .setColor(0x00ff00);

      await message.reply({ embeds: [birthdayPromptEmbed] });

      // Wait for birthday response
      if (!message.channel.isTextBased()) return;
      const birthdayCollected = await (message.channel as any)
        .awaitMessages({
          filter: nameFilter,
          max: 1,
          time: 60000,
          errors: ['time'],
        })
        .catch(() => null);

      if (!birthdayCollected) {
        const finalEmbed = new EmbedBuilder()
          .setTitle('Complete')
          .setDescription(
            `You've been registered as ${userName}. Use \`!birth YYYY-MM-DD\` to set your birthday later.`,
          )
          .setColor(0x0099ff);

        await message.reply({ embeds: [finalEmbed] });
        return;
      }

      const birthdayInput = birthdayCollected.first()!.content.trim();

      if (birthdayInput.toLowerCase() === 'skip') {
        const finalEmbed = new EmbedBuilder()
          .setTitle('Complete')
          .setDescription(
            `You've been registered as ${userName}. Use \`!birth YYYY-MM-DD\` to set your birthday later.`,
          )
          .setColor(0x0099ff);

        await message.reply({ embeds: [finalEmbed] });
        return;
      }

      // Validate birthday format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birthdayInput)) {
        const finalEmbed = new EmbedBuilder()
          .setTitle('Complete')
          .setDescription(
            `You've been registered as ${userName}.\n\nInvalid birthday format. Use \`!birth YYYY-MM-DD\` to set it later.`,
          )
          .setColor(0x0099ff);

        await message.reply({ embeds: [finalEmbed] });
        return;
      }

      // Import setBirthday dynamically to avoid circular dependencies
      const { setBirthday } = await import('../birthdays/helpers');
      const isoDateString = `${birthdayInput}T12:00:00Z`;
      const res = await setBirthday(userID, isoDateString);

      if (res.success) {
        const successEmbed = new EmbedBuilder()
          .setTitle('Registration Complete! 🎉')
          .setDescription(
            `You've been registered as ${userName} with birthday set to ${birthdayInput}.`,
          )
          .setColor(0x00ff00);

        await message.reply({ embeds: [successEmbed] });
        this.logger.info(
          `User ${message.author.tag} self-registered as ${userName} with birthday ${birthdayInput}`,
        );
      } else {
        const partialEmbed = new EmbedBuilder()
          .setTitle('Partial Success')
          .setDescription(
            `You've been registered as ${userName}, but there was an error setting your birthday. Use \`!birth YYYY-MM-DD\` to try again.`,
          )
          .setColor(0xffaa00);

        await message.reply({ embeds: [partialEmbed] });
      }
    } catch (error) {
      this.logger.error('Error during self-registration', error);

      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(
          'An error occurred during registration. Please try again later.',
        )
        .setColor(0xff0000);

      await message.reply({ embeds: [embed] });
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
          name: '!register',
          value:
            'Register yourself to the database (prompts for name and birthday)',
          inline: false,
        },
        {
          name: '!user info [@user|discordID]',
          value: 'Display user information (defaults to yourself)',
          inline: false,
        },
        {
          name: '!user add @user',
          value: 'Add a user to the database (admin only)',
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
        command: '!register',
        description:
          'Register yourself to the database (prompts for name and birthday)',
        usage: '!register',
        adminOnly: false,
      },
      {
        command: '!user info [@user]',
        description: 'Display user information from the database',
        usage: '!user info [@user|discordID]',
        adminOnly: false,
      },
      {
        command: '!user add',
        description: 'Add a user to the database (admin only)',
        usage: '!user add @user',
        adminOnly: true,
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
