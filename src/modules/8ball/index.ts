import { Client, Message } from 'discord.js';
import { BotModule } from '../../types/module';

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

  initialize(client: Client): void {
    console.log(`[${this.name}] Module initialized`);
  }

  handleMessage(message: Message): boolean {
    if (message.content.startsWith('!8ball')) {
      const randomIndex = Math.floor(Math.random() * responses.length);
      const reply = responses[randomIndex];
      message.reply(reply);
      return true;
    }
    return false;
  }

  cleanup(): void {
    console.log(`[${this.name}] Module cleaned up`);
  }
}

export default new Senpai8BallModule();
