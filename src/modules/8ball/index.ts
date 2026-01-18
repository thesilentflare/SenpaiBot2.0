import { Message } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';

const responses: string[] = [
  'Yes.',
  'No.',
  'Maybe.',
  'Ask again later.',
  'Definitely!',
  "I don't think so.",
  'Absolutely!',
  'Not in a million years.',
];

class Senpai8BallModule implements BotModule {
  name = '8ball';
  description = 'Magic 8-ball fortune telling';
  enabled = true;
  private logger = Logger.forModule('8ball');

  initialize(): void {
    this.logger.debug('Module initialized');
  }

  handleMessage(message: Message): boolean {
    const content = message.content.trim();

    if (content.startsWith('!8ball')) {
      // Check if user provided a question
      const question = content.slice(6).trim();
      if (!question) {
        message.reply(
          '❓ Please ask me a question! Usage: `!8ball <your question>`',
        );
        return true;
      }

      const randomIndex = Math.floor(Math.random() * responses.length);
      const reply = responses[randomIndex];
      message.reply(reply);
      return true;
    }

    // Check for common misspellings
    if (content.match(/^!8(?:bal|ball|bll|aball)/i)) {
      message.reply(
        '❓ Did you mean `!8ball`? Usage: `!8ball <your question>`',
      );
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
        command: '!8ball',
        description: 'Ask the magic 8-ball a question',
        usage: '!8ball <your question>',
      },
    ];
  }
}

export default new Senpai8BallModule();
