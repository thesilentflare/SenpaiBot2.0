import { Client, Message, EmbedBuilder } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import { fetchWikiPreview } from './helpers';

const WARFRAME_WIKIA_URL = 'https://warframe.fandom.com/wiki/';
const COLOR = 0xff93ac;

class WarframeModule implements BotModule {
  name = 'warframe';
  description = 'Warframe codex wiki lookup';
  enabled = true;
  private logger = Logger.forModule('warframe');

  initialize(client: Client): void {
    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    if (message.content.startsWith('!codex')) {
      await this.handleCodexCommand(message);
      return true;
    }
    return false;
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!codex <entry name>',
        description: 'Look up a Warframe codex entry from the wiki',
        usage: '!codex Trinity',
        adminOnly: false,
      },
    ];
  }

  private async handleCodexCommand(message: Message): Promise<void> {
    const entryName = message.content.slice('!codex'.length).trim();

    if (!entryName) {
      await message.reply('`Operator, what codex entry are you looking for?`');
      return;
    }

    // Capitalize each word and join with underscores
    const formattedName = entryName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_');

    const wikiUrl = WARFRAME_WIKIA_URL + formattedName;

    try {
      const preview = await fetchWikiPreview(wikiUrl);

      const embed = new EmbedBuilder()
        .setTitle(preview.title)
        .setURL(preview.url)
        .setDescription(preview.description)
        .setColor(COLOR);

      if (preview.imageUrl) {
        embed.setImage(preview.imageUrl);
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Error fetching Warframe wiki:', error);
      await message.reply(
        '`Operator, my codex does not seem to have an entry for this`',
      );
    }
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }
}

export default new WarframeModule();
