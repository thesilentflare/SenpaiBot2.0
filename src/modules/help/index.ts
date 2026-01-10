import { Client, EmbedBuilder, Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';

class HelpModule implements BotModule {
  name = 'help';
  description = 'Display available commands';
  enabled = true;
  private client: Client | null = null;
  private allModules: BotModule[] = [];

  initialize(client: Client): void {
    this.client = client;
    console.log(`[${this.name}] Module initialized`);
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

    // Build the help embed
    const embed = new EmbedBuilder()
      .setTitle('🤖 SenpaiBot Commands')
      .setColor(0x93acff)
      .setFooter({ text: 'Use the commands exactly as shown' });

    // Add user commands grouped by module
    for (const [moduleName, { user }] of moduleCommands) {
      if (user.length > 0) {
        let commandsText = '';
        user.forEach((cmd) => {
          commandsText += `**${cmd.command}** - ${cmd.description}\n`;
          if (cmd.usage) {
            commandsText += `  _${cmd.usage}_\n`;
          }
        });

        // Capitalize first letter of module name for display
        const displayName =
          moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        embed.addFields({
          name: `📋 ${displayName}`,
          value: commandsText,
          inline: false,
        });
      }
    }

    // Add admin commands
    const allAdminCommands: CommandInfo[] = [];
    for (const [, { admin }] of moduleCommands) {
      allAdminCommands.push(...admin);
    }

    if (allAdminCommands.length > 0) {
      let adminCommandsText = '';
      allAdminCommands.forEach((cmd) => {
        adminCommandsText += `**${cmd.command}** - ${cmd.description}\n`;
        if (cmd.usage) {
          adminCommandsText += `  _${cmd.usage}_\n`;
        }
      });
      embed.addFields({
        name: '🛡️ Admin Commands',
        value: adminCommandsText,
        inline: false,
      });
    }

    await message.reply({ embeds: [embed] });
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
    console.log(`[${this.name}] Module cleaned up`);
  }
}

export default new HelpModule();
