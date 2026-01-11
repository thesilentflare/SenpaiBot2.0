import { Client, EmbedBuilder, Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import { fetchCardPreview } from './helpers';

const YUGIOH_WIKIA_URL = 'https://yugioh.fandom.com/wiki/';
const COLOR = 0xff93ac;

class YugiohModule implements BotModule {
  name = 'yugioh';
  description = 'Search for Yu-Gi-Oh! card information';
  enabled = true;
  private logger = Logger.forModule('yugioh');

  initialize(client: Client): void {
    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    const content = message.content.trim();

    if (content.startsWith('!yugioh ')) {
      await this.handleYugiohCommand(message);
      return true;
    }

    // Check if user typed !yugioh without a card name
    if (content === '!yugioh') {
      message.reply(
        '🎴 Please provide a card name! Example: `!yugioh Dark Magician`',
      );
      return true;
    }

    // Check for common misspellings
    if (content.match(/^!(?:yugi|ygo|yugio)/i)) {
      message.reply('🎴 Did you mean `!yugioh <card name>`?');
      return true;
    }

    return false;
  }

  private async handleYugiohCommand(message: Message): Promise<void> {
    const cardName = message.content.slice('!yugioh'.length).trim();

    if (!cardName) {
      message.reply(
        '🎴 Please provide a card name! Example: `!yugioh Dark Magician`',
      );
      return;
    }

    // Format card name for URL (capitalize first letter of each word, replace spaces with underscores)
    const formattedCardName = cardName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_');

    const cardUrl = `${YUGIOH_WIKIA_URL}${encodeURIComponent(formattedCardName)}`;

    // Send a "searching" message
    const searchingMsg = await message.reply(
      '🔍 Searching for card information...',
    );

    try {
      const preview = await fetchCardPreview(cardUrl);

      const embed = new EmbedBuilder()
        .setTitle(preview.title)
        .setURL(preview.url)
        .setDescription(preview.description)
        .setColor(COLOR);

      if (preview.imageUrl) {
        embed.setImage(preview.imageUrl);
      }

      await searchingMsg.edit({ content: '', embeds: [embed] });
    } catch (error) {
      this.logger.error('Error fetching card:', error);

      // Try an alternative: search with exact user input (no formatting)
      const altUrl = `${YUGIOH_WIKIA_URL}${encodeURIComponent(cardName.split(' ').join('_'))}`;

      try {
        const preview = await fetchCardPreview(altUrl);

        const embed = new EmbedBuilder()
          .setTitle(preview.title)
          .setURL(preview.url)
          .setDescription(preview.description)
          .setColor(COLOR);

        if (preview.imageUrl) {
          embed.setImage(preview.imageUrl);
        }

        await searchingMsg.edit({ content: '', embeds: [embed] });
      } catch (retryError) {
        await searchingMsg.edit({
          content: `❌ KaibaCorp does not have any information on this card.\n💡 Try checking the exact card name on the wiki: <${YUGIOH_WIKIA_URL}>`,
          embeds: [],
        });
      }
    }
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!yugioh',
        description: 'Search for Yu-Gi-Oh! card information',
        usage: '!yugioh <card name> (e.g., !yugioh Dark Magician)',
      },
    ];
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }
}

export default new YugiohModule();
