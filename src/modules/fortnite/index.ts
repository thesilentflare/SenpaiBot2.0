import { AttachmentBuilder, Message } from 'discord.js';
import path from 'path';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';

const FORTNITE_LOCATIONS: Record<string, string> = {
  'Anarchy Acres': 'anarchy_acres.png',
  'Dusty Divot': 'dusty_divot.png',
  'Fatal Fields': 'fatal_fields.png',
  'Flush Factory': 'flush_factory.png',
  'Greasy Grove': 'greasy_grove.png',
  'Haunted Hills': 'haunted_hills.png',
  'Junk Junction': 'junk_junction.png',
  'Lonely Lodge': 'lonely_lodge.png',
  'Loot Lake': 'loot_lake.png',
  'Lucky Landing': 'lucky_landing.png',
  'Moisty Mire': 'moisty_mire.png',
  'Pleasant Park': 'pleasant_park.png',
  'Retail Row': 'retail_row.png',
  'Risky Reels': 'risky_reels.png',
  'Salty Springs': 'salty_springs.png',
  'Shifty Shafts': 'shifty_shafts.png',
  'Snobby Shores': 'snobby_shores.png',
  'Tilted Towers': 'tilted_towers.png',
  'Tomato Town': 'tomato_town.png',
  'Wailing Woods': 'wailing_woods.png',
  A37: 'a37.jpg',
};

const LOCATION_NAMES = Object.keys(FORTNITE_LOCATIONS);

class FortniteModule implements BotModule {
  name = 'fortnite';
  description = 'Random Fortnite drop location selector';
  enabled = true;
  private logger = Logger.forModule('fortnite');

  initialize(): void {
    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    const content = message.content.trim().toLowerCase();

    if (
      content.startsWith('!wherewedroppingbois') ||
      content.startsWith('!drop')
    ) {
      await this.sendFortniteLocation(message);
      return true;
    }

    return false;
  }

  private async sendFortniteLocation(message: Message): Promise<void> {
    try {
      // Select a random location
      const randomIndex = Math.floor(Math.random() * LOCATION_NAMES.length);
      const locationName = LOCATION_NAMES[randomIndex];
      const imageName = FORTNITE_LOCATIONS[locationName];

      // Build the path to the image
      const imagePath = path.join(
        __dirname,
        '../../assets/fortnite_locations',
        imageName,
      );

      // Create an attachment
      const attachment = new AttachmentBuilder(imagePath);

      // Send the message with the image as a reply
      const replyText = `We dropping ${locationName} bois`;
      const sentMessage = await message.reply({
        content: replyText,
        files: [attachment],
      });

      // Try to add a reaction emoji
      // Note: Custom emoji require the emoji to be in a guild the bot has access to
      // Using a standard emoji instead
      await sentMessage.react('🔥');
    } catch (error) {
      this.logger.error('Error sending Fortnite location', error);
      message.reply(
        '❌ Sorry, something went wrong while picking a drop location!',
      );
    }
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!drop',
        description: 'Get a random Fortnite drop location',
        usage: '!drop',
      },
      {
        command: '!wherewedroppingbois',
        description: 'Get a random Fortnite drop location',
        usage: '!wherewedroppingbois',
      },
    ];
  }
}

export default new FortniteModule();
