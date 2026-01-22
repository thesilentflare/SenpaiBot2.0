import { Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import itemService from '../services/ItemService';
import Logger from '../../../utils/logger';
import { BALL_TYPES, SPECIAL_POKEMON } from '../types';
import path from 'path';
import axios from 'axios';

const COLOR_GOLD = 0xffd700;
const COLOR_ERROR = 0xff0000;

// Ball sprite URLs (from PokeAPI)
const BALL_SPRITE_URLS: { [key: number]: string } = {
  1: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  2: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  3: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  4: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
};

const BAG_SPRITE_SIZE = 96; // Larger sprites for balls
const BAG_COLS = 4; // 4 columns for balls

/**
 * Generate a visual bag image with ball sprites
 */
async function generateBagImage(
  bagItems: Array<{ itemType: number; quantity: number }>,
): Promise<Buffer> {
  // Calculate grid dimensions
  const totalSlots = bagItems.reduce((sum, item) => sum + item.quantity, 0);
  const rows = Math.ceil(totalSlots / BAG_COLS);
  const CANVAS_WIDTH = BAG_COLS * BAG_SPRITE_SIZE;
  const CANVAS_HEIGHT = rows * BAG_SPRITE_SIZE;

  // Load background
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

  // Load all ball sprites in parallel
  const spritePromises: Promise<{ img: any; itemType: number } | null>[] = [];

  for (const item of bagItems) {
    for (let i = 0; i < item.quantity; i++) {
      spritePromises.push(
        (async () => {
          try {
            const spriteUrl = BALL_SPRITE_URLS[item.itemType];
            if (!spriteUrl) return null;

            const response = await axios.get(spriteUrl, {
              responseType: 'arraybuffer',
              timeout: 5000,
            });
            return {
              img: await loadImage(Buffer.from(response.data)),
              itemType: item.itemType,
            };
          } catch (err) {
            const errorMsg =
              err instanceof Error ? err.message : 'Unknown error';
            Logger.warn(
              `Failed to load ball sprite for type ${item.itemType}: ${errorMsg}`,
            );
            return null;
          }
        })(),
      );
    }
  }

  const sprites = await Promise.all(spritePromises);

  // Draw sprites
  let x = 0;
  let y = 0;

  for (const sprite of sprites) {
    if (sprite) {
      const offsetX = x * BAG_SPRITE_SIZE;
      const offsetY = y * BAG_SPRITE_SIZE;
      ctx.drawImage(
        sprite.img,
        offsetX,
        offsetY,
        BAG_SPRITE_SIZE,
        BAG_SPRITE_SIZE,
      );
    }

    x++;
    if (x >= BAG_COLS) {
      x = 0;
      y++;
    }
  }

  return canvas.toBuffer('image/png');
}

export async function handleBag(
  message: Message,
  args: string[],
): Promise<void> {
  // Check if viewing another user's bag
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
      const embed = new EmbedBuilder()
        .setTitle('❌ User Not Found')
        .setDescription('Could not find that user.')
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }
  }

  try {
    const bag = await itemService.getBag(userId);

    if (bag.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📦 Empty Bag')
        .setDescription(`${username} has no items in their bag!`)
        .setColor(COLOR_GOLD);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Build text summary
    let description = '';
    let totalItems = 0;

    for (const item of bag) {
      const ballType = BALL_TYPES[item.itemType];
      const ballName = ballType
        ? ballType.displayName
        : `Ball ${item.itemType}`;
      description += `${ballName}: ${item.quantity}\n`;
      totalItems += item.quantity;
    }

    // Generate visual bag image
    const bagImage = await generateBagImage(bag);
    const attachment = new AttachmentBuilder(bagImage, {
      name: 'bag.png',
    });

    const embed = new EmbedBuilder()
      .setTitle(`${username}'s Bag`)
      .setDescription(description)
      .setImage('attachment://bag.png')
      .setFooter({ text: `Total Items: ${totalItems}` })
      .setColor(0x9370db);

    await message.reply({ embeds: [embed], files: [attachment] });

    Logger.info(`Displayed bag for ${username} (${userId})`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    Logger.error('Error handling bag command:', errorMsg);
    await message.reply(
      'An error occurred while fetching the bag. Please try again.',
    );
  }
}

export async function handleOpenBall(
  message: Message,
  args: string[],
): Promise<void> {
  const userId = message.author.id;
  const username = message.author.username;

  // Check for ball type argument
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Command Usage')
      .setDescription(
        '**Usage:** `!pg open <ball_type> [amount|all]`\n\n' +
          '**Ball types:** pokeball, greatball, ultraball, masterball\n' +
          '**Special:** `all` to open all balls of all types\n\n' +
          '**Examples:**\n' +
          '`!pg open pokeball` - Open 1 Poké Ball\n' +
          '`!pg open greatball 5` - Open 5 Great Balls\n' +
          '`!pg open ultraball all` - Open all Ultra Balls\n' +
          '`!pg open all` - Open all balls',
      )
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
    return;
  }

  try {
    // Check if opening ALL balls
    if (args[0].toLowerCase() === 'all') {
      await handleOpenAllBalls(message, userId, username);
      return;
    }

    const ballArg = args[0].toLowerCase();
    let ballType: number;

    // Map ball names to types
    if (ballArg === 'pokeball' || ballArg === 'poke') {
      ballType = 1;
    } else if (ballArg === 'greatball' || ballArg === 'great') {
      ballType = 2;
    } else if (ballArg === 'ultraball' || ballArg === 'ultra') {
      ballType = 3;
    } else if (ballArg === 'masterball' || ballArg === 'master') {
      ballType = 4;
    } else {
      const embed = new EmbedBuilder()
        .setTitle('❌ Invalid Ball Type')
        .setDescription(
          'Invalid ball type! Use: pokeball, greatball, ultraball, masterball, or all',
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
      return;
    }

    // Check for amount or 'all' flag
    let amount = 1;
    let openAll = false;

    if (args.length > 1) {
      if (args[1].toLowerCase() === 'all') {
        openAll = true;
      } else {
        const parsedAmount = parseInt(args[1]);
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          amount = Math.min(parsedAmount, 100); // Cap at 100
        }
      }
    }

    const ballTypeData = BALL_TYPES[ballType];
    const ballName = ballTypeData
      ? ballTypeData.displayName
      : `Ball ${ballType}`;

    // Open single ball
    if (!openAll && amount === 1) {
      const result = await itemService.openBall(userId, ballType);
      await sendSingleOpenResult(message, username, ballName, result);
      return;
    }

    // Open multiple balls
    if (openAll) {
      const results = await itemService.openAllBalls(userId, ballType);
      await sendMultipleOpenResults(message, username, ballName, results);
    } else {
      // Open specific amount
      const quantity = await itemService.getItemQuantity(userId, ballType);
      if (quantity < amount) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Not Enough Balls')
          .setDescription(
            `You only have ${quantity} ${ballName}${quantity !== 1 ? 's' : ''}!`,
          )
          .setColor(COLOR_ERROR);
        await message.reply({ embeds: [embed] });
        return;
      }

      const results = [];
      for (let i = 0; i < amount; i++) {
        const result = await itemService.openBall(userId, ballType);
        results.push(result);
      }
      await sendMultipleOpenResults(message, username, ballName, results);
    }
  } catch (error) {
    if (error instanceof Error) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(error.message)
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
    } else {
      Logger.error('Error handling open command', error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(
          'An error occurred while opening the ball. Please try again.',
        )
        .setColor(COLOR_ERROR);
      await message.reply({ embeds: [embed] });
    }
  }
}

/**
 * Handle opening all balls of all types
 */
async function handleOpenAllBalls(
  message: Message,
  userId: string,
  username: string,
): Promise<void> {
  const bag = await itemService.getBag(userId);

  if (bag.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Empty Bag')
      .setDescription('You have no balls to open!')
      .setColor(COLOR_ERROR);
    await message.reply({ embeds: [embed] });
    return;
  }

  let allResults: Array<{
    type: 'points' | 'pokemon';
    value: number | { id: number; name: string; rarity: number };
  }> = [];

  for (const item of bag) {
    const results = await itemService.openAllBalls(userId, item.itemType);
    allResults = allResults.concat(results);
  }

  await sendMultipleOpenResults(message, username, 'All Balls', allResults);
}

/**
 * Send result for opening a single ball
 */
async function sendSingleOpenResult(
  message: Message,
  username: string,
  ballName: string,
  result: {
    type: 'points' | 'pokemon';
    value: number | { id: number; name: string; rarity: number };
  },
): Promise<void> {
  if (result.type === 'points') {
    const embed = new EmbedBuilder()
      .setTitle(`✨ ${username} opened a ${ballName}!`)
      .setDescription(`Received **${result.value} pikapoints**!`)
      .setColor(COLOR_GOLD);
    await message.reply({ embeds: [embed] });
  } else {
    // Pokemon result
    const pokemon = result.value as {
      id: number;
      name: string;
      rarity: number;
    };
    let rarityText: string;
    if (pokemon.rarity <= 5) {
      rarityText = `${pokemon.rarity}⭐`;
    } else if (pokemon.rarity === 6) {
      rarityText = 'Legendary';
    } else if (pokemon.rarity === 7) {
      rarityText = 'Mythic';
    } else {
      rarityText = 'Special';
    }

    const embed = new EmbedBuilder()
      .setTitle(`${username} opened a ${ballName}!`)
      .setDescription(`${pokemon.name}\nRarity: ${rarityText}`)
      .setColor(0x9370db);

    // Set thumbnail
    if (pokemon.id >= 10000) {
      const url = SPECIAL_POKEMON[pokemon.id];
      if (url) {
        embed.setThumbnail(url);
      }
    } else {
      const strId = pokemon.id.toString().padStart(3, '0');
      embed.setThumbnail(
        `https://www.serebii.net/sunmoon/pokemon/${strId}.png`,
      );
    }

    await message.reply({ embeds: [embed] });
  }

  Logger.info(
    `${username} opened ${ballName}: ${result.type === 'points' ? `${result.value} points` : (result.value as { name: string }).name}`,
  );
}

/**
 * Send summarized results for opening multiple balls
 */
async function sendMultipleOpenResults(
  message: Message,
  username: string,
  ballName: string,
  results: Array<{
    type: 'points' | 'pokemon';
    value: number | { id: number; name: string; rarity: number };
  }>,
): Promise<void> {
  let totalPoints = 0;
  const pokemonReceived: Array<{ id: number; name: string; rarity: number }> =
    [];

  for (const result of results) {
    if (result.type === 'points') {
      totalPoints += result.value as number;
    } else {
      pokemonReceived.push(
        result.value as { id: number; name: string; rarity: number },
      );
    }
  }

  let description = `**Opened ${results.length} ${ballName}${results.length > 1 ? 's' : ''}!**\n\n`;

  if (totalPoints > 0) {
    description += `💰 **Total Points:** ${totalPoints} pikapoints\n\n`;
  }

  if (pokemonReceived.length > 0) {
    description += `**Pokémon Received (${pokemonReceived.length}):**\n`;

    // Group by rarity
    const rarityGroups: { [key: string]: string[] } = {
      '1⭐': [],
      '2⭐': [],
      '3⭐': [],
      '4⭐': [],
      '5⭐': [],
      Legendary: [],
      Mythic: [],
      Special: [],
    };

    for (const pokemon of pokemonReceived) {
      let rarityKey: string;
      if (pokemon.rarity <= 5) {
        rarityKey = `${pokemon.rarity}⭐`;
      } else if (pokemon.rarity === 6) {
        rarityKey = 'Legendary';
      } else if (pokemon.rarity === 7) {
        rarityKey = 'Mythic';
      } else {
        rarityKey = 'Special';
      }
      rarityGroups[rarityKey].push(pokemon.name);
    }

    for (const [rarity, pokemon] of Object.entries(rarityGroups)) {
      if (pokemon.length > 0) {
        description += `**${rarity}:** ${pokemon.join(', ')}\n`;
      }
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`✨ ${username}'s Ball Opening Results`)
    .setDescription(description)
    .setColor(COLOR_GOLD);

  await message.reply({ embeds: [embed] });

  Logger.info(
    `${username} opened ${results.length} balls: ${totalPoints} points, ${pokemonReceived.length} pokemon`,
  );
}
