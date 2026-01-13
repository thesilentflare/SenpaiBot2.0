import {
  Message,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { createCanvas, loadImage, Image } from 'canvas';
import inventoryService from '../services/InventoryService';
import Logger from '../../../utils/logger';
import { getSpriteUrl } from '../config/spriteQuizQuestions';
import path from 'path';
import axios from 'axios';

const POKEMON_PER_PAGE = 32; // 8x4 grid
const INTERACTION_TIMEOUT = 120000; // 2 minutes
const SPRITE_SIZE = 48; // Further reduced for faster generation
const COLS = 8;
const ROWS = 4;
const CANVAS_WIDTH = 384; // Further reduced for faster generation
const CANVAS_HEIGHT = 192; // Further reduced for faster generation

/**
 * Generate a sprite grid image for the given Pokemon list
 */
async function generateBoxImage(
  pokemonList: Array<{ pokemon: { id: number; name: string }; count: number }>,
): Promise<Buffer> {
  // Load background image
  const backgroundPath = path.join(
    __dirname,
    '..',
    'assets',
    'images',
    'inv_background.png',
  );
  const background = await loadImage(backgroundPath);

  // Create canvas
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.drawImage(background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Load and draw each Pokemon sprite
  let x = 0;
  let y = 0;

  for (const item of pokemonList) {
    try {
      const spriteUrl = getSpriteUrl(item.pokemon.id);

      // Download sprite
      const response = await axios.get(spriteUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
      });

      const img = await loadImage(Buffer.from(response.data));

      // Calculate position (sprites are 100x100 pixels)
      const offsetX = x * SPRITE_SIZE;
      const offsetY = y * SPRITE_SIZE;

      // Draw sprite (resize from original size to 100x100)
      ctx.drawImage(img, offsetX, offsetY, SPRITE_SIZE, SPRITE_SIZE);

      // Move to next position
      x++;
      if (x >= COLS) {
        x = 0;
        y++;
      }
    } catch (error) {
      Logger.warn(
        `Failed to load sprite for Pokemon #${item.pokemon.id}`,
        error,
      );
      // Continue to next Pokemon on error
      x++;
      if (x >= COLS) {
        x = 0;
        y++;
      }
    }
  }

  return canvas.toBuffer('image/png');
}

export async function handleBox(
  message: Message,
  args: string[],
): Promise<void> {
  // Check if viewing another user's box
  let userId = message.author.id;
  let username = message.author.username;

  if (args.length > 0) {
    // Try to extract user ID from mention or direct ID
    const mention = args[0].match(/^<@!?(\d+)>$/);
    if (mention) {
      userId = mention[1];
    } else if (/^\d+$/.test(args[0])) {
      userId = args[0];
    }

    try {
      const user = await message.client.users.fetch(userId);
      username = user.username;
    } catch (error) {
      await message.reply('❌ Could not find that user.');
      return;
    }
  }

  try {
    // Get user's full inventory with counts
    const inventory = await inventoryService.getInventoryWithCounts(userId);

    if (inventory.length === 0) {
      await message.reply(`📦 ${username} has no Pokémon in their box!`);
      return;
    }

    // Send loading message
    const loadingMessage = await message.reply(
      `📦 Loading ${username}'s box... (${inventory.length} unique Pokémon)`,
    );

    // Sort by Pokemon ID
    inventory.sort((a, b) => a.pokemon.id - b.pokemon.id);

    const totalPages = Math.ceil(inventory.length / POKEMON_PER_PAGE);
    let currentPage = 0;

    // Generate ONLY the first page immediately
    const start = 0;
    const end = Math.min(POKEMON_PER_PAGE, inventory.length);
    const firstPageInventory = inventory.slice(start, end);
    const firstPageBuffer = await generateBoxImage(firstPageInventory);
    const firstPageAttachment = new AttachmentBuilder(firstPageBuffer, {
      name: 'box_page_0.png',
    });

    // Store all page attachments (first page is ready, rest will be generated)
    const pageAttachments: AttachmentBuilder[] = [firstPageAttachment];

    // Get initial attachment
    const attachment = pageAttachments[currentPage];

    // Create navigation buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('box_prev')
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('box_next')
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1),
    );

    const messageContent = `${username}'s party (page ${currentPage + 1}/${totalPages})`;

    // Edit the loading message with the final result
    const response =
      totalPages > 1
        ? await loadingMessage.edit({
            content: messageContent,
            files: [attachment],
            components: [row],
          })
        : await loadingMessage.edit({
            content: messageContent,
            files: [attachment],
          });

    // If only one page, no need for interaction handling
    if (totalPages === 1) return;

    // Generate remaining pages in the background after showing first page
    (async () => {
      for (let page = 1; page < totalPages; page++) {
        const start = page * POKEMON_PER_PAGE;
        const end = Math.min(start + POKEMON_PER_PAGE, inventory.length);
        const pageInventory = inventory.slice(start, end);

        const imageBuffer = await generateBoxImage(pageInventory);
        pageAttachments[page] = new AttachmentBuilder(imageBuffer, {
          name: `box_page_${page}.png`,
        });
      }
      Logger.debug(
        `Background generation complete for ${username}'s box (${totalPages} pages)`,
      );
    })();

    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: INTERACTION_TIMEOUT,
    });

    collector.on('collect', async (interaction) => {
      // Only allow the original user to interact
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({
          content: 'Only the command author can navigate this box!',
          ephemeral: true,
        });
        return;
      }

      // Defer the update to prevent timeout
      await interaction.deferUpdate();

      // Update page based on button
      if (interaction.customId === 'box_prev') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (interaction.customId === 'box_next') {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      }

      // Get pre-generated image for this page (might still be generating)
      let newAttachment = pageAttachments[currentPage];

      // If page hasn't been generated yet, generate it now
      if (!newAttachment) {
        const start = currentPage * POKEMON_PER_PAGE;
        const end = Math.min(start + POKEMON_PER_PAGE, inventory.length);
        const pageInventory = inventory.slice(start, end);
        const imageBuffer = await generateBoxImage(pageInventory);
        newAttachment = new AttachmentBuilder(imageBuffer, {
          name: `box_page_${currentPage}.png`,
        });
        pageAttachments[currentPage] = newAttachment;
      }

      const newMessageContent = `${username}'s party (page ${currentPage + 1}/${totalPages})`;

      // Update buttons
      const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('box_prev')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('box_next')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1),
      );

      await interaction.editReply({
        content: newMessageContent,
        files: [newAttachment],
        components: [newRow],
      });
    });

    collector.on('end', async () => {
      // Disable all buttons when collector expires
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('box_prev')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('box_next')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
      );

      try {
        await response.edit({ components: [disabledRow] });
      } catch (error) {
        // Message might have been deleted
        Logger.debug('Could not disable box buttons on timeout');
      }
    });

    Logger.info(
      `${username} viewed their Pokemon box (${inventory.length} species, page ${currentPage + 1}/${totalPages})`,
    );
  } catch (error) {
    Logger.error('Error handling box command', error);
    await message.reply(
      '❌ An error occurred while loading the box. Please try again.',
    );
  }
}
