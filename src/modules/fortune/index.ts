import { Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';

const fortunes: string[] = [
  'You will have a great day!',
  'Something unexpected will happen soon.',
  'A pleasant surprise is waiting for you.',
  'Be cautious of new opportunities.',
  'Happiness is just around the corner.',
  'You will achieve your goals.',
  'A friend will bring good news.',
  'Trust your instincts.',
];

class FortuneModule implements BotModule {
  name = 'fortune';
  description = 'Random fortune cookie messages';
  enabled = true;
  private logger = Logger.forModule('fortune');

  initialize(): void {
    this.logger.debug('Module initialized');
  }

  handleMessage(message: Message): boolean {
    const content = message.content.trim();

    if (content.startsWith('!fortune')) {
      const randomIndex = Math.floor(Math.random() * fortunes.length);
      const reply = fortunes[randomIndex];
      message.reply(reply);
      return true;
    }

    // Check for common misspellings
    if (content.match(/^!(?:fortun|forune|fotune|fourtune)/i)) {
      message.reply('🔮 Did you mean `!fortune`?');
      return true;
    }

    return false;
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!fortune',
        description: 'Get a random fortune cookie message',
        usage: '!fortune',
      },
    ];
  }
}

export default new FortuneModule();
