import { Client, Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { BotModule, CommandInfo } from '../../types/module';
import Logger from '../../utils/logger';
import {
  fetchYandere,
  fetchSafebooru,
  downloadImage,
  ImageboardPost,
} from './helpers';

const COLOR = 0xff93ac;

type ImageboardFetcher = () => Promise<ImageboardPost>;

class ImageboardsModule implements BotModule {
  name = 'imageBoards';
  description = 'Random imageboard posts';
  enabled = true;
  private messages = new Set<Message>();
  private imageboards: ImageboardFetcher[];
  private logger = Logger.forModule('imageBoards');

  constructor() {
    this.imageboards = [fetchYandere, fetchSafebooru];
  }

  initialize(client: Client): void {
    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    const content = message.content.trim().toLowerCase();

    if (content === '!daily') {
      await this.handleRandomDaily(message);
      return true;
    }

    if (content === '!daily all') {
      await this.handleDailyAll(message);
      return true;
    }

    if (content === '!daily purge') {
      await this.handlePurge(message);
      return true;
    }

    if (content === '!daily yandere') {
      await this.fetchAndSend(message, fetchYandere);
      return true;
    }

    if (content === '!daily safebooru') {
      await this.fetchAndSend(message, fetchSafebooru);
      return true;
    }

    return false;
  }

  getCommands(): CommandInfo[] {
    return [
      {
        command: '!daily',
        description: 'Get a random image from a random imageboard',
        usage: '!daily',
        adminOnly: false,
      },
      {
        command: '!daily all',
        description: 'Get random images from all imageboards',
        usage: '!daily all',
        adminOnly: false,
      },
      {
        command: '!daily yandere',
        description: 'Get a random image from Yandere',
        usage: '!daily yandere',
        adminOnly: false,
      },
      {
        command: '!daily safebooru',
        description: 'Get a random image from Safebooru (SFW)',
        usage: '!daily safebooru',
        adminOnly: false,
      },
      {
        command: '!daily purge',
        description: 'Delete all imageboard posts from this session',
        usage: '!daily purge',
        adminOnly: false,
      },
    ];
  }

  private async handleRandomDaily(message: Message): Promise<void> {
    const randomFetcher =
      this.imageboards[Math.floor(Math.random() * this.imageboards.length)];
    await this.fetchAndSend(message, randomFetcher);
  }

  private async handleDailyAll(message: Message): Promise<void> {
    const shuffled = [...this.imageboards].sort(() => Math.random() - 0.5);

    for (const fetcher of shuffled) {
      await this.fetchAndSend(message, fetcher);
      // Small delay between posts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async handlePurge(message: Message): Promise<void> {
    const count = this.messages.size;

    if (count === 0) {
      await message.reply('No imageboard posts to purge.');
      return;
    }

    for (const msg of this.messages) {
      try {
        await msg.delete();
      } catch (error) {
        this.logger.error('Failed to delete message:', error);
      }
    }

    this.messages.clear();
    await message.reply(`Successfully purged ${count} post(s).`);
  }

  private async fetchAndSend(
    message: Message,
    fetcher: ImageboardFetcher,
  ): Promise<void> {
    try {
      const post = await fetcher();

      // Download the image
      const imageData = await downloadImage(post.fileUrl);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${post.source}: #${post.id}`)
        .setURL(post.postUrl)
        .setColor(COLOR);

      // Create attachment with spoiler
      const attachment = new AttachmentBuilder(imageData, {
        name: 'SPOILER_image.png',
      });

      const sentMessage = await message.reply({
        embeds: [embed],
        files: [attachment],
      });

      // Store message for purging
      this.messages.add(sentMessage);
    } catch (error) {
      this.logger.error('Error fetching from imageboard:', error);
      await message.reply('Error: Failed to fetch image from API.');
    }
  }

  cleanup(): void {
    this.messages.clear();
    this.logger.debug('Module cleaned up');
  }
}

export default new ImageboardsModule();
