import { Client, Message } from 'discord.js';
import { BotModule } from '../../types/module';

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

  initialize(client: Client): void {
    console.log(`[${this.name}] Module initialized`);
  }

  handleMessage(message: Message): boolean {
    if (message.content.startsWith('!fortune')) {
      const randomIndex = Math.floor(Math.random() * fortunes.length);
      const reply = fortunes[randomIndex];
      message.reply(reply);
      return true;
    }
    return false;
  }

  cleanup(): void {
    console.log(`[${this.name}] Module cleaned up`);
  }
}

export default new FortuneModule();
