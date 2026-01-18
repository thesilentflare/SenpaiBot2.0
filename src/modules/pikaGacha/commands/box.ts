import {
  Message,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import inventoryService from '../services/InventoryService';
import Logger from '../../../utils/logger';
import { getSpriteUrl } from '../config/spriteQuizQuestions';
import path from 'path';
import axios from 'axios';

const POKEMON_PER_PAGE = 32; // 8x4 grid
const INTERACTION_TIMEOUT = 120000; // 2 minutes
const SPRITE_SIZE = 64; // Increased size now that we load in parallel
const COLS = 8;
const CANVAS_WIDTH = 512; // 8 cols * 64px
const CANVAS_HEIGHT = 256; // 4 rows * 64px

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

  // Load ALL sprites in parallel for maximum speed
  const spritePromises = pokemonList.map(async (item) => {
    try {
      const spriteUrl = getSpriteUrl(item.pokemon.id);
      const response = await axios.get(spriteUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
      });
      return {
        img: await loadImage(Buffer.from(response.data)),
        pokemonId: item.pokemon.id,
      };
    } catch (error) {
      Logger.warn(
        `Failed to load sprite for Pokemon #${item.pokemon.id}`,
        error,
      );
      return null;
    }
  });

  // Wait for all sprites to load
  const sprites = await Promise.all(spritePromises);

  // Draw all loaded sprites
  let x = 0;
  let y = 0;

  for (const sprite of sprites) {
    if (sprite) {
      const offsetX = x * SPRITE_SIZE;
      const offsetY = y * SPRITE_SIZE;
      ctx.drawImage(sprite.img, offsetX, offsetY, SPRITE_SIZE, SPRITE_SIZE);
    }

    // Move to next position
    x++;
    if (x >= COLS) {
      x = 0;
      y++;
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
  let favoritesOnly = false;

  // Check for --favorites or -f flag
  const filteredArgs = args.filter((arg) => {
    if (arg === '--favorites' || arg === '-f') {
      favoritesOnly = true;
      return false;
    }
    return true;
  });

  if (filteredArgs.length > 0) {
    // Try to extract user ID from mention or direct ID
    const mention = filteredArgs[0].match(/^<@!?(\d+)>$/);
    if (mention) {
      userId = mention[1];
    } else if (/^\d+$/.test(filteredArgs[0])) {
      userId = filteredArgs[0];
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
    let inventory = await inventoryService.getInventoryWithCounts(userId);

    // Filter to favorites if flag is set
    if (favoritesOnly) {
      const favorites = await inventoryService.getFavorites(userId);
      const favoriteIds = new Set(favorites.map((f) => f.pokemonId));
      inventory = inventory.filter((item) => favoriteIds.has(item.pokemon.id));
    }

    if (inventory.length === 0) {
      const emptyMessage = favoritesOnly
        ? `⭐ ${username} has no favorite Pokémon!`
        : `📦 ${username} has no Pokémon in their box!`;
      await message.reply(emptyMessage);
      return;
    }

    // Send loading message
    const boxType = favoritesOnly ? 'favorites' : 'box';
    const loadingMessage = await message.reply(
      `📦 Loading ${username}'s ${boxType}... (${inventory.length} unique Pokémon)`,
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

    const boxTitle = favoritesOnly
      ? `${username}'s favorites ⭐`
      : `${username}'s party`;
    const messageContent = `${boxTitle} (page ${currentPage + 1}/${totalPages})`;

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
