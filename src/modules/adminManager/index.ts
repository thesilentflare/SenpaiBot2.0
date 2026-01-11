import { Client, EmbedBuilder, Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import {
  addAdmin,
  removeAdmin,
  setAdminStatus,
  getAllAdmins,
  isAdmin,
} from './helpers';
import Logger from '../../utils/logger';

class AdminManagerModule implements BotModule {
  name = 'adminManager';
  description = 'Manage bot administrators';
  enabled = true;
  private logger = Logger.forModule('adminManager');

  initialize(client: Client): void {
    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    const content = message.content.trim();

    // Check if user has permission to use admin commands
    const hasPermission = await this.checkPermission(message);

    if (content.startsWith('!admin add ')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }
      await this.handleAddAdmin(message);
      return true;
    }

    if (content.startsWith('!admin remove ')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }
      await this.handleRemoveAdmin(message);
      return true;
    }

    if (content.startsWith('!admin disable ')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }
      await this.handleDisableAdmin(message);
      return true;
    }

    if (content.startsWith('!admin enable ')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }
      await this.handleEnableAdmin(message);
      return true;
    }

    if (content.startsWith('!admin list')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }
      await this.handleListAdmins(message);
      return true;
    }

    if (content.startsWith('!admin help')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }
      await this.handleHelp(message);
      return true;
    }

    // Check if user typed !admin with unknown subcommand or no subcommand
    if (content === '!admin' || content.startsWith('!admin ')) {
      if (!hasPermission) {
        await this.sendPermissionDenied(message);
        return true;
      }

      const parts = content.split(/\s+/);
      if (
        parts.length === 1 ||
        (parts.length > 1 &&
          !['add', 'remove', 'disable', 'enable', 'list', 'help'].includes(
            parts[1],
          ))
      ) {
        const subcommand = parts[1] || '';
        const embed = new EmbedBuilder()
          .setTitle('❌ Unknown Command')
          .setDescription(
            subcommand
              ? `Unknown subcommand: \`${subcommand}\`\n\nUse \`!admin help\` to see available commands.`
              : 'Please specify a subcommand.\n\nUse `!admin help` to see available commands.',
          )
          .setColor(0xff0000);
        await message.reply({ embeds: [embed] });
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has permission to use admin commands
   * Server owner or active admin can use these commands
   */
  private async checkPermission(message: Message): Promise<boolean> {
    if (!message.guild) return false;

    return isAdmin(message.author.id, message.guild);
  }

  private async sendPermissionDenied(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('❌ Permission Denied')
      .setDescription('You do not have permission to use admin commands.')
      .setColor(0xff0000);
    await message.reply({ embeds: [embed] });
  }

  private async handleAddAdmin(message: Message): Promise<void> {
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(
          'Please mention a user to add as admin: `!admin add @user`',
        )
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    try {
      const result = await addAdmin(mentioned.id);
      const embed = new EmbedBuilder()
        .setTitle(result.success ? '✅ Success' : '⚠️ Notice')
        .setDescription(result.message)
        .setColor(result.success ? 0x00ff00 : 0xffaa00);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error adding admin:', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while adding the admin.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
    }
  }

  private async handleRemoveAdmin(message: Message): Promise<void> {
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(
          'Please mention a user to remove from admins: `!admin remove @user`',
        )
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Prevent removing yourself if you're the last active admin
    if (mentioned.id === message.author.id) {
      const admins = await getAllAdmins();
      const activeAdmins = admins.filter((a) => a.active);
      if (
        activeAdmins.length === 1 &&
        activeAdmins[0].discordID === message.author.id
      ) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription(
            'You cannot remove yourself as the last active admin.',
          )
          .setColor(0xff0000);
        await message.reply({ embeds: [embed] });
        return;
      }
    }

    try {
      const result = await removeAdmin(mentioned.id);
      const embed = new EmbedBuilder()
        .setTitle(result.success ? '✅ Success' : '⚠️ Notice')
        .setDescription(result.message)
        .setColor(result.success ? 0x00ff00 : 0xffaa00);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error removing admin:', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while removing the admin.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
    }
  }

  private async handleDisableAdmin(message: Message): Promise<void> {
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(
          'Please mention a user to disable: `!admin disable @user`',
        )
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    try {
      const result = await setAdminStatus(mentioned.id, false);
      const embed = new EmbedBuilder()
        .setTitle(result.success ? '✅ Success' : '⚠️ Notice')
        .setDescription(result.message)
        .setColor(result.success ? 0x00ff00 : 0xffaa00);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error disabling admin:', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while disabling the admin.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
    }
  }

  private async handleEnableAdmin(message: Message): Promise<void> {
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(
          'Please mention a user to enable: `!admin enable @user`',
        )
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
      return;
    }

    try {
      const result = await setAdminStatus(mentioned.id, true);
      const embed = new EmbedBuilder()
        .setTitle(result.success ? '✅ Success' : '⚠️ Notice')
        .setDescription(result.message)
        .setColor(result.success ? 0x00ff00 : 0xffaa00);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error enabling admin:', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while enabling the admin.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
    }
  }

  private async handleListAdmins(message: Message): Promise<void> {
    try {
      const admins = await getAllAdmins();

      if (admins.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Admin List')
          .setDescription('No admins found in the database.')
          .setColor(0x93acff);
        await message.reply({ embeds: [embed] });
        return;
      }

      const description = admins
        .map((admin) => {
          const status = admin.active ? '🟢 Active' : '🔴 Inactive';
          return `${status} - ${admin.name} (<@${admin.discordID}>)`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('📋 Admin List')
        .setDescription(description)
        .setColor(0x93acff);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error listing admins:', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while listing admins.')
        .setColor(0xff0000);
      await message.reply({ embeds: [embed] });
    }
  }

  private async handleHelp(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Admin Manager Commands')
      .setDescription(
        '**Available Commands:**\n\n' +
          '`!admin add @user` - Add a user as an admin\n' +
          '`!admin remove @user` - Remove a user from admins\n' +
          '`!admin enable @user` - Enable an inactive admin\n' +
          '`!admin disable @user` - Disable an active admin\n' +
          '`!admin list` - List all admins\n' +
          '`!admin help` - Show this help message\n\n' +
          '**Permissions:**\n' +
          'Only the server owner or active admins can use these commands.',
      )
      .setColor(0x93acff);
    await message.reply({ embeds: [embed] });
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!admin add',
        description: 'Add a user as an admin',
        usage: '!admin add @user',
        adminOnly: true,
      },
      {
        command: '!admin remove',
        description: 'Remove a user from admins',
        usage: '!admin remove @user',
        adminOnly: true,
      },
      {
        command: '!admin enable',
        description: 'Enable an inactive admin',
        usage: '!admin enable @user',
        adminOnly: true,
      },
      {
        command: '!admin disable',
        description: 'Disable an active admin',
        usage: '!admin disable @user',
        adminOnly: true,
      },
      {
        command: '!admin list',
        description: 'List all admins',
        usage: '!admin list',
        adminOnly: true,
      },
      {
        command: '!admin help',
        description: 'Show admin commands help',
        usage: '!admin help',
        adminOnly: true,
      },
    ];
  }
}

export default new AdminManagerModule();
