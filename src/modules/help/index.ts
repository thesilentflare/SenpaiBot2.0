import {
  Client,
  EmbedBuilder,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';

class HelpModule implements BotModule {
  name = 'help';
  description = 'Display available commands';
  enabled = true;
  private client: Client | null = null;
  private allModules: BotModule[] = [];
  private logger = Logger.forModule('help');

  initialize(client: Client): void {
    this.client = client;
    this.logger.debug('Module initialized');
  }

  /**
   * Set reference to all modules for command discovery
   */
  setModules(modules: BotModule[]): void {
    this.allModules = modules;
  }

  handleMessage(message: Message): boolean {
    const content = message.content.trim();

    if (content === '!help' || content === '!commands') {
      this.showHelp(message);
      return true;
    }

    return false;
  }

  private async showHelp(message: Message): Promise<void> {
    // Group commands by module
    const moduleCommands: Map<
      string,
      { user: CommandInfo[]; admin: CommandInfo[] }
    > = new Map();

    // Gather all commands from enabled modules
    for (const module of this.allModules) {
      if (module.enabled && module.getCommands) {
        const commands = module.getCommands();
        const userCmds: CommandInfo[] = [];
        const adminCmds: CommandInfo[] = [];

        for (const cmd of commands) {
          // Skip hidden commands
          if (cmd.hidden) {
            continue;
          }

          if (cmd.adminOnly) {
            adminCmds.push(cmd);
          } else {
            userCmds.push(cmd);
          }
        }

        if (userCmds.length > 0 || adminCmds.length > 0) {
          moduleCommands.set(module.name, { user: userCmds, admin: adminCmds });
        }
      }
    }

    // Build pages - group modules into pages
    const pages: EmbedBuilder[] = [];
    const modulesPerPage = 3;
    const moduleEntries = Array.from(moduleCommands.entries());

    for (let i = 0; i < moduleEntries.length; i += modulesPerPage) {
      const pageModules = moduleEntries.slice(i, i + modulesPerPage);
      const embed = new EmbedBuilder()
        .setTitle('🤖 SenpaiBot Commands')
        .setColor(0x93acff)
        .setFooter({
          text: `Page ${Math.floor(i / modulesPerPage) + 1}/${Math.ceil(moduleEntries.length / modulesPerPage)} • Use the buttons to navigate`,
        });

      for (const [moduleName, { user, admin }] of pageModules) {
        // Add user commands
        if (user.length > 0) {
          let commandsText = '';
          user.forEach((cmd) => {
            commandsText += `**${cmd.command}** - ${cmd.description}\n`;
          });

          if (commandsText.length > 0) {
            const displayName =
              moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
            // Truncate if too long
            if (commandsText.length > 1024) {
              commandsText =
                commandsText.substring(0, 1000) + '...\n_[Truncated]_';
            }
            embed.addFields([
              {
                name: `📋 ${displayName}`,
                value: commandsText,
                inline: false,
              },
            ]);
          }
        }

        // Add admin commands for this module
        if (admin.length > 0) {
          let adminText = '';
          admin.forEach((cmd) => {
            adminText += `**${cmd.command}** - ${cmd.description}\n`;
          });

          if (adminText.length > 0) {
            const displayName =
              moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
            if (adminText.length > 1024) {
              adminText = adminText.substring(0, 1000) + '...\n_[Truncated]_';
            }
            embed.addFields([
              {
                name: `🛡️ ${displayName} (Admin)`,
                value: adminText,
                inline: false,
              },
            ]);
          }
        }
      }

      pages.push(embed);
    }

    if (pages.length === 0) {
      await message.reply('No commands available.');
      return;
    }

    let currentPage = 0;

    // Create buttons
    const getButtons = (disabled: { prev: boolean; next: boolean }) => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('help_prev')
          .setLabel('◀ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled.prev),
        new ButtonBuilder()
          .setCustomId('help_next')
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled.next),
      );
    };

    // Send initial message
    const reply = await message.reply({
      embeds: [pages[currentPage]],
      components:
        pages.length > 1 ? [getButtons({ prev: true, next: false })] : [],
    });

    if (pages.length === 1) return;

    // Create collector for button interactions
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async (interaction) => {
      // Only allow the original user to use the buttons
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: 'These buttons are not for you!',
          ephemeral: true,
        });
        return;
      }

      if (interaction.customId === 'help_prev') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (interaction.customId === 'help_next') {
        currentPage = Math.min(pages.length - 1, currentPage + 1);
      }

      await interaction.update({
        embeds: [pages[currentPage]],
        components: [
          getButtons({
            prev: currentPage === 0,
            next: currentPage === pages.length - 1,
          }),
        ],
      });
    });

    collector.on('end', () => {
      // Disable buttons after timeout
      reply.edit({ components: [] }).catch(() => {});
    });
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!help',
        description: 'Show all available commands',
        usage: '!help',
      },
      {
        command: '!commands',
        description: 'Alias for !help',
        usage: '!commands',
      },
    ];
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }
}

export default new HelpModule();
