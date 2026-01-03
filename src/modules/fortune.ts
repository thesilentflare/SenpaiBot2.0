import { Client, Message } from 'discord.js';

const client = new Client({ intents: [] });

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

client.on('messageCreate', (message: Message) => {
  if (message.content.startsWith('!fortune')) {
    const randomIndex = Math.floor(Math.random() * fortunes.length);
    const reply = fortunes[randomIndex];
    message.reply(reply);
  }
});

export default client;
